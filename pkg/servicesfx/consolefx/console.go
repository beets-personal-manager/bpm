package consolefx

import (
	"context"
	"errors"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/filesfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/logsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/queuefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/rpcfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/bobcatalyst/debug"
	"github.com/bobcatalyst/flow"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
	"log/slog"
	"net/http"
	"strings"
	"sync/atomic"
)

type (
	Input interface {
		Name() string
		Body() any
		Input(data any, headers http.Header) error
	}
	AsInput struct {
		fx.Out
		V Input `group:"input"`
	}
)

var (
	ErrNotRunning = errors.New("import is not running")
	ErrRunning    = errors.New("import is already running")
)

type Service struct {
	output   flow.Repeater[subflow.Message]
	instance atomic.Pointer[instance]

	q      *queuefx.Service
	fi     *filesfx.Service
	beet   *beetsfx.Service
	rpc    *rpcfx.Service
	lgs    *logsfx.Service
	ctx    context.Context
	logger *slog.Logger
}

type Params struct {
	fx.In
	Queue     *queuefx.Service
	Lifecycle fx.Lifecycle
	Context   context.Context
	Files     *filesfx.Service
	Beets     *beetsfx.Service
	RPC       *rpcfx.Service
	Logs      *logsfx.Service
	Logger    *slog.Logger
}

type Return struct {
	fx.Out
	serverfx.AsMessageProducer
	AsInput
	Service *Service
}

func New(params Params) Return {
	ctx, cancel := context.WithCancel(params.Context)
	srv := Service{
		q:      params.Queue,
		fi:     params.Files,
		beet:   params.Beets,
		rpc:    params.RPC,
		lgs:    params.Logs,
		ctx:    ctx,
		logger: params.Logger.With(slog.String("service", "console")),
	}

	srv.output.Push(
		subflow.NewStartMessage(),
		subflow.NewStdioMessage[subflow.StderrMessage]("Run a command to get output\n"),
		subflow.NewExitMessage(0),
	)

	params.Lifecycle.Append(fx.StartStopHook(func() {
		go func() {
			defer cancel()
			srv.runCommands(ctx)
		}()
	}, cancel))
	return Return{
		AsMessageProducer: serverfx.AsMessageProducer{
			V: &srv,
		},
		AsInput: AsInput{
			V: &srv,
		},
		Service: &srv,
	}
}

func (*Service) Name() string { return "console" }

func (srv *Service) Listen(ctx context.Context) <-chan subflow.Message {
	return srv.output.Listen(ctx)
}

func (srv *Service) Stop() error {
	if p := srv.instance.Load(); p != nil {
		p.cancel()
		return nil
	}
	return ErrNotRunning
}

func (srv *Service) Body() any {
	return new(string)
}

func (srv *Service) Input(data any, _ http.Header) error {
	if p := srv.instance.Load(); p != nil {
		s := data.(*string)
		p.cmd.Push(subflow.NewInputln(strings.TrimSpace(*s)))
		return nil
	}
	return ErrNotRunning
}

func (srv *Service) runCommands(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case v, ok := <-srv.q.Pop(ctx):
			if ok {
				srv.runPoppedCommand(ctx, v)
			}
		}
	}
}

func (srv *Service) runPoppedCommand(ctx context.Context, v *queuefx.ItemFinisher) {
	defer v.Done()
	if err := srv.startCommand(ctx, v.Item()); err != nil {
		srv.logger.Error("error while running beets command", slog.Any("error", err))
	}
}

type instance struct {
	cmd      *subflow.Cmd
	item     queuefx.Item
	sc       subflow.CommandArgs
	ctx      context.Context
	cancel   context.CancelFunc
	beetsCfg *beetsfx.Config
	events   flow.Stream[subflow.Message]
	log      *logsfx.LogWriter
}

func (srv *Service) startCommand(ctx context.Context, item queuefx.Item) (finalErr error) {
	ins := instance{item: item}
	ins.log, ins.sc, ins.beetsCfg = newLogWriter(item)

	defer ins.events.Close()
	defer func() { finalErr = errors.Join(finalErr, item.Cleanup()) }()
	defer func() { finalErr = errors.Join(finalErr, srv.lgs.WriteLog(ins.log, finalErr)) }()

	ins.ctx, ins.cancel = context.WithCancel(ctx)
	defer ins.cancel()
	srv.writeLogEvents(ins.ctx, &ins.events, ins.log)

	cfgFile, rmCfgFile, err := srv.fi.TmpYAML(ins.beetsCfg)
	if err != nil {
		return err
	}
	defer func() { finalErr = errors.Join(finalErr, rmCfgFile()) }()

	remote, err := srv.rpc.Start(ins.ctx, &ins.events)
	if err != nil {
		return err
	}
	defer func() { finalErr = errors.Join(finalErr, remote.Close()) }()

	opts := []beetsfx.Option{beetsfx.OptionRPCPort(remote.Port()), beetsfx.OptionConfig(cfgFile)}
	if debug.Debug {
		opts = append(opts, beetsfx.OptionVerbosity(beetsfx.VerbosityVeryVerbose))
	}

	ins.cmd, err = srv.beet.Exec(ins.ctx, item.Command(), opts...)
	if err != nil {
		return err
	}
	defer func() { finalErr = errors.Join(finalErr, ins.cmd.Close()) }()
	pipeCmdEvents(ctx, ins.cmd, &ins.events)
	srv.pipeCmdOutput(ins.cmd)

	if p := srv.instance.Swap(&ins); p != nil {
		p.cancel()
		srv.logger.Warn("existing command instance stored while starting new command", slog.String("id", p.item.ID().String()), slog.Bool("killed", true))
	}
	defer srv.instance.Store(nil)

	ins.cmd.Start()
	defer ins.cancel()
	<-ins.cmd.Done()
	return nil
}

func newLogWriter(item queuefx.Item) (*logsfx.LogWriter, subflow.CommandArgs, *beetsfx.Config) {
	lw := logsfx.NewLogWriter()
	sc := item.Command()
	beetsCfg := item.BeetsConfig()

	lw.ID = item.ID()
	lw.Time = item.Time()
	lw.Kind = item.Kind()
	lw.Config = beetsCfg
	lw.API = item.API()
	lw.Subcommand = sc
	lw.ExtraFiles = item.Extra()
	return lw, sc, beetsCfg
}

func (srv *Service) pipeCmdOutput(cmd *subflow.Cmd) {
	out := cmd.Listen(srv.ctx)
	go func() {
		for msg := range out {
			if _, ok := msg.(subflow.StartMessage); ok {
				srv.output.Reset(msg)
			} else {
				srv.output.Push(msg)
			}
		}
	}()
}

func pipeCmdEvents(ctx context.Context, cmd *subflow.Cmd, p flow.Pushable[subflow.Message]) {
	ctx, cancel := context.WithCancel(ctx)
	out := cmd.Listen(ctx)
	go func() {
		defer cancel()
		for msg := range out {
			p.Push(msg)
			if _, ok := msg.(subflow.ExitMessage); ok {
				return
			}
		}
	}()
}

func (srv *Service) writeLogEvents(ctx context.Context, l flow.Listenable[subflow.Message], lw *logsfx.LogWriter) {
	out := l.Listen(ctx)
	go func() {
		for msg := range out {
			if err := lw.WriteMessage(msg); err != nil {
				srv.logger.Error("failed to write log message", slog.Any("error", err))
			}
		}
	}()
}

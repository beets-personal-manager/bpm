package beetsfx

import (
	"context"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
)

type Service struct {
	beetsCmd  subflow.CommandArgs
	beetsHome string
	tracksDir string
}

type Params struct {
	fx.In
	Ev envfx.Env
}

func New(params Params) *Service {
	return &Service{
		beetsCmd:  params.Ev.BeetCmdArgs,
		beetsHome: params.Ev.BeetsHome,
		tracksDir: params.Ev.LibraryPath,
	}
}

type Option func(*Command)

func OptionVerbosity(v Verbosity) Option {
	return func(cmd *Command) {
		cmd.Verbosity = v
	}
}

func OptionConfig(cfg string) Option {
	return func(cmd *Command) {
		cmd.Config = &cfg
	}
}

func OptionRPCPort(port uint16) Option {
	return func(cmd *Command) {
		cmd.RPCPort = &port
	}
}

func (bcs *Service) Command(subcommand subflow.CommandArgs, opts ...Option) *Command {
	cmd := Command{
		BaseCommand: bcs.beetsCmd,
		SubCommand:  subcommand,
		TracksDir:   bcs.tracksDir,
		BeetsHome:   bcs.beetsHome,
		Verbosity:   VerbosityVeryVerbose,
	}

	for _, opt := range opts {
		opt(&cmd)
	}

	return &cmd
}

func (bcs *Service) Run(ctx context.Context, subcommand subflow.CommandArgs, opts ...Option) subflow.Output {
	return subflow.Run(ctx, bcs.Command(subcommand, opts...), nil)
}

func (bcs *Service) Exec(ctx context.Context, subcommand subflow.CommandArgs, opts ...Option) (*subflow.Cmd, error) {
	return subflow.New(ctx, bcs.Command(subcommand, opts...))
}

package queuefx

import (
	"context"
	"encoding"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/configfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/bobcatalyst/flow"
	"github.com/bobcatalyst/subflow"
	"github.com/google/uuid"
	"go.uber.org/fx"
	"log/slog"
	"slices"
	"sync"
	"time"
)

var Module = fx.Module("queue",
	fx.Provide(
		New,
		newQueueStarterImport,
	),
)

type (
	QueueStarter interface {
		Name() string
		Body() any
		Start(body any) (Item, error)
	}
	AsQueueStarter struct {
		fx.Out
		V QueueStarter `group:"queue-starter"`
	}
)

type Item interface {
	// Command prepares a beets subcommand. Mutations to the beets.Config will be passed to beets.
	Command() subflow.CommandArgs
	// API is the original model that generate this Item
	API() any
	AppConfig() *configfx.Config
	BeetsConfig() *beetsfx.Config
	Kind() beetsfx.CommandKind
	ID() uuid.UUID
	Time() time.Time
	Cleanup() error
	Extra() map[string]encoding.BinaryMarshaler
}

type Service struct {
	start    flow.Stream[Item]
	actions  flow.Stream[*modify]
	pop      flow.Stream[*channel]
	running  flow.Stream[*ItemFinisher]
	finished flow.Stream[*ItemFinisher]
	started  chan struct{}

	ctx    context.Context
	logger *slog.Logger

	queue flow.Repeater[subflow.Message]
}

type QueueParams struct {
	fx.In
	Lf     fx.Lifecycle
	Ctx    context.Context
	Logger *slog.Logger
}

type QueueReturn struct {
	fx.Out
	Service *Service
	serverfx.AsMessageProducer
}

func New(params QueueParams) QueueReturn {
	ctx, cancel := context.WithCancel(params.Ctx)
	srv := &Service{
		ctx:     ctx,
		started: make(chan struct{}),
		logger:  params.Logger.With(slog.String("service", "queue")),
	}

	params.Lf.Append(fx.StartStopHook(
		srv.manageQueue,
		cancel,
	))

	return QueueReturn{
		Service: srv,
		AsMessageProducer: serverfx.AsMessageProducer{
			V: srv,
		},
	}
}

func (*Service) Name() string { return "queue" }

func (srv *Service) Listen(ctx context.Context) <-chan subflow.Message {
	return srv.queue.Listen(ctx)
}

func (srv *Service) Start(ctx context.Context, i Item) {
	select {
	case <-srv.started:
		srv.start.Push(i)
	case <-ctx.Done():
	}
}

func (srv *Service) Modify(ctx context.Context, id uuid.UUID, action ModifyAction) {
	select {
	case <-srv.started:
		srv.actions.Push(&modify{id: id, action: action})
	case <-ctx.Done():
	}
}

type ItemFinisher struct {
	item   Item
	ctx    context.Context
	cancel context.CancelFunc
}

func (f *ItemFinisher) Item() Item {
	if f == nil {
		return nil
	}
	return f.item
}

func (f *ItemFinisher) Done() {
	if f != nil {
		f.cancel()
	}
}

func (srv *Service) Pop(ctx context.Context) <-chan *ItemFinisher {
	select {
	case <-srv.started:
		c := srv.requestPop()
		cc := make(chan *ItemFinisher, 1)
		go func() {
			defer close(cc)
			select {
			case v, ok := <-c.c:
				if ok {
					srv.wrapFinisher(ctx, cc, v)
				}
			case <-ctx.Done():
				return
			}
		}()

		return cc
	case <-ctx.Done():
		return closedChan[*ItemFinisher]()
	}
}

func (srv *Service) wrapFinisher(ctx context.Context, cc chan *ItemFinisher, v Item) {
	fin := &ItemFinisher{item: v}
	fin.ctx, fin.cancel = context.WithCancel(context.Background())
	select {
	case cc <- fin:
		srv.running.Push(fin)
		go srv.finish(fin)
	case <-ctx.Done():
	}
}

func (srv *Service) finish(fin *ItemFinisher) {
	defer srv.finished.Push(fin)
	select {
	case <-srv.ctx.Done():
	case <-fin.ctx.Done():
	}
}

func (srv *Service) requestPop() *channel {
	c := &channel{
		c:   make(chan Item, 1),
		ctx: srv.ctx,
	}
	c.stop = context.AfterFunc(c.ctx, c.Close)
	srv.pop.Push(c)
	return c
}

func closedChan[T any]() <-chan T {
	c := make(chan T)
	close(c)
	return c
}

type modify struct {
	id     uuid.UUID
	action ModifyAction
}

type channel struct {
	c    chan Item
	once sync.Once
	ctx  context.Context
	stop func() bool
}

func (c *channel) Close() {
	c.once.Do(func() {
		close(c.c)
		c.stop()
	})
}

func (c *channel) Send(v Item) {
	c.once.Do(func() {
		c.stop()
		select {
		case <-c.ctx.Done():
			return
		case c.c <- v:
		}
	})
}

func (srv *Service) manageQueue() {
	go func() {
		var (
			ctx, cancel = context.WithCancel(srv.ctx)

			start    = srv.start.Listen(ctx)
			md       = srv.actions.Listen(ctx)
			pops     = srv.pop.Listen(ctx)
			running  = srv.running.Listen(ctx)
			finished = srv.finished.Listen(ctx)

			currentlyRunning *ItemFinisher

			values  []Item
			waiting []*channel
		)

		close(srv.started)
		defer cancel()
		defer func() {
			for _, w := range waiting {
				w.Close()
			}
			for _, v := range values {
				_ = v.Cleanup()
			}
		}()

		for {
			srv.queue.Reset(NewQueueMessage(currentlyRunning.Item(), values))

			select {
			case <-ctx.Done():
				return
			case v, ok := <-start:
				if ok {
					values, waiting = srv.shift(values, waiting, nil, v)
				} else {
					return
				}
			case v, ok := <-md:
				if ok {
					values = srv.modify(values, v)
				} else {
					return
				}
			case v, ok := <-pops:
				if ok {
					values, waiting = srv.shift(values, waiting, v)
				} else {
					return
				}
			case v, ok := <-running:
				if ok {
					currentlyRunning.Done()
					currentlyRunning = v
				} else {
					return
				}
			case v, ok := <-finished:
				if ok && currentlyRunning == v {
					currentlyRunning = nil
				} else {
					return
				}
			}
		}
	}()
}

func (srv *Service) modify(values []Item, action *modify) []Item {
	idx := slices.IndexFunc(values, func(item Item) bool { return item.ID() == action.id })
	if idx < 0 {
		return nil
	}

	item := values[idx]
	values = slices.Delete(values, idx, idx+1)

	switch action.action {
	case ModifyActionUp:
		return slices.Insert(values, min(idx-1, len(values)), item)
	case ModifyActionTop:
		return append([]Item{item}, values...)
	case ModifyActionDown:
		return slices.Insert(values, min(idx+1, len(values)), item)
	case ModifyActionBottom:
		return append(values, item)
	case ModifyActionRemove:
		if err := values[idx].Cleanup(); err != nil {
			srv.logger.Error("error during cleanup of queue item being removed", slog.Any("error", err))
		}
		return values
	default:
		panic("invalid action")
	}
	return values
}

func (srv *Service) shift(values []Item, waiting []*channel, e *channel, add ...Item) ([]Item, []*channel) {
	values = append(values, add...)

	if e == nil {
		if len(waiting) > 0 {
			e = waiting[0]
			waiting = slices.Delete(waiting, 0, 1)
		} else {
			return values, waiting
		}
	}

	if len(values) == 0 {
		waiting = append(waiting, e)
		return values, waiting
	}

	e.Send(values[0])
	return slices.Delete(values, 0, 1), waiting
}

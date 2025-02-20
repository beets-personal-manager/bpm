package serverfx

import (
	"context"
	"fmt"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/bobcatalyst/flow"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync/atomic"
	"time"
)

var Module = fx.Module("server",
	fx.Provide(
		fx.Private,
		newServer,
	),
	fx.Invoke(func(srv *Service, lf fx.Lifecycle, sd fx.Shutdowner) {
		lf.Append(fx.StartStopHook(srv.run(sd), srv.shutdown))
	}),
)

type (
	Api interface {
		Name() string
		RegisterAPI(*http.ServeMux)
	}
	AsApi struct {
		fx.Out
		V Api `group:"api"`
	}

	AsClient struct {
		fx.Out
		V http.Handler `name:"client"`
	}

	MessageProducer interface {
		Name() string
		flow.Listenable[subflow.Message]
	}
	AsMessageProducer struct {
		fx.Out
		V MessageProducer `group:"message-producer"`
	}
)

type Service struct {
	server http.Server
	logger *slog.Logger
}

type Params struct {
	fx.In
	Client http.Handler `name:"client"`
	APIs   []Api        `group:"api"`
	Env    envfx.Env
	Logger *slog.Logger
	Ctx    context.Context
}

func newServer(params Params) *Service {
	mux := http.NewServeMux()
	mux.Handle("/", params.Client)

	mux.HandleFunc("/api/", func(http.ResponseWriter, *http.Request) {
		fmt.Println("none")
	})
	for _, api := range params.APIs {
		route := fmt.Sprintf("/api/%s", api.Name())
		routeSlash := route + "/"
		apiMux := http.NewServeMux()
		api.RegisterAPI(apiMux)
		mux.Handle(routeSlash, http.StripPrefix(route, apiMux))
	}

	l := params.Logger.With(slog.String("service", "server"))
	lfn := logReq(l)
	return &Service{
		server: http.Server{
			Addr: params.Env.ServeAddress,
			Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				defer lfn(r)()
				if cors(w, r) {
					mux.ServeHTTP(w, r)
				}
			}),
			ErrorLog:    slog.NewLogLogger(l.Handler(), enabledLevel(params.Ctx, l)),
			BaseContext: func(net.Listener) context.Context { return params.Ctx },
		},
		logger: l,
	}
}

func logReq(l *slog.Logger) func(*http.Request) func() {
	var requests atomic.Uint64
	return func(r *http.Request) func() {
		start := time.Now()
		l := l.With(slog.String("method", r.Method), slog.String("url", r.URL.String()), slog.Uint64("id", requests.Add(1)))
		l.Debug("request")
		return func() {
			l.Debug("complete", slog.Duration("elapsed", time.Since(start)))
		}
	}
}

func cors(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if len(origin) == 0 {
		return true
	}
	host := r.Host

	if origin == "http://"+host || origin == "https://"+host {
		return true
	}

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", strings.Join([]string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodHead,
			http.MethodOptions,
		}, ","))
		w.Header().Set("Access-Control-Allow-Headers", strings.Join([]string{
			"Origin",
			"Content-Length",
			"Content-Type",
		}, ","))
		w.Header().Set("Access-Control-Max-Age", strconv.FormatInt(int64((12*time.Hour)/time.Second), 10))
		w.Header().Set("Access-Control-Allow-Origin", "*")
		defer w.WriteHeader(http.StatusNoContent)
		return false
	} else {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		return true
	}
}

func enabledLevel(ctx context.Context, l *slog.Logger) slog.Level {
	last := slog.LevelDebug
	for _, next := range []slog.Level{slog.LevelDebug, slog.LevelInfo, slog.LevelWarn, slog.LevelError} {
		if l.Enabled(ctx, next) {
			last = next
		} else {
			return last
		}
	}
	return last
}

func (srv *Service) run(sd fx.Shutdowner) func() {
	return func() {
		go func() {
			defer sd.Shutdown(fx.ExitCode(0))
			srv.logger.Info("serving", slog.String("addr", srv.server.Addr))
			srv.logger.Error("server exited", slog.Any("error", srv.server.ListenAndServe()))
		}()
	}
}

func (srv *Service) shutdown(ctx context.Context) error {
	defer srv.server.Close()
	return srv.server.Shutdown(ctx)
}

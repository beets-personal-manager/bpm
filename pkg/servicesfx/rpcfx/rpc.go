package rpcfx

import (
	"context"
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/bobcatalyst/flow"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
	"io"
	"net"
	"net/rpc"
	"slices"
)

type (
	RPC interface {
		Name() string
		NewRPC(ctx context.Context, events flow.Pushable[subflow.Message]) (rcvr io.Closer, _ error)
	}
	AsRPC struct {
		fx.Out
		V RPC `group:"rpc"`
	}
)

type Service struct {
	rpc []RPC
}

type Params struct {
	fx.In
	RPCs []RPC `group:"rpc"`
}

func New(params Params) *Service {
	return &Service{rpc: params.RPCs}
}

type Server struct {
	port     uint16
	cancel   context.CancelFunc
	closed   chan struct{}
	closeErr error
}

func (srv *Service) Start(ctx context.Context, events flow.Pushable[subflow.Message]) (_ *Server, finalErr error) {
	ok, catch, finally := util.Cleanup()
	defer finally()

	ctx, cancel := context.WithCancel(ctx)
	catch(cancel)

	ln, err := (&net.ListenConfig{}).Listen(ctx, "tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	catch(func() { finalErr = errors.Join(finalErr, ln.Close()) })

	server := &Server{
		cancel: cancel,
		closed: make(chan struct{}),
	}

	if addr, ok := ln.Addr().(*net.TCPAddr); ok {
		server.port = uint16(addr.Port)
	} else {
		return nil, errors.New("invalid server address")
	}

	rpcSrv := rpc.NewServer()
	closers := []io.Closer{ln}
	for _, r := range srv.rpc {
		v, err := r.NewRPC(ctx, events)
		if err != nil {
			return nil, err
		}
		catch(func() { finalErr = errors.Join(finalErr, v.Close()) })
		closers = append(closers, v)

		if err := rpcSrv.RegisterName(r.Name(), v); err != nil {
			return nil, err
		}
	}

	go rpcSrv.Accept(ln)
	go func() {
		defer close(server.closed)
		<-ctx.Done()
		for _, fn := range slices.Backward(closers) {
			server.closeErr = errors.Join(server.closeErr, fn.Close())
		}
	}()

	ok()
	return server, nil
}

func (srv *Server) Port() uint16 {
	return srv.port
}

func (srv *Server) Close() error {
	srv.cancel()
	<-srv.closed
	return srv.closeErr
}

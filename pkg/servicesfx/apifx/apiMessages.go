package apifx

import (
	"encoding/json"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/bobcatalyst/sseflow"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
	"log/slog"
	"net/http"
)

type Messages struct {
	producers []serverfx.MessageProducer
	logger    *slog.Logger
}

type MessagesParams struct {
	fx.In
	Producers []serverfx.MessageProducer `group:"message-producer"`
	Logger    *slog.Logger
}

func newMessages(params MessagesParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Messages{
			producers: params.Producers,
		},
	}
}

func (*Messages) Name() string {
	return "messages"
}

func (rs *Messages) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /{$}", rs.getMessages)
}

func (rs *Messages) getMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Transfer-Encoding", "chunked")
	srv := sseflow.Upgrade(w, r)
	defer srv.Close()

	for _, p := range rs.producers {
		go func(event string, c <-chan subflow.Message) {
			for msg := range c {
				if b, err := json.Marshal(msg); err == nil {
					srv.Push(&sseflow.Message{
						Event: event,
						Data:  string(b),
					})
				} else {
					rs.logger.Error("failed to marshal message", slog.Any("error", err))
				}
			}
		}(p.Name(), p.Listen(srv))
	}
	<-srv.Done()
}

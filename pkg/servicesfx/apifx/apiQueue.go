package apifx

import (
	"encoding/json"
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/queuefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/google/uuid"
	"go.uber.org/fx"
	"io"
	"net/http"
)

type Queue struct {
	q        *queuefx.Service
	starters map[string]queuefx.QueueStarter
}

type QueueParams struct {
	fx.In
	Q        *queuefx.Service
	Starters []queuefx.QueueStarter `group:"queue-starter"`
}

func newQueue(params QueueParams) serverfx.AsApi {
	rs := &Queue{
		q:        params.Q,
		starters: make(map[string]queuefx.QueueStarter),
	}
	for _, s := range params.Starters {
		rs.starters[s.Name()] = s
	}
	return serverfx.AsApi{V: rs}
}

func (*Queue) Name() string {
	return "queue"
}

func (rs *Queue) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("POST /{id}/{action}", rs.modifyQueue)
	mux.HandleFunc("DELETE /{id}", rs.remove)
	mux.HandleFunc("POST /start", rs.start)
}

func (rs *Queue) start(w http.ResponseWriter, r *http.Request) {
	starterName, ok := r.Header["X-Command-Type"]
	if ok && (len(starterName) == 0 || len(starterName[0]) == 0) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	starter, ok := rs.starters[starterName[0]]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	v := starter.Body()
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if item, err := starter.Start(v); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else {
		rs.q.Start(r.Context(), item)
	}
}

func (rs *Queue) modifyQueue(w http.ResponseWriter, r *http.Request) {
	var action queuefx.ModifyAction
	var id uuid.UUID
	if err := util.GetPathValue(r, "action", &action); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if action != queuefx.ModifyActionRemove {
		rs.q.Modify(r.Context(), id, action)
	} else {
		w.WriteHeader(http.StatusBadRequest)
	}
}

func (rs *Queue) remove(w http.ResponseWriter, r *http.Request) {
	var id uuid.UUID
	if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else {
		rs.q.Modify(r.Context(), id, queuefx.ModifyActionRemove)
	}
}

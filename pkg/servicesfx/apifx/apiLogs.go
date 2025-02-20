package apifx

import (
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/logsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/google/uuid"
	"go.uber.org/fx"
	"io"
	"net/http"
	"os"
	"strconv"
)

type Logs struct {
	logs *logsfx.Service
}

type LogsParams struct {
	fx.In
	Logs *logsfx.Service
}

func newLogs(params LogsParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Logs{
			logs: params.Logs,
		},
	}
}

func (*Logs) Name() string {
	return "logs"
}

func (rs *Logs) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /", rs.getLogs)
	mux.HandleFunc("GET /{id}", rs.getLog)
	mux.HandleFunc("DELETE /{id}", rs.deleteLog)
	mux.HandleFunc("GET /{id}/{filename}", rs.getLogFile)
}

func (rs *Logs) getLogs(w http.ResponseWriter, r *http.Request) {
	if l, err := rs.logs.List(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, l)
	}
}

func (rs *Logs) getLog(w http.ResponseWriter, r *http.Request) {
	var id uuid.UUID
	if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if f, err := rs.logs.Log(id); errors.Is(err, os.ErrNotExist) {
		w.WriteHeader(http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else {
		defer f.Close()
		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Length", strconv.FormatInt(f.Size, 10))
		_, _ = io.Copy(w, f)
	}
}

func (rs *Logs) deleteLog(w http.ResponseWriter, r *http.Request) {
	var id uuid.UUID
	if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if err := rs.logs.Delete(id); errors.Is(err, os.ErrNotExist) {
		w.WriteHeader(http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

func (rs *Logs) getLogFile(w http.ResponseWriter, r *http.Request) {
	var id uuid.UUID
	if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if f, err := rs.logs.LogFS(id); errors.Is(err, os.ErrNotExist) {
		w.WriteHeader(http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else {
		defer f.Close()
		http.ServeFileFS(w, r, f, r.PathValue("filename"))
	}
}

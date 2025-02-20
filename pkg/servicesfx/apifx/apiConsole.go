package apifx

import (
	"encoding/json"
	"errors"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/consolefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"go.uber.org/fx"
	"maps"
	"net/http"
)

type Console struct {
	cs     *consolefx.Service
	inputs map[string]consolefx.Input
}

type ConsoleParams struct {
	fx.In
	Inputs  []consolefx.Input `group:"input"`
	Console *consolefx.Service
}

func newConsole(params ConsoleParams) serverfx.AsApi {
	inputs := map[string]consolefx.Input{}
	for _, i := range params.Inputs {
		inputs[i.Name()] = i
	}

	return serverfx.AsApi{
		V: &Console{
			cs:     params.Console,
			inputs: inputs,
		},
	}
}

func (*Console) Name() string {
	return "console"
}

func (rs *Console) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("DELETE /{$}", rs.stop)
	mux.HandleFunc("PUT /{$}", rs.input)
}

func (rs *Console) stop(w http.ResponseWriter, r *http.Request) {
	if err := rs.cs.Stop(); errors.Is(err, consolefx.ErrNotRunning) {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

func (rs *Console) input(w http.ResponseWriter, r *http.Request) {
	in, ok := rs.getInput(r)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	body := in.Body()

	if err := json.NewDecoder(r.Body).Decode(body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if err := in.Input(body, maps.Clone(r.Header)); errors.Is(err, consolefx.ErrNotRunning) {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

func (rs *Console) getInput(r *http.Request) (in consolefx.Input, ok bool) {
	if h, ok := r.Header["X-Input-Type"]; ok && len(h) > 0 {
		if in, ok = rs.inputs[h[0]]; ok {
			return in, true
		}
	}
	return
}

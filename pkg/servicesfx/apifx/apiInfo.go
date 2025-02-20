package apifx

import (
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/infofx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"go.uber.org/fx"
	"net/http"
	"os"
	"path/filepath"
)

type Info struct {
	info *infofx.Service
}

type InfoParams struct {
	fx.In
	Info *infofx.Service
}

func newinfo(params InfoParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Info{
			info: params.Info,
		},
	}
}

func (*Info) Name() string {
	return "info"
}

func (rs *Info) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /imports/{filename...}", rs.getInfoForImport)
	mux.HandleFunc("GET /tracks", rs.getInfoForLibrary)
	mux.HandleFunc("GET /beets", rs.getInfoForBeets)
}

func (rs *Info) getInfoForImport(w http.ResponseWriter, r *http.Request) {
	if v, err := rs.info.ImportInfo(r.Context(), filepath.FromSlash(r.PathValue("filename"))); errors.Is(err, os.ErrNotExist) {
		http.Error(w, err.Error(), http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, v)
	}
}

func (rs *Info) getInfoForLibrary(w http.ResponseWriter, r *http.Request) {
	if v, err := rs.info.TracksInfo(r.Context()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, v)
	}
}

func (rs *Info) getInfoForBeets(w http.ResponseWriter, r *http.Request) {
	q := new(beetsfx.Query)
	if ok, err := util.GetQueryValueOptional(r, "q", q); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if !ok {
		q = nil
	}

	if v, err := rs.info.BeetsInfo(r.Context(), q); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, v)
	}
}

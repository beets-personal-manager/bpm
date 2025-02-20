package apifx

import (
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/browsefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"go.uber.org/fx"
	"net/http"
	"os"
	"path/filepath"
)

type Browse struct {
	browse *browsefx.Service
}

type BrowseParams struct {
	fx.In
	Browse *browsefx.Service
}

func newBrowse(params BrowseParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Browse{
			browse: params.Browse,
		},
	}
}

func (*Browse) Name() string {
	return "browse"
}

func (rs *Browse) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /fileseparator", rs.getFileseparator)
	mux.HandleFunc("GET /files/{filename...}", rs.getFiles)
	mux.HandleFunc("DELETE /files/{filename...}", rs.deleteFile)
}

func (rs *Browse) getFileseparator(w http.ResponseWriter, _ *http.Request) {
	util.HTTPRespJSON(w, rs.browse.Fileseparator())
}

func (rs *Browse) getFiles(w http.ResponseWriter, r *http.Request) {
	if v, err := rs.browse.List(filepath.FromSlash(r.PathValue("filename"))); errors.Is(err, os.ErrNotExist) {
		w.WriteHeader(http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, v)
	}
}

func (rs *Browse) deleteFile(w http.ResponseWriter, r *http.Request) {
	if err := rs.browse.Delete(filepath.FromSlash(r.PathValue("filename"))); errors.Is(err, os.ErrNotExist) {
		w.WriteHeader(http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusNoContent)
	}
}

package apifx

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/libraryfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"github.com/bobcatalyst/iters"
	"go.uber.org/fx"
	"log/slog"
	"net/http"
	"os"
	"slices"
)

type Library struct {
	lib    *libraryfx.Service
	ctx    context.Context
	logger *slog.Logger
}

type LibraryParams struct {
	fx.In
	Lib    *libraryfx.Service
	Ctx    context.Context
	Logger *slog.Logger
}

func newLibrary(params LibraryParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Library{
			lib:    params.Lib,
			ctx:    params.Ctx,
			logger: params.Logger.With(slog.String("api", "library")),
		},
	}
}

func (*Library) Name() string {
	return "library"
}

func (rs *Library) RegisterAPI(mux *http.ServeMux) {
	mux.HandleFunc("GET /{$}", rs.list)
	mux.HandleFunc("GET /fields", rs.fields)
	mux.HandleFunc("GET /albumart/{id}", rs.albumArt)
	mux.HandleFunc("GET /libraries", rs.libraries)
}

func (rs *Library) libraries(w http.ResponseWriter, r *http.Request) {
	var a util.TextBool
	if err := util.GetQueryValue(r, "a", &a); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if libs, err := rs.lib.Libraries(r.Context(), a.Value()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, libs)
	}
}

func (rs *Library) fields(w http.ResponseWriter, r *http.Request) {
	if f, err := rs.lib.Fields(r.Context()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, f)
	}
}

func (rs *Library) albumArt(w http.ResponseWriter, r *http.Request) {
	var id util.TextNumber
	if err := util.GetPathValue(r, "id", &id); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	} else if art, err := rs.lib.AlbumArt(r.Context(), id.Value()); errors.Is(err, context.Canceled) {
		http.Error(w, err.Error(), http.StatusRequestTimeout)
	} else if errors.Is(err, os.ErrNotExist) {
		http.Error(w, err.Error(), http.StatusNotFound)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		http.ServeContent(w, r, art.Name(), art.ModTime(), art)
	}
}

func (rs *Library) list(w http.ResponseWriter, r *http.Request) {
	var (
		q      beetsfx.Query
		a, fft util.TextBool
		ik     includeKeys
	)

	if err := errors.Join(
		util.GetQueryValue(r, "q", &q),
		util.GetQueryValue(r, "a", &a),
		util.GetQueryValue(r, "fft", &fft),
		util.GetQueryValue(r, "ik", &ik),
	); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var opts []libraryfx.Option
	for ok, opt := range iters.IterJoin2[bool, libraryfx.Option](
		iters.IterValue2(true, libraryfx.OptionListQuery(q)),
		iters.IterValue2[bool, libraryfx.Option](a.Value(), libraryfx.OptionListOnlyAlbums),
		iters.IterValue2[bool, libraryfx.Option](fft.Value(), libraryfx.OptionListFromFiles),
		iters.IterValue2(len(ik) > 0, libraryfx.OptionListIncludeKeys(ik)),
	) {
		if ok {
			opts = append(opts, opt)
		}
	}

	enc := json.NewEncoder(w)
	if out, err := rs.lib.List(r.Context(), opts...); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		for msg := range out {
			if err := enc.Encode(msg); err != nil {
				rs.logger.Error("failed to write list response", slog.Any("error", err))
				return
			}
		}
	}
}

type includeKeys []string

func (ik *includeKeys) UnmarshalText(b []byte) error {
	ikb := bytes.Split(b, []byte(","))
	for i, v := range ikb {
		ikb[i] = bytes.TrimSpace(v)
	}
	ikb = slices.DeleteFunc(ikb, func(s []byte) bool { return len(s) == 0 })
	ikb = slices.CompactFunc(ikb, bytes.Equal)

	*ik = make([]string, len(ikb))
	for i, v := range ikb {
		(*ik)[i] = string(v)
	}
	return nil
}

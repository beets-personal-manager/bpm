package apifx

import (
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/configfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"go.uber.org/fx"
	"net/http"
)

type Config struct {
	cfg *configfx.Service
}

type ConfigParams struct {
	fx.In
	Cfg *configfx.Service
}

func newConfig(params ConfigParams) serverfx.AsApi {
	return serverfx.AsApi{
		V: &Config{cfg: params.Cfg},
	}
}

func (*Config) Name() string {
	return "config"
}

func (rs *Config) RegisterAPI(r *http.ServeMux) {
	r.HandleFunc("GET /queries", rs.getQueries)
	r.HandleFunc("GET /beets", rs.getBeetConfig)
}

func (rs *Config) getQueries(w http.ResponseWriter, r *http.Request) {
	if v, err := rs.cfg.ReadApplicationConfig(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespJSON(w, v.Queries)
	}
}

func (rs *Config) getBeetConfig(w http.ResponseWriter, r *http.Request) {
	if c, err := rs.cfg.ReadBeetsConfig(r.Context(), configfx.OptionBeetConfigWithDefault); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		util.HTTPRespYAML(w, c)
	}
}

package configfx

import (
	"context"
	"errors"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/filesfx"
	"go.uber.org/fx"
	"gopkg.in/yaml.v3"
	"io"
	"os"
)

type Service struct {
	location       string
	beets          *beetsfx.Service
	defaultLibrary string
	fi             *filesfx.Service
}

type Params struct {
	fx.In
	Ev   envfx.Env
	Beet *beetsfx.Service
	Fi   *filesfx.Service
}

func New(params Params) *Service {
	sv := &Service{
		beets:          params.Beet,
		location:       params.Ev.ConfigPath,
		defaultLibrary: params.Ev.DefaultLibraryName,
		fi:             params.Fi,
	}
	return sv
}

func (r *Service) ReadApplicationConfig() (*Config, error) {
	f, err := os.Open(r.location)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var cfg Config
	if err = yaml.NewDecoder(f).Decode(&cfg); err != nil && !errors.Is(err, io.EOF) {
		return nil, err
	}
	return &cfg, nil
}

type getBeetsConfigOptions struct {
	withDefault bool
	cfg         *beetsfx.Config
}

func OptionBeetConfigWithDefault(opts *getBeetsConfigOptions) {
	opts.withDefault = true
}

func OptionBeetConfigConfig(cfg *beetsfx.Config) func(*getBeetsConfigOptions) {
	return func(opts *getBeetsConfigOptions) { opts.cfg = cfg }
}

func (r *Service) ReadBeetsConfig(ctx context.Context, options ...func(*getBeetsConfigOptions)) (config map[string]any, _ error) {
	var opt getBeetsConfigOptions
	for _, fn := range options {
		fn(&opt)
	}

	var opts []beetsfx.Option
	if opt.cfg != nil {
		name, remove, err := r.fi.TmpYAML(opt.cfg)
		if err != nil {
			return nil, err
		}
		defer remove()
		opts = append(opts, beetsfx.OptionConfig(name))
	}

	data := r.beets.Run(ctx, beetsfx.ConfigSubCommand{
		WithDefault: opt.withDefault,
	}, opts...)
	if data.Err() != nil {
		return nil, data.Err()
	}

	if err := yaml.Unmarshal(data.Stdout(), &config); err != nil {
		return nil, err
	}
	return
}

func (r *Service) NewConfig() *beetsfx.Config {
	return beetsfx.NewConfig(r.defaultLibrary)
}

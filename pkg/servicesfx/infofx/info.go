package infofx

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"go.uber.org/fx"
)

type Service struct {
	beet       *beetsfx.Service
	tracksDir  string
	importPath string
}

type Params struct {
	fx.In
	Ev  envfx.Env
	Bcs *beetsfx.Service
}

func New(params Params) *Service {
	return &Service{
		beet:       params.Bcs,
		tracksDir:  params.Ev.LibraryPath,
		importPath: params.Ev.ImportPath,
	}
}

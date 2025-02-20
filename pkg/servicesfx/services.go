package servicesfx

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/apifx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/browsefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/clientfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/configfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/consolefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/deletefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/editorfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/filesfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/infofx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/libraryfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/logsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/queuefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/rpcfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"go.uber.org/fx"
)

var Module = fx.Module("services",
	apifx.Module,
	fx.Provide(
		beetsfx.New,
		browsefx.New,
		clientfx.New,
		configfx.New,
		consolefx.New,
		deletefx.New,
		editorfx.New,
		envfx.New,
		filesfx.New,
		infofx.New,
		libraryfx.New,
		logsfx.New,
	),
	queuefx.Module,
	fx.Provide(
		rpcfx.New,
	),
	serverfx.Module,
)

package queuefx

import (
	"encoding"
	"errors"
	"fmt"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/configfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/filesfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/logsfx"
	"github.com/bobcatalyst/subflow"
	"github.com/google/uuid"
	"go.uber.org/fx"
	"os"
	"path/filepath"
	"time"
)

type QueueImport struct {
	Path        *[]string         `json:"path"` // Required
	Query       *string           `json:"query"`
	Library     *string           `json:"library"` // Required
	Queries     []string          `json:"queries"`
	Set         map[string]string `json:"set"`
	GroupAlbums bool              `json:"groupAlbums"`
	Flat        bool              `json:"flat"`
	Singleton   bool              `json:"singleton"`
	Timid       bool              `json:"timid"`
	AsIs        bool              `json:"asIs"`
}

type QueueStarterImport struct {
	importPath string
	cfg        *configfx.Service
	fi         *filesfx.Service
}

type QueueStarterImportParams struct {
	fx.In
	Ev  envfx.Env
	Cfg *configfx.Service
	Fi  *filesfx.Service
}

func newQueueStarterImport(params QueueStarterImportParams) AsQueueStarter {
	return AsQueueStarter{
		V: &QueueStarterImport{
			importPath: params.Ev.ImportPath,
			cfg:        params.Cfg,
			fi:         params.Fi,
		},
	}
}

func (q *QueueStarterImport) Name() string { return "import" }
func (q *QueueStarterImport) Body() any    { return new(QueueImport) }

func (q *QueueStarterImport) Start(body any) (Item, error) {
	req := body.(*QueueImport)

	if req.Path == nil {
		return nil, errors.New("path required")
	}

	fp := filepath.Join(q.importPath, filepath.Join(*req.Path...))
	if _, err := os.Stat(fp); err != nil {
		return nil, err
	}

	cfg, err := q.cfg.ReadApplicationConfig()
	if err != nil {
		return nil, err
	}

	if req.Library == nil {
		return nil, errors.New("library is required")
	} else if *req.Library == "" {
		return nil, errors.New("library cannot be empty")
	}

	bcfg := beetsfx.NewConfig(*req.Library)
	for _, q := range req.Queries {
		if cfg.Queries.Exists(q) {
			bcfg.AddPathQuery(cfg.Queries.Get(q))
		} else {
			return nil, fmt.Errorf("query %q is not specified in the config", q)
		}
	}

	sc := beetsfx.ImportSubCommand{
		Singleton:   req.Singleton,
		Flat:        req.Flat,
		GroupAlbums: req.GroupAlbums,
		AsIs:        req.AsIs,
		Move:        true,
		FromScratch: true,
		Timid:       req.Timid,
		Set:         req.Set,
	}

	if req.Query != nil {
		// Reimport from query
		sc.Query = &beetsfx.Query{}
		sc.Query.Parse(*req.Query)
	} else {
		// Import from filesystem
		sc.Path = fp
	}

	lf, rlf, err := q.fi.Tmp()
	if err != nil {
		return nil, err
	}
	sc.LogFile = &lf

	return &importItem{
		api:    req,
		id:     uuid.New(),
		time:   time.Now(),
		cfg:    cfg,
		bcfg:   bcfg,
		sc:     sc,
		delLog: rlf,
	}, nil
}

type importItem struct {
	api    *QueueImport
	id     uuid.UUID
	time   time.Time
	cfg    *configfx.Config
	bcfg   *beetsfx.Config
	sc     beetsfx.ImportSubCommand
	delLog filesfx.RemoveFunc
}

func (ii *importItem) API() any                     { return ii.api }
func (ii *importItem) ID() uuid.UUID                { return ii.id }
func (ii *importItem) Time() time.Time              { return ii.time }
func (*importItem) Kind() beetsfx.CommandKind       { return beetsfx.CommandKindImport }
func (ii *importItem) AppConfig() *configfx.Config  { return ii.cfg }
func (ii *importItem) BeetsConfig() *beetsfx.Config { return ii.bcfg }
func (ii *importItem) Command() subflow.CommandArgs { return ii.sc }
func (ii *importItem) Cleanup() error               { return ii.delLog() }

func (ii *importItem) Extra() map[string]encoding.BinaryMarshaler {
	return map[string]encoding.BinaryMarshaler{
		"log.txt": logsfx.FileMarshaler(*ii.sc.LogFile),
	}
}

package libraryfx

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/configfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/filesfx"
	"github.com/bobcatalyst/iters"
	"github.com/bobcatalyst/subflow"
	"go.uber.org/fx"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

type Entry map[string]any

type Fields struct {
	Item  FieldSets `json:"item"`
	Album FieldSets `json:"album"`
}

type FieldSets struct {
	Fields            []string `json:"fields"`
	FlexibleAttribute []string `json:"flexibleAttribute"`
}

type Service struct {
	beets          *beetsfx.Service
	cfg            *configfx.Service
	fi             *filesfx.Service
	defaultLibrary string
	ctx            context.Context
	logger         *slog.Logger
	libraryPath    string
}

type Params struct {
	fx.In
	Beet   *beetsfx.Service
	Cfg    *configfx.Service
	Ev     envfx.Env
	Fi     *filesfx.Service
	Ctx    context.Context
	Logger *slog.Logger
}

func New(params Params) *Service {
	return &Service{
		beets:          params.Beet,
		cfg:            params.Cfg,
		defaultLibrary: params.Ev.DefaultLibraryName,
		fi:             params.Fi,
		ctx:            params.Ctx,
		logger:         params.Logger.With("service", "library"),
		libraryPath:    params.Ev.LibraryPath,
	}
}

type listOptions struct {
	albums      bool
	fromFiles   bool
	format      *beetsfx.ExportFormat
	query       beetsfx.Query
	includeKeys []string
}

type Option func(o *listOptions)

func OptionListOnlyAlbums(o *listOptions) {
	o.albums = true
}

func OptionListFromFiles(o *listOptions) {
	o.fromFiles = true
}

func OptionListIncludeKeys(keys []string) Option {
	return func(o *listOptions) {
		o.includeKeys = keys
	}
}

func OptionListFormat(format beetsfx.ExportFormat) Option {
	return func(o *listOptions) {
		o.format = &format
	}
}

func OptionListQuery(query beetsfx.Query) Option {
	return func(o *listOptions) {
		o.query = query
	}
}

type ArtFile struct {
	f       *os.File
	modTime time.Time
}

func (f *ArtFile) Close() error                                 { return f.f.Close() }
func (f *ArtFile) Read(p []byte) (n int, err error)             { return f.f.Read(p) }
func (f *ArtFile) Seek(offset int64, whence int) (int64, error) { return f.f.Seek(offset, whence) }
func (f *ArtFile) Name() string                                 { return f.f.Name() }
func (f *ArtFile) ModTime() time.Time                           { return f.modTime }

func (srv *Service) AlbumArt(ctx context.Context, albumID int) (*ArtFile, error) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	defer context.AfterFunc(srv.ctx, cancel)()

	var q beetsfx.Query
	q.Parse(fmt.Sprintf("id:%d", albumID))
	out, err := srv.List(ctx, OptionListQuery(q), OptionListOnlyAlbums)
	if err != nil {
		return nil, err
	}

	select {
	case <-ctx.Done():
		return nil, context.Canceled
	case v, ok := <-out:
		if ok {
			if artPath, ok := v["artpath"]; ok {
				if artPath, ok := artPath.(string); ok && artPath != "None" {
					artPath = strings.TrimPrefix(artPath, srv.libraryPath)
					artPath = strings.TrimLeft(artPath, string(filepath.Separator))
					f, err := os.OpenInRoot(srv.libraryPath, artPath)
					if err != nil {
						return nil, err
					}

					stat, err := f.Stat()
					if err != nil {
						return nil, errors.Join(f.Close(), err)
					}
					return &ArtFile{f: f, modTime: stat.ModTime()}, nil
				}
			}
		}
		return nil, os.ErrNotExist
	}
}

func (srv *Service) List(ctx context.Context, options ...Option) (_ <-chan Entry, finalErr error) {
	var opts listOptions
	for _, o := range options {
		o(&opts)
	}

	cfg, rmCfg, err := srv.fi.TmpYAML(&beetsfx.Config{
		Misc: map[string]any{
			"plugins": []string{"export"},
			"export": map[string]any{
				"json": map[string]any{
					"ensure_ascii": true,
					"sort_keys":    false,
				},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	c, cancel := context.WithCancel(ctx)
	defer func() {
		if finalErr != nil {
			cancel()
			finalErr = errors.Join(finalErr, rmCfg())
		} else {
			context.AfterFunc(c, func() { rmCfg() })
		}
	}()

	cmd, err := srv.beets.Exec(c, beetsfx.ExportSubCommand{
		Albums:      opts.albums,
		Library:     !opts.fromFiles,
		Format:      opts.format,
		Query:       opts.query,
		IncludeKeys: opts.includeKeys,
	}, beetsfx.OptionConfig(cfg))
	if err != nil {
		return nil, err
	}
	defer func() {
		if finalErr != nil {
			finalErr = errors.Join(finalErr, cmd.Close())
		} else {
			context.AfterFunc(c, func() { cmd.Close() })
		}
	}()

	pr, pw := io.Pipe()
	go writeStdout(cmd, c, cancel, pw)

	out := make(chan Entry)
	go srv.readExport(out, c, cancel, pr)

	return out, nil
}

func writeStdout(cmd *subflow.Cmd, ctx context.Context, cancel context.CancelFunc, pw *io.PipeWriter) {
	defer pw.Close()
	defer cancel()
	out := cmd.Listen(ctx)
	start := sync.OnceFunc(cmd.Start)
	for {
		start()
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-out:
			if !ok {
				return
			} else if out, ok := msg.(subflow.StdoutMessage); ok {
				if _, err := pw.Write(out.Data); err != nil {
					pw.CloseWithError(err)
					return
				}
			} else if _, ok := msg.(subflow.ExitMessage); ok {
				return
			}
		}
	}
}

func (srv *Service) readExport(out chan<- Entry, ctx context.Context, cancel context.CancelFunc, pr io.ReadCloser) {
	defer close(out)
	defer cancel()
	defer pr.Close()
	dec := json.NewDecoder(pr)
	for dec.More() {
		m := Entry{}
		if err := dec.Decode(&m); err != nil && !errors.Is(err, io.EOF) {
			srv.logger.Error("failed to decode export json line", slog.Any("error", err))
			return
		}
		select {
		case <-ctx.Done():
			return
		case out <- m:
		}
	}
}

const libraryNameKey = "library_name"

func (srv *Service) Libraries(ctx context.Context, albumsOnly bool) ([]string, error) {
	opts := []Option{OptionListIncludeKeys([]string{libraryNameKey})}
	if albumsOnly {
		opts = append(opts, OptionListOnlyAlbums)
	}

	out, err := srv.List(ctx, opts...)
	if err != nil {
		return nil, err
	}

	return slices.Sorted(iters.IterUnique(iters.IterJoin(iters.IterValue(srv.defaultLibrary), func(yield func(string) bool) {
		for e := range out {
			if name, ok := e[libraryNameKey].(string); ok && name != "" {
				if !yield(name) {
					return
				}
			}
		}
	}))), nil
}

func (srv *Service) Fields(ctx context.Context) (*Fields, error) {
	out := srv.beets.Run(ctx, &beetsfx.FieldsSubCommand{})
	if out.Err() != nil {
		return nil, out.Err()
	}

	var f Fields
	var scanTo *[]string
	sc := bufio.NewScanner(bytes.NewReader(out.Stdout()))
	for sc.Scan() {
		line := sc.Text()
		indented := strings.HasPrefix(line, "  ")
		if strings.HasSuffix(line, ":") && !indented {
			switch line {
			case "Item fields:":
				scanTo = &f.Item.Fields
			case "Album fields:":
				scanTo = &f.Album.Fields
			case "Item flexible attributes:":
				scanTo = &f.Item.FlexibleAttribute
			case "Album flexible attributes:":
				scanTo = &f.Album.FlexibleAttribute
			}
		} else if indented && scanTo != nil {
			line = strings.TrimSpace(line)
			*scanTo = append(*scanTo, line)
		}
	}

	if sc.Err() != nil {
		return nil, sc.Err()
	}
	return &f, nil
}

package logsfx

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"errors"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/deletefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"github.com/google/uuid"
	"go.uber.org/fx"
	"io"
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"
	"time"
)

const JSONManifest = "manifest.json"

type Service struct {
	dir    string
	ds     *deletefx.Service
	logger *slog.Logger
}

type Params struct {
	fx.In
	Ev     envfx.Env
	Ds     *deletefx.Service
	Logger *slog.Logger
}

func New(params Params) (*Service, error) {
	lg := params.Logger.With(slog.String("service", "logs"))
	if stat, err := os.Stat(params.Ev.LogsPath); err != nil {
		lg.Error("failed to stat logs dir", slog.String("dir", params.Ev.LogsPath), slog.Any("err", err))
		return nil, err
	} else if !stat.IsDir() {
		lg.Error("slog dir is not a dir", slog.String("dir", params.Ev.LogsPath))
		return nil, errors.New("logs dir is not a directory")
	}

	return &Service{
		dir:    params.Ev.LogsPath,
		ds:     params.Ds,
		logger: lg,
	}, nil
}

func (srv *Service) List() (a []*LogListing, _ error) {
	for e, err := range srv.logFiles {
		if err != nil {
			return nil, err
		}
		a = append(a, e)
	}
	return
}

func (srv *Service) Log(id uuid.UUID) (*File, error) {
	for e, err := range srv.logFiles {
		if err != nil {
			return nil, err
		} else if e.Log.ID == id {
			f, err := os.Open(filepath.Join(srv.dir, e.Name))
			if err != nil {
				return nil, err
			}
			return &File{ReadCloser: f, LogListing: *e}, nil
		}
	}
	return nil, os.ErrNotExist
}

func (srv *Service) Delete(id uuid.UUID) error {
	for e, err := range srv.logFiles {
		if err != nil {
			return err
		} else if e.Log.ID == id {
			return srv.ds.Delete(filepath.Join(srv.dir, e.Name))
		}
	}
	return os.ErrNotExist
}

type logFS struct {
	io.Closer
	fs.FS
}

func (srv *Service) LogFS(id uuid.UUID) (LogFS, error) {
	for e, err := range srv.logFiles {
		if err != nil {
			return nil, err
		} else if e.Log.ID == id {
			f, err := os.Open(filepath.Join(srv.dir, e.Name))
			if err != nil {
				return nil, err
			}
			zr, err := zip.NewReader(f, e.Size)
			if err != nil {
				return nil, err
			}

			return &logFS{
				Closer: f,
				FS:     zr,
			}, nil
		}
	}
	return nil, os.ErrNotExist
}

func (srv *Service) logFiles(yield func(l *LogListing, _ error) bool) {
	entries, err := os.ReadDir(srv.dir)
	if err != nil {
		yield(nil, err)
		return
	}

	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		var li LogListing
		li.Name = e.Name()
		info, err := e.Info()
		if err != nil {
			srv.logger.Error("failed to stat file", slog.Any("error", err))
			continue
		}
		li.Size = info.Size()

		if err := srv.readInfo(li.Name, &li.Log); err != nil {
			srv.logger.Error("failed to read info from file", slog.Any("error", err))
			continue
		}

		if !yield(&li, nil) {
			return
		}
	}
}

func (srv *Service) readInfo(name string, li *Log) error {
	f, err := os.Open(filepath.Join(srv.dir, name))
	if err != nil {
		return err
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return err
	}

	zf, err := zip.NewReader(f, stat.Size())
	if err != nil {
		return err
	}

	zff, err := zf.Open(JSONManifest)
	if err != nil {
		return err
	}
	defer zff.Close()

	dec := json.NewDecoder(zff)
	dec.DisallowUnknownFields()
	return dec.Decode(li)
}

func (srv *Service) WriteLog(logWriter *LogWriter, runErr error) (finalErr error) {
	files, err := getRawData(logWriter, runErr)
	if err != nil {
		return err
	}

	ts := logWriter.Time.Format(time.RFC3339Nano)
	filename := filepath.Join(srv.dir, ts+".zip")
	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer func() {
		if finalErr = errors.Join(finalErr, f.Close()); finalErr != nil {
			finalErr = errors.Join(finalErr, srv.ds.Delete(filename))
		}
	}()

	return writeZip(f, files)
}

func writeZip(f io.Writer, files map[string][]byte) (finalErr error) {
	zfw := zip.NewWriter(f)
	defer func() { finalErr = errors.Join(finalErr, zfw.Close()) }()

	for name, b := range files {
		w, err := zfw.Create(name)
		if err != nil {
			return err
		} else if _, err := io.Copy(w, bytes.NewReader(b)); err != nil {
			return err
		}
	}
	return nil
}

func getRawData(logWriter *LogWriter, runErr error) (map[string][]byte, error) {
	var e *string
	if runErr != nil {
		s := runErr.Error()
		e = &s
	}

	b, err := json.MarshalIndent(&Log{
		ID:   logWriter.ID,
		Time: logWriter.Time,
		Kind: logWriter.Kind,
		Err:  e,
	}, "", "    ")
	if err != nil {
		return nil, err
	}

	raw := map[string][]byte{JSONManifest: b}
	for name, marsh := range logWriter.Data() {
		b, err := marsh.MarshalBinary()
		if err != nil {
			return nil, err
		}
		raw[name] = b
	}
	return raw, nil
}

type LogFS interface {
	fs.FS
	io.Closer
}

type File struct {
	io.ReadCloser
	LogListing
}

type Log struct {
	ID   uuid.UUID           `json:"id"`
	Time time.Time           `json:"time"`
	Kind beetsfx.CommandKind `json:"kind"`
	Err  *string             `json:"err,omitempty"`
}

type LogListing struct {
	Log
	Name string `json:"name"`
	Size int64  `json:"size"`
}

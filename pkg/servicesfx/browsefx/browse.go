package browsefx

import (
	"errors"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/deletefx"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/envfx"
	"go.uber.org/fx"
	"os"
	"path/filepath"
)

type Service struct {
	delete     *deletefx.Service
	importPath string
}

type Params struct {
	fx.In
	Env    envfx.Env
	Delete *deletefx.Service
}

func New(params Params) *Service {
	return &Service{
		delete:     params.Delete,
		importPath: params.Env.ImportPath,
	}
}

func (*Service) Fileseparator() string {
	return string(filepath.Separator)
}

func (br *Service) Delete(path string) error {
	return br.delete.Delete(filepath.Join(br.importPath, path))
}

type DirEntry struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
	Path  string `json:"path"`
	Size  int64  `json:"size"`
}

func (br *Service) List(path string) (a []DirEntry, _ error) {
	path = filepath.Join(br.importPath, path)
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	for _, e := range entries {
		stat, err := br.readDirEntry(path, e)
		if err != nil {
			if errors.Is(err, errSkip) {
				continue
			}
			return nil, err
		}
		a = append(a, stat)
	}
	return
}

var errSkip = errors.New("")

func (*Service) readDirEntry(path string, e os.DirEntry) (DirEntry, error) {
	fp := filepath.Join(path, e.Name())
	de := DirEntry{
		Name:  e.Name(),
		Path:  fp,
		IsDir: e.IsDir(),
	}

	if !e.IsDir() {
		if !e.Type().IsRegular() {
			return DirEntry{}, errSkip
		}
		stat, err := e.Info()
		if err != nil {
			return DirEntry{}, err
		}
		de.Size = stat.Size()
	}
	return de, nil
}

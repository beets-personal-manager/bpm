package infofx

import (
	"context"
	"os"
	"path/filepath"
)

type Folder struct {
	Folders uint            `json:"folders"`
	Files   uint            `json:"files"`
	Types   map[string]uint `json:"types"`
}

func (in *Service) TracksInfo(ctx context.Context) (*Folder, error) {
	return in.getInfo(ctx, in.tracksDir)
}

func (in *Service) ImportInfo(ctx context.Context, path string) (*Folder, error) {
	return in.getInfo(ctx, filepath.Join(in.importPath, path))
}

func (in *Service) getInfo(ctx context.Context, path string) (*Folder, error) {
	var inf fileInfoCounter
	if err := inf.Walk(ctx, path); err != nil {
		return nil, err
	}

	if inf.Folder.Folders > 0 {
		inf.Folder.Folders--
	}
	return &inf.Folder, nil
}

type fileInfoCounter struct {
	Folder
}

func (info *fileInfoCounter) incType(filename string) {
	if info.Types == nil {
		info.Types = make(map[string]uint)
	}

	ext := filepath.Ext(filename)
	if ext == "" {
		return
	}

	info.Types[ext] = info.Types[ext] + 1
}

func (info *fileInfoCounter) Walk(ctx context.Context, dir string) error {
	return info.walkDir(ctx, dir)
}

func (info *fileInfoCounter) walkDir(ctx context.Context, dir string) error {
	e, err := info.readDir(dir)
	if err != nil {
		return err
	}
	info.Folders++
	return info.countFiles(ctx, dir, e)
}

func (info *fileInfoCounter) countFiles(ctx context.Context, dir string, e []os.DirEntry) error {
	for _, e := range e {
		if ctx.Err() != nil {
			return ctx.Err()
		} else if e.IsDir() {
			if err := info.walkDir(ctx, filepath.Join(dir, e.Name())); err != nil {
				return err
			}
		} else {
			info.incType(e.Name())
			info.Files++
		}
	}
	return nil
}

func (info *fileInfoCounter) readDir(dir string) ([]os.DirEntry, error) {
	fi, err := os.Open(dir)
	if err != nil {
		return nil, err
	}
	defer fi.Close()

	f, err := fi.ReadDir(-1)
	if err != nil {
		return nil, err
	}

	return f, err
}

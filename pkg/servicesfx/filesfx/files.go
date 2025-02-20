package filesfx

import (
    "errors"
    "github.com/beets-personal-manager/bpm/pkg/servicesfx/deletefx"
    "go.uber.org/fx"
    "gopkg.in/yaml.v3"
    "io"
    "os"
)

type RemoveFunc func() error

type Service struct {
    ds *deletefx.Service
}

type Params struct {
    fx.In
    Ds *deletefx.Service
}

func New(params Params) *Service {
    return &Service{
        ds: params.Ds,
    }
}

func (srv *Service) Tmp() (string, RemoveFunc, error) {
    f, err := os.CreateTemp("", "")
    if err != nil {
        return "", nil, err
    } else if err := f.Close(); err != nil {
        return "", nil, err
    }
    return f.Name(), func() error { return srv.ds.Delete(f.Name()) }, nil
}

func (srv *Service) TmpYAML(a any) (string, RemoveFunc, error) {
    return srv.tmpEncode(a, "*.yml", func(w io.Writer) encoder {
        enc := yaml.NewEncoder(w)
        enc.SetIndent(2)
        return enc
    })
}

type encoder interface {
    Encode(any) error
}

func (srv *Service) tmpEncode(a any, pattern string, newEnc func(io.Writer) encoder) (_ string, _ RemoveFunc, finalErr error) {
    f, err := os.CreateTemp("", pattern)
    if err != nil {
        return "", nil, err
    }
    rm := func() error { return srv.ds.Delete(f.Name()) }
    defer func() {
        if finalErr = errors.Join(finalErr, f.Close()); finalErr != nil {
            finalErr = errors.Join(finalErr, rm())
        }
    }()

    enc := newEnc(f)
    if cl, ok := enc.(io.Closer); ok {
        defer func() {
            finalErr = errors.Join(finalErr, cl.Close())
        }()
    }

    if err := enc.Encode(a); err != nil {
        return "", nil, err
    }
    return f.Name(), rm, nil
}

package clientfx

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
	"net/http"
	"path"
	"strings"
)

func New() serverfx.AsClient {
	srv := http.FileServerFS(webFs)
	return serverfx.AsClient{V: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if canServeFile(path.Clean(r.URL.Path)) {
			srv.ServeHTTP(w, r)
		} else {
			r := r.Clone(r.Context())
			r.URL.Path = "/"
			srv.ServeHTTP(w, r)
		}
	})}
}

func canServeFile(file string) bool {
	f, err := webFs.Open(strings.TrimLeft(file, "/"))
	if err != nil {
		return false
	}
	defer f.Close()

	if stat, err := f.Stat(); err != nil {
		return false
	} else if stat.IsDir() {
		return false
	}

	return true
}

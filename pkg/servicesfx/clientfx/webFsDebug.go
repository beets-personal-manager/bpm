//go:build debug

package clientfx

import (
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
)

var webFs fs.FS

func init() {
	_, staticLocation, _, ok := runtime.Caller(0)
	if !ok {
		panic(staticLocation)
	}

	static, err := os.OpenRoot(filepath.Join(filepath.Dir(staticLocation), "static"))
	if err != nil {
		panic(err)
	}
	webFs = static.FS()
	// Don't close static, will get closed when program exits
}

//go:build !debug

package clientfx

//go:generate npm run --prefix ../../../web/ build

import (
	"embed"
	"io/fs"
)

var (
	//go:embed static
	web   embed.FS
	webFs fs.FS
)

func init() {
	f, err := fs.Sub(web, "static")
	if err != nil {
		panic(err)
	}
	webFs = f
}

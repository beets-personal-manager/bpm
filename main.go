package main

import (
	"github.com/bobcatalyst/mainfx"

	_ "github.com/beets-personal-manager/bpm/cmd/editor"
	_ "github.com/beets-personal-manager/bpm/cmd/server"
)

func main() {
	mainfx.Main()
}

package server

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx"
	"github.com/bobcatalyst/mainfx"
)

func init() {
	mainfx.RegisterSubcommand("server", "Runs the bpm server.", servicesfx.Module)
}

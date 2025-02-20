package editor

import (
    _ "embed"
    "strings"
)

//go:generate go run genName/main.go

//go:embed command
var CommandName string

func init() {
    CommandName = strings.TrimSpace(CommandName)
}
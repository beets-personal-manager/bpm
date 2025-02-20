package beetsfx

import (
	"fmt"
	"github.com/beets-personal-manager/bpm/internal/app/editor"
	"github.com/bobcatalyst/subflow"
	"os"
	"slices"
	"sync"
)

//go:generate go run github.com/dmarkham/enumer -json -yaml -text -type CommandKind -trimprefix CommandKind -transform lower

type CommandKind int

const (
	CommandKindImport CommandKind = iota
)

type Verbosity uint

const (
	VerbosityQuiet Verbosity = iota
	VerbosityVerbose
	VerbosityVeryVerbose
)

type Command struct {
	BaseCommand subflow.CommandArgs
	SubCommand  subflow.CommandArgs
	RPCPort     *uint16
	Config      *string
	TracksDir   string
	BeetsHome   string
	Verbosity   Verbosity
}

func (cmd *Command) Command() string {
	return cmd.BaseCommand.Command()
}

func (cmd *Command) Args() []string {
	args := slices.Clone(cmd.BaseCommand.Args())
	if cmd.Config != nil {
		args = append(args, "-c", *cmd.Config)
	}

	switch cmd.Verbosity {
	case VerbosityQuiet:
	case VerbosityVerbose:
		args = append(args, "-v")
	case VerbosityVeryVerbose:
		args = append(args, "-vv")
	}

	args = append(args, "-d", cmd.TracksDir)
	args = append(args, cmd.SubCommand.Command())
	args = append(args, cmd.SubCommand.Args()...)
	return args
}

var executable = sync.OnceValue(func() string {
	exec, err := os.Executable()
	if err != nil {
		panic(err)
	}
	return exec
})

func (cmd *Command) Environment() []string {
	env := []string{
		fmt.Sprintf("BEETSDIR=%s", cmd.BeetsHome),
		fmt.Sprintf("EDITOR=%s %s", executable(), editor.CommandName),
	}
	if cmd.RPCPort != nil {
		env = append(env, fmt.Sprintf("BEETS_RPC_PORT=%d", *cmd.RPCPort))
	}
	return env
}

type Subcommand[T fmt.Stringer] struct {
	Cmd subflow.JSONString[T] `json:"command"`
}

func (s Subcommand[T]) Command() string {
	return s.Cmd.String()
}

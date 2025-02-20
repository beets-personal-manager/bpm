package editor

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"github.com/beets-personal-manager/bpm/internal/app/editor"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/editorfx"
	"github.com/bobcatalyst/debug"
	"github.com/bobcatalyst/envstruct"
	"github.com/bobcatalyst/mainfx"
	"go.uber.org/fx"
	"gopkg.in/yaml.v3"
	"io"
	"net"
	"net/rpc"
	"os"
)

func init() {
	mainfx.RegisterSubcommand(editor.CommandName, "Runs the bpm editor. For internal use only.", module)
}

type Env struct {
	Port uint16 `env:"BEETS_RPC_PORT" description:"Port to dial to connect to RPC server." parser:"port"`
}

var module = fx.Module("editor",
	fx.Provide(
		fx.Private,
		debugOutput,
		envstruct.Unmarshal[Env],
	),
	fx.Provide(
		fx.Private,
		ReadFile.do,
		DoRPC.do,
	),
	fx.Invoke(WriteFile.do),
)

type WriteFile struct {
	fx.In
	InFile      *editorfx.OutputEditorStart
	Outfile     *editorfx.InputEditor
	DebugOutput io.Writer `name:"debugOutput"`
	Shutdown    fx.Shutdowner
}

func (params WriteFile) do() (finalErr error) {
	defer func() {
		if finalErr == nil {
			params.Shutdown.Shutdown(fx.ExitCode(0))
		} else {
			params.Shutdown.Shutdown(fx.ExitCode(1))
		}
	}()

	f, err := os.OpenFile(params.InFile.Filename, os.O_WRONLY|os.O_TRUNC|os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer func() { finalErr = errors.Join(finalErr, f.Close()) }()

	enc := yaml.NewEncoder(io.MultiWriter(f, params.DebugOutput))
	for _, data := range params.Outfile.Data {
		if err := enc.Encode(data); err != nil {
			return err
		}
	}
	return enc.Close()
}

type DoRPC struct {
	fx.In
	InFile *editorfx.OutputEditorStart
	Env    Env
	Ctx    context.Context
}

func (params DoRPC) do() (*editorfx.InputEditor, error) {
	ctx, cancel := context.WithCancel(params.Ctx)
	defer cancel()
	conn, err := (&net.Dialer{}).DialContext(ctx, "tcp", fmt.Sprintf("127.0.0.1:%d", params.Env.Port))
	if err != nil {
		return nil, err
	}
	defer conn.Close()
	cli := rpc.NewClient(conn)

	var outFile editorfx.InputEditor
	if err := cli.Call("editor.Edit", *params.InFile, &outFile); err != nil {
		return nil, err
	}
	return &outFile, nil
}

type ReadFile struct {
	fx.In
	Args        *mainfx.OsArgs
	DebugOutput io.Writer `name:"debugOutput"`
}

func (params ReadFile) do() (*editorfx.OutputEditorStart, error) {
	if len(params.Args.CommandArgs) == 0 {
		return nil, errors.New("no file to edit")
	}

	name := params.Args.CommandArgs[0]
	f, err := os.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	dec := yaml.NewDecoder(io.TeeReader(f, params.DebugOutput))
	data := make([]map[string]any, 0, 20)
	for {
		var m map[string]any
		if err := dec.Decode(&m); err != nil {
			if errors.Is(err, io.EOF) {
				o := editorfx.NewEditorMessage[editorfx.OutputEditorStart](name, data)
				return o, nil
			}
			return nil, err
		}
		data = append(data, m)
	}
}

func debugOutput() (v struct {
	fx.Out
	W io.Writer `name:"debugOutput"`
}) {
	v.W = io.Discard
	if debug.Debug {
		v.W = os.Stderr
	}
	return
}

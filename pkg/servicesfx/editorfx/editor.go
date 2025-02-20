package editorfx

import (
    "github.com/beets-personal-manager/bpm/pkg/servicesfx/consolefx"
    "github.com/beets-personal-manager/bpm/pkg/servicesfx/rpcfx"
    "github.com/beets-personal-manager/bpm/pkg/servicesfx/serverfx"
    "github.com/bobcatalyst/flow"
    "github.com/bobcatalyst/subflow"
    "go.uber.org/fx"
    "sync/atomic"
)

type Service struct {
	editor atomic.Pointer[instance]
	output flow.Repeater[subflow.Message]
}

type EditorParams struct {
	fx.In
}

type EditorReturn struct {
	fx.Out
	consolefx.AsInput
	rpcfx.AsRPC
	serverfx.AsMessageProducer
}

func New(params EditorParams) EditorReturn {
	var editor Service
	return EditorReturn{
		AsInput: consolefx.AsInput{
			V: &editor,
		},
		AsRPC: rpcfx.AsRPC{
			V: &editor,
		},
		AsMessageProducer: serverfx.AsMessageProducer{
			V: &editor,
		},
	}
}

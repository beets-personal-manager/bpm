package editorfx

import (
	"fmt"
	"github.com/beets-personal-manager/bpm/internal/pkg/util"
	"github.com/bobcatalyst/subflow"
)

type EditorMessage[K fmt.Stringer] struct {
	subflow.BaseMessage[KindEditor]
	Editor   subflow.JSONString[K] `json:"editor"`
	Filename string                `json:"filename"`
	Data     []map[string]any      `json:"data"`
}

type OutputEditorStart struct {
	EditorMessage[EditorKindStart]
	End *util.AtomicPointer[InputEditor] `json:"end"`
}

type InputEditor struct {
	EditorMessage[EditorKindInput]
	Failed bool `json:"failed"`
}

type EditorLike interface {
	OutputEditorStart | InputEditor
}

func newBaseEditorMessage[K fmt.Stringer](filename string, data []map[string]any) EditorMessage[K] {
	return EditorMessage[K]{
		BaseMessage: subflow.NewBaseMessage[KindEditor](),
		Filename:    filename,
		Data:        data,
	}
}

func NewEditorMessage[T EditorLike](filename string, data []map[string]any) *T {
	var v T
	switch v := any(&v).(type) {
	case *OutputEditorStart:
		v.EditorMessage = newBaseEditorMessage[EditorKindStart](filename, data)
	case *InputEditor:
		v.EditorMessage = newBaseEditorMessage[EditorKindInput](filename, data)
	}
	return &v
}

func newFailedEditor(filename string) *InputEditor {
	ed := NewEditorMessage[InputEditor](filename, []map[string]any{})
	ed.Failed = true
	return ed
}

type KindEditor struct{}

func (KindEditor) String() string {
	return "editor"
}

type EditorKindStart struct{}

func (EditorKindStart) String() string { return "start" }

type EditorKindInput struct{}

func (EditorKindInput) String() string { return "input" }

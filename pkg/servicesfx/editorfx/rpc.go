package editorfx

import (
    "context"
    "fmt"
    "github.com/beets-personal-manager/bpm/internal/pkg/util"
    "github.com/bobcatalyst/flow"
    "github.com/bobcatalyst/subflow"
    "io"
    "sync"
)

func (*Service) Name() string {
    return "editor"
}

type Editor struct {
    events flow.Pushable[subflow.Message]
    rpc    *Service
    ctx    context.Context
    cancel context.CancelFunc
}

func (e *Service) NewRPC(ctx context.Context, events flow.Pushable[subflow.Message]) (rcvr io.Closer, _ error) {
    ed := Editor{
        rpc:    e,
        events: events,
    }
    ed.ctx, ed.cancel = context.WithCancel(ctx)
    return &ed, nil
}

func (ed *Editor) Close() error {
    ed.cancel()
    return nil
}

func (ed *Editor) Edit(output OutputEditorStart, input *InputEditor) (finalErr error) {
    ctx, cancel := context.WithCancel(ed.ctx)
    defer cancel()

    ins := &instance{
        e:        ed,
        cancel:   cancel,
        inputSet: make(chan struct{}),
        filename: output.Filename,
    }
    output.End = &ins.end
    defer context.AfterFunc(ctx, func() { ins.Close() })()
    defer ins.Close()

    // Close previous instance if exists
    if p := ed.rpc.editor.Swap(ins); p != nil {
        p.Close()
    }

    ed.rpc.output.Reset(output)
    ed.events.Push(output)

    select {
    case <-ctx.Done():
        return ctx.Err()
    case <-ins.inputSet:
        *input = *ins.input
        return nil
    }
}

type instance struct {
    e        *Editor
    cancel   context.CancelFunc
    inputSet chan struct{}
    input    *InputEditor
    close    sync.Once
    closeErr error
    filename string
    end      util.AtomicPointer[InputEditor]
}

func (ins *instance) Submit(data []map[string]any, filename string) error {
    return ins.Close(NewEditorMessage[InputEditor](filename, data))
}

func (ins *instance) Close(end ...*InputEditor) error {
    if err := ins.validate(end); err != nil {
        return err
    }
    input := append(end, newFailedEditor(ins.filename))[0]

    ins.close.Do(func() {
        defer ins.e.rpc.editor.CompareAndSwap(ins, nil)
        defer ins.cancel()
        defer close(ins.inputSet)
        ins.input = input
        ins.end.Set(input)
        // Push then reset to clear
        ins.e.rpc.output.Push(input)
        ins.e.rpc.output.Reset()
        // File logging
        ins.e.events.Push(input)
    })
    return ins.closeErr
}

func (ins *instance) validate(end []*InputEditor) error {
    if len(end) > 0 && end[0].Filename != ins.filename {
        return fmt.Errorf("expected filename %s, go %s", ins.filename, end[0].Filename)
    }
    return nil
}

package logsfx

import (
	"encoding"
	"encoding/json"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/bobcatalyst/subflow"
	"github.com/google/uuid"
	"iter"
	"maps"
	"time"
)

type LogWriter struct {
	Time         time.Time
	Kind         beetsfx.CommandKind
	stdioJson    BufMarshaler
	stdioJsonEnc *json.Encoder
	stdoutTxt    BufMarshaler
	stderrTxt    BufMarshaler
	API          any
	Config       *beetsfx.Config
	Subcommand   subflow.CommandArgs
	ExtraFiles   map[string]encoding.BinaryMarshaler
	ID           uuid.UUID
}

func NewLogWriter() *LogWriter {
	var lw LogWriter
	lw.stdioJsonEnc = json.NewEncoder(&lw.stdioJson)
	return &lw
}

func (lw *LogWriter) WriteMessage(m subflow.Message) error {
	if err := lw.stdioJsonEnc.Encode(m); err != nil {
		return err
	}

	switch msg := m.(type) {
	case subflow.StderrMessage:
		lw.stderrTxt.Write(msg.Data)
	case subflow.StdoutMessage:
		lw.stdoutTxt.Write(msg.Data)
	case subflow.StdinMessage:
		lw.stdoutTxt.Write(msg.Data)
	}
	return nil
}

func (lw *LogWriter) Data() iter.Seq2[string, encoding.BinaryMarshaler] {
	return iterJoin2(
		maps.All(map[string]encoding.BinaryMarshaler{
			"stdout.txt":      &lw.stdoutTxt,
			"stderr.txt":      &lw.stderrTxt,
			"stdio.json":      &lw.stdioJson,
			"request.json":    JSONMarshaler{lw.API},
			"subcommand.json": JSONMarshaler{lw.Subcommand},
			"config.yaml":     YAMLMarshaler{lw.Config},
		}),
		maps.All(lw.ExtraFiles),
	)
}

func iterJoin2[T1, T2 any](i ...iter.Seq2[T1, T2]) iter.Seq2[T1, T2] {
	return func(yield func(T1, T2) bool) {
		for _, i := range i {
			for i1, i2 := range i {
				if !yield(i1, i2) {
					return
				}
			}
		}
	}
}

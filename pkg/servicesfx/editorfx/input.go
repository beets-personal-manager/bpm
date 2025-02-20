package editorfx

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/consolefx"
	"net/http"
)

func (e *Service) Body() any {
	var m []map[string]any
	return &m
}

func (e *Service) Input(data any, headers http.Header) error {
	if p := e.editor.Load(); p != nil {
		return p.Submit(*(data.(*[]map[string]any)), headers.Get("X-Editor-Filename"))
	}
	return consolefx.ErrNotRunning
}

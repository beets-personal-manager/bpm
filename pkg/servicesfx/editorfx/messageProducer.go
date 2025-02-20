package editorfx

import (
	"context"
	"github.com/bobcatalyst/subflow"
)

func (e *Service) Event() string {
	return "editor"
}

func (e *Service) Listen(ctx context.Context) <-chan subflow.Message {
	return e.output.Listen(ctx)
}

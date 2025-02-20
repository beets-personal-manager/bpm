package deletefx

import (
	"go.uber.org/fx"
	"log/slog"
)

type Service struct {
	logger *slog.Logger
}

type Params struct {
	fx.In
	Logger *slog.Logger
}

func New(params Params) *Service {
	return &Service{
		logger: params.Logger.WithGroup("delete"),
	}
}

func (s *Service) Delete(path string) error {
	s.logger.Debug("deleting files", slog.String("path", path))
	return remove(path)
}

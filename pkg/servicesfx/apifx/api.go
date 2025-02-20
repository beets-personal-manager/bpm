package apifx

import (
	"go.uber.org/fx"
)

var Module = fx.Module("api",
	fx.Provide(
		newBrowse,
		newConfig,
		newConsole,
		newinfo,
		newLibrary,
		newLogs,
		newMessages,
		newQueue,
	),
)

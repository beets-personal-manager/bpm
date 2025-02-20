package envfx

import (
	"github.com/bobcatalyst/envstruct"
	"github.com/bobcatalyst/subflow"
)

type Env struct {
	ServeAddress       string              `env:"SERVE_ADDRESS" description:"The address to serve on." default:"0.0.0.0:23387"`
	BeetsHome          string              `env:"BEETS_HOME" description:"The BEETSHOME directory used by beets." default:"/config" parser:"absFile"`
	ImportPath         string              `env:"IMPORT_PATH" description:"A path to a folder where files to import are stored." default:"/import" parser:"absFile"`
	ConfigPath         string              `env:"CONFIG_PATH" description:"The path to the bpm config." default:"/config/bpm.yml" parser:"absFile"`
	LibraryPath        string              `env:"LIBRARY_PATH" description:"The directory where the music library is stored." default:"/library" parser:"absFile"`
	LogsPath           string              `env:"LOGS_PATH" description:"The directory to store log files in." default:"/logs" parser:"absFile"`
	BeetCmdArgs        subflow.CommandArgs `env:"BEET_CMD" description:"The command to launch beets with." default:"beet" parser:"args"`
	DefaultLibraryName string              `env:"DEFAULT_LIBRARY_NAME" description:"The name of the default library" default:"Tracks"`
}

func New() (Env, error) {
	return envstruct.Unmarshal[Env]()
}

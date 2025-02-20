package beetsfx

import (
	"encoding/json"
	"gopkg.in/yaml.v3"
	"maps"
	"path/filepath"
	"time"
)

type (
	Config struct {
		Threaded StringBool
		// The options that allow for customization of the visual appearance of the console interface.
		UI     UIConfig
		Import ImportConfig
		// Paths contains beets path queries.
		Paths PathConfig
		Misc  Y
	}
	PathConfig struct {
		LibraryName string
		Default     string
		Comp        string
		Singleton   string
		Queries     map[string]string
	}
	UIConfig struct {
		// Either yes or no; whether to use color in console output (currently only in the import command). Turn this off if your terminal doesn’t support ANSI colors.
		Color StringBool `yaml:"color" json:"color"`
	}
	ImportConfig struct {
		// SetFields contains extra data to include on import.
		SetFields ImportSetFieldsConfig `yaml:"set_fields" json:"set_fields"`
	}
	ImportSetFieldsConfig struct {
		// Name of the library the track is saved in
		LibraryName string `yaml:"library_name" json:"library"`
		// Date time of import
		ImportDate StringTime `yaml:"import_date" json:"import_date"`
	}
)

type Y map[string]any

var (
	_ yaml.Marshaler = StringBool(false)
	_ yaml.IsZeroer  = StringBool(false)
)

type StringBool bool

func (s StringBool) IsZero() bool {
	return bool(!s)
}

func (s StringBool) MarshalYAML() (any, error) {
	if s {
		return "yes", nil
	}
	return "no", nil
}

var (
	_ yaml.Marshaler = StringTime(time.Now())
	_ yaml.IsZeroer  = StringTime(time.Now())
)

type StringTime time.Time

func (s StringTime) IsZero() bool {
	return time.Time(s).IsZero()
}

func (s StringTime) MarshalYAML() (any, error) {
	b, _ := time.Time(s).MarshalText()
	return string(b), nil
}

func NewConfig(libraryName string) *Config {
	return &Config{
		Threaded: true,
		UI:       UIConfig{Color: true},
		Import: ImportConfig{
			SetFields: ImportSetFieldsConfig{
				LibraryName: libraryName,
				ImportDate:  StringTime(time.Now()),
			},
		},
		Paths: PathConfig{
			LibraryName: libraryName,
			Default:     filepath.Join("$albumartist", "$album%aunique{}", "$track $title"),
			Comp:        filepath.Join("Compilations", "$album%aunique{}", "$track $title"),
			Singleton:   filepath.Join("Singles", "$artist - $title"),
			Queries:     map[string]string{},
		},
	}
}

func (cfg *Config) AddPathQuery(search, path string) *Config {
	cfg.Paths.Queries[search] = path
	return cfg
}

func (cfg *Config) SetLibraryName(name string) *Config {
	cfg.Import.SetFields.LibraryName = name
	cfg.Paths.LibraryName = name
	return cfg
}

func (cfg *Config) MarshalJSON() ([]byte, error) {
	return json.Marshal(cfg.toRaw())
}

func (cfg *Config) MarshalYAML() (any, error) {
	return cfg.toRaw(), nil
}

func (cfg *Config) toRaw() map[string]any {
	m := map[string]any{
		"threaded": cfg.Threaded,
		"ui":       cfg.UI,
		"import":   cfg.Import,
		"paths":    cfg.Paths,
	}

	for k, v := range cfg.Misc {
		m[k] = v
	}
	return m
}

func (p PathConfig) MarshalYAML() (any, error) {
	m := maps.Clone(p.Queries)
	if m == nil {
		return map[string]any{}, nil
	}
	m["default"] = p.Default
	m["singleton"] = p.Singleton
	m["comp"] = p.Comp
	for k, v := range m {
		m[k] = filepath.Join(p.LibraryName, v)
	}
	return m, nil
}

func (p PathConfig) MarshalJSON() ([]byte, error) {
	m, _ := p.MarshalYAML()
	return json.Marshal(m)
}

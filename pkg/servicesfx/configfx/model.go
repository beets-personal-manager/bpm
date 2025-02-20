package configfx

import "gopkg.in/yaml.v3"

type Config struct {
	Queries Queries `yaml:"queries" json:"queries"`
}

func (cfg *Config) UnmarshalYAML(n *yaml.Node) error {
	type rawCfgTyp Config
	var rawCfg rawCfgTyp
	var soundtrackQuery struct {
		SoundtrackQuery bool `yaml:"soundtrack-query"`
	}

	if err := n.Decode(&rawCfg); err != nil {
		return err
	} else if err := n.Decode(&soundtrackQuery); err != nil {
		return err
	}

	if rawCfg.Queries == nil {
		rawCfg.Queries = Queries{}
	}

	if soundtrackQuery.SoundtrackQuery {
		rawCfg.Queries[SoundtrackQueryName] = &SoundtrackQuery
	}

	*cfg = Config(rawCfg)
	return nil
}

package configfx

import (
	"encoding/json"
	"gopkg.in/yaml.v3"
	"maps"
	"slices"
)

const SoundtrackQueryName = "Soundtracks"

var SoundtrackQuery = Query{
	Name:  SoundtrackQueryName,
	Query: "albumtype:soundtrack",
	Path:  "Soundtracks/$album%aunique{}/$track $title",
}

type (
	// Queries represent named path queries
	Queries map[string]*Query
	Query   struct {
		Name  string `yaml:"-"`
		Query string `yaml:"query"`
		Path  string `yaml:"path"`
	}
)

func (q Queries) QueryNames() []string { return slices.Sorted(maps.Keys(q)) }

func (q Queries) MarshalJSON() ([]byte, error) { return json.Marshal(q.QueryNames()) }

func (q Queries) UnmarshalYAML(n *yaml.Node) error {
	type rawType Queries
	if err := n.Decode((*rawType)(&q)); err != nil {
		return err
	}
	for name, query := range q {
		query.Name = name
	}
	return nil
}

func (q Queries) Get(name string) (query, path string) {
	if q, ok := q[name]; ok {
		return q.Query, q.Path
	}
	return
}

func (q Queries) Exists(name string) bool { _, ok := q[name]; return ok }

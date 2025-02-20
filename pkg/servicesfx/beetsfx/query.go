package beetsfx

import (
	"encoding/json"
	"gopkg.in/yaml.v3"
	"regexp"
	"slices"
	"strings"
)

type Query []string

var argsPattern = regexp.MustCompile(`("[^"]*"|[^"\s]+)(\s+|$)`)

func (q *Query) Parse(s string) {
	var args []string
	for _, v := range argsPattern.FindAllString(s, -1) {
		if v = strings.TrimSpace(v); v != "" {
			args = append(args, v)
		}
	}
	*q = args
}

func (q *Query) Iter(yield func(string) bool) {
	slices.Values(*q)(yield)
}

func (q *Query) UnmarshalJSON(b []byte) error {
	var n string
	if err := json.Unmarshal(b, &n); err != nil {
		return err
	}
	q.Parse(n)
	return nil
}

func (q *Query) UnmarshalText(b []byte) error {
	q.Parse(string(b))
	return nil
}

func (q *Query) UnmarshalYAML(n *yaml.Node) error {
	var s string
	if err := n.Decode(&s); err != nil {
		return err
	}
	q.Parse(s)
	return nil
}

func (q *Query) UnmarshalParam(param string) error {
	q.Parse(param)
	return nil
}

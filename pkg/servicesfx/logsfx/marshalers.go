package logsfx

import (
	"bytes"
	"encoding/json"
	"gopkg.in/yaml.v3"
	"os"
)

type BytesMarshaler []byte

func (b BytesMarshaler) MarshalBinary() ([]byte, error) { return b, nil }

type BufMarshaler struct{ bytes.Buffer }

func (b *BufMarshaler) MarshalBinary() ([]byte, error) { return b.Bytes(), nil }

type FileMarshaler string

func (fi FileMarshaler) MarshalBinary() ([]byte, error) { return os.ReadFile(string(fi)) }

type JSONMarshaler struct{ A any }

func (jm JSONMarshaler) MarshalBinary() ([]byte, error) { return json.MarshalIndent(jm.A, "", "    ") }

type YAMLMarshaler struct{ A any }

func (ym YAMLMarshaler) MarshalBinary() ([]byte, error) { return yaml.Marshal(ym.A) }

package util

import (
	"encoding"
	"encoding/json"
	"gopkg.in/yaml.v3"
	"net/http"
	"path/filepath"
	"strconv"
)

func HTTPRespJSON[T any](w http.ResponseWriter, v T) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(v)
}

func HTTPRespYAML[T any](w http.ResponseWriter, v T) {
	w.Header().Set("Content-Type", "application/yaml")
	w.WriteHeader(http.StatusOK)
	yaml.NewEncoder(w).Encode(v)
}

func GetPathValue(r *http.Request, key string, um encoding.TextUnmarshaler) error {
	return um.UnmarshalText(([]byte)(r.PathValue(key)))
}

func GetQueryValue(r *http.Request, key string, um encoding.TextUnmarshaler) error {
	return um.UnmarshalText(([]byte)(r.URL.Query().Get(key)))
}

func GetQueryValueOptional(r *http.Request, key string, um encoding.TextUnmarshaler) (bool, error) {
	if !r.URL.Query().Has(key) {
		return false, nil
	}
	return true, GetQueryValue(r, key, um)
}

type TextNumber int

func (t *TextNumber) UnmarshalText(text []byte) (err error) {
	v, err := strconv.Atoi(string(text))
	*t = TextNumber(v)
	return err
}

func (t TextNumber) Value() int {
	return int(t)
}

type TextBool bool

func (t *TextBool) UnmarshalText(text []byte) (err error) {
	if len(text) == 0 {
		*t = false
		return nil
	}

	v, err := strconv.ParseBool(string(text))
	*t = TextBool(v)
	return err
}

func (t TextBool) Value() bool {
	return bool(t)
}

type TextFilepathFromSlash string

func (t *TextFilepathFromSlash) UnmarshalText(text []byte) (err error) {
	*t = TextFilepathFromSlash(filepath.FromSlash(string(text)))
	return nil
}

func (t TextFilepathFromSlash) Value() string {
	return string(t)
}

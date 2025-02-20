package beetsfx

import (
	"fmt"
	"iter"
	"slices"
)

type ImportSubCommand struct {
	Subcommand[importCommand]
	Singleton   bool              `json:"-s"`     // -s
	Flat        bool              `json:"--flat"` // --flat
	GroupAlbums bool              `json:"-g"`     // -g
	Path        string            `json:"[PATH],omitempty"`
	LogFile     *string           `json:"-l"`             // -l
	Move        bool              `json:"-m"`             // -m
	FromScratch bool              `json:"--from-scratch"` // --from-scratch
	Set         map[string]string `json:"--set"`          // --set field=value
	Timid       bool              `json:"-t"`             // -t
	AsIs        bool              `json:"-a"`             // -A
	Query       *Query            `json:"-L,omitempty"`   // -L
}

type importCommand struct{}

func (importCommand) String() string { return "import" }

func (isc ImportSubCommand) Args() []string {
	return iterCollect(
		isc.logFileIter,
		isc.flagsIter,
		isc.setIter,
		func(yield func(string) bool) {
			if isc.Query != nil {
				if !yield("-L") {
					return
				}
				isc.Query.Iter(yield)
			} else {
				yield(isc.Path)
			}
		},
	)
}

func iterCollect[T any](iters ...iter.Seq[T]) []T {
	return slices.Collect[T](func(yield func(T) bool) {
		for _, i := range iters {
			for v := range i {
				if !yield(v) {
					return
				}
			}
		}
	})
}

func flagsIter(m map[string]bool) iter.Seq[string] {
	return func(yield func(string) bool) {
		for arg, ok := range m {
			if ok {
				if !yield(arg) {
					return
				}
			}
		}
	}
}

func (isc *ImportSubCommand) flagsIter(yield func(string) bool) {
	flagsIter(map[string]bool{
		"-s":             isc.Singleton,
		"--flat":         isc.Flat,
		"-g":             isc.GroupAlbums,
		"-m":             isc.Move,
		"--from-scratch": isc.FromScratch,
		"-t":             isc.Timid,
		"-A":             isc.AsIs,
	})(yield)
}

func (isc *ImportSubCommand) logFileIter(yield func(string) bool) {
	if isc.LogFile != nil {
		if !yield("-l") {
			return
		}
		yield(*isc.LogFile)
	}
}

func (isc *ImportSubCommand) setIter(yield func(string) bool) {
	for k, v := range isc.Set {
		if !yield("--set") {
			return
		} else if !yield(fmt.Sprintf("%s=%s", k, v)) {
			return
		}
	}
}

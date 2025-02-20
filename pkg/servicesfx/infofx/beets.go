package infofx

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"io"
)

type Beets struct {
	Tracks       uint64  `json:"tracks"`
	Time         float64 `json:"time"`
	Size         int64   `json:"size"`
	Artists      uint64  `json:"artists"`
	Albums       uint64  `json:"albums"`
	AlbumArtists uint64  `json:"albumArtists"`
}

func (in *Service) BeetsInfo(ctx context.Context, query *beetsfx.Query) (any, error) {
	sc := beetsfx.StatsSubCommand{
		Exact: true,
	}

	if query != nil {
		sc.Query = *query
	}

	data := in.beet.Run(ctx, sc)
	if data.Err() != nil {
		return nil, data.Err()
	}
	return parseLines(bytes.NewReader(data.Stdout()))
}

func parseLines(r io.Reader) (*Beets, error) {
	var stats beetsInfoCounter
	scans := stats.getScans()
	sc := bufio.NewScanner(r)

	line := scans.shift()
	for ; line != nil && sc.Scan(); line = scans.shift() {
		if err := line.parse(sc.Text()); err != nil {
			return nil, err
		}
	}

	if err := checkScanner(line, sc); err != nil {
		return nil, err
	}

	stats.Time = stats.time.Float64()
	stats.Size = stats.size.Int64()
	return &stats.Beets, nil
}

func checkScanner(line *scanLine, sc *bufio.Scanner) error {
	if sc.Err() != nil {
		if line != nil {
			return line.err(sc.Err())
		}
	}
	return sc.Err()
}

type beetsInfoCounter struct {
	Beets
	time beetStatsTime
	size beetStatsSize
}

func (bic *beetsInfoCounter) parseTimeSize(time, size string) (err error) {
	bic.Time, err = json.Number(time).Float64()
	if err != nil {
		return
	}
	bic.Size, err = json.Number(size).Int64()
	return
}

type scanLine struct {
	line int
	fmt  string
	args []any
}

func (data *scanLine) err(err error) error {
	return fmt.Errorf("failed to scan line %d: %w", data.line, err)
}

func (data *scanLine) parse(in string) error {
	if _, err := fmt.Sscanf(in, data.fmt, data.args...); err != nil {
		return fmt.Errorf(`failed to read value from line %d value("%q"): %w`, data.line, in, err)
	}
	return nil
}

type scanLines []scanLine

func (sc *scanLines) shift() (sl *scanLine) {
	if len(*sc) == 0 {
		return nil
	}
	sl = &(*sc)[0]
	*sc = (*sc)[1:]
	return
}

func (bic *beetsInfoCounter) getScans() scanLines {
	return scanLines{
		{0, "Tracks: %d", []any{&bic.Tracks}},
		{1, "Total time: %s %s %p seconds)", []any{new(string), new(string), &bic.time}},
		{2, "Total size: %s %s %p bytes)", []any{new(string), new(string), &bic.size}},
		{3, "Artists: %d", []any{&bic.Artists}},
		{4, "Albums: %d", []any{&bic.Albums}},
		{5, "Album artists: %d", []any{&bic.AlbumArtists}},
	}
}

type (
	beetStatsTime float64
	beetStatsSize int64
)

func (bst *beetStatsTime) Scan(state fmt.ScanState, _ rune) error {
	return prefixRemoveScanner(state, (*float64)(bst), json.Number.Float64)
}

func (bst *beetStatsTime) Float64() float64 {
	return float64(*bst)
}

func (bss *beetStatsSize) Scan(state fmt.ScanState, _ rune) error {
	return prefixRemoveScanner(state, (*int64)(bss), json.Number.Int64)
}

func (bss *beetStatsSize) Int64() int64 {
	return int64(*bss)
}

func prefixRemoveScanner[N int64 | float64, S ~string](state fmt.ScanState, s *N, parse func(S) (N, error)) error {
	token, err := state.Token(true, nil)
	if err != nil {
		return err
	}

	start := min(1, len(token))
	v, err := parse(S(token[start:]))
	if err != nil {
		return err
	}
	*s = v
	return nil
}

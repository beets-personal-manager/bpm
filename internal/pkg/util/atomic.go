package util

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"sync/atomic"
)

// AtomicPointer is an [atomic.Pointer] that can be marshalled/unmarshalled.
type AtomicPointer[T any] struct {
	p atomic.Pointer[T]
}

var jsonNull = []byte("null")

func (jp *AtomicPointer[T]) MarshalJSON() ([]byte, error) {
	if p := jp.p.Load(); p != nil {
		return json.Marshal(p)
	}
	return jsonNull, nil
}

func (jp *AtomicPointer[T]) UnmarshalJSON(data []byte) error {
	if bytes.Equal(data, jsonNull) {
		jp.p.Store(nil)
		return nil
	}
	var t T
	if err := json.Unmarshal(data, &t); err != nil {
		return err
	}
	jp.p.Store(&t)
	return nil
}

func (jp *AtomicPointer[T]) Set(v *T) {
	jp.p.Store(v)
}

func (jp *AtomicPointer[T]) GobEncode() ([]byte, error) {
	p := jp.p.Load()
	if p == nil {
		return nil, nil
	}
	var buf bytes.Buffer
	buf.WriteByte(0)
	if err := gob.NewEncoder(&buf).Encode(p); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (jp *AtomicPointer[T]) GobDecode(b []byte) error {
	if len(b) == 0 {
		jp.Set(nil)
	}
	var v T
	if err := gob.NewDecoder(bytes.NewReader(b[1:])).Decode(&v); err != nil {
		return err
	}
	jp.Set(&v)
	return nil
}

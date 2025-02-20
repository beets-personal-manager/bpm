package util

import "slices"

// Cleanup cleans up resource if an error occurs. Usage:
//
//	ok, catch, finally := Cleanup()
//	defer finally()
//
//	f, err := os.Open("foo.txt")
//	// handle err...
//	catch(func() { f.Close() })
//
//	// do stuff...
//
//	ok()
//	return
func Cleanup() (ok func(), catch func(func()), finally func()) {
	okV := false
	var after []func()
	return func() {
			okV = true
		}, func(fn func()) {
			after = append(after, fn)
		}, func() {
			if !okV {
				for _, fn := range slices.Backward(after) {
					//goland:noinspection GoDeferInLoop
					defer fn()
				}
			}
		}
}

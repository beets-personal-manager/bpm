//go:build !deleteLogOnly

package deletefx

import "os"

func remove(path string) error {
	return os.RemoveAll(path)
}

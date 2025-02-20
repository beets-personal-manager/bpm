package main

import (
	"fmt"
	"github.com/google/uuid"
	"os"
)

func main() {
	if err := os.WriteFile("command", []byte(fmt.Sprintf("editor-%s", uuid.NewString())), os.ModePerm); err != nil {
		panic(err)
	}
}

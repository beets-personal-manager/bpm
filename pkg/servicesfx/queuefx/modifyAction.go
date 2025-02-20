package queuefx

//go:generate go run github.com/dmarkham/enumer -json -yaml -text -type ModifyAction -trimprefix ModifyAction -transform lower

type ModifyAction int

const (
    ModifyActionUp ModifyAction = iota
    ModifyActionTop
    ModifyActionDown
    ModifyActionBottom
    ModifyActionRemove
)

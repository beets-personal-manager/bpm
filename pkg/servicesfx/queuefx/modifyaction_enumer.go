// Code generated by "enumer -json -yaml -text -type ModifyAction -trimprefix ModifyAction -transform lower"; DO NOT EDIT.

package queuefx

import (
	"encoding/json"
	"fmt"
	"strings"
)

const _ModifyActionName = "uptopdownbottomremove"

var _ModifyActionIndex = [...]uint8{0, 2, 5, 9, 15, 21}

const _ModifyActionLowerName = "uptopdownbottomremove"

func (i ModifyAction) String() string {
	if i < 0 || i >= ModifyAction(len(_ModifyActionIndex)-1) {
		return fmt.Sprintf("ModifyAction(%d)", i)
	}
	return _ModifyActionName[_ModifyActionIndex[i]:_ModifyActionIndex[i+1]]
}

// An "invalid array index" compiler error signifies that the constant values have changed.
// Re-run the stringer command to generate them again.
func _ModifyActionNoOp() {
	var x [1]struct{}
	_ = x[ModifyActionUp-(0)]
	_ = x[ModifyActionTop-(1)]
	_ = x[ModifyActionDown-(2)]
	_ = x[ModifyActionBottom-(3)]
	_ = x[ModifyActionRemove-(4)]
}

var _ModifyActionValues = []ModifyAction{ModifyActionUp, ModifyActionTop, ModifyActionDown, ModifyActionBottom, ModifyActionRemove}

var _ModifyActionNameToValueMap = map[string]ModifyAction{
	_ModifyActionName[0:2]:        ModifyActionUp,
	_ModifyActionLowerName[0:2]:   ModifyActionUp,
	_ModifyActionName[2:5]:        ModifyActionTop,
	_ModifyActionLowerName[2:5]:   ModifyActionTop,
	_ModifyActionName[5:9]:        ModifyActionDown,
	_ModifyActionLowerName[5:9]:   ModifyActionDown,
	_ModifyActionName[9:15]:       ModifyActionBottom,
	_ModifyActionLowerName[9:15]:  ModifyActionBottom,
	_ModifyActionName[15:21]:      ModifyActionRemove,
	_ModifyActionLowerName[15:21]: ModifyActionRemove,
}

var _ModifyActionNames = []string{
	_ModifyActionName[0:2],
	_ModifyActionName[2:5],
	_ModifyActionName[5:9],
	_ModifyActionName[9:15],
	_ModifyActionName[15:21],
}

// ModifyActionString retrieves an enum value from the enum constants string name.
// Throws an error if the param is not part of the enum.
func ModifyActionString(s string) (ModifyAction, error) {
	if val, ok := _ModifyActionNameToValueMap[s]; ok {
		return val, nil
	}

	if val, ok := _ModifyActionNameToValueMap[strings.ToLower(s)]; ok {
		return val, nil
	}
	return 0, fmt.Errorf("%s does not belong to ModifyAction values", s)
}

// ModifyActionValues returns all values of the enum
func ModifyActionValues() []ModifyAction {
	return _ModifyActionValues
}

// ModifyActionStrings returns a slice of all String values of the enum
func ModifyActionStrings() []string {
	strs := make([]string, len(_ModifyActionNames))
	copy(strs, _ModifyActionNames)
	return strs
}

// IsAModifyAction returns "true" if the value is listed in the enum definition. "false" otherwise
func (i ModifyAction) IsAModifyAction() bool {
	for _, v := range _ModifyActionValues {
		if i == v {
			return true
		}
	}
	return false
}

// MarshalJSON implements the json.Marshaler interface for ModifyAction
func (i ModifyAction) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.String())
}

// UnmarshalJSON implements the json.Unmarshaler interface for ModifyAction
func (i *ModifyAction) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("ModifyAction should be a string, got %s", data)
	}

	var err error
	*i, err = ModifyActionString(s)
	return err
}

// MarshalText implements the encoding.TextMarshaler interface for ModifyAction
func (i ModifyAction) MarshalText() ([]byte, error) {
	return []byte(i.String()), nil
}

// UnmarshalText implements the encoding.TextUnmarshaler interface for ModifyAction
func (i *ModifyAction) UnmarshalText(text []byte) error {
	var err error
	*i, err = ModifyActionString(string(text))
	return err
}

// MarshalYAML implements a YAML Marshaler for ModifyAction
func (i ModifyAction) MarshalYAML() (interface{}, error) {
	return i.String(), nil
}

// UnmarshalYAML implements a YAML Unmarshaler for ModifyAction
func (i *ModifyAction) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	if err := unmarshal(&s); err != nil {
		return err
	}

	var err error
	*i, err = ModifyActionString(s)
	return err
}

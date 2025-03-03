// Code generated by "enumer -json -yaml -text -type CommandKind -trimprefix CommandKind -transform lower"; DO NOT EDIT.

package beetsfx

import (
	"encoding/json"
	"fmt"
	"strings"
)

const _CommandKindName = "import"

var _CommandKindIndex = [...]uint8{0, 6}

const _CommandKindLowerName = "import"

func (i CommandKind) String() string {
	if i < 0 || i >= CommandKind(len(_CommandKindIndex)-1) {
		return fmt.Sprintf("CommandKind(%d)", i)
	}
	return _CommandKindName[_CommandKindIndex[i]:_CommandKindIndex[i+1]]
}

// An "invalid array index" compiler error signifies that the constant values have changed.
// Re-run the stringer command to generate them again.
func _CommandKindNoOp() {
	var x [1]struct{}
	_ = x[CommandKindImport-(0)]
}

var _CommandKindValues = []CommandKind{CommandKindImport}

var _CommandKindNameToValueMap = map[string]CommandKind{
	_CommandKindName[0:6]:      CommandKindImport,
	_CommandKindLowerName[0:6]: CommandKindImport,
}

var _CommandKindNames = []string{
	_CommandKindName[0:6],
}

// CommandKindString retrieves an enum value from the enum constants string name.
// Throws an error if the param is not part of the enum.
func CommandKindString(s string) (CommandKind, error) {
	if val, ok := _CommandKindNameToValueMap[s]; ok {
		return val, nil
	}

	if val, ok := _CommandKindNameToValueMap[strings.ToLower(s)]; ok {
		return val, nil
	}
	return 0, fmt.Errorf("%s does not belong to CommandKind values", s)
}

// CommandKindValues returns all values of the enum
func CommandKindValues() []CommandKind {
	return _CommandKindValues
}

// CommandKindStrings returns a slice of all String values of the enum
func CommandKindStrings() []string {
	strs := make([]string, len(_CommandKindNames))
	copy(strs, _CommandKindNames)
	return strs
}

// IsACommandKind returns "true" if the value is listed in the enum definition. "false" otherwise
func (i CommandKind) IsACommandKind() bool {
	for _, v := range _CommandKindValues {
		if i == v {
			return true
		}
	}
	return false
}

// MarshalJSON implements the json.Marshaler interface for CommandKind
func (i CommandKind) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.String())
}

// UnmarshalJSON implements the json.Unmarshaler interface for CommandKind
func (i *CommandKind) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("CommandKind should be a string, got %s", data)
	}

	var err error
	*i, err = CommandKindString(s)
	return err
}

// MarshalText implements the encoding.TextMarshaler interface for CommandKind
func (i CommandKind) MarshalText() ([]byte, error) {
	return []byte(i.String()), nil
}

// UnmarshalText implements the encoding.TextUnmarshaler interface for CommandKind
func (i *CommandKind) UnmarshalText(text []byte) error {
	var err error
	*i, err = CommandKindString(string(text))
	return err
}

// MarshalYAML implements a YAML Marshaler for CommandKind
func (i CommandKind) MarshalYAML() (interface{}, error) {
	return i.String(), nil
}

// UnmarshalYAML implements a YAML Unmarshaler for CommandKind
func (i *CommandKind) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	if err := unmarshal(&s); err != nil {
		return err
	}

	var err error
	*i, err = CommandKindString(s)
	return err
}

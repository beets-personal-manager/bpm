package beetsfx

type FieldsSubCommand struct {
	Subcommand[fieldsCommand]
}

type fieldsCommand struct{}

func (fieldsCommand) String() string { return "fields" }

func (FieldsSubCommand) Args() []string {
	return []string{}
}

package beetsfx

type ConfigSubCommand struct {
	Subcommand[configCommand]
	WithDefault bool `json:"--default"`
}

type configCommand struct{}

func (configCommand) String() string { return "config" }

func (csc ConfigSubCommand) Args() (a []string) {
	return iterCollect(
		flagsIter(map[string]bool{
			"--default": csc.WithDefault,
		}),
	)
}

package beetsfx

type StatsSubCommand struct {
	Subcommand[statsCommand]
	Exact bool  `json:"-e"`
	Query Query `json:"[QUERY]"`
}

type statsCommand struct{}

func (statsCommand) String() string { return "stats" }

func (ssc StatsSubCommand) Args() (a []string) {
	return iterCollect(
		flagsIter(map[string]bool{
			"-e": ssc.Exact,
		}),
		ssc.Query.Iter,
	)
}

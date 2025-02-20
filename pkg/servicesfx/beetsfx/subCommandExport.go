package beetsfx

type ExportFormat string

const (
	ExportFormatCSV       = ExportFormat("csv")
	ExportFormatJSON      = ExportFormat("json")
	ExportFormatJSONLines = ExportFormat("jsonlines")
	ExportFormatXML       = ExportFormat("xml")
)

func (ef ExportFormat) iter(yield func(string) bool) {
	switch ef {
	case ExportFormatCSV, ExportFormatXML, ExportFormatJSON, ExportFormatJSONLines:
		if !yield("-f") {
			return
		}
		yield(string(ef))
	}
}

type ExportSubCommand struct {
	Subcommand[exportCommand]
	Albums      bool          `json:"-a"` // -a
	Library     bool          `json:"-l"` // -l
	Format      *ExportFormat `json:"-f"` // -f
	IncludeKeys []string      `json:"-i"` // -i
	Query       Query         `json:"[QUERY]"`
}

type exportCommand struct{}

func (exportCommand) String() string { return "export" }

func (lsc ExportSubCommand) Args() []string {
	return iterCollect(
		flagsIter(map[string]bool{
			"-a": lsc.Albums,
			"-l": lsc.Library,
		}),
		func(yield func(string) bool) {
			if lsc.Format != nil {
				lsc.Format.iter(yield)
			} else {
				ExportFormatJSONLines.iter(yield)
			}
		},
		lsc.includeKeys,
		lsc.Query.Iter,
	)
}

func (lsc *ExportSubCommand) includeKeys(yield func(string) bool) {
	for _, k := range lsc.IncludeKeys {
		if !yield("-i") {
			return
		} else if !yield(k) {
			return
		}
	}
}

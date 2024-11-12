package generator

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"text/template"
)

func createGeneralFuncMap() template.FuncMap {
	return template.FuncMap{
		"qEnv": func(name string) string {
			return os.Getenv(name)
		},

		"qJoin": func(items []string, sep string) string {
			return strings.Join(items, sep)
		},

		"qContains": func(hayStack interface{}, needle string) string {
			contained := false
			switch t := hayStack.(type) {
			case string:
				if strings.Contains(t, needle) {
					contained = true
				}

			case []string:
				contained = slices.Contains(t, needle)
			}

			if contained {
				return "true"
			} else {
				return ""
			}
		},

		"qUnpack": func(input string) []string {
			// [AAA BBB] -> []string{"AAA", "BBB"}
			input = strings.TrimSpace(input)
			if len(input) == 0 {
				return []string{}
			}

			if strings.HasPrefix(input, "[") && strings.HasSuffix(input, "]") {
				if len(input) == 2 {
					return []string{}
				}

				return strings.Split(input[1:len(input)-1], " ")
			}

			return []string{input}
		},

		"qEnsureExtension": func(filename string, ext string) string {
			extracted := filepath.Ext(filename)
			if len(extracted) != 0 {
				return filename
			}

			return filename + ext
		},
	}
}

// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package generator

import (
	"os"
	"os/user"
	"path/filepath"
	"qtcli/util"
	"text/template"
	"time"
)

func generateLicense(
	licenseTemplatePath string,
	data util.StringAnyMap,
) (string, error) {
	if len(licenseTemplatePath) == 0 {
		return "", nil
	}

	now := time.Now()
	user, _ := user.Current()
	dataAll := util.StringAnyMap{
		"Year":  now.Format("2006"),
		"Month": now.Format("01"),
		"Day":   now.Format("02"),
		"Date":  now.Format("2006-01-02"),
		"User":  user.Username,
	}
	dataAll.Merge(data)

	return util.NewTemplateExpander().
		Name(filepath.Base(licenseTemplatePath)).
		Data(dataAll).
		Funcs(template.FuncMap{
			"qEnv": func(name string) string {
				return os.Getenv(name)
			},
		}).
		RunFile(licenseTemplatePath)
}

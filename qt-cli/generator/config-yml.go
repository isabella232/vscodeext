// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package generator

import (
	"io/fs"
	"qtcli/util"

	"gopkg.in/yaml.v3"
)

// config file format related
type ConfigData struct {
	Version string            `yaml:"version"`
	Files   []ConfigEntryFile `yaml:"files"`
	Global  ConfigEntryGlobal `yaml:"global"`
}

type ConfigEntryFile struct {
	In         string              `yaml:"in"`
	Out        string              `yaml:"out"`
	FieldsList []ConfigEntryFields `yaml:"fields"`
	When       string              `yaml:"when"`
}

type ConfigEntryGlobal struct {
	FieldsList []ConfigEntryFields `yaml:"fields"`
	Header     string              `yaml:"header"`
}

type ConfigEntryFields util.StringAnyMap

func (g *ConfigEntryFields) expandBy(
	expander *util.TemplateExpander,
) (util.StringAnyMap, error) {
	all := util.StringAnyMap{}

	for name, expr := range *g {
		if str, ok := expr.(string); ok {
			expanded, err := expander.Name(name).RunString(str)
			if err != nil {
				return util.StringAnyMap{}, err
			}

			all[name] = expanded
		} else {
			all[name] = expr
		}
	}

	return all, nil
}

func readConfig(targetFS fs.FS, filePath string) (ConfigData, error) {
	raw, err := util.ReadAllFromFS(targetFS, filePath)
	if err != nil {
		return ConfigData{}, err
	}

	var config ConfigData
	if err := yaml.Unmarshal(raw, &config); err != nil {
		return ConfigData{}, err
	}

	return config, nil
}

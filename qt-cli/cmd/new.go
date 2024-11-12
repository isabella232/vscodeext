// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package cmd

import (
	"qtcli/prompt"
	"qtcli/util"

	"github.com/spf13/cobra"
)

var outputDir string
var customTemplateDir string
var licenseTemplatePath string

var newCmd = &cobra.Command{
	Use:   "new",
	Short: util.Msg("Create a new project or file(s)"),
	Run: func(cmd *cobra.Command, args []string) {
		prompt.RunNew()
	},
}

func init() {
	flags := newCmd.PersistentFlags()

	flags.StringVarP(
		&outputDir, "output-dir", "d", "",
		util.Msg("Output directory"))

	flags.StringVarP(
		&customTemplateDir, "template-dir", "p", "",
		util.Msg("Specify a path to the custom template directory"))

	flags.StringVarP(
		&licenseTemplatePath, "license-file", "l", "",
		util.Msg("Specify a path to the license template file"))

	rootCmd.AddCommand(newCmd)
}

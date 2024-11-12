// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package cmd

import (
	"qtcli/generator"
	"qtcli/util"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var classType string
var base string

var cppMacroList []string
var cppIncludeList []string
var cppIsQObject bool

var pythonModuleName string
var pythonImportList []string

var newClassCmd = &cobra.Command{
	Use:   "class <name> --type <type>",
	Short: util.Msg("Create a new class"),
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) < 1 {
			cmd.Help()
			return
		}

		g := generator.NewGenerator(&generator.GeneratorInputData{
			Category:          generator.TargetCategoryClass,
			Type:              classType,
			Name:              args[0],
			OutputDir:         outputDir,
			LicenseFile:       licenseTemplatePath,
			CustomTemplateDir: customTemplateDir,

			CppBaseClass:      base,
			CppMacroList:      cppMacroList,
			CppIncludeList:    cppIncludeList,
			CppClassIsQObject: cppIsQObject,
			CppUsePragma:      true,

			PythonBaseClass:  base,
			PythonModuleName: pythonModuleName,
			PythonImportList: pythonImportList,
		})

		_, err := g.Run()
		if err != nil {
			logrus.Fatal(err)
		}
	},
}

func init() {
	// common
	flags := newClassCmd.Flags()
	flags.StringVarP(
		&classType, "type", "t", "",
		util.Msg("Specify file type to create"))

	flags.StringVarP(
		&base, "base", "b", "",
		util.Msg("Base class name"))

	newClassCmd.MarkFlagRequired("type")

	// cpp related
	flags.StringSliceVarP(
		&cppMacroList, "add", "a", []string{},
		util.Msg("Qt macro to add. (e.g., Q_OBJECT, QML_ELEMENT)"))

	flags.StringSliceVarP(
		&cppIncludeList, "include", "i", []string{},
		util.Msg("Qt classe to include in a header file"))

	flags.BoolVarP(
		&cppIsQObject, "qobject", "q", false,
		util.Msg("Specify if class is a QObject-derived class"))

	// python related
	flags.StringVarP(
		&pythonModuleName, "module", "m", "PySide6",
		util.Msg("Qt for Python Module"))

	flags.StringSliceVar(
		&pythonImportList, "import", []string{},
		util.Msg("Qt classe to import"))

	newCmd.AddCommand(newClassCmd)
}

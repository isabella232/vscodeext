// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package generator

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"qtcli/assets"
	"qtcli/util"
	"strings"
	"text/template"

	"github.com/sirupsen/logrus"
)

type Generator struct {
	GeneratorInputData
	TypeConst     TargetType
	Config        GeneratorConfig
	GlobalContext GeneratorContext
}

// note,
// this is a maximal set of possible input data
type GeneratorInputData struct {
	Category          TargetCategory
	Type              string
	Name              string
	OutputDir         string
	LicenseFile       string
	CustomTemplateDir string

	CppBaseClass      string
	CppMacroList      []string
	CppIncludeList    []string
	CppClassIsQObject bool
	CppUsePragma      bool

	PythonBaseClass  string
	PythonModuleName string
	PythonImportList []string
}

type GeneratorConfig struct {
	Contents ConfigData
	BaseFS   fs.FS
	BaseDir  string
	FilePath string
}

type GeneratorContext struct {
	Data   util.StringAnyMap
	Funcs  template.FuncMap
	Header string
}

type GeneratorResult struct {
	FileNames []string
}

func NewGenerator(input *GeneratorInputData) *Generator {
	return &Generator{
		GeneratorInputData: *input,
	}
}

func (g *Generator) Run() (GeneratorResult, error) {
	if err := g.validate(); err != nil {
		return GeneratorResult{}, err
	}

	if err := g.prepareContext(); err != nil {
		return GeneratorResult{}, err
	}

	generateFiles := []string{}

	for index, file := range g.Config.Contents.Files {
		logrus.Debug(fmt.Sprintf(
			"processing a file (%v/%v), in = %v",
			index+1, len(g.Config.Contents.Files), file.In))

		when, err := g.evalWhenCondition(file)
		if err != nil {
			return GeneratorResult{}, err
		}

		if !when {
			logrus.Debug(
				"skipping generation ",
				"because 'when' condition was not satisfied")
			continue
		}

		fileName, err := g.runSingleFile(file)
		if err != nil {
			return GeneratorResult{}, err
		}

		generateFiles = append(generateFiles, fileName)

	}

	return GeneratorResult{FileNames: generateFiles}, nil
}

func (g *Generator) evalWhenCondition(file ConfigEntryFile) (bool, error) {
	if len(file.When) == 0 {
		return true, nil
	}

	out, err := util.NewTemplateExpander().
		Name(file.In).
		Data(g.GlobalContext.Data).
		Funcs(g.GlobalContext.Funcs).
		RunString(file.When)
	if err != nil {
		return false, err
	}

	if out != "true" {
		return false, nil
	}

	return true, nil
}

func (g *Generator) validate() error {
	logrus.Debug(fmt.Sprintf(
		"validating input data, cat. = %v, type = %v, name = %v",
		g.Category, g.Type, g.Name))

	g.TypeConst = findNewTypeConst(g.Category, g.Type)
	if g.TypeConst == TargetTypeInvalid {
		return fmt.Errorf(
			"invalid new type, given = '%v', '%v'",
			g.Category, g.Type)
	}

	g.Config.FilePath = findConfigPath(g.TypeConst)
	if len(g.Config.FilePath) == 0 {
		return fmt.Errorf(
			"cannot determine a config file path, type = '%v'",
			g.TypeConst)
	}

	g.Config.BaseDir = filepath.Dir(g.Config.FilePath)
	g.Config.BaseFS = assets.Assets

	if len(g.CustomTemplateDir) != 0 {
		g.Config.BaseFS = os.DirFS(g.CustomTemplateDir)
	}

	// load config.yml
	logrus.Debug(fmt.Sprintf(
		"reading config, file = '%v'", g.Config.FilePath))

	config, err := readConfig(g.Config.BaseFS, g.Config.FilePath)
	if err != nil {
		return err
	}

	g.Config.Contents = config

	return nil
}

func (g *Generator) prepareContext() error {
	logrus.Debug("preparing global context")

	// func
	g.GlobalContext.Funcs = createGeneralFuncMap()
	g.GlobalContext.Funcs["cpp"] = func() CppFuncs {
		return CppFuncs{}
	}

	// fields
	logrus.Debug("processing fields")
	expander := util.NewTemplateExpander().Funcs(g.GlobalContext.Funcs)
	accumulatedFields := util.StringAnyMap{
		"qArgName":        g.Name,
		"qArgType":        g.Type,
		"qArgOutputDir":   g.OutputDir,
		"qArgLicenseFile": g.LicenseFile,
		"qArgTemplateDir": g.CustomTemplateDir,

		"qArgBase":    g.CppBaseClass,
		"qArgAdd":     g.CppMacroList,
		"qArgInclude": g.CppIncludeList,
		"qArgQObject": g.CppClassIsQObject,
		"qArgModule":  g.PythonModuleName,
		"qArgImport":  g.PythonImportList,
	}

	for _, group := range g.Config.Contents.Global.FieldsList {
		out, err := group.expandBy(expander.Data(accumulatedFields))
		if err != nil {
			return err
		}

		accumulatedFields.Merge(out)
		logrus.Debug(fmt.Sprintf("expanding fields, %v", accumulatedFields))
	}

	g.GlobalContext.Data = accumulatedFields
	logrus.Debug(fmt.Sprintf("processing fields, done, value = %v", accumulatedFields))

	// others
	g.GlobalContext.Header = g.Config.Contents.Global.Header

	return nil
}

func (g *Generator) runSingleFile(file ConfigEntryFile) (string, error) {
	// update fields
	allFields := util.StringAnyMap{}
	allFields.Merge(g.GlobalContext.Data)
	expander := util.NewTemplateExpander().Funcs(g.GlobalContext.Funcs)

	for _, group := range file.FieldsList {
		localFields, err := group.expandBy(expander.Data(allFields))
		if err != nil {
			return "", err
		}

		allFields.Merge(localFields)
	}

	// expand output file name
	outputFileName, err := expander.
		Name(file.In).
		Data(allFields).
		RunString(file.Out)
	if err != nil {
		return "", err
	}

	// expand input contents
	path := filepath.Join(g.Config.BaseDir, file.In)
	body, err := util.ReadAllFromFS(g.Config.BaseFS, path)
	if err != nil {
		return "", err
	}

	output, err := expander.
		Name(outputFileName).
		RunString(g.GlobalContext.Header + string(body))
	if err != nil {
		return "", err
	}

	// remove spaces at beginning
	output = strings.TrimLeft(output, " \t\r\n")

	// save or write to console
	if len(g.OutputDir) != 0 {
		destPath := filepath.Join(g.OutputDir, outputFileName)
		_, err := util.WriteAll([]byte(output), destPath)
		if err != nil {
			return "", err
		}
	} else {
		util.PrintlnWithName(output, outputFileName)
	}

	return outputFileName, nil
}

// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package util

import (
	"bytes"
	"io"
	"text/template"
)

type TemplateExpander struct {
	data  StringAnyMap
	funcs template.FuncMap
	name  string
}

func NewTemplateExpander() *TemplateExpander {
	return &TemplateExpander{
		data:  StringAnyMap{},
		funcs: template.FuncMap{},
	}
}

func (e *TemplateExpander) Name(name string) *TemplateExpander {
	e.name = name
	return e
}

func (e *TemplateExpander) Data(data StringAnyMap) *TemplateExpander {
	e.data = data
	return e
}

func (e *TemplateExpander) Funcs(funcs template.FuncMap) *TemplateExpander {
	e.funcs = funcs
	return e
}

func (e *TemplateExpander) RunString(templateString string) (string, error) {
	return e.execTemplate(template.
		New(e.name).
		Funcs(e.funcs).
		Parse(templateString))
}

func (e *TemplateExpander) RunFile(filePath string) (string, error) {
	return e.execTemplate(template.
		New(e.name).
		Funcs(e.funcs).
		ParseFiles(filePath))
}

func (e *TemplateExpander) execTemplate(
	tmpl *template.Template,
	err error,
) (string, error) {
	if err != nil {
		return "", err
	}

	var buffer bytes.Buffer
	var io io.Writer = &buffer
	err = tmpl.Execute(io, e.data)
	if err != nil {
		return "", err
	}

	return buffer.String(), nil
}

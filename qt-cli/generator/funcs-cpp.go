// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package generator

import (
	"fmt"
	"qtcli/util"
	"sort"
	"strings"
	"unicode"
)

type CppFuncs struct{}

func (cpp CppFuncs) ExtractClassName(fqcn string) string {
	return extractClassNameOnly(fqcn)
}

func (cpp CppFuncs) CreateNamespaceOpenings(fqcn string) string {
	splits := strings.Split(fqcn, "::")
	output := []string{}

	for i := 0; i < len(splits)-1; i++ {
		output = append(output, fmt.Sprintf("namespace %s {", splits[i]))
	}

	return strings.Join(output, "\n")
}

func (cpp CppFuncs) CreateNamespaceClosings(fqcn string) string {
	splits := strings.Split(fqcn, "::")
	output := []string{}

	for i := 0; i < len(splits)-1; i++ {
		output = append(output, fmt.Sprintf("} // namespace %s", splits[i]))
	}

	return strings.Join(output, "\n")
}

func (cpp CppFuncs) CreateHeaderGuard(fileName string) string {
	return strings.ReplaceAll(strings.ToUpper(fileName), ".", "_")
}

func (cpp CppFuncs) CreateIncludes(
	includes []string, macros []string) []string {
	all := []string{}

	sort.Strings(includes)
	hasModuleName := true

	for _, name := range includes {
		if !mightBeQtClass(name) {
			continue
		}

		item := name

		if hasModuleName {
			module := findModuleName(name)
			if module != "" {
				item = module + "/" + name
			}
		}

		all = append(all, item)
	}

	return all
}

func (cpp CppFuncs) CreateLicense(
	licenseTemplatePath string,
	className string,
	fileName string,
) string {
	str, _ := generateLicense(licenseTemplatePath, util.StringAnyMap{
		"ClassName": className,
		"FileName":  fileName,
	})

	return str
}

func mightBeQtClass(name string) bool {
	return len(name) >= 2 &&
		name[0] == 'Q' &&
		unicode.IsUpper(rune(name[1]))
}

func findModuleName(name string) string {
	switch name {
	case "QObject", "QSharedData":
		return "QtCore"

	case "QWidget", "QMainWindow":
		return "QtWidgets"

	case "QQuickItem":
		return "QtQuick"

	case "QQmlEngine":
		return "QtQml"
	}

	return ""
}

func extractClassNameOnly(fqcn string) string {
	splits := strings.Split(fqcn, "::")
	if len(splits) == 0 {
		return ""
	}
	return splits[len(splits)-1]
}

// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package generator

import (
	"slices"
	"strings"
)

type TargetCategory string

const (
	TargetCategoryInvalid TargetCategory = "TargetCategoryInvalid"
	TargetCategoryProject TargetCategory = "TargetCategoryProject"
	TargetCategoryClass   TargetCategory = "TargetCategoryClass"
	TargetCategoryFile    TargetCategory = "TargetCategoryFile"
)

type TargetType string

const (
	TargetTypeInvalid TargetType = "TargetTypeInvalid"
	TargetClassCpp    TargetType = "TargetClassCpp"
	TargetClassPython TargetType = "TargetClassPython"
)

type SearchDict = map[TargetType][]string

var typeNamesDict = map[TargetCategory]SearchDict{
	TargetCategoryClass: {
		TargetClassCpp:    {"cpp"},
		TargetClassPython: {"python"},
	},
}

func findNewTypeConst(category TargetCategory, key string) TargetType {
	key = strings.ToLower(key)
	dict := typeNamesDict[category]
	if dict == nil {
		return TargetTypeInvalid
	}

	for typeId, possibleNames := range dict {
		if slices.Contains(possibleNames, key) {
			return typeId
		}
	}

	return TargetTypeInvalid
}

func findConfigPath(newType TargetType) string {
	switch newType {
	case TargetClassCpp:
		return "templates/classes/cpp/config.yml"

	case TargetClassPython:
		return "templates/classes/python/config.yml"
	}

	return ""
}

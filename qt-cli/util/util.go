// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

package util

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
)

type StringAnyMap map[string]interface{}

func (m *StringAnyMap) Merge(other StringAnyMap) {
	for k, v := range other {
		(*m)[k] = v
	}
}

func ReadAllFromFS(targetFS fs.FS, path string) ([]byte, error) {
	stat, err := fs.Stat(targetFS, path)
	if err != nil {
		return []byte{},
			fmt.Errorf("cannot read file info, given %v", path)
	}

	if !stat.Mode().IsRegular() {
		return []byte{},
			fmt.Errorf("cannot read non-regular file, given = %v", path)
	}

	file, err := targetFS.Open(path)
	if err != nil {
		return []byte{}, err
	}

	defer file.Close()
	return io.ReadAll(file)
}

func WriteAll(data []byte, destPath string) (int, error) {
	dir := filepath.Dir(destPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return 0, err
	}

	destFile, err := os.Create(destPath)
	if err != nil {
		return 0, err
	}

	defer destFile.Close()
	return destFile.Write(data)
}

func PrintlnWithName(data string, fileName string) {
	fmt.Println(">>>>>>>", fileName)
	fmt.Print(data)
	fmt.Println("<<<<<<<", fileName)
}

func Msg(s string) string {
	return s
}

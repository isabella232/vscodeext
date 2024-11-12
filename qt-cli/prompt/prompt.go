package prompt

import (
	"fmt"
	"qtcli/generator"

	"github.com/sirupsen/logrus"
)

func RunNew() error {
	newType, err := runTypeSelection()
	if err != nil {
		return err
	}

	inputData, err := getInputData(newType)
	if err != nil {
		return nil
	}

	g := generator.NewGenerator(&inputData)
	_, err = g.Run()
	if err != nil {
		logrus.Fatal(err)
	}

	return nil
}

func getInputData(newType generator.TargetType) (
	generator.GeneratorInputData, error) {
	switch newType {
	case generator.TargetClassCpp:
		return RunNewCppClass()

	case generator.TargetClassPython:
		return RunNewPythonClass()

	default:
		return generator.GeneratorInputData{},
			fmt.Errorf("not supported yet")
	}
}

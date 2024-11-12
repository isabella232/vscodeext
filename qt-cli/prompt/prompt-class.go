package prompt

import (
	"qtcli/generator"

	"github.com/manifoldco/promptui"
)

func runTypeSelection() (generator.TargetType, error) {
	items := []struct {
		Name string
		Id   generator.TargetType
	}{
		{Name: "C++ Class", Id: generator.TargetClassCpp},
		{Name: "Python Class", Id: generator.TargetClassPython},
	}

	templates := &promptui.SelectTemplates{
		Selected: "{{ .Name }}",
		Inactive: "\U00002002 {{ .Name }}",
		Active:   "\U00002192 {{ .Name | bold | underline }}",
	}

	prompt := promptui.Select{
		Label:     "What do you want to create?",
		Items:     items,
		Templates: templates,
	}

	index, _, err := prompt.Run()
	if err != nil {
		return generator.TargetTypeInvalid, err
	}

	return items[index].Id, nil
}

func RunNewCppClass() (generator.GeneratorInputData, error) {
	fallback := generator.GeneratorInputData{}
	promptName := promptui.Prompt{
		Label: "Class Name",
	}

	promptBaseClass := promptui.Prompt{
		Label: "Base class",
	}

	promptOutputDir := promptui.Prompt{
		Label: "Output Dir",
	}

	className, err := promptName.Run()
	if err != nil {
		return fallback, err
	}

	baseClass, err := promptBaseClass.Run()
	if err != nil {
		return fallback, err
	}

	outputDir, err := promptOutputDir.Run()
	if err != nil {
		return fallback, err
	}

	return generator.GeneratorInputData{
		Category:     generator.TargetCategoryClass,
		Type:         "cpp",
		Name:         className,
		OutputDir:    outputDir,
		CppBaseClass: baseClass,
	}, nil
}

func RunNewPythonClass() (generator.GeneratorInputData, error) {
	fallback := generator.GeneratorInputData{}
	promptModule := promptui.Prompt{
		Label: "Python Module (PySide6, PySide2, etc)",
	}

	promptName := promptui.Prompt{
		Label: "Class Name (could include namespaces)",
	}

	promptBaseClass := promptui.Prompt{
		Label: "Base class",
	}

	promptOutputDir := promptui.Prompt{
		Label: "Output Dir",
	}

	moduleName, err := promptModule.Run()
	if err != nil {
		return fallback, err
	}

	className, err := promptName.Run()
	if err != nil {
		return fallback, err
	}

	baseClass, err := promptBaseClass.Run()
	if err != nil {
		return fallback, err
	}

	outputDir, err := promptOutputDir.Run()
	if err != nil {
		return fallback, err
	}

	return generator.GeneratorInputData{
		Category:         generator.TargetCategoryClass,
		Type:             "python",
		Name:             className,
		OutputDir:        outputDir,
		PythonBaseClass:  baseClass,
		PythonModuleName: moduleName,
	}, nil
}

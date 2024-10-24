// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import { isMultiWorkspace, telemetry } from 'qt-lib';
import { EXTENSION_ID } from '@/constants';

interface RecommendedSetting {
  extensionId: string;
  setting: string;
  value: string;
}

export function registerSetRecommendedSettingsCommand() {
  telemetry.sendAction('setRecommendedSettings');
  const recommendedSettings: RecommendedSetting[] = [
    {
      extensionId: 'cmake',
      setting: 'options.statusBarVisibility',
      value: 'visible'
    }
  ];

  const configurationTarget = isMultiWorkspace()
    ? vscode.ConfigurationTarget.Workspace
    : undefined;
  const recommendedSettingsCommand = vscode.commands.registerCommand(
    `${EXTENSION_ID}.setRecommendedSettings`,
    () => {
      for (const { extensionId, setting, value } of recommendedSettings) {
        void vscode.workspace
          .getConfiguration(extensionId)
          .update(setting, value, configurationTarget);
      }
    }
  );
  return recommendedSettingsCommand;
}

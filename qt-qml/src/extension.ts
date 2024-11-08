// Copyright (C) 2023 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import {
  CoreAPI,
  getCoreApi,
  createLogger,
  initLogger,
  telemetry
} from 'qt-lib';

import { registerColorProvider } from '@/color-provider';
import { registerRestartQmllsCommand } from '@cmd/restart-qmlls';
import { registerDownloadQmllsCommand } from '@cmd/download-qmlls';
import { registerCheckQmllsUpdateCommand } from '@cmd/check-qmlls-update';
import { Qmlls } from '@/qmlls';
import { EXTENSION_ID } from '@/constants';
import { QMLProjectManager, createQMLProject } from '@/project';

export let projectManager: QMLProjectManager;
export let coreAPI: CoreAPI | undefined;

const logger = createLogger('extension');

export async function activate(context: vscode.ExtensionContext) {
  initLogger(EXTENSION_ID);
  telemetry.activate(context);
  projectManager = new QMLProjectManager(context);
  coreAPI = await getCoreApi();

  if (vscode.workspace.workspaceFolders !== undefined) {
    for (const folder of vscode.workspace.workspaceFolders) {
      const project = await createQMLProject(folder, context);
      projectManager.addProject(project);
    }
  }

  context.subscriptions.push(
    registerRestartQmllsCommand(),
    registerCheckQmllsUpdateCommand(),
    registerDownloadQmllsCommand(),
    registerColorProvider()
  );
  telemetry.sendEvent(`activated`);

  void Qmlls.checkAssetAndDecide();
}

export function deactivate() {
  logger.info(`Deactivating ${EXTENSION_ID}`);
  telemetry.dispose();
  projectManager.dispose();
}

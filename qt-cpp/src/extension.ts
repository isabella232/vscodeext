// Copyright (C) 2023 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import {
  CoreAPI,
  getCoreApi,
  QtWorkspaceType,
  createLogger,
  initLogger,
  QtWorkspaceConfigMessage,
  QtInsRootConfigName,
  AdditionalQtPathsName,
  GlobalWorkspace,
  QtAdditionalPath,
  telemetry
} from 'qt-lib';
import {
  getQtInsRoot,
  getQtPathsExe,
  getSelectedKit
} from '@cmd/register-qt-path';
import { registerMinGWgdbCommand } from '@cmd/mingw-gdb';
import { registerResetCommand } from '@cmd/reset-qt-ext';
import { registerNatvisCommand } from '@cmd/natvis';
import { registerScanForQtKitsCommand } from '@cmd/scan-qt-kits';
import {
  registerbuildDirectoryName,
  registerlaunchTargetFilenameWithoutExtension,
  registerKitDirectoryCommand,
  qtDirCommand,
  qpaPlatformPluginPathCommand,
  qmlImportPathCommand
} from '@cmd/launch-variables';
import { createCppProject, CppProjectManager, CppProject } from '@/project';
import { KitManager, tryToUseCMakeFromQtTools } from '@/kit-manager';
import { wasmStartTaskProvider, WASMStartTaskProvider } from '@task/wasm-start';
import { EXTENSION_ID } from '@/constants';

export let kitManager: KitManager;
export let projectManager: CppProjectManager;
export let coreAPI: CoreAPI | undefined;

let taskProvider: vscode.Disposable | undefined;

const logger = createLogger('extension');

export async function activate(context: vscode.ExtensionContext) {
  await vscode.extensions.getExtension('ms-vscode.cmake-tools')?.activate();

  initLogger(EXTENSION_ID);
  telemetry.activate(context);
  kitManager = new KitManager(context);
  projectManager = new CppProjectManager(context);
  coreAPI = await getCoreApi();

  if (vscode.workspace.workspaceFolders !== undefined) {
    for (const folder of vscode.workspace.workspaceFolders) {
      const project = await createCppProject(folder, context);
      projectManager.addProject(project, true);
      kitManager.addProject(project, true);
    }
  }

  context.subscriptions.push(
    qpaPlatformPluginPathCommand(),
    qmlImportPathCommand(),
    registerKitDirectoryCommand(),
    qtDirCommand(),
    registerMinGWgdbCommand(),
    registerResetCommand(),
    ...registerNatvisCommand(),
    registerScanForQtKitsCommand(),
    registerlaunchTargetFilenameWithoutExtension(),
    registerbuildDirectoryName()
  );
  telemetry.sendEvent(`activated`);

  taskProvider = vscode.tasks.registerTaskProvider(
    WASMStartTaskProvider.WASMStartType,
    wasmStartTaskProvider
  );

  coreAPI?.onValueChanged(async (message) => {
    logger.info('Received config change:', message.config as unknown as string);
    return processMessage(message);
  });
  void tryToUseCMakeFromQtTools();
  await kitManager.checkForAllQtInstallations();

  await initCoreValues();
  logger.info('Core values initialized');
}

export function deactivate() {
  logger.info(`Deactivating ${EXTENSION_ID}`);
  telemetry.dispose();
  projectManager.dispose();
  if (taskProvider) {
    taskProvider.dispose();
  }
}

export async function initCoreValues() {
  if (!coreAPI) {
    throw new Error('CoreAPI is not initialized');
  }

  for (const project of projectManager.getProjects()) {
    const folder = project.folder;
    const kit = await getSelectedKit(folder, true);
    const message = new QtWorkspaceConfigMessage(folder);
    const selectedKitPath = kit ? getQtInsRoot(kit) : undefined;
    logger.info(
      `Setting selected kit path for ${folder.uri.fsPath} to ${selectedKitPath}`
    );
    message.config.set('selectedKitPath', selectedKitPath);
    const selectedQtPaths = kit ? getQtPathsExe(kit) : undefined;
    message.config.set('selectedQtPaths', selectedQtPaths);
    message.config.set('workspaceType', QtWorkspaceType.CMakeExt);
    message.config.set('buildDir', project.buildDir ?? '');
    logger.info('Updating coreAPI with message:', message as unknown as string);
    coreAPI.update(message);
  }
}

async function processMessage(message: QtWorkspaceConfigMessage) {
  // check if workspace folder is a string
  let project: CppProject | undefined;
  if (typeof message.workspaceFolder === 'string') {
    if (message.workspaceFolder !== GlobalWorkspace) {
      throw new Error('Invalid global workspace');
    }
  } else {
    project = projectManager.getProject(message.workspaceFolder);
    if (!project) {
      logger.error('Project not found');
      return;
    }
  }
  for (const key of message.config.keys()) {
    if (key === QtInsRootConfigName) {
      const value = message.get<string>(QtInsRootConfigName) ?? '';
      await kitManager.onQtInstallationRootChanged(value, project?.folder);
      continue;
    }

    if (key === AdditionalQtPathsName) {
      const additionalQtPaths =
        message.get<QtAdditionalPath[]>(AdditionalQtPathsName) ?? [];
      await kitManager.onQtPathsChanged(additionalQtPaths, project?.folder);
      continue;
    }
  }
}

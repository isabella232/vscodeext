// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import {
  getQtInsRoot,
  getQtPathsExe,
  getSelectedKit,
  IsQtKit
} from '@cmd/register-qt-path';
import { createLogger } from 'qt-lib';
import { EXTENSION_ID } from '@/constants';
import { coreAPI } from '@/extension';

const logger = createLogger('natvis');

export function registerNatvisCommand() {
  const getNatvis = (version: string) => {
    const extension = vscode.extensions.getExtension(
      `theqtcompany.${EXTENSION_ID}`
    );
    if (!extension) {
      const error = 'Could not find the extension';
      logger.error(error);
      throw new Error(error);
    }
    const extensionPath = extension.extensionPath;
    if (!extensionPath) {
      const error = 'Could not find the extension path';
      logger.error(error);
      throw new Error(error);
    }
    const natvisFile = path.join(
      extensionPath,
      'res',
      'natvis',
      `qt${version}.natvis.xml`
    );
    if (!fs.existsSync(natvisFile)) {
      const error = `Could not find the natvis file: ${natvisFile}`;
      logger.error(error);
      throw new Error(error);
    }
    return natvisFile;
  };

  const natvisDisposal = vscode.commands.registerCommand(
    `${EXTENSION_ID}.natvis`,
    async () => {
      const kit = await getSelectedKit();
      if (!kit || !IsQtKit(kit)) {
        const error = `${kit?.name} is not a Qt kit`;
        throw new Error(error);
      }
      const qtInsRoot = getQtInsRoot(kit);
      if (qtInsRoot) {
        const qtVersion = qtInsRoot.includes('6.') ? '6' : '5';
        return getNatvis(qtVersion);
      }
      const qtPathsExe = getQtPathsExe(kit);
      if (qtPathsExe) {
        const qtInfo = coreAPI?.getQtInfoFromPath(qtPathsExe);
        const qtVersion = qtInfo?.get('QT_VERSION')?.includes('6.') ? '6' : '5';
        return getNatvis(qtVersion);
      }
      return undefined;
    }
  );
  const natvis5Disposal = vscode.commands.registerCommand(
    `${EXTENSION_ID}.natvis5`,
    () => {
      return getNatvis('5');
    }
  );
  const natvis6Disposal = vscode.commands.registerCommand(
    `${EXTENSION_ID}.natvis6`,
    () => {
      return getNatvis('6');
    }
  );

  return [natvisDisposal, natvis5Disposal, natvis6Disposal];
}

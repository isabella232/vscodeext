// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { IsWindows, createLogger } from 'qt-lib';
import { getSelectedKit } from '@cmd/register-qt-path';
import { EXTENSION_ID } from '@/constants';

const logger = createLogger('mingw-gdb');

async function findMinGWgdbPath(): Promise<string> {
  if (!IsWindows) {
    throw new Error('MinGW gdb is only available on Windows');
  }
  const kit = await getSelectedKit();
  if (!kit?.environmentVariables?.VSCODE_QT_INSTALLATION) {
    const message = 'Could not find the selected Qt installation path';
    logger.error(message);
    throw new Error(message);
  }
  const selectedQtPath = kit.environmentVariables.VSCODE_QT_INSTALLATION;
  const toolsDir = locateToolsDir(selectedQtPath);
  const mingwDir = fs
    .readdirSync(toolsDir)
    .find((tool) => tool.startsWith('mingw'));
  if (!mingwDir) {
    throw new Error('No MinGW installation found');
  }
  const gdbPath = path.join(toolsDir, mingwDir, 'bin', 'gdb.exe');
  if (!fs.existsSync(gdbPath)) {
    throw new Error('No gdb found in MinGW installation');
  }
  return gdbPath;
}

function locateToolsDir(selectedQtPath: string): string {
  let toolsDir = '';
  for (let i = 0; i < 4; i++) {
    toolsDir = path.join(selectedQtPath, '../'.repeat(i), 'Tools');
    if (fs.existsSync(toolsDir)) {
      return toolsDir;
    }
  }
  throw new Error(
    'No Tools directory found in the up to 4 levels up from the selected Qt path'
  );
}

export function registerMinGWgdbCommand() {
  return vscode.commands.registerCommand(
    `${EXTENSION_ID}.minGWgdb`,
    findMinGWgdbPath
  );
}

// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as path from 'path';
import * as vscode from 'vscode';
import { spawnSync } from 'child_process';
import {
  Trace,
  ServerOptions,
  LanguageClient,
  LanguageClientOptions
} from 'vscode-languageclient/node';

import * as qtPaths from '@util/get-qt-paths';
import * as versionutil from '@util/versions';
import * as util from '@util/util';
import { KitManager } from '@/kit-manager';
import { projectManager } from '@/extension';
import { createLogger } from '@/logger';

const logger = createLogger('qmlls');
const QMLLS_CONFIG = 'qt-official.qmlls';

export class Qmlls {
  private _client: LanguageClient | undefined;
  private _channel: vscode.OutputChannel | undefined;

  constructor() {
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration(QMLLS_CONFIG) ||
        event.affectsConfiguration('qt-official.qtFolder')
      ) {
        void this.restart();
      }
    });
  }

  public async start() {
    const configs = vscode.workspace.getConfiguration(QMLLS_CONFIG);
    if (!configs.get<boolean>('enabled', false)) {
      return;
    }

    try {
      if (configs.get<string>('customExePath')) {
        const customPath = configs.get<string>('customExePath') ?? '';
        const res = spawnSync(customPath, ['--help'], { timeout: 1000 });
        if (res.status !== 0) {
          throw res.error ?? new Error(res.stderr.toString());
        }

        this.startLanguageClient(customPath);
      } else {
        const qmllsPath = await findMostRecentExecutableQmlLS();
        if (!qmllsPath) {
          throw new Error('not found');
        }

        this.startLanguageClient(qmllsPath);
      }
    } catch (error) {
      if (util.isError(error)) {
        const message =
          'Cannot start QML language server. ' + createErrorString(error);

        void vscode.window.showErrorMessage(message);
        logger.error(message);
      }
    }
  }

  private startLanguageClient(qmllsPath: string) {
    const configs = vscode.workspace.getConfiguration(QMLLS_CONFIG);
    const verboseOutput = configs.get<boolean>('verboseOutput', false);
    const traceLsp = configs.get<string>('traceLsp', 'off');

    if (!this._channel) {
      this._channel = vscode.window.createOutputChannel('QML Language Server');
    }

    const serverOptions: ServerOptions = {
      command: qmllsPath,
      args: verboseOutput ? ['--verbose'] : []
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ language: 'qml' }],
      outputChannel: this._channel
    };

    if (traceLsp !== 'off') {
      clientOptions.traceOutputChannel = this._channel;
    }

    // create and start the client,
    // this will also launch the server
    this._client = new LanguageClient('qmlls', serverOptions, clientOptions);
    this._client
      .start()
      .then(async () => {
        await this._client?.setTrace(Trace.fromString(traceLsp));
        vscode.workspace.onDidChangeWorkspaceFolders(async () => {
          await this.restart();
        });

        logger.info(`QML Language Server started, ${qmllsPath}`);
      })
      .catch(() => {
        void vscode.window.showErrorMessage('Cannot start QML language server');
        logger.error(`LanguageClient has failed to start with ${qmllsPath}`);
      });
  }

  public async stop() {
    if (this._client) {
      if (this._client.isRunning()) {
        await this._client
          .stop()
          .then(() => {
            logger.info('QML Language Server stopped');
          })
          .catch((e) => {
            logger.info(`QML Language Server stop failed, ${e}`);
          });
      }

      this._client = undefined;
    }

    if (this._channel) {
      this._channel.dispose();
      this._channel = undefined;
    }
  }

  public async restart() {
    await this.stop();
    await this.start();
  }
}

async function findMostRecentExecutableQmlLS(): Promise<string | undefined> {
  const allQtFolders = [
    KitManager.getCurrentGlobalQtFolder(),
    ...Array.from(projectManager.getProjects()).map((project) => {
      return KitManager.getWorkspaceFolderQtFolder(project.folder);
    })
  ];

  const found: {
    qmllsPath: string;
    qtVersion: string;
  }[] = [];

  for (const qtFolder of allQtFolders) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    const allQt = await KitManager.findQtInstallations(qtFolder);

    for (const qt of allQt) {
      const relative = path.relative(qtFolder, qt);
      const version = path.normalize(relative).split(path.sep)[0];
      if (!version || !versionRegex.test(version)) {
        continue;
      }

      found.push({
        qtVersion: version,
        qmllsPath: path.join(
          qt,
          'bin',
          'qmlls' + qtPaths.PlatformExecutableExtension
        )
      });
    }
  }

  found.sort((a, b) => {
    return -1 * versionutil.compareVersions(a.qtVersion, b.qtVersion);
  });

  for (const item of found) {
    const res = spawnSync(item.qmllsPath, ['--help'], { timeout: 1000 });
    if (res.status === 0) {
      return item.qmllsPath;
    }
  }

  return undefined;
}

function createErrorString(e: Error): string {
  const casted = e as {
    code?: string;
    path?: string;
  };

  if (!casted.code) {
    return e.message;
  }

  const KnownErrors: Record<string, string> = {
    EPERM: 'Operation not permitted',
    ENOENT: 'No such file or directory',
    EACCES: 'Permission denied'
  };

  return (
    casted.path +
    ', ' +
    `${KnownErrors[casted.code] ?? 'Error'} (${casted.code})`
  );
}

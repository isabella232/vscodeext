// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';
import * as fs from 'fs';
import untildify from 'untildify';

import { DesignerClient } from '@/designer-client';
import { DesignerServer } from '@/designer-server';
import { createLogger, QtWorkspaceType, Project } from 'qt-lib';
import {
  getConfig,
  affectsConfig,
  locateDesigner,
  locateDesignerFromQtPaths
} from '@/util';
import { CONF_CUSTOM_WIDGETS_DESIGNER_EXE_PATH } from '@/constants';

const logger = createLogger('project');

export async function createUIProject(
  folder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext
) {
  return Promise.resolve(new UIProject(folder, context));
}

// Project class represents a workspace folder in the extension.
export class UIProject implements Project {
  private readonly _disposables: vscode.Disposable[] = [];
  private _workspaceType: QtWorkspaceType | undefined;
  private _binDir: string | undefined;
  private _designerClient: DesignerClient | undefined;
  private _qtpathsExe: string | undefined;
  private readonly _designerServer: DesignerServer;
  private _customWidgetsDesignerExePath: string | undefined;
  public constructor(
    readonly _folder: vscode.WorkspaceFolder,
    readonly _context: vscode.ExtensionContext
  ) {
    this._designerServer = new DesignerServer();
    this._customWidgetsDesignerExePath = this.getQtCustomDesignerPath();
    logger.info(
      `${CONF_CUSTOM_WIDGETS_DESIGNER_EXE_PATH}: "${this._customWidgetsDesignerExePath}"`
    );
    if (this._customWidgetsDesignerExePath) {
      if (
        UIProject.checkCustomDesignerExePath(this._customWidgetsDesignerExePath)
      ) {
        this.designerClient = new DesignerClient(
          this._customWidgetsDesignerExePath,
          this._designerServer.getPort()
        );
      }
    }
    const eventHandler = vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        affectsConfig(
          event,
          CONF_CUSTOM_WIDGETS_DESIGNER_EXE_PATH,
          this._folder
        )
      ) {
        this._customWidgetsDesignerExePath = this.getQtCustomDesignerPath();
        logger.info(
          `new ${CONF_CUSTOM_WIDGETS_DESIGNER_EXE_PATH}:`,
          this._customWidgetsDesignerExePath
        );
        if (
          this._customWidgetsDesignerExePath &&
          UIProject.checkCustomDesignerExePath(
            this._customWidgetsDesignerExePath
          )
        ) {
          this.designerClient = new DesignerClient(
            this._customWidgetsDesignerExePath,
            this._designerServer.getPort()
          );
        } else {
          // That means the user has removed the path.
          // So, we need to detach the client.
          if (this._designerClient) {
            this.designerClient = new DesignerClient(
              this.getQtCustomDesignerPath(),
              this._designerServer.getPort()
            );
          }
        }
      }
    });
    this._disposables.push(eventHandler);
  }
  getQtCustomDesignerPath() {
    return untildify(
      getConfig<string>(CONF_CUSTOM_WIDGETS_DESIGNER_EXE_PATH, '', this._folder)
    );
  }

  private async getNewDesignerClient(binDir: string) {
    const designerExe = await locateDesigner(binDir);
    if (!designerExe) {
      return undefined;
    }
    const designerClient = new DesignerClient(
      designerExe,
      this.designerServer.getPort()
    );
    return designerClient;
  }
  get workspaceType() {
    return this._workspaceType;
  }
  set workspaceType(workspaceType: QtWorkspaceType | undefined) {
    this._workspaceType = workspaceType;
  }

  get binDir() {
    return this._binDir;
  }

  get qtpathsExe() {
    return this._qtpathsExe;
  }

  set qtpathsExe(qtpathsExe: string | undefined) {
    const setDesignerClient = (designer: string | undefined) => {
      if (designer) {
        this.designerClient = new DesignerClient(
          designer,
          this.designerServer.getPort()
        );
      }
    };
    if (qtpathsExe) {
      void locateDesignerFromQtPaths(qtpathsExe).then(setDesignerClient);
    } else {
      this.designerClient = undefined;
    }
    this._qtpathsExe = qtpathsExe;
  }

  async setBinDir(binDir: string | undefined) {
    if (binDir !== this._binDir) {
      if (!this._customWidgetsDesignerExePath) {
        this._binDir = binDir;
        if (binDir) {
          this.designerClient = await this.getNewDesignerClient(binDir);
        } else {
          this.designerClient = undefined;
        }
      }
    }
  }
  get designerServer() {
    return this._designerServer;
  }
  get designerClient() {
    return this._designerClient;
  }
  set designerClient(client: DesignerClient | undefined) {
    this._designerClient?.detach();
    this._designerClient = client;
  }
  get folder() {
    return this._folder;
  }

  private static checkCustomDesignerExePath(
    customWidgetsDesignerExePath: string
  ) {
    if (!fs.existsSync(customWidgetsDesignerExePath)) {
      logger.error(
        'Qt Widgets Designer executable not found at:"',
        customWidgetsDesignerExePath,
        '"'
      );
      void vscode.window.showWarningMessage(
        'Qt Widgets Designer executable not found at:"' +
          customWidgetsDesignerExePath +
          '"'
      );
      return false;
    }
    return true;
  }
  dispose() {
    this._designerServer.dispose();
    this._designerClient?.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}

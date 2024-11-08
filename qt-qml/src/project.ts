// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import { Project, ProjectManager, createLogger } from 'qt-lib';
import { Qmlls } from '@/qmlls';

const logger = createLogger('project');

export async function createQMLProject(
  folder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext
) {
  return Promise.resolve(new QMLProject(folder, context));
}

export class QMLProjectManager extends ProjectManager<QMLProject> {
  constructor(override readonly context: vscode.ExtensionContext) {
    super(context, createQMLProject);
  }
  async stopQmlls() {
    const promises = [];
    for (const project of this.getProjects()) {
      promises.push(project.qmlls.stop());
    }
    return Promise.all(promises);
  }
  async startQmlls() {
    const promises = [];
    for (const project of this.getProjects()) {
      promises.push(project.qmlls.start());
    }
    return Promise.all(promises);
  }
  async restartQmlls() {
    const promises = [];
    for (const project of this.getProjects()) {
      promises.push(project.qmlls.restart());
    }
    return Promise.all(promises);
  }
}
// Project class represents a workspace folder in the extension.
export class QMLProject implements Project {
  _qmlls: Qmlls;
  public constructor(
    readonly _folder: vscode.WorkspaceFolder,
    readonly _context: vscode.ExtensionContext
  ) {
    logger.info('Creating project:', _folder.uri.fsPath);
    this._qmlls = new Qmlls(_folder);
    void this.qmlls.start();
  }
  get folder() {
    return this._folder;
  }
  get qmlls() {
    return this._qmlls;
  }
  dispose() {
    logger.info('Disposing project:', this.folder.uri.fsPath);
    void this.qmlls.stop();
  }
}

// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import { EXTENSION_ID } from '@/constants';
import { DecisionCode, fetchAssetAndDecide } from '@/qmlls';
import { qmlls } from '@/extension';
import { showAutoDismissNotification } from 'qt-lib';

export function registerCheckQmllsUpdateCommand() {
  return vscode.commands.registerCommand(
    `${EXTENSION_ID}.checkQmllsUpdate`,
    async () => {
      const decision = await fetchAssetAndDecide();

      switch (decision.code) {
        case DecisionCode.NeedToUpdate:
          if (decision.asset) {
            await qmlls.install(decision.asset, { restart: true });
          }
          break;

        case DecisionCode.AlreadyUpToDate:
          void showAutoDismissNotification(
            'QML language server',
            `Already Up-to-date, tag = ${decision.asset?.tag_name}`
          );
          break;

        default:
          break;
      }
    }
  );
}

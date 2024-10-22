// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as vscode from 'vscode';

import { EXTENSION_ID } from '@/constants';
import { DecisionCode, fetchAssetAndDecide } from '@/qmlls';
import { qmlls } from '@/extension';

export function registerDownloadQmllsCommand() {
  return vscode.commands.registerCommand(
    `${EXTENSION_ID}.downloadQmlls`,
    async () => {
      const decision = await fetchAssetAndDecide({ doNotAsk: true });

      switch (decision.code) {
        case DecisionCode.NeedToUpdate:
        case DecisionCode.AlreadyUpToDate:
          if (decision.asset) {
            await qmlls.install(decision.asset, { restart: true });
          }
          break;

        default:
          break;
      }
    }
  );
}

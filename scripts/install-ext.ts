// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import { execSync } from 'child_process';

import { getExtensionVersion } from './common';

function main() {
  program.option('-d, --dir <string>', 'Path to target extension directory');
  program.option('-n, --name <string>', 'Name of the extension');
  program.option('--profile <string>', 'Profile to install package');
  program.parse(process.argv);
  const options = program.opts();
  const profile = options.profile as string;
  const targetExtensionRoot = options.dir as string;
  const extensionName = options.name as string;

  const outputDir = path.join(targetExtensionRoot, 'out');
  // try to find <name>-*.vsix in the output directory
  const files = fs.readdirSync(outputDir);
  const extensionFiles = files.filter(
    (file) => file.startsWith(`${extensionName}-`) && file.endsWith('.vsix')
  );
  if (extensionFiles.length === 0) {
    throw new Error(
      `No extension files found in the output directory for ${extensionName}`
    );
  }
  const packageVersion = getExtensionVersion(targetExtensionRoot);
  if (!packageVersion) {
    throw new Error('Failed to get package version');
  }

  // Install the matching version of the extension
  const extension = extensionFiles.find((file) => {
    const version = file.split('-')[2]?.split('.vsix')[0] ?? '';
    return version === packageVersion;
  });

  if (!extension) {
    throw new Error(
      `No extension file found for version ${packageVersion} in the output directory`
    );
  }

  let profileArg = '';
  if (profile) {
    profileArg = ` --profile="${profile}"`;
  }

  execSync(`code --install-extension "${extension}" --force${profileArg}`, {
    cwd: outputDir,
    stdio: 'inherit'
  });
}

main();

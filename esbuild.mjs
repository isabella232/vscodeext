// Copyright (C) 2024 The Qt Company Ltd.
// SPDX-License-Identifier: LicenseRef-Qt-Commercial OR LGPL-3.0-only

import { build, context} from 'esbuild';

/** @type BuildOptions */
const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production'
};

// Config for extension source code (to be run in a Node-based context)
/** @type BuildOptions */
const extensionConfig = {
  ...baseConfig,
  platform: 'node',
  mainFields: ['module', 'main'],
  tsconfig: './tsconfig.json',
  format: 'cjs',
  entryPoints: ['./src/extension.ts'],
  outfile: './out/extension.js',
  external: ['vscode']
};

// Config for webview source code (to be run in a web-based context)
/** @type BuildOptions */
const webviewConfig = {
  ...baseConfig,
  target: 'es2020',
  format: 'esm',
  entryPoints: ['./src/editors/ui/webview-ui/main.ts'],
  outfile: './out/editors/ui/webview-ui/main.js'
};

// Build script
(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--watch')) {
      const extCtx = await context({
        ...extensionConfig
      });
      await extCtx.watch();
      await extCtx.dispose();
      const webCtx = await context({
        ...webviewConfig
      });
      await webCtx.watch();
      await webCtx.dispose();
      console.log('[watch] build finished');
    } else {
      // Build extension and webview code
      await build(extensionConfig);
      await build(webviewConfig);
      console.log('build complete');
    }
  } catch (err) {
    process.stderr.write(err.stderr);
    process.exit(1);
  }
})();

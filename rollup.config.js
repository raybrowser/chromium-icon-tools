import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import externals from 'rollup-plugin-node-externals';

export default [
  // Build index.ts
  {
    input: './src/index.ts',
    output: [
      {
        file: './dist/index.js',
        format: 'es',
      },
    ],
    plugins: [typescript(), json(), externals()],
  },
  // Build svg2icon-cli.ts
  {
    input: './src/cli/svg2icon-cli.ts',
    output: [
      {
        file: './bin/svg2icon-cli.cjs',
        format: 'cjs',
        banner: '#!/usr/bin/env node \n',
      },
    ],
    plugins: [typescript(), json(), externals()],
  },
];

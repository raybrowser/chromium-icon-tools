import typescript from '@rollup/plugin-typescript';
import externals from 'rollup-plugin-node-externals';

export default [
  // Build index.ts.
  {
    input: './src/index.ts',
    output: [
      {
        file: './dist/index.js',
        format: 'es',
      },
    ],
    plugins: [typescript(), externals()],
  },
  // Build svg2icon-cli.ts.
  {
    input: './src/bin/svg2icon-cli.ts',
    output: [
      {
        file: './dist/svg2icon-cli.js',
        format: 'es',
      },
    ],
    plugins: [typescript(), externals()],
  },
];

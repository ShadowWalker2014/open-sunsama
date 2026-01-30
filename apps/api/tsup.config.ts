import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  // Bundle workspace packages so the output is self-contained
  noExternal: [
    '@open-sunsama/database',
    '@open-sunsama/types',
    '@open-sunsama/utils',
  ],
});

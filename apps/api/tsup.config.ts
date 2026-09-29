import { defineConfig } from 'tsup';

export default defineConfig({
  // migrate.ts is the one-off runner: `node dist/migrate.js`
  entry: ['src/index.ts', 'src/migrate.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  // Bundle workspace packages so the output is self-contained
  noExternal: [
    '@open-sunsama/database',
    '@open-sunsama/types',
    '@open-sunsama/utils',
    '@open-sunsama/mcp',
    // Bundle the MCP SDK's Zod schemas with the standalone API build.
    'zod',
  ],
});

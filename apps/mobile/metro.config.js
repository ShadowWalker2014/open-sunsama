const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages
config.watchFolders = [workspaceRoot];

// Resolve modules from workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure proper resolution for symlinked packages
config.resolver.disableHierarchicalLookup = true;

// Support workspace package resolution
config.resolver.extraNodeModules = {
  '@open-sunsama/api-client': path.resolve(workspaceRoot, 'packages/api-client/src'),
  '@open-sunsama/types': path.resolve(workspaceRoot, 'packages/types/src'),
};

// Resolve .js imports to .ts files (ESM imports in workspace packages)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle .js extension imports - resolve to .ts
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    return context.resolveRequest(context, tsModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

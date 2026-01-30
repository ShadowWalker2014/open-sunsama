const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages (append to defaults)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Resolve modules from workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Support workspace package resolution
config.resolver.extraNodeModules = {
  '@open-sunsama/api-client': path.resolve(workspaceRoot, 'packages/api-client/src'),
  '@open-sunsama/types': path.resolve(workspaceRoot, 'packages/types/src'),
};

// Resolve .js imports to .ts files (ESM imports in workspace packages)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Only transform .js to .ts for files in workspace packages
  // This prevents breaking node_modules imports (e.g., React's CJS files)
  const isFromWorkspacePackage = context.originModulePath && 
    context.originModulePath.includes('/packages/');
  
  if (isFromWorkspacePackage && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    return context.resolveRequest(context, tsModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

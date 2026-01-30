const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch workspace packages (append to defaults)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// Block root node_modules/react from being resolved - force local version only
config.resolver.blockList = [
  // Block root's react to prevent version mismatch
  new RegExp(`^${escapeRegex(path.resolve(workspaceRoot, 'node_modules/react'))}(/.*)?$`),
  new RegExp(`^${escapeRegex(path.resolve(workspaceRoot, 'node_modules/scheduler'))}(/.*)?$`),
];

// Helper to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resolve modules - local first, then workspace
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
  const isFromWorkspacePackage = context.originModulePath && 
    context.originModulePath.includes('/packages/');
  
  if (isFromWorkspacePackage && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    return context.resolveRequest(context, tsModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

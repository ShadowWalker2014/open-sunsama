const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Expo automatically detects workspace packages; only bridge ESM source imports.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isFromWorkspacePackage =
    context.originModulePath && context.originModulePath.includes("/packages/");

  if (
    isFromWorkspacePackage &&
    moduleName.startsWith(".") &&
    moduleName.endsWith(".js")
  ) {
    const tsModuleName = moduleName.replace(/\.js$/, ".ts");
    return context.resolveRequest(context, tsModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

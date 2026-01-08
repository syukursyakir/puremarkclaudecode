const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Python venv folder from Metro's file watching
// This prevents permission errors with symlinks on Windows
config.resolver.blockList = [
  /venv\/.*/,
  /\.git\/.*/,
];

config.watcher.additionalExclusions = [
  '**/venv/**',
  '**/.git/**',
];

module.exports = config;

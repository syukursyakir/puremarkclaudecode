const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude Python venv and backend folder from Metro's file watching
// This prevents permission errors with symlinks on Windows
config.resolver.blockList = [
  /backend[\/\\]venv[\/\\].*/,
  /backend[\/\\]__pycache__[\/\\].*/,
  /venv[\/\\].*/,
  /\.git[\/\\].*/,
];

// Exclude from watcher
config.watcher = {
  ...config.watcher,
  additionalExclusions: [
    '**/backend/venv/**',
    '**/backend/__pycache__/**',
    '**/venv/**',
    '**/.git/**',
    '**/node_modules/.cache/**',
  ],
};

module.exports = config;

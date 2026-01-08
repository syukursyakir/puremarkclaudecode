// ================================================================
//  APP CONFIGURATION
// ================================================================
// Centralized configuration for the PureMark app.
// Uses environment variables for deployment flexibility.

import Constants from 'expo-constants';

// Get extra config from app.config.js or app.json
const extra = Constants.expoConfig?.extra ?? {};

// API Configuration
// Priority: 1. Environment variable, 2. Default based on platform
const getDefaultApiUrl = (): string => {
  // For development, detect platform and use appropriate localhost
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to access host machine
    // iOS simulator and web can use localhost directly
    // For physical devices, you'll need to set API_URL in your environment
    return 'http://10.0.2.2:5000';
  }
  // Production default (should be overridden via environment)
  return 'https://api.puremark.app';
};

export const config = {
  // API base URL - configurable via environment
  apiUrl: (extra.apiUrl as string) || getDefaultApiUrl(),

  // Image upload constraints
  image: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB max
    maxDimension: 4096, // Max width or height
    allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
  },

  // Debug mode
  debug: __DEV__ || (extra.debug as boolean) || false,
};

export default config;

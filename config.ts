// ================================================================
//  APP CONFIGURATION
// ================================================================
// Centralized configuration for the PureMark app.
// Uses environment variables for deployment flexibility.

import Constants from 'expo-constants';

// Get extra config from app.config.js or app.json
const extra = Constants.expoConfig?.extra ?? {};

// ================================================================
// Backend Selection
// ================================================================
// Choose which backend to use:
// - 'railway': FastAPI on Railway (recommended for production)
// - 'supabase': Supabase Edge Functions
// - 'local': Local development server
export type BackendType = 'railway' | 'supabase' | 'local';

// Set this to switch backends
export const BACKEND_TYPE: BackendType = 'railway';

// Backend URLs
const BACKEND_URLS: Record<BackendType, string> = {
  railway: 'https://puremarkclaudecode-production.up.railway.app',
  supabase: 'https://xnzgmgjuxisclvjvnppy.supabase.co/functions/v1',
  local: __DEV__ ? 'http://10.0.2.2:8000' : 'http://localhost:8000',
};

// Direct URL export for easy access
export const API_URL: string = BACKEND_URLS[BACKEND_TYPE];

// API Configuration
const getApiUrl = (): string => {
  // Allow environment override
  if (extra.apiUrl) {
    return extra.apiUrl as string;
  }
  return BACKEND_URLS[BACKEND_TYPE];
};

// API Key for authentication (optional - only required in production)
const getApiKey = (): string | undefined => {
  return extra.apiKey as string | undefined;
};

export const config = {
  // Backend type
  backendType: BACKEND_TYPE,

  // API base URL - automatically selected based on backend type
  apiUrl: getApiUrl(),

  // API key for authentication (set in Railway environment as API_SECRET_KEY)
  apiKey: getApiKey(),

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

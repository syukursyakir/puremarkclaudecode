// Dynamic Expo configuration
// This allows environment variables to be injected at build time

// Load .env file
require('dotenv').config();

export default ({ config }) => {
  return {
    ...config,
    extra: {
      // API URL - set via environment variable for different deployments
      // Development: API_URL=http://192.168.1.100:5000 (your local IP)
      // Production: API_URL=https://api.puremark.app
      apiUrl: process.env.API_URL || null,

      // API Key for authenticated requests to backend
      // Set API_SECRET_KEY in your EAS secrets for production builds
      apiKey: process.env.API_SECRET_KEY || null,

      // Debug mode
      debug: process.env.DEBUG === 'true',
    },
  };
};

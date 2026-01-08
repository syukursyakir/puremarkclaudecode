// Dynamic Expo configuration
// This allows environment variables to be injected at build time

export default ({ config }) => {
  return {
    ...config,
    extra: {
      // API URL - set via environment variable for different deployments
      // Development: API_URL=http://192.168.1.100:5000 (your local IP)
      // Production: API_URL=https://api.puremark.app
      apiUrl: process.env.API_URL || null,

      // Debug mode
      debug: process.env.DEBUG === 'true',
    },
  };
};

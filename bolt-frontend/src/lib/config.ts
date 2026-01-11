export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1/public',
  appName: import.meta.env.VITE_APP_NAME || 'Agent402',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

export default config;

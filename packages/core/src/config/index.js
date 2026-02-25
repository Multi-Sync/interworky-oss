const { loadConfig } = require('dotenv-handler');
const fs = require('fs');
const path = require('path');
const mode = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../../.env.${mode}`);

const required = [
  'MONGODB_URL',
  'JWT_SECRET',
];

const defaults = {
  PORT: '3015',
  AI_MODEL: 'gpt-4o',
  AI_FAST_MODEL: 'gpt-4o-mini',
  EMAIL_PROVIDER: 'console',
  SMS_PROVIDER: 'console',
  STORAGE_PROVIDER: 'local',
  STORAGE_LOCAL_PATH: './uploads',
};

module.exports = () => {
  // If .env file doesn't exist (K8s), create it from process.env so getConfig() works
  if (!fs.existsSync(envPath)) {
    const lines = Object.entries(process.env)
      .filter(([k]) => !k.includes('\n'))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.writeFileSync(envPath, lines);
  }

  return loadConfig(envPath, { required, defaults, expand: true });
};

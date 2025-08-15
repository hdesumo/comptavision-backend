// config/config.js
require('dotenv').config();
const { version } = require('../package.json');

const isProd = (process.env.NODE_ENV || 'development') === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-prod')) {
  // Évite de démarrer en prod sans secret solide
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

const parseBool = (v, def = false) => {
  if (typeof v !== 'string') return def;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

module.exports = {
  app: {
    name: 'ComptaVision',
    version: version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    // Normalise: enlève un éventuel slash final pour éviter les doubles slashes dans les fetch
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  },
  db: {
    // Supporte DATABASE_URL (Railway/Render) ou fallback local
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'comptavision_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: parseBool(process.env.DB_SSL || (isProd ? 'true' : 'false')),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-prod',
  },
  license: {
    defaultDurationDays: parseInt(process.env.LICENSE_DEFAULT_DAYS || '365', 10),
    maxUsersDefault: parseInt(process.env.LICENSE_MAX_USERS || '5', 10),
  },
};


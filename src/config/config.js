// src/config/config.js
require('dotenv').config();
const path = require('path');

// Version app depuis le package.json (chemin robuste en prod)
const { version } = (() => {
  try {
    const pkg = require(path.join(__dirname, '..', '..', 'package.json'));
    return { version: pkg.version || '1.0.0' };
  } catch {
    return { version: '1.0.0' };
  }
})();

const isProd = (process.env.NODE_ENV || 'development') === 'production';

// petit utilitaire pour parser les booléens d'env
const parseBool = (v, def = false) => {
  if (typeof v !== 'string') return def;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
};

// Sécurité : empêcher un démarrage prod sans secret JWT
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-prod')) {
  throw new Error('JWT_SECRET must be set to a strong value in production.');
}

module.exports = {
  app: {
    name: 'ComptaVision',
    version: version, // ex: "1.0.0"
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    // enlève un éventuel slash final pour éviter les doubles // dans les fetch
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  },
  db: {
    // support DATABASE_URL (Railway/Render) OU variables séparées
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'comptavision_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    // active SSL par défaut en prod, mais surchargable via DB_SSL
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


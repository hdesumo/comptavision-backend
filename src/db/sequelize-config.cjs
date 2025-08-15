// src/db/sequelize-config.cjs
require('dotenv').config();

const common = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {},
};

const useUrl = !!process.env.DATABASE_URL;

const fromUrl = () => {
  const cfg = { ...common, use_env_variable: 'DATABASE_URL' };
  if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
    cfg.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
  }
  return cfg;
};

const fromVars = () => {
  const cfg = {
    ...common,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME || 'comptavision_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  };
  if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
    cfg.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
  }
  return cfg;
};

const envCfg = useUrl ? fromUrl() : fromVars();

module.exports = {
  development: envCfg,
  test: envCfg,
  production: envCfg,
};

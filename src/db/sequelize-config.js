require('dotenv').config();

const common = {
  dialect: 'postgres',
  dialectOptions: {},
  logging: false,
};

const useUrl = !!process.env.DATABASE_URL;

const withUrl = () => {
  const cfg = { ...common, use_env_variable: 'DATABASE_URL' };
  if ((process.env.DB_SSL || '').toLowerCase() === 'true') {
    cfg.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
  }
  return cfg;
};

const withCreds = () => {
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

const envCfg = useUrl ? withUrl() : withCreds();

module.exports = {
  development: envCfg,
  test: envCfg,
  production: envCfg,
};

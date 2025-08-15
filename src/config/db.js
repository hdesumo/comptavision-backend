// config/db.js
const { Pool } = require('pg');
const url = require('url');
const config = require('./config');

let pool;

if (config.db.url) {
  // DATABASE_URL style: postgres://user:pass@host:port/dbname
  const params = url.parse(config.db.url);
  const [user, password] = (params.auth || '').split(':');
  const ssl =
    config.db.ssl || (params.query && /ssl=true/i.test(params.query)) ? { rejectUnauthorized: false } : false;

  pool = new Pool({
    user,
    password,
    host: params.hostname,
    port: parseInt(params.port || '5432', 10),
    database: (params.pathname || '').split('/')[1],
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
} else {
  pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

// Vérification de connexion au démarrage (optionnel)
pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};


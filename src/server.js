// comptavision-backend/src/server.js
// Serveur Express prêt prod (Railway/Render/Vercel) : CORS centralisé, Helmet, logs, 404, erreurs, arrêt propre.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Config centralisée
const config = require('./config/config');

// Routes (adapte les chemins si différents dans ton repo)
const authRoutes = require('./auth/auth.routes');                 // ex: login, refresh, etc.
const tenantRoutes = require('./tenants/tenant.routes');
const clientRoutes = require('./clients/client.routes');
const adminLicenseRoutes = require('./routes/admin/license.routes');     // CRUD licences côté admin
const licenseActivationRoutes = require('./routes/auth/license-activation.routes'); // activation via clé

const app = express();

// Déploiement derrière proxy (Vercel/Render/Railway)
app.set('trust proxy', 1);

// Sécurité HTTP
app.use(helmet());

// Logs HTTP (désactivé en test)
if (config.app.env !== 'test') {
  app.use(morgan('combined'));
}

// CORS : frontend autorisé via config.app.frontendUrl
app.use(cors({
  origin: config.app.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ComptaVision API',
    env: config.app.env,
    version: config.app.version
  });
});

// ===== API v1 =====
app.use('/api/v1/auth', authRoutes);               // Auth (classique)
app.use('/api/v1/auth', licenseActivationRoutes);  // Activation licence via clé
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/admin', adminLicenseRoutes);      // Espace admin (licences) versionné

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestion d’erreurs centralisée
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Internal error:', err);
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: config.app.env === 'development' ? err.message : undefined
  });
});

// Lancement serveur
const PORT = config.app.port;
const server = app.listen(PORT, () => {
  console.log(`🚀 ${config.app.name} backend running on port ${PORT}`);
});

// Arrêt propre
const shutdown = (signal) => {
  console.log(`\n${signal} received: closing server...`);
  server.close(() => {
    console.log('🔻 HTTP server closed. Bye!');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };


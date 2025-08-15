// src/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Récupère le token Bearer de l'en-tête Authorization
 */
function getBearerToken(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (!h) return null;
  const [type, token] = h.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Middleware obligatoire : vérifie le JWT, remplit req.user
 * Attendu dans le payload : { sub, email, tenantId, role }
 */
function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'MISSING_TOKEN' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET manquant dans les variables d’environnement');
      return res.status(500).json({ error: 'SERVER_CONFIG_ERROR' });
    }

    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      // Optionnel si tu veux verrouiller :
      // issuer: 'financeiq',
      // audience: 'financeiq-app',
    });

    // Champs utiles pour le multi-tenant
    req.user = {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
      // tout autre champ dont tu as besoin
    };

    if (!req.user.tenantId) {
      return res.status(401).json({ error: 'TENANT_REQUIRED' });
    }

    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

/**
 * Middleware optionnel : n’échoue pas si pas de token
 * (utile pour routes publiques qui peuvent bénéficier d’un user si présent)
 */
function optionalAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  } catch (e) {
    // on ignore les erreurs (reste non authentifié)
  }
  next();
}

/**
 * Middleware d’autorisation par rôle
 * Usage: router.post('/x', requireAuth, requireRole('ADMIN','OWNER'), handler)
 */
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ error: 'FORBIDDEN' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    next();
  };
}

/**
 * Helper pour signer un access token
 * @param {object} user  { id, email, tenantId, role }
 * @param {object} opts  { expiresIn='1h' }
 */
function signAccessToken(user, opts = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');

  const payload = {
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: opts.expiresIn || '1h',
    subject: String(user.id),
    // issuer: 'financeiq',
    // audience: 'financeiq-app',
  });
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  signAccessToken,
};


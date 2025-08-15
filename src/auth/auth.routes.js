// src/auth/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/* ------------------------- helpers JWT & RBAC ------------------------- */

function getBearerToken(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (!h) return null;
  const [type, token] = h.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

function signAccessToken(user, opts = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  // payload minimal nécessaire au SaaS multi-tenant
  const payload = {
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  };
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: opts.expiresIn || '7d',
    subject: String(user.id),
    // issuer: 'financeiq',
    // audience: 'financeiq-app',
  });
}

const authenticateToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'MISSING_TOKEN' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // On récupère l’utilisateur pour vérifier statut & lier le tenant
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { tenant: true }
    });
    if (!user || !user.isActive || user.tenant.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        country: user.tenant.country,
      }
    };
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
};

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    next();
  };
}

/* ------------------------------ Register ------------------------------ */
// Register new cabinet (tenant + first user)
router.post('/register', async (req, res) => {
  try {
    const {
      cabinetName,
      cabinetSlug,
      country,
      email,
      password,
      firstName,
      lastName
    } = req.body;

    // Validate required fields
    if (!cabinetName || !cabinetSlug || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const slug = String(cabinetSlug).toLowerCase().trim();

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Cabinet slug already taken' });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create tenant and user in transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: cabinetName,
          slug,
          country: country || 'CM',
          currency: country === 'SN' ? 'XOF' : 'XAF'
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'OWNER',
          tenantId: tenant.id
        }
      });

      return { tenant, user };
    });

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role
    });

    res.status(201).json({
      message: 'Cabinet created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* -------------------------------- Login ------------------------------- */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user with tenant info
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isActive || user.tenant.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account suspended' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenant.id,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ------------------------------ Me (profile) ------------------------------ */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role
    },
    tenant: req.user.tenant ?? {
      id: req.user.tenantId
    }
  });
});

/* ----------------------------- exports ----------------------------- */
module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireRole = requireRole;


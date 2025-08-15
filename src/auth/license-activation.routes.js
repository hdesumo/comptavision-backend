// src/auth/license-activation.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { withTenantTx } = require('../lib/withTenantTx'); // si tu veux appliquer RLS après activation

/**
 * Body attendu:
 * { licenseKey: string, tenantSlug: string } // le cabinet a déjà créé son compte (tenant) via /register
 * - Vérifie la licence (existante, non expirée, status PENDING/ACTIVE)
 * - Lie la licence au tenant si non lié
 * - Active si PENDING
 */
router.post('/auth/activate-license', async (req, res) => {
  try {
    const { licenseKey, tenantSlug } = req.body;
    if (!licenseKey || !tenantSlug) {
      return res.status(400).json({ error: 'MISSING_FIELDS' });
    }

    const license = await prisma.license.findUnique({ where: { licenseKey } });
    if (!license) return res.status(404).json({ error: 'LICENSE_NOT_FOUND' });
    if (license.status === 'REVOKED') return res.status(403).json({ error: 'LICENSE_REVOKED' });

    const now = new Date();
    if (now > new Date(license.expiresAt)) {
      // passe en EXPIRED si dépassée
      await prisma.license.update({ where: { id: license.id }, data: { status: 'EXPIRED' } });
      return res.status(403).json({ error: 'LICENSE_EXPIRED' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return res.status(404).json({ error: 'TENANT_NOT_FOUND' });

    // Lier la licence au tenant si pas déjà lié
    const toUpdate = {
      tenantId: license.tenantId || tenant.id,
      status: 'ACTIVE',
      activatedAt: license.activatedAt || now
    };

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: toUpdate
    });

    // (Optionnel) mettre à jour le plan du tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: updated.plan,
        status: 'ACTIVE'
      }
    });

    res.json({ message: 'LICENSE_ACTIVATED', license: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_ACTIVATION_FAILED' });
  }
});

module.exports = router;


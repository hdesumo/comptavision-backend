// src/admin/license.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateLicenseKey, addDays } = require('../lib/license');
const { requireAuth, requireRole } = require('../middleware/auth');

// Toutes les routes admin nécessitent un rôle interne (ex.: OWNER = ComptaVision staff)
router.use(requireAuth, requireRole('OWNER', 'ADMIN')); // adapte selon ta gouvernance

// POST /admin/licenses -> créer une licence PENDING
router.post('/licenses', async (req, res) => {
  try {
    const {
      plan = 'STARTER',
      seats = 5,
      termDays = Number(process.env.LICENSE_DEFAULT_TERM_DAYS || 365),
      note
    } = req.body;

    const licenseKey = generateLicenseKey('CV');

    const license = await prisma.license.create({
      data: {
        licenseKey,
        status: 'PENDING',
        plan,
        seats,
        issuedAt: new Date(),
        expiresAt: addDays(new Date(), termDays),
        note: note || null
      }
    });

    res.status(201).json(license);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_CREATE_FAILED' });
  }
});

// GET /admin/licenses -> liste
router.get('/licenses', async (_req, res) => {
  try {
    const list = await prisma.license.findMany({
      orderBy: { issuedAt: 'desc' }
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_LIST_FAILED' });
  }
});

// GET /admin/licenses/:id
router.get('/licenses/:id', async (req, res) => {
  try {
    const lic = await prisma.license.findUnique({ where: { id: req.params.id } });
    if (!lic) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(lic);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_GET_FAILED' });
  }
});

// PATCH /admin/licenses/:id -> maj status/plan/seats/expiry/revoke
router.patch('/licenses/:id', async (req, res) => {
  try {
    const { status, plan, seats, expiresAt, note } = req.body;
    const lic = await prisma.license.update({
      where: { id: req.params.id },
      data: { status, plan, seats, expiresAt: expiresAt ? new Date(expiresAt) : undefined, note }
    });
    res.json(lic);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_UPDATE_FAILED' });
  }
});

// POST /admin/licenses/:id/revoke
router.post('/licenses/:id/revoke', async (req, res) => {
  try {
    const lic = await prisma.license.update({
      where: { id: req.params.id },
      data: { status: 'REVOKED' }
    });
    res.json(lic);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'LICENSE_REVOKE_FAILED' });
  }
});

module.exports = router;


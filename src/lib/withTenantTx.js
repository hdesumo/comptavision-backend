// src/lib/withTenantTx.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Ouvre une transaction et fixe app.tenant_id pour TOUTES
 * les requêtes SQL exécutées via le Prisma tx fourni à fn(tx).
 */
async function withTenantTx(tenantId, fn) {
  if (!tenantId) throw new Error('TENANT_REQUIRED');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);
    return fn(tx);
  });
}

module.exports = { prisma, withTenantTx };


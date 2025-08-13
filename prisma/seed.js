// prisma/seed.js
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1) Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-tenant' },
    update: {
      name: 'Cabinet Démo',
      country: 'CM',
      currency: 'XAF',
      plan: 'STARTER',
      status: 'ACTIVE',
    },
    create: {
      slug: 'demo-tenant',
      name: 'Cabinet Démo',
      country: 'CM',
      currency: 'XAF',
      plan: 'STARTER',
      status: 'ACTIVE',
    },
  });

  // 2) User (propriétaire)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.local' },
    update: {
      firstName: 'Owner',
      lastName: 'Demo',
      role: 'OWNER',
      isActive: true,
      tenantId: tenant.id,
    },
    create: {
      email: 'owner@demo.local',
      password: 'changeme', // ⚠️ à remplacer par un hash bcrypt en prod
      firstName: 'Owner',
      lastName: 'Demo',
      role: 'OWNER',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // 3) Client
  const client = await prisma.client.upsert({
    where: { email: 'client@demo.local' },
    update: {
      name: 'Client Démo',
      phone: '+237600000000',
      isActive: true,
      tenantId: tenant.id,
    },
    create: {
      name: 'Client Démo',
      email: 'client@demo.local',
      phone: '+237600000000',
      isActive: true,
      tenantId: tenant.id,
    },
  });

  // 4) Abonnement (1↔1 avec Tenant)
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id }, // tenantId est @unique → parfait pour upsert
    update: {
      status: 'ACTIVE',
      plan: 'STARTER',
      amount: new Prisma.Decimal('0.00'),
      currency: 'EUR',
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
    },
    create: {
      status: 'ACTIVE',
      plan: 'STARTER',
      amount: new Prisma.Decimal('0.00'),
      currency: 'EUR',
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      tenantId: tenant.id,
    },
  });

  // 5) (Optionnel) Exemple de données financières + prédiction
  await prisma.financialData.upsert({
    where: { clientId_period_periodType: { clientId: client.id, period: '2025-07', periodType: 'MONTHLY' } },
    update: {
      revenue: new Prisma.Decimal('100000.00'),
      expenses: new Prisma.Decimal('80000.00'),
      profitMargin: new Prisma.Decimal('20.00'),
      source: 'MANUAL',
      importedAt: new Date(),
    },
    create: {
      clientId: client.id,
      period: '2025-07',
      periodType: 'MONTHLY',
      revenue: new Prisma.Decimal('100000.00'),
      expenses: new Prisma.Decimal('80000.00'),
      profitMargin: new Prisma.Decimal('20.00'),
      source: 'MANUAL',
      importedAt: new Date(),
    },
  });

  await prisma.prediction.create({
    data: {
      clientId: client.id,
      type: 'HEALTH_SCORE',
      value: new Prisma.Decimal('75.00'),
      confidence: new Prisma.Decimal('0.85'),
      period: '2025-08',
      factors: { revenueTrend: 'up', expenseControl: 'medium' },
      recommendations: { actions: ['Optimiser coûts fixes', 'Diversifier clients'] },
    },
  });

  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


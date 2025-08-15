-- === Row Level Security (RLS) pour FinanceIQ (multi-tenant) ===
-- Tables concernées : users, clients, financial_data, predictions, integrations, subscriptions
-- NB: on ne met PAS de RLS sur "tenants" (administrable à part).

-- 1) Activer RLS
ALTER TABLE "users"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "predictions"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integrations"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions"  ENABLE ROW LEVEL SECURITY;

-- Si tu veux forcer RLS même pour le propriétaire de la table, dé-commente :
-- ALTER TABLE "users"          FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "clients"        FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "financial_data" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "predictions"    FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "integrations"   FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "subscriptions"  FORCE ROW LEVEL SECURITY;

-- 2) Policies : SELECT/INSERT/UPDATE/DELETE
-- On lit le tenant courant via current_setting('app.tenant_id', true).
-- Le 'true' évite l'erreur si non défini (renvoie NULL) => predicate faux => accès refusé.

-- USERS
DROP POLICY IF EXISTS users_tenant_select ON "users";
CREATE POLICY users_tenant_select ON "users"
  FOR SELECT USING ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS users_tenant_mod ON "users";
CREATE POLICY users_tenant_mod ON "users"
  FOR ALL USING ("tenantId" = current_setting('app.tenant_id', true))
         WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- CLIENTS
DROP POLICY IF EXISTS clients_tenant_select ON "clients";
CREATE POLICY clients_tenant_select ON "clients"
  FOR SELECT USING ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS clients_tenant_mod ON "clients";
CREATE POLICY clients_tenant_mod ON "clients"
  FOR ALL USING ("tenantId" = current_setting('app.tenant_id', true))
         WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- FINANCIAL DATA (via client)
DROP POLICY IF EXISTS fdata_tenant_select ON "financial_data";
CREATE POLICY fdata_tenant_select ON "financial_data"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "financial_data"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS fdata_tenant_mod ON "financial_data";
CREATE POLICY fdata_tenant_mod ON "financial_data"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "financial_data"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "financial_data"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  );

-- PREDICTIONS (via client)
DROP POLICY IF EXISTS preds_tenant_select ON "predictions";
CREATE POLICY preds_tenant_select ON "predictions"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "predictions"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  );

DROP POLICY IF EXISTS preds_tenant_mod ON "predictions";
CREATE POLICY preds_tenant_mod ON "predictions"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "predictions"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "clients" c
            WHERE c.id = "predictions"."clientId"
              AND c."tenantId" = current_setting('app.tenant_id', true))
  );

-- INTEGRATIONS
DROP POLICY IF EXISTS integ_tenant_select ON "integrations";
CREATE POLICY integ_tenant_select ON "integrations"
  FOR SELECT USING ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS integ_tenant_mod ON "integrations";
CREATE POLICY integ_tenant_mod ON "integrations"
  FOR ALL USING ("tenantId" = current_setting('app.tenant_id', true))
         WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS subs_tenant_select ON "subscriptions";
CREATE POLICY subs_tenant_select ON "subscriptions"
  FOR SELECT USING ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS subs_tenant_mod ON "subscriptions";
CREATE POLICY subs_tenant_mod ON "subscriptions"
  FOR ALL USING ("tenantId" = current_setting('app.tenant_id', true))
         WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
-- This is an empty migration.
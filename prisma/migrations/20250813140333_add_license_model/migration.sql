-- CreateTable
CREATE TABLE "public"."licenses" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "seats" INTEGER NOT NULL DEFAULT 5,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,
    "note" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "public"."licenses"("licenseKey");

-- AddForeignKey
ALTER TABLE "public"."licenses" ADD CONSTRAINT "licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

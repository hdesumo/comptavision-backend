/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,email]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_tenantId_email_key" ON "public"."clients"("tenantId", "email");

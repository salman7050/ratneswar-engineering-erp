-- Ratneswar ERP Final V7
-- Owner role, clean expense/payment ledger, monthly salary archive,
-- reusable combined signature+stamp assets, and zero-paid-API local AI job bridge.

-- Final access wording: the old MANAGER login is the business OWNER.
ALTER TYPE "Role" RENAME VALUE 'MANAGER' TO 'OWNER';

-- Company settings: Owner approval + final PO contact + AI bridge defaults.
ALTER TABLE "company_settings" RENAME COLUMN "managerApprovalThreshold" TO "ownerApprovalThreshold";
ALTER TABLE "company_settings"
  ADD COLUMN "poContactName" TEXT NOT NULL DEFAULT 'Salman Perwez',
  ADD COLUMN "poContactEmail" TEXT NOT NULL DEFAULT 'ratneswar.salman@gmail.com',
  ADD COLUMN "poContactPhone" TEXT NOT NULL DEFAULT '7050202473',
  ADD COLUMN "aiMode" TEXT NOT NULL DEFAULT 'QUEUE';

UPDATE "company_settings"
SET "ollamaModel" = 'qwen3:4b'
WHERE "ollamaModel" IN ('llama3.2:3b', 'llama3.2');

UPDATE "company_settings"
SET "defaultPoTerms" = E'Grand Total is inclusive of applicable GST as shown in this Purchase Order.\nPayment terms shall be as stated in this PO / mutually agreed.\nDelivery and technical scope shall be as stated in the approved offer / mutually agreed.'
WHERE "defaultPoTerms" = 'Material must conform to approved specifications. Delivery and payment shall be as stated in this purchase order.';


-- Billing issuer details and site-specific monthly billing cycle.
ALTER TABLE "subcontractors"
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "accountNo" TEXT,
  ADD COLUMN "ifsc" TEXT,
  ADD COLUMN "branch" TEXT;
ALTER TABLE "billing_contracts" ADD COLUMN "cycleStartDay" INTEGER NOT NULL DEFAULT 1;

-- Expenses & Payments
CREATE TYPE "ExpenseTransactionType" AS ENUM (
  'EXPENSE','VENDOR_PAYMENT','PO_PAYMENT','ADVANCE','CASH_EXPENSE','SALARY','CASH_LABOUR','INTERNAL_TRANSFER','REFUND_RECOVERY'
);
CREATE TYPE "ExpenseDocumentStatus" AS ENUM ('NOT_REQUIRED','DOCUMENT_PENDING','AVAILABLE','VERIFIED');

ALTER TABLE "expenses" ALTER COLUMN "siteId" DROP NOT NULL;
ALTER TABLE "expenses"
  ADD COLUMN "businessUnit" TEXT NOT NULL DEFAULT 'Ratneswar Engineering',
  ADD COLUMN "transactionType" "ExpenseTransactionType" NOT NULL DEFAULT 'EXPENSE',
  ADD COLUMN "payee" TEXT,
  ADD COLUMN "paymentMode" TEXT,
  ADD COLUMN "bankReference" TEXT,
  ADD COLUMN "documentUrl" TEXT,
  ADD COLUMN "documentStatus" "ExpenseDocumentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ERP',
  ADD COLUMN "isMajor" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "vendorId" TEXT,
  ADD COLUMN "purchaseOrderId" TEXT;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "expenses_date_idx" ON "expenses"("date");
CREATE INDEX "expenses_businessUnit_idx" ON "expenses"("businessUnit");
CREATE INDEX "expenses_siteId_idx" ON "expenses"("siteId");
CREATE INDEX "expenses_transactionType_idx" ON "expenses"("transactionType");

-- Monthly salary archive / intelligent distribution (the Excel remains the source of truth).
CREATE TYPE "SalaryRecordStatus" AS ENUM ('UPLOADED','FINAL','PAID');
CREATE TYPE "SalaryDistributionType" AS ENUM ('EMPLOYEE_SALARY','CASH_LABOUR','OTHER');

CREATE TABLE "salary_monthly_records" (
  "id" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "salaryFileName" TEXT NOT NULL,
  "salaryFileUrl" TEXT NOT NULL,
  "bankFileName" TEXT,
  "bankFileUrl" TEXT,
  "paymentProofName" TEXT,
  "paymentProofUrl" TEXT,
  "employeeGross" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "bankPayable" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cashLabour" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalManpowerCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "pfEmployee" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "pfEmployer" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "professionalTax" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "advanceRecovery" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" "SalaryRecordStatus" NOT NULL DEFAULT 'UPLOADED',
  "parsedSummary" JSONB,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "salary_monthly_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "salary_monthly_records_periodKey_key" ON "salary_monthly_records"("periodKey");
CREATE INDEX "salary_monthly_records_year_month_idx" ON "salary_monthly_records"("year","month");
ALTER TABLE "salary_monthly_records" ADD CONSTRAINT "salary_monthly_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "salary_site_distributions" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" "SalaryDistributionType" NOT NULL DEFAULT 'EMPLOYEE_SALARY',
  "grossAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "netPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "isCash" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "salaryRecordId" TEXT NOT NULL,
  "siteId" TEXT,
  CONSTRAINT "salary_site_distributions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "salary_site_distributions_salaryRecordId_idx" ON "salary_site_distributions"("salaryRecordId");
CREATE INDEX "salary_site_distributions_siteId_idx" ON "salary_site_distributions"("siteId");
ALTER TABLE "salary_site_distributions" ADD CONSTRAINT "salary_site_distributions_salaryRecordId_fkey" FOREIGN KEY ("salaryRecordId") REFERENCES "salary_monthly_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_site_distributions" ADD CONSTRAINT "salary_site_distributions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Saved combined signature+stamp assets. Signature and stamp are intentionally one image.
CREATE TABLE "signature_assets" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "signature_assets_pkey" PRIMARY KEY ("id")
);

INSERT INTO "signature_assets" ("id","name","imageUrl","isActive","isDefault","sortOrder","createdAt","updatedAt") VALUES
  ('sig-jaydipsinh-owner','Jaydipsinh — Owner','/brand/jaydipsinh-sign-stamp.jpg',true,false,10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('sig-salman-admin','Salman — Admin','/brand/salman-sign-stamp.png',true,false,20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "quotations" ADD COLUMN "includeSignature" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "signatureAssetId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "includeSignature" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "signatureAssetId" TEXT;
ALTER TABLE "purchase_orders" ADD COLUMN "includeSignature" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "signatureAssetId" TEXT;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_signatureAssetId_fkey" FOREIGN KEY ("signatureAssetId") REFERENCES "signature_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_signatureAssetId_fkey" FOREIGN KEY ("signatureAssetId") REFERENCES "signature_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_signatureAssetId_fkey" FOREIGN KEY ("signatureAssetId") REFERENCES "signature_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AI queue: online ERP creates jobs; office-PC worker runs Ollama locally and writes model output back.
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED','PROCESSING','MODEL_DONE','DONE','FAILED');
CREATE TABLE "ai_jobs" (
  "id" TEXT NOT NULL,
  "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
  "request" JSONB NOT NULL,
  "rawResponse" TEXT,
  "finalResponse" JSONB,
  "error" TEXT,
  "model" TEXT,
  "pickedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_jobs_status_createdAt_idx" ON "ai_jobs"("status","createdAt");
CREATE INDEX "ai_jobs_userId_createdAt_idx" ON "ai_jobs"("userId","createdAt");
ALTER TABLE "ai_jobs" ADD CONSTRAINT "ai_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

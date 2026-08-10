-- Ratneswar ERP professional automation, structured billing and secure document numbering

CREATE TYPE "SiteOwnership" AS ENUM ('DIRECT', 'SUBCONTRACT');
CREATE TYPE "BillingMode" AS ENUM ('ON_DEMAND', 'MONTHLY', 'MILESTONE');
CREATE TYPE "BillingPartyType" AS ENUM ('CLIENT', 'SUBCONTRACTOR');
CREATE TYPE "BillingLineCategory" AS ENUM ('O_AND_M', 'MAINTENANCE', 'TESTING', 'INSTALLATION', 'MATERIAL', 'OTHER');
CREATE TYPE "InvoiceType" AS ENUM ('STANDARD', 'MONTHLY_SITE', 'SUBCONTRACT');
CREATE TYPE "DocumentKind" AS ENUM ('QUOTATION', 'INVOICE', 'PURCHASE_ORDER', 'WORK_ORDER');

CREATE TABLE "clients" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "legalName" TEXT,
  "gstin" TEXT,
  "pan" TEXT,
  "address" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "contactPerson" TEXT,
  "state" TEXT NOT NULL DEFAULT 'Gujarat',
  "stateCode" TEXT NOT NULL DEFAULT '24',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractors" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "legalName" TEXT,
  "gstin" TEXT,
  "pan" TEXT,
  "address" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "contactPerson" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sites"
  ADD COLUMN "siteCode" TEXT,
  ADD COLUMN "ownership" "SiteOwnership" NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN "billingMode" "BillingMode" NOT NULL DEFAULT 'ON_DEMAND',
  ADD COLUMN "monthlyBillingEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "defaultDestination" TEXT,
  ADD COLUMN "defaultPaymentTerms" TEXT,
  ADD COLUMN "defaultTenderNo" TEXT,
  ADD COLUMN "defaultBuyerOrderNo" TEXT,
  ADD COLUMN "defaultBuyerOrderDate" TIMESTAMP(3),
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "clientId" TEXT,
  ADD COLUMN "subcontractorId" TEXT;

CREATE TABLE "billing_contracts" (
  "id" TEXT NOT NULL,
  "contractNo" TEXT,
  "title" TEXT NOT NULL,
  "billToType" "BillingPartyType" NOT NULL DEFAULT 'CLIENT',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "paymentTerms" TEXT,
  "creditDays" INTEGER NOT NULL DEFAULT 30,
  "destination" TEXT,
  "tenderNo" TEXT,
  "buyerOrderNo" TEXT,
  "buyerOrderDate" TIMESTAMP(3),
  "gstType" "GstType" NOT NULL DEFAULT 'SGST_CGST',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  "clientId" TEXT,
  "subcontractorId" TEXT,
  CONSTRAINT "billing_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_line_templates" (
  "id" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "category" "BillingLineCategory" NOT NULL DEFAULT 'O_AND_M',
  "description" TEXT NOT NULL,
  "testingDescription" TEXT,
  "hsnCode" TEXT NOT NULL DEFAULT '998717',
  "unit" TEXT NOT NULL DEFAULT 'Month',
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "billingContractId" TEXT NOT NULL,
  CONSTRAINT "billing_line_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_sequences" (
  "id" TEXT NOT NULL,
  "kind" "DocumentKind" NOT NULL,
  "financialYear" TEXT NOT NULL,
  "nextValue" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "quotations" ADD COLUMN "clientId" TEXT;

ALTER TABLE "invoices"
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "invoiceType" "InvoiceType" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "billingMonth" TEXT,
  ADD COLUMN "periodFrom" TIMESTAMP(3),
  ADD COLUMN "periodTo" TIMESTAMP(3),
  ADD COLUMN "buyerPan" TEXT,
  ADD COLUMN "placeOfSupply" TEXT,
  ADD COLUMN "referenceNo" TEXT,
  ADD COLUMN "referenceDate" TIMESTAMP(3),
  ADD COLUMN "buyerOrderDate" TIMESTAMP(3),
  ADD COLUMN "destination" TEXT,
  ADD COLUMN "tenderNo" TEXT,
  ADD COLUMN "dispatchThrough" TEXT,
  ADD COLUMN "termsOfDelivery" TEXT,
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "clientId" TEXT,
  ADD COLUMN "subcontractorId" TEXT,
  ADD COLUMN "billingContractId" TEXT;

ALTER TABLE "invoice_items"
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "workCategory" "BillingLineCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "testingDescription" TEXT,
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'Nos',
  ADD COLUMN "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
  ADD COLUMN "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");
CREATE INDEX "clients_name_idx" ON "clients"("name");
CREATE UNIQUE INDEX "subcontractors_code_key" ON "subcontractors"("code");
CREATE INDEX "subcontractors_name_idx" ON "subcontractors"("name");
CREATE UNIQUE INDEX "sites_siteCode_key" ON "sites"("siteCode");
CREATE INDEX "sites_ownership_idx" ON "sites"("ownership");
CREATE INDEX "sites_clientId_idx" ON "sites"("clientId");
CREATE INDEX "sites_subcontractorId_idx" ON "sites"("subcontractorId");
CREATE UNIQUE INDEX "billing_contracts_contractNo_key" ON "billing_contracts"("contractNo");
CREATE INDEX "billing_contracts_siteId_active_idx" ON "billing_contracts"("siteId", "active");
CREATE UNIQUE INDEX "document_sequences_kind_financialYear_key" ON "document_sequences"("kind", "financialYear");
CREATE UNIQUE INDEX "invoices_billingContractId_billingMonth_key" ON "invoices"("billingContractId", "billingMonth");
CREATE INDEX "invoices_invoiceType_date_idx" ON "invoices"("invoiceType", "date");
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX "invoices_subcontractorId_idx" ON "invoices"("subcontractorId");

ALTER TABLE "sites" ADD CONSTRAINT "sites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sites" ADD CONSTRAINT "sites_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_contracts" ADD CONSTRAINT "billing_contracts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_contracts" ADD CONSTRAINT "billing_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_contracts" ADD CONSTRAINT "billing_contracts_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_line_templates" ADD CONSTRAINT "billing_line_templates_billingContractId_fkey" FOREIGN KEY ("billingContractId") REFERENCES "billing_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "subcontractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billingContractId_fkey" FOREIGN KEY ("billingContractId") REFERENCES "billing_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

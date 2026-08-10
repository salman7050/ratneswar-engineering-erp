-- Quotation-first V6: smart drafting, flexible engineering quantities and manager approval.
CREATE TYPE "QuotationRisk" AS ENUM ('NORMAL', 'HIGH_RISK');
CREATE TYPE "QuotationApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "QuotationCalculationMode" AS ENUM ('QTY_RATE', 'QTY_SECONDARY_RATE', 'FIXED');

ALTER TABLE "quotations"
  ADD COLUMN "referenceNo" TEXT,
  ADD COLUMN "recipientDesignation" TEXT,
  ADD COLUMN "recipientDepartment" TEXT,
  ADD COLUMN "subject" TEXT NOT NULL DEFAULT 'Quotation',
  ADD COLUMN "introduction" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "terms" TEXT,
  ADD COLUMN "aiDrafted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "riskLevel" "QuotationRisk" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "riskReason" TEXT,
  ADD COLUMN "approvalStatus" "QuotationApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "approvalNote" TEXT,
  ADD COLUMN "approvalRequestedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" TEXT;

UPDATE "quotations"
SET "referenceNo" = 'RE/QTN/' ||
  CASE WHEN EXTRACT(MONTH FROM "date") >= 4
    THEN TO_CHAR("date", 'YY') || '-' || TO_CHAR("date" + INTERVAL '1 year', 'YY')
    ELSE TO_CHAR("date" - INTERVAL '1 year', 'YY') || '-' || TO_CHAR("date", 'YY')
  END || '/' || "quoteNo"
WHERE "referenceNo" IS NULL;

ALTER TABLE "quotations" ALTER COLUMN "referenceNo" SET NOT NULL;
CREATE UNIQUE INDEX "quotations_referenceNo_key" ON "quotations"("referenceNo");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotation_items"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'Nos',
  ADD COLUMN "secondaryQuantity" DECIMAL(10,2),
  ADD COLUMN "secondaryUnit" TEXT,
  ADD COLUMN "rateBasis" TEXT,
  ADD COLUMN "calculationMode" "QuotationCalculationMode" NOT NULL DEFAULT 'QTY_RATE';

ALTER TABLE "company_settings"
  ADD COLUMN "quotationRefPrefix" TEXT NOT NULL DEFAULT 'RE/QTN',
  ADD COLUMN "quotationValidityDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "managerApprovalThreshold" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Existing V5 quotation wording remains valid until edited by the new smart editor.
UPDATE "quotations" SET "subject" = CASE WHEN COALESCE(NULLIF(TRIM("scope"), ''), '') <> '' THEN "scope" ELSE 'Quotation' END WHERE "subject" = 'Quotation';


UPDATE "company_settings"
SET "defaultQuoteTerms" = E'GST will be charged as shown in the quotation.\nQuotation is valid for 30 days from the date of issue.\nWork will be executed within mutually agreed timelines.'
WHERE "defaultQuoteTerms" IN (
  'Prices are valid for 30 days. Work will be executed as per mutually approved scope and schedule.',
  'The above rates are exclusive of GST unless stated otherwise.\nQuotation is valid for 30 days from the date of issue.\nWork will be executed within mutually agreed timelines.'
);

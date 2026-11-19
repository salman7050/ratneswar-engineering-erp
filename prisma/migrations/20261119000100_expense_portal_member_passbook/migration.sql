-- Employee expense links, approval queue and member passbook

ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'FOOD';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'SITE_TRANSPORT';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'OFFICE';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'MARKETING';

CREATE TYPE "ExpenseSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "MemberPassbookEntryType" AS ENUM ('ADVANCE', 'EXPENSE', 'REFUND', 'ADJUSTMENT');

CREATE TABLE "expense_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "roleLabel" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL DEFAULT 'Ratneswar Engineering',
    "area" TEXT,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "expense_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_submissions" (
    "id" TEXT NOT NULL,
    "status" "ExpenseSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,
    "reviewedById" TEXT,
    CONSTRAINT "expense_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_submission_items" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "siteName" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "reference" TEXT,
    "receiptUrl" TEXT,
    "reimbursementRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionId" TEXT NOT NULL,
    "siteId" TEXT,
    "expenseId" TEXT,
    CONSTRAINT "expense_submission_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member_passbook_entries" (
    "id" TEXT NOT NULL,
    "type" "MemberPassbookEntryType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reference" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "siteId" TEXT,
    "sourceExpenseId" TEXT,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "member_passbook_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_members_token_key" ON "expense_members"("token");
CREATE INDEX "expense_members_isActive_idx" ON "expense_members"("isActive");
CREATE INDEX "expense_submissions_status_submittedAt_idx" ON "expense_submissions"("status", "submittedAt");
CREATE INDEX "expense_submissions_memberId_submittedAt_idx" ON "expense_submissions"("memberId", "submittedAt");
CREATE UNIQUE INDEX "expense_submission_items_expenseId_key" ON "expense_submission_items"("expenseId");
CREATE INDEX "expense_submission_items_submissionId_idx" ON "expense_submission_items"("submissionId");
CREATE INDEX "expense_submission_items_siteId_idx" ON "expense_submission_items"("siteId");
CREATE UNIQUE INDEX "member_passbook_entries_sourceExpenseId_key" ON "member_passbook_entries"("sourceExpenseId");
CREATE INDEX "member_passbook_entries_memberId_date_idx" ON "member_passbook_entries"("memberId", "date");
CREATE INDEX "member_passbook_entries_type_date_idx" ON "member_passbook_entries"("type", "date");

ALTER TABLE "expense_members" ADD CONSTRAINT "expense_members_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_submissions" ADD CONSTRAINT "expense_submissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "expense_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_submissions" ADD CONSTRAINT "expense_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_submission_items" ADD CONSTRAINT "expense_submission_items_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "expense_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_submission_items" ADD CONSTRAINT "expense_submission_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_submission_items" ADD CONSTRAINT "expense_submission_items_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_passbook_entries" ADD CONSTRAINT "member_passbook_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "expense_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_passbook_entries" ADD CONSTRAINT "member_passbook_entries_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_passbook_entries" ADD CONSTRAINT "member_passbook_entries_sourceExpenseId_fkey" FOREIGN KEY ("sourceExpenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_passbook_entries" ADD CONSTRAINT "member_passbook_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ratneswar Engineering ERP baseline schema
-- Generated from prisma/schema.prisma. Do not edit by hand; regenerate with scripts/generate_initial_migration.py.

CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'STORE', 'HR');

CREATE TYPE "SiteType" AS ENUM ('SUBSTATION', 'HYDRO', 'PUMPING_STATION', 'SOLAR', 'OM_CONTRACT', 'EPC', 'OTHER');

CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

CREATE TYPE "SiteRole" AS ENUM ('SITE_ENGINEER', 'SITE_MANAGER', 'SUPERVISOR');

CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE');

CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING');

CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE');

CREATE TYPE "BreakdownSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "TimelineCategory" AS ENUM ('MILESTONE', 'ISSUE', 'VISIT', 'GENERAL');

CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'UNDER_MAINTENANCE', 'RETIRED');

CREATE TYPE "TenderStatus" AS ENUM ('PREPARING', 'SUBMITTED', 'WON', 'LOST', 'CANCELLED', 'COMPLETED');

CREATE TYPE "EmdStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REFUNDED', 'FORFEITED');

CREATE TYPE "TenderApprovalStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "DocumentCategory" AS ENUM ('INSURANCE', 'CERTIFICATE', 'WORK_ORDER', 'AGREEMENT', 'CONTRACT', 'INVOICE_BILL', 'QUOTATION', 'TESTING_REPORT', 'REPORT', 'DRAWING', 'PHOTO', 'STAFF_DOCUMENT', 'ATTENDANCE', 'TENDER_DOCUMENT', 'OTHER');

CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIAL', 'LABOUR', 'FUEL', 'TRANSPORT', 'EQUIPMENT', 'MISC');

CREATE TYPE "LeaveType" AS ENUM ('SICK', 'CASUAL', 'EARNED', 'UNPAID');

CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "PerformanceRating" AS ENUM ('BELOW_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'EXCEEDS_EXPECTATIONS', 'OUTSTANDING');

CREATE TYPE "SalaryStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TYPE "GstType" AS ENUM ('SGST_CGST', 'IGST');

CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'GENERATED', 'PAID', 'OVERDUE');

CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED', 'REJECTED');

CREATE TYPE "POApprovalStage" AS ENUM ('NONE', 'ENGINEER', 'MANAGER', 'OWNER', 'DONE');

CREATE TYPE "POApprovalAction" AS ENUM ('APPROVED', 'REJECTED');

CREATE TYPE "WOStatus" AS ENUM ('DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "StoreType" AS ENUM ('CENTRAL', 'SITE');

CREATE TYPE "StockTxnType" AS ENUM ('RECEIVE', 'ISSUE');

CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TYPE "TaskCategory" AS ENUM ('SITE_VISIT', 'INVOICE', 'QUOTATION', 'TENDER', 'FOLLOW_UP', 'MATERIAL_ORDER', 'MEETING', 'DOCUMENTATION', 'MAINTENANCE', 'ADMIN', 'OTHER');

CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED');

CREATE TYPE "FollowUpType" AS ENUM ('CALL_VENDOR', 'CALL_CLIENT', 'PAYMENT_REMINDER', 'QUOTATION_REMINDER', 'TRANSFORMER_TESTING', 'INSPECTION', 'OTHER');

CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'DONE');

CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "SiteVisitStatus" AS ENUM ('PLANNED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

CREATE TYPE "ReminderType" AS ENUM ('AMC_EXPIRY', 'INSURANCE_EXPIRY', 'TENDER_SUBMISSION', 'INVOICE_DUE', 'SALARY_DATE', 'PF_DUE', 'GST_RETURN', 'SITE_VISIT', 'MAINTENANCE', 'CALIBRATION', 'VEHICLE_SERVICE', 'OTHER');

CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'DONE', 'DISMISSED');

CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "authId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "role" "Role" NOT NULL DEFAULT 'ENGINEER'::"Role",
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_authId_key" UNIQUE ("authId"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE TABLE "sites" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "type" "SiteType" NOT NULL,
  "client" TEXT NOT NULL,
  "capacity" TEXT,
  "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE'::"SiteStatus",
  "coverPhotoUrl" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_photos" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "site_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "site_engineers" (
  "id" TEXT NOT NULL,
  "role" "SiteRole" NOT NULL DEFAULT 'SITE_ENGINEER'::"SiteRole",
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "site_engineers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_engineers_siteId_userId_key" UNIQUE ("siteId", "userId")
);

CREATE TABLE "attendance" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT'::"AttendanceStatus",
  "checkIn" TEXT,
  "checkOut" TEXT,
  "notes" TEXT,
  "siteId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attendance_siteId_employeeId_date_key" UNIQUE ("siteId", "employeeId", "date")
);

CREATE TABLE "insurances" (
  "id" TEXT NOT NULL,
  "policyNo" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "coverageAmount" DECIMAL(14,2) NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "amcs" (
  "id" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE'::"ContractStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "amcs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warranties" (
  "id" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "terms" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "maintenance_logs" (
  "id" TEXT NOT NULL,
  "type" "MaintenanceType" NOT NULL DEFAULT 'PREVENTIVE'::"MaintenanceType",
  "description" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "cost" DECIMAL(10,2),
  "nextDueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "breakdown_logs" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "BreakdownSeverity" NOT NULL DEFAULT 'MEDIUM'::"BreakdownSeverity",
  "reportedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "downtimeHours" DECIMAL(6,2),
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "breakdown_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_events" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "TimelineCategory" NOT NULL DEFAULT 'GENERAL'::"TimelineCategory",
  "eventDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  "tenderId" TEXT,
  "createdById" TEXT,
  CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "materials" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "ratePerUnit" DECIMAL(10,2) NOT NULL,
  "receivedDate" TIMESTAMP(3) NOT NULL,
  "supplier" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "unit" TEXT NOT NULL,
  "minThreshold" DECIMAL(12,2),
  "location" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT NOT NULL,
  CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assets" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "assetTag" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "location" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "purchaseValue" DECIMAL(12,2),
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE'::"AssetStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  CONSTRAINT "assets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assets_assetTag_key" UNIQUE ("assetTag")
);

CREATE TABLE "tenders" (
  "id" TEXT NOT NULL,
  "tenderNo" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "estimatedValue" DECIMAL(14,2) NOT NULL,
  "emdAmount" DECIMAL(14,2),
  "emdDeadline" TIMESTAMP(3),
  "emdStatus" "EmdStatus" NOT NULL DEFAULT 'PENDING'::"EmdStatus",
  "emdSubmittedDate" TIMESTAMP(3),
  "emdRefundDate" TIMESTAMP(3),
  "submissionDate" TIMESTAMP(3),
  "status" "TenderStatus" NOT NULL DEFAULT 'PREPARING'::"TenderStatus",
  "notes" TEXT,
  "approvalStatus" "TenderApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED'::"TenderApprovalStatus",
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvalNotes" TEXT,
  "winningBidAmount" DECIMAL(14,2),
  "competitorNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT,
  "ownerId" TEXT,
  CONSTRAINT "tenders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenders_tenderNo_key" UNIQUE ("tenderNo")
);

CREATE TABLE "tender_boq_items" (
  "id" TEXT NOT NULL,
  "slNo" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "rate" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "tenderId" TEXT NOT NULL,
  CONSTRAINT "tender_boq_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  "tenderId" TEXT,
  "employeeId" TEXT,
  "poId" TEXT,
  "uploadedById" TEXT NOT NULL,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
  "id" TEXT NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employees" (
  "id" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "department" TEXT,
  "photoUrl" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "pan" TEXT,
  "aadhaar" TEXT,
  "pfNumber" TEXT,
  "esicNumber" TEXT,
  "pfEnrolled" BOOLEAN NOT NULL DEFAULT TRUE,
  "esicEnrolled" BOOLEAN NOT NULL DEFAULT FALSE,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "emergencyContactRelation" TEXT,
  "bankAccount" TEXT,
  "ifsc" TEXT,
  "basic" DECIMAL(10,2) NOT NULL,
  "hra" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "otherAllowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  CONSTRAINT "employees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employees_employeeCode_key" UNIQUE ("employeeCode")
);

CREATE TABLE "leave_requests" (
  "id" TEXT NOT NULL,
  "type" "LeaveType" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "days" DECIMAL(4,1) NOT NULL,
  "reason" TEXT,
  "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING'::"LeaveStatus",
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_records" (
  "id" TEXT NOT NULL,
  "fromDesignation" TEXT NOT NULL,
  "toDesignation" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "promotion_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "increment_records" (
  "id" TEXT NOT NULL,
  "previousBasic" DECIMAL(10,2) NOT NULL,
  "newBasic" DECIMAL(10,2) NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "increment_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "performance_reviews" (
  "id" TEXT NOT NULL,
  "reviewPeriod" TEXT NOT NULL,
  "rating" "PerformanceRating" NOT NULL,
  "strengths" TEXT,
  "improvements" TEXT,
  "reviewedBy" TEXT NOT NULL,
  "reviewDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employeeId" TEXT NOT NULL,
  CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salary_slips" (
  "id" TEXT NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "presentDays" INTEGER NOT NULL,
  "totalDays" INTEGER NOT NULL,
  "otHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "otRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "advanceDeduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "grossPay" DECIMAL(10,2) NOT NULL,
  "pfEmployee" DECIMAL(10,2) NOT NULL,
  "pfEmployer" DECIMAL(10,2) NOT NULL,
  "professionalTax" DECIMAL(10,2) NOT NULL,
  "netPay" DECIMAL(10,2) NOT NULL,
  "status" "SalaryStatus" NOT NULL DEFAULT 'DRAFT'::"SalaryStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employeeId" TEXT NOT NULL,
  "approvedById" TEXT,
  CONSTRAINT "salary_slips_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "salary_slips_employeeId_month_year_key" UNIQUE ("employeeId", "month", "year")
);

CREATE TABLE "quotations" (
  "id" TEXT NOT NULL,
  "quoteNo" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "client" TEXT NOT NULL,
  "clientAddress" TEXT,
  "clientGstin" TEXT,
  "scope" TEXT NOT NULL,
  "gstType" "GstType" NOT NULL DEFAULT 'SGST_CGST'::"GstType",
  "taxableValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(14,2) NOT NULL,
  "validTill" TIMESTAMP(3),
  "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT'::"QuotationStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT,
  "tenderId" TEXT,
  "bankAccountId" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "quotations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quotations_quoteNo_key" UNIQUE ("quoteNo")
);

CREATE TABLE "quotation_items" (
  "id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "hsnCode" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "rate" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "quotationId" TEXT NOT NULL,
  CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
  "id" TEXT NOT NULL,
  "invoiceNo" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "buyerName" TEXT NOT NULL,
  "buyerAddress" TEXT,
  "buyerGstin" TEXT,
  "poRefNo" TEXT,
  "paymentTerms" TEXT,
  "gstType" "GstType" NOT NULL DEFAULT 'SGST_CGST'::"GstType",
  "taxableValue" DECIMAL(14,2) NOT NULL,
  "taxAmount" DECIMAL(14,2) NOT NULL,
  "grandTotal" DECIMAL(14,2) NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT'::"InvoiceStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  "tenderId" TEXT,
  "bankAccountId" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_invoiceNo_key" UNIQUE ("invoiceNo")
);

CREATE TABLE "invoice_items" (
  "id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "hsnCode" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "rate" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "invoiceId" TEXT NOT NULL,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_records" (
  "id" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "mode" TEXT NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invoiceId" TEXT NOT NULL,
  CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_orders" (
  "id" TEXT NOT NULL,
  "poNo" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "POStatus" NOT NULL DEFAULT 'DRAFT'::"POStatus",
  "refNumber" TEXT,
  "quotationRef" TEXT,
  "indentRef" TEXT,
  "department" TEXT,
  "raisedBy" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM'::"TaskPriority",
  "projectName" TEXT,
  "vendorId" TEXT,
  "vendorName" TEXT NOT NULL,
  "vendorCode" TEXT,
  "vendorGstin" TEXT,
  "vendorPan" TEXT,
  "vendorAddress" TEXT,
  "vendorEmail" TEXT,
  "vendorPhone" TEXT,
  "vendorContactPerson" TEXT,
  "deliveryAddress" TEXT,
  "deliveryContactPerson" TEXT,
  "deliveryDate" TIMESTAMP(3),
  "expectedDelivery" TIMESTAMP(3),
  "gstType" "GstType" NOT NULL DEFAULT 'SGST_CGST'::"GstType",
  "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "taxableValue" DECIMAL(14,2) NOT NULL,
  "cgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "sgstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "igstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(14,2) NOT NULL,
  "roundOff" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(14,2) NOT NULL,
  "advancePercent" DECIMAL(5,2),
  "creditDays" INTEGER,
  "paymentMethod" TEXT,
  "bankAccountId" TEXT,
  "deliverySchedule" TEXT,
  "packing" TEXT,
  "transportation" TEXT,
  "insurance" TEXT,
  "warranty" TEXT,
  "inspectionTerms" TEXT,
  "specialInstructions" TEXT,
  "notes" TEXT,
  "terms" TEXT,
  "approvalStage" "POApprovalStage" NOT NULL DEFAULT 'NONE'::"POApprovalStage",
  "rejectedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_orders_poNo_key" UNIQUE ("poNo")
);

CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" ("status");
CREATE INDEX "purchase_orders_vendorId_idx" ON "purchase_orders" ("vendorId");

CREATE TABLE "purchase_order_items" (
  "id" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "itemCode" TEXT,
  "description" TEXT NOT NULL,
  "hsnCode" TEXT NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'Nos',
  "quantity" DECIMAL(10,2) NOT NULL,
  "rate" DECIMAL(12,2) NOT NULL,
  "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
  "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(14,2) NOT NULL,
  "remarks" TEXT,
  "poId" TEXT NOT NULL,
  CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "po_approvals" (
  "id" TEXT NOT NULL,
  "stage" "POApprovalStage" NOT NULL,
  "action" "POApprovalAction" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "poId" TEXT NOT NULL,
  "byId" TEXT NOT NULL,
  CONSTRAINT "po_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "po_comments" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "poId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "po_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_orders" (
  "id" TEXT NOT NULL,
  "woNo" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "client" TEXT NOT NULL,
  "scopeOfWork" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "value" DECIMAL(14,2) NOT NULL,
  "terms" TEXT,
  "status" "WOStatus" NOT NULL DEFAULT 'DRAFT'::"WOStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  "tenderId" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_orders_woNo_key" UNIQUE ("woNo")
);

CREATE TABLE "bank_accounts" (
  "id" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountNo" TEXT NOT NULL,
  "ifsc" TEXT NOT NULL,
  "branch" TEXT NOT NULL,
  "upiId" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_settings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "legalName" TEXT NOT NULL DEFAULT 'Ratneswar Engineering',
  "gstin" TEXT NOT NULL DEFAULT '24ABKFR8021K1ZZ',
  "address" TEXT NOT NULL DEFAULT 'Office No. 19, Sanghvi Square Complex, Salarinaka, Rapar–Kutch, Gujarat – 370165',
  "phone" TEXT NOT NULL DEFAULT '84010 50053 / 78019 56980',
  "email" TEXT NOT NULL DEFAULT 'ratneswarengineering@gmail.com',
  "signatoryName" TEXT NOT NULL DEFAULT 'Authorised Signatory',
  "signatureUrl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendors" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "gstin" TEXT,
  "pan" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vendors_code_key" UNIQUE ("code")
);

CREATE TABLE "stores" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "StoreType" NOT NULL DEFAULT 'CENTRAL'::"StoreType",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "siteId" TEXT,
  CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "reorderLevel" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "standardRate" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_items_sku_key" UNIQUE ("sku")
);

CREATE TABLE "stock_transactions" (
  "id" TEXT NOT NULL,
  "type" "StockTxnType" NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "rate" DECIMAL(10,2),
  "date" TIMESTAMP(3) NOT NULL,
  "referenceNo" TEXT,
  "issuedTo" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stockItemId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "vendorId" TEXT,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM'::"TaskPriority",
  "category" "TaskCategory" NOT NULL DEFAULT 'OTHER'::"TaskCategory",
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING'::"TaskStatus",
  "progress" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "dueTime" TEXT,
  "reminderAt" TIMESTAMP(3),
  "attachmentUrl" TEXT,
  "notes" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT,
  "assignedToId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_assignedToId_status_idx" ON "tasks" ("assignedToId", "status");
CREATE INDEX "tasks_dueDate_idx" ON "tasks" ("dueDate");

CREATE TABLE "task_comments" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "follow_ups" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "FollowUpType" NOT NULL DEFAULT 'OTHER'::"FollowUpType",
  "dueDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING'::"FollowUpStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT,
  "assignedToId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "follow_ups_assignedToId_status_dueDate_idx" ON "follow_ups" ("assignedToId", "status", "dueDate");

CREATE TABLE "quick_notes" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "quick_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quick_notes_userId_idx" ON "quick_notes" ("userId");

CREATE TABLE "meetings" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "time" TEXT NOT NULL,
  "withPerson" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED'::"MeetingStatus",
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meetings_createdById_date_idx" ON "meetings" ("createdById", "date");

CREATE TABLE "site_visits" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "time" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "status" "SiteVisitStatus" NOT NULL DEFAULT 'PLANNED'::"SiteVisitStatus",
  "checkInAt" TIMESTAMP(3),
  "checkOutAt" TIMESTAMP(3),
  "checkInLat" DOUBLE PRECISION,
  "checkInLng" DOUBLE PRECISION,
  "checkOutLat" DOUBLE PRECISION,
  "checkOutLng" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "siteId" TEXT NOT NULL,
  "engineerId" TEXT NOT NULL,
  CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_visits_engineerId_date_idx" ON "site_visits" ("engineerId", "date");

CREATE TABLE "smart_reminders" (
  "id" TEXT NOT NULL,
  "type" "ReminderType" NOT NULL DEFAULT 'OTHER'::"ReminderType",
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "recurrence" "RecurrenceType" NOT NULL DEFAULT 'NONE'::"RecurrenceType",
  "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE'::"ReminderStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "smart_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "smart_reminders_status_dueDate_idx" ON "smart_reminders" ("status", "dueDate");

CREATE TABLE "eod_reports" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "completedWork" TEXT NOT NULL,
  "pendingWork" TEXT,
  "tomorrowPlan" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "eod_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "eod_reports_userId_date_key" UNIQUE ("userId", "date")
);

ALTER TABLE "site_photos" ADD CONSTRAINT "site_photos_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_engineers" ADD CONSTRAINT "site_engineers_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_engineers" ADD CONSTRAINT "site_engineers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "amcs" ADD CONSTRAINT "amcs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "breakdown_logs" ADD CONSTRAINT "breakdown_logs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "materials" ADD CONSTRAINT "materials_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tender_boq_items" ADD CONSTRAINT "tender_boq_items_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "increment_records" ADD CONSTRAINT "increment_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "salary_slips" ADD CONSTRAINT "salary_slips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "salary_slips" ADD CONSTRAINT "salary_slips_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "po_approvals" ADD CONSTRAINT "po_approvals_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "po_approvals" ADD CONSTRAINT "po_approvals_byId_fkey" FOREIGN KEY ("byId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "po_comments" ADD CONSTRAINT "po_comments_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "po_comments" ADD CONSTRAINT "po_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "smart_reminders" ADD CONSTRAINT "smart_reminders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "eod_reports" ADD CONSTRAINT "eod_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Retire legacy signature/stamp assets that were bundled under /public.
-- Signatures must be uploaded through ERP Settings into private Supabase Storage
-- and served with short-lived signed URLs.
--
-- NOTE: Prisma model SignatureAsset is mapped to the PostgreSQL table
-- "signature_assets" via @@map("signature_assets").
UPDATE "signature_assets"
SET "isActive" = false,
    "isDefault" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "imageUrl" LIKE '/brand/%sign%'
   OR "imageUrl" LIKE '/brand/%signature%';

-- Retire legacy signature/stamp assets that were bundled under /public.
-- Signatures must be uploaded through ERP Settings into the private Supabase
-- `documents` bucket and served with short-lived signed URLs.
UPDATE "SignatureAsset"
SET "isActive" = false,
    "isDefault" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "imageUrl" LIKE '/brand/%sign%'
   OR "imageUrl" LIKE '/brand/%signature%';

-- Cloud V8: no local AI runtime. Keep legacy columns/table for migration safety,
-- but change defaults and existing singleton settings to cloud values.
ALTER TABLE "company_settings" ALTER COLUMN "aiMode" SET DEFAULT 'CLOUD';
ALTER TABLE "company_settings" ALTER COLUMN "aiProvider" SET DEFAULT 'CLOUDFLARE';
ALTER TABLE "company_settings" ALTER COLUMN "ollamaBaseUrl" SET DEFAULT 'https://api.cloudflare.com/client/v4';
ALTER TABLE "company_settings" ALTER COLUMN "ollamaModel" SET DEFAULT '@cf/zai-org/glm-4.7-flash';

UPDATE "company_settings"
SET "aiMode" = 'CLOUD',
    "aiProvider" = 'CLOUDFLARE',
    "ollamaBaseUrl" = 'https://api.cloudflare.com/client/v4',
    "ollamaModel" = '@cf/zai-org/glm-4.7-flash'
WHERE "id" = 'singleton';

# Ratneswar Engineering ERP — Cloud V8

Cloud-first Owner/Admin ERP for Ratneswar Engineering.

## Runtime architecture
- **Cloudflare Workers**: Next.js hosting/builds through OpenNext.
- **Supabase**: shared Postgres database, email/password authentication, private document storage.
- **Cloudflare Workers AI**: Ratneswar AI in the cloud; no office-PC AI worker or Ollama runtime.

Owner and Admin always use the same cloud database. Changes are stored centrally and dashboard pages auto-refresh from the cloud.

## Access
Only `OWNER` and `ADMIN` application roles can sign in. Authentication uses Supabase email + password. Public self-sign-up is not exposed. Forgot/reset password flow is included.

## Deployment
This version is prepared for Cloudflare Workers through OpenNext, with Supabase providing the shared PostgreSQL database, authentication and storage.

Build command: `npm run cf:build`
Deploy command: `npx wrangler deploy`

The Cloudflare build runs `prisma generate` and the OpenNext build. It does not automatically run `prisma migrate deploy`; database migrations are deliberately separate.

Read `CLOUDFLARE_DEPLOYMENT.md` and `CLOUD_DEPLOY_ONLY.txt` for the exact setup.

## Important
Do not use the old V7 Windows/local setup scripts. Cloud V8 is intended to run online; user computers and mobile devices are clients only.

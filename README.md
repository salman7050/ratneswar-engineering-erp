# Ratneswar Engineering ERP — Cloud V8

Cloud-first Owner/Admin ERP for Ratneswar Engineering.

## Runtime architecture
- **Netlify**: Next.js application hosting/builds.
- **Supabase**: shared Postgres database, email/password authentication, private document storage.
- **Cloudflare Workers AI**: Ratneswar AI in the cloud; no office-PC AI worker or Ollama runtime.

Owner and Admin always use the same cloud database. Changes are stored centrally and dashboard pages auto-refresh from the cloud.

## Access
Only `OWNER` and `ADMIN` application roles can sign in. Authentication uses Supabase email + password. Public self-sign-up is not exposed. Forgot/reset password flow is included.

## Deployment
Read `CLOUD_DEPLOY_ONLY.txt`. Add `.env.cloud.example` values to Netlify environment variables and deploy from Git. Netlify runs Prisma migrations and `next build` in its cloud build environment.

## Important
Do not use the old V7 Windows/local setup scripts. Cloud V8 is intended to run online; user computers and mobile devices are clients only.

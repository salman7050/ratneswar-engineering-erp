# Ratneswar ERP — Cloudflare Workers Deployment

This build is prepared for Cloudflare Workers with OpenNext. Supabase remains the shared database, authentication and private-file service, so existing business data is not moved or deleted.

## Recommended plan

Use **Cloudflare Workers Paid**. The minimum is about USD 5/month. The free Worker has a 10 ms CPU limit and a 3 MB compressed bundle limit, which is too tight for a secure server-rendered ERP with Prisma.

## 1. Push this project to GitHub

If the repository contains the outer `RatneswarERP` folder, the application root is:

```text
RatneswarERP/ratneswar-engineering-erp-cloud-v8
```

## 2. Create the Cloudflare Worker

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages** and create/import an application from GitHub.
3. Select the Ratneswar ERP repository and production branch.
4. Set the root directory to the application root shown above when required.
5. Use these commands:

```text
Build command:  npm run cf:build
Deploy command: npx wrangler deploy
```

## 3. Add build variables and secrets

Copy every value from `.env.cloud.example` into Cloudflare **Build Variables and Secrets**. Use the existing real values from Netlify; do not paste secrets into source code.

Required names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_AI_API_TOKEN
CLOUDFLARE_AI_MODEL
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
```

For the first build, set `NEXT_PUBLIC_APP_URL` to the expected Workers URL:

```text
https://ratneswar-engineering-erp.YOUR-SUBDOMAIN.workers.dev
```

After Cloudflare shows the final URL, correct this variable if necessary and redeploy.

## 4. Update Supabase authentication URLs

In Supabase Dashboard → Authentication → URL Configuration:

```text
Site URL: https://YOUR-FINAL-WORKERS-URL
Redirect URL: https://YOUR-FINAL-WORKERS-URL/**
```

This is required for forgot-password, reset-password and login callbacks. Remove the old localhost URL. Keep the old Netlify URL only until the Cloudflare deployment has been tested.

## 5. Test before switching off Netlify

Test these items on the Workers URL:

1. Owner/Admin login
2. Dashboard
3. Sites / Projects
4. Create user
5. Forgot password and reset link
6. Create/edit one normal record

Only after these pass, disconnect or pause the Netlify site.

## Local verification commands

```bash
npm install --legacy-peer-deps
npm run preview
```

For an authenticated command-line deployment:

```bash
npm run deploy
```

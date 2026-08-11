# Ratneswar ERP — Password Reset Deployment Setup

The login, forgot-password, callback and new-password screens are already implemented in the code. No SQL or Prisma migration is required for this update. The reset request uses the live page origin, so a stale local environment value cannot place `localhost` in a production reset email.

Complete these one-time settings after deploying the updated project.

If a reset email currently opens `localhost`, Supabase is falling back to the project's configured **Site URL**. This is a Supabase dashboard configuration issue, not a hardcoded login-page link.

## 1. Netlify environment variable

Set this value to the final public origin, without a trailing slash:

```text
NEXT_PUBLIC_APP_URL=https://YOUR-FINAL-SITE.netlify.app
```

Redeploy after changing it.

## 2. Supabase URL configuration

Open **Supabase Dashboard → Authentication → URL Configuration**.

- Site URL: `https://YOUR-FINAL-SITE.netlify.app`
- Redirect URL: `https://YOUR-FINAL-SITE.netlify.app/api/auth/callback`

Use the exact public origin shown by Netlify. Do not leave the production Site URL as `http://localhost:3000`.

For local testing, you may also add:

```text
http://localhost:3000/api/auth/callback
```

## 3. Reset-password email delivery

Supabase's built-in email service is intended for limited testing. It has a low project-wide email limit and may restrict recipients. For dependable delivery to all registered Gmail or company addresses, configure a custom SMTP provider under **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**.

Keep the default Reset Password email template link as `{{ .ConfirmationURL }}` so the secure callback and recovery code remain intact.

## 4. Test once after deployment

1. Open `/forgot-password` on the final deployed site.
2. Enter an email that exists in **Supabase Authentication → Users**.
3. Wait at least one minute and check Inbox, Promotions and Spam.
4. Open only the newest reset email.
5. Set a new password and sign in again.

If the screen reports a rate limit, wait before requesting another email. Repeated clicks can delay testing.

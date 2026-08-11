RATNESWAR ERP CLOUD V8.4 - CLEAN LOGIN & PASSWORD RECOVERY BUILD

This package contains the complete updated project.

WHAT IS UPDATED
- Approved full-screen clean login design.
- Approved Option 3 Soft Glass Grid design across the authenticated ERP.
- Blue/green Ratneswar palette replaces all legacy gold UI accents.
- Floating glass sidebar, top bar, cards, actions and responsive workspace shell.
- Short database retries and safe branding fallback prevent transient pooler
  failures from turning the whole application into a blank server-error screen.
- Ratneswar Engineering branding with subtle motion.
- Clean business wording: Project Control, Smart Operations and Business Growth.
- Existing Supabase email/password authentication remains unchanged.
- Branded forgot-password and reset-password screens.
- Password reset uses the live browser origin instead of a hardcoded localhost URL.

OWNER LOGIN
- Owner and Admin use the same login page; there is no separate Owner button.
- Sign in as Admin, open Access Control, select Add User, choose OWNER,
  enter the owner's email and a temporary password, then create the account.
- The new Owner can immediately sign in from the normal login page.
- See OWNER_LOGIN_SETUP.md for details.

PASSWORD RESET
- Before testing on the live site, complete the Supabase URL Configuration in
  PASSWORD_RESET_SETUP.md. If Supabase Site URL is still localhost, the reset
  email can still fall back to localhost even though the application code is correct.

DEPLOYMENT
1. Commit and push this complete project to the connected Git repository.
2. Let Netlify run the production build.
3. Set the final Netlify URL in Netlify and Supabase as documented.
4. Test Admin login, Owner login and one password-reset request.

NETLIFY DATABASE VARIABLES
- DATABASE_URL must use Supabase Transaction Pooler port 6543 with
  pgbouncer=true and connection_limit=1.
- DIRECT_URL must keep the Session Pooler port 5432 for Prisma migrations.

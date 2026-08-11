RATNESWAR ERP CLOUD V8.4 - CLEAN LOGIN & PASSWORD RECOVERY BUILD

This package contains the complete updated project.

WHAT IS UPDATED
- Approved full-screen clean login design.
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


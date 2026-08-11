# Ratneswar ERP — Owner Login Setup

Admin and Owner do not have separate login screens. Both roles sign in through the same `/login` page. The role is attached to the ERP user account and is applied after authentication.

## Recommended setup from the ERP

1. Sign in with the working Admin account.
2. Open **Access Control** from the sidebar, or visit `/users`.
3. Select **Add User**.
4. Enter the owner's name, email and phone number.
5. Select **OWNER** in the Role field.
6. Set a temporary password of at least 8 characters and select **Create User**.
7. Sign out and use the owner's email and temporary password on the normal login page.

This single action creates the Supabase Authentication user and the matching ERP database profile with `OWNER` access enabled. Do not create the user only in Supabase Authentication unless you also create or update the matching ERP profile.

## If the owner email already exists

Open **Access Control**, edit that user and confirm:

- Role is **OWNER**
- Active account is enabled

If the account was created only in the Supabase dashboard and does not appear in Access Control, delete that incomplete test user from Supabase Authentication and recreate it through **Access Control → Add User**. This avoids an authentication account without the correct ERP role.

## Password help

An Admin or Owner can set a temporary password from the key icon beside the user in Access Control. The user can also use **Forgot password?** after the production URL settings in `PASSWORD_RESET_SETUP.md` are complete.


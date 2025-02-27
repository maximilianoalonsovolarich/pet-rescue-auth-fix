# Installation Instructions

Follow these steps to implement the authentication fixes in your Pet Rescue project.

## Prerequisites

- Access to your Supabase project dashboard
- Ability to run SQL queries in the Supabase SQL Editor
- Access to your project's codebase

## Step 1: Fix Admin User

The most critical step is to properly set up the admin user:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of the `migrations/admin_user_fix.sql` file
4. Execute the query
5. Check the logs for success messages

This will create or fix the admin user with credentials:
- Email: `codemaxon@gmail.com`
- Password: `admin123`

## Step 2: Add Password Reset Function

To enable password resets through the application:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the contents of the `migrations/create_password_reset_function.sql` file
4. Execute the query

This creates a secure function for resetting passwords that can be called from your application.

## Step 3: Add Force Login Page

To add a direct login page that bypasses potential issues:

1. Copy the `src/pages/admin/force-login.tsx` file to your project
2. Place it at the same path in your project structure
3. Build and deploy your application
4. Access the page at `/admin/force-login`

## Step 4: Diagnostic Utility (Optional)

The diagnostic utility helps troubleshoot authentication issues:

1. Copy the `utils/auth_diagnostic.js` file to your project
2. Install it with npm:
   ```bash
   npm install --save-dev
   ```
3. Run it from your project root:
   ```bash
   node utils/auth_diagnostic.js
   ```

This utility provides detailed information about the admin user and can help diagnose login issues.

## Step 5: Update Your Login Component (Optional)

If you're still experiencing issues, consider updating your login component to include better error handling:

1. Update your login page to include debug information similar to the `force-login.tsx` component
2. Ensure you're properly handling authentication errors

## Common Issues and Solutions

### Email Verification Not Working

If email verification isn't working:

1. Check your Supabase project settings:
   - Go to Authentication > Email Templates
   - Verify email templates are properly configured
2. Try manually setting `email_confirmed_at` in the database:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = now()
   WHERE email = 'user@example.com';
   ```

### Registration Not Working

If new user registration isn't working:

1. Check your RLS policies
2. Ensure that the `handle_new_user()` trigger function exists:
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```
3. Verify the trigger is properly set up:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

## Need More Help?

Refer to the [Supabase Authentication documentation](https://supabase.com/docs/guides/auth) for more information on how authentication works in Supabase.

If you're still experiencing issues, check the Supabase logs in your project dashboard for detailed error messages.
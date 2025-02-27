# Pet Rescue Auth Fix

This repository contains fixes for authentication issues in the Pet Rescue application, particularly with admin login and password recovery.

## Common Issues

1. Admin user (`codemaxon@gmail.com`) cannot log in
2. Password recovery emails not being sent
3. New users cannot register

## Step-by-Step Fix Instructions

### Fix 1: Reset Admin User Using SQL

The most reliable way to fix the admin user issues is to use our specialized SQL script:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the entire content from [admin_user_fix.sql](./migrations/admin_user_fix.sql)
4. Run the SQL in the editor
5. Check the logs for any errors

This script will:
- Check if the admin user exists
- If it exists, it will reset the password and fix any auth issues
- If it doesn't exist, it will create a new admin user
- Ensure the profile record is properly set up

### Fix 2: Use the Force Login Page

If normal login still doesn't work, use the force login page:

1. Add the [force-login.tsx](./src/pages/admin/force-login.tsx) file to your project at `src/pages/admin/force-login.tsx`
2. Build and deploy your application
3. Navigate to `/admin/force-login` in your browser
4. Use the admin credentials to log in:
   - Email: `codemaxon@gmail.com`
   - Password: `admin123`
5. If errors persist, enable debug mode to see what's happening

### Fix 3: Troubleshooting Password Reset Issues

If password reset emails aren't being sent:

1. Check your Supabase project settings:
   - Go to Authentication > Email Templates
   - Ensure the Magic Link and Recovery templates are properly configured
   - Check that email sending is enabled in project settings

2. If you're using a free tier Supabase project, be aware that email delivery has limitations. You might need to upgrade your plan for better email service.

### Fix 4: Debugging Registration Issues

If new users cannot register:

1. Check the RLS (Row Level Security) policies for the `profiles` table
2. Ensure the `handle_new_user()` trigger function is working properly
3. Verify that you haven't reached any account limits on your Supabase plan

## Technical Details

### Password Hashing in Supabase Auth

Supabase Auth uses Bcrypt hashing for passwords. The correct way to set a password in a SQL script is:

```sql
UPDATE auth.users 
SET encrypted_password = crypt('your_password', gen_salt('bf'))
WHERE email = 'user@example.com';
```

### Provider ID in Identities

For email-based login, the `provider_id` in the `auth.identities` table should match the user's email. Inconsistencies here can cause login issues.

### Common Pitfalls

1. **Multiple Identities**: Sometimes a user can have multiple identity records, which can cause conflicts
2. **Incomplete Profile**: The profile record might not exist or might have incorrect data
3. **Token Issues**: Auth tokens might be expired or invalid
4. **Email Confirmation**: The user's email might not be confirmed

## Support

If you continue to experience issues, check the Supabase logs in your project dashboard for more detailed error messages.

## License

MIT
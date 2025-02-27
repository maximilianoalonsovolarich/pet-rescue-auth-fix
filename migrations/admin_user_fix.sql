-- Comprehensive Admin User Creation and Reset Script
-- This script will handle both creation and reset scenarios in one go
-- It uses the most reliable method for Supabase Auth passwords

DO $$
DECLARE
  admin_email TEXT := 'codemaxon@gmail.com';
  admin_password TEXT := 'admin123';
  admin_name TEXT := 'Admin User';
  admin_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if the user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = admin_email
  ) INTO user_exists;
  
  RAISE NOTICE 'Admin user exists: %', user_exists;
  
  IF user_exists THEN
    -- Get the existing user's ID
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    RAISE NOTICE 'Existing admin ID: %', admin_id;
    
    -- Update the existing user's password and metadata
    UPDATE auth.users
    SET 
      -- This is the proper method for Supabase password hashing
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      -- These dates ensure the account is confirmed and active
      email_confirmed_at = now(),
      confirmation_token = NULL,
      confirmation_sent_at = NULL,
      recovery_token = NULL,
      recovery_sent_at = NULL,
      -- Update metadata fields
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      raw_user_meta_data = jsonb_build_object(
        'name', admin_name,
        'full_name', admin_name
      ),
      -- Update timestamps
      updated_at = now(),
      last_sign_in_at = now(),
      -- Ensure the account is not banned
      banned_until = NULL,
      -- Set the correct authentication settings
      aud = 'authenticated',
      role = 'authenticated',
      is_super_admin = false
    WHERE id = admin_id;
    
    RAISE NOTICE 'Updated user with ID: %', admin_id;
    
    -- Delete and recreate identity to ensure it's correct
    DELETE FROM auth.identities WHERE user_id = admin_id;
    
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id, 'email', admin_email, 'email_verified', true),
      'email',
      admin_email,
      now(),
      now(),
      now()
    );
    
    RAISE NOTICE 'Recreated identity for user with ID: %', admin_id;
  ELSE
    -- Create a completely new admin user
    admin_id := uuid_generate_v4();
    RAISE NOTICE 'Creating new admin user with ID: %', admin_id;
    
    -- Insert the user into auth.users with properly hashed password
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      last_sign_in_at,
      banned_until,
      aud,
      role,
      is_super_admin
    )
    VALUES (
      admin_id,
      (SELECT id FROM auth.instances LIMIT 1),
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      NULL,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']
      ),
      jsonb_build_object(
        'name', admin_name,
        'full_name', admin_name
      ),
      now(),
      now(),
      now(),
      NULL,
      'authenticated',
      'authenticated',
      false
    );
    
    -- Create identity record for the new user
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id, 'email', admin_email, 'email_verified', true),
      'email',
      admin_email,
      now(),
      now(),
      now()
    );
    
    RAISE NOTICE 'Created new admin user with ID: %', admin_id;
  END IF;
  
  -- Ensure the profile record exists and is marked as admin
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
    -- Update existing profile
    UPDATE public.profiles
    SET
      name = admin_name,
      email = admin_email,
      is_admin = true,
      last_login = now()
    WHERE id = admin_id;
    
    RAISE NOTICE 'Updated profile for admin user';
  ELSE
    -- Create new profile
    INSERT INTO public.profiles (
      id,
      name,
      email,
      is_admin,
      created_at,
      last_login
    )
    VALUES (
      admin_id,
      admin_name,
      admin_email,
      true,
      now(),
      now()
    );
    
    RAISE NOTICE 'Created profile for admin user';
  END IF;
  
  -- Final success message
  RAISE NOTICE '------------------------------------------------';
  RAISE NOTICE 'Admin user setup completed successfully';
  RAISE NOTICE 'ID: %', admin_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: %', admin_password;
  RAISE NOTICE '------------------------------------------------';
END $$;
-- Create a function to reset user passwords securely
-- This function can be called from the client app using RPC

CREATE OR REPLACE FUNCTION admin_reset_password(user_email TEXT, new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_id UUID;
  result JSONB;
BEGIN
  -- Check if the function caller has admin privileges
  -- This ensures only admins can reset passwords
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.uid() = auth.users.id AND profiles.is_admin = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can reset passwords'
    );
  END IF;

  -- Get the user ID from the email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Update the password
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'Password updated successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
-- This is safe because the function checks for admin status internally
GRANT EXECUTE ON FUNCTION admin_reset_password(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION admin_reset_password IS 
'Resets a user password. Only administrators can call this function.';

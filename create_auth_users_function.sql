-- Create a function to get coaches for mentions from auth.users
-- This function allows us to safely query auth.users table

CREATE OR REPLACE FUNCTION get_coaches_for_mentions(search_query TEXT DEFAULT '')
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return users from auth.users table
  -- Filter by search query if provided
  IF search_query = '' OR search_query IS NULL THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
    WHERE au.email IS NOT NULL
    ORDER BY au.created_at DESC
    LIMIT 20;
  ELSE
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
    WHERE au.email IS NOT NULL
      AND (
        au.email ILIKE '%' || search_query || '%'
        OR (au.raw_user_meta_data->>'full_name') ILIKE '%' || search_query || '%'
        OR (au.raw_user_meta_data->>'name') ILIKE '%' || search_query || '%'
        OR (au.raw_user_meta_data->>'first_name') ILIKE '%' || search_query || '%'
        OR (au.raw_user_meta_data->>'last_name') ILIKE '%' || search_query || '%'
      )
    ORDER BY au.created_at DESC
    LIMIT 20;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_coaches_for_mentions(TEXT) TO authenticated;

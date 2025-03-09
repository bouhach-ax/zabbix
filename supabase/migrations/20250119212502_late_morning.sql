/*
  # Fix Tag Usage Increment Function

  This migration:
  1. Ensures proper schema access for the increment_tag_usage function
  2. Grants necessary permissions to anon and authenticated roles
  3. Uses DO blocks for safer execution
*/

DO $$ 
BEGIN
  -- Drop existing function if it exists
  DROP FUNCTION IF EXISTS increment_tag_usage(uuid);
END $$;

-- Create the function with proper permissions
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE inventory_tags
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = tag_id;
END;
$$;

-- Grant execute permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_tag_usage(uuid) TO anon, authenticated;
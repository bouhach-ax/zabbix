/*
  # Fix Tag Constraints and Functions

  1. Changes
    - Add ON CONFLICT handling for tag creation
    - Fix increment_tag_usage function permissions
    - Add proper error handling

  2. Security
    - Maintain RLS policies
    - Grant proper permissions
*/

-- Drop and recreate the increment_tag_usage function with better error handling
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inventory_tags
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = tag_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tag not found';
  END IF;
END;
$$;

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_tag_usage(uuid) TO anon, authenticated;

-- Add a function to safely create or update tags
CREATE OR REPLACE FUNCTION upsert_tag(
  p_key text,
  p_value text,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag_id uuid;
BEGIN
  INSERT INTO inventory_tags (key, value, description)
  VALUES (p_key, p_value, p_description)
  ON CONFLICT (key, value) 
  DO UPDATE SET 
    description = COALESCE(EXCLUDED.description, inventory_tags.description)
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION upsert_tag(text, text, text) TO anon, authenticated;
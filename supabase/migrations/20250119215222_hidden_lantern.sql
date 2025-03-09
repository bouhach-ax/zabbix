/*
  # Fix Tag Policies and Permissions

  1. Changes
    - Drop existing policies
    - Create new policies with proper permissions
    - Grant necessary permissions to anonymous users
    - Fix function permissions

  2. Security
    - Maintain RLS but allow anonymous access
    - Ensure proper function execution rights
*/

-- Drop existing policies
DROP POLICY IF EXISTS "anon_read_tags" ON inventory_tags;
DROP POLICY IF EXISTS "anon_insert_tags" ON inventory_tags;
DROP POLICY IF EXISTS "anon_update_tags" ON inventory_tags;
DROP POLICY IF EXISTS "anon_delete_tags" ON inventory_tags;
DROP POLICY IF EXISTS "anon_read_tags_v2" ON inventory_tags;
DROP POLICY IF EXISTS "anon_insert_tags_v2" ON inventory_tags;
DROP POLICY IF EXISTS "anon_update_tags_v2" ON inventory_tags;
DROP POLICY IF EXISTS "anon_delete_tags_v2" ON inventory_tags;

-- Create new policies with proper permissions
CREATE POLICY "allow_anonymous_select"
  ON inventory_tags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_anonymous_insert"
  ON inventory_tags FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anonymous_update"
  ON inventory_tags FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "allow_anonymous_delete"
  ON inventory_tags FOR DELETE
  TO anon
  USING (true);

-- Ensure proper function permissions
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Recreate the increment_tag_usage function with proper permissions
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

-- Recreate the upsert_tag function with proper permissions
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

-- Grant execute permissions explicitly
GRANT EXECUTE ON FUNCTION increment_tag_usage(uuid) TO anon;
GRANT EXECUTE ON FUNCTION upsert_tag(text, text, text) TO anon;
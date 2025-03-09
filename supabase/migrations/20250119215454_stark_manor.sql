/*
  # Fix Tag Permissions and Sequences

  1. Changes
    - Remove references to non-existent sequences
    - Fix policy names to avoid conflicts
    - Grant proper permissions for anonymous access
    
  2. Security
    - Enable RLS with anonymous access
    - Grant necessary table permissions
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_anonymous_select" ON inventory_tags;
DROP POLICY IF EXISTS "allow_anonymous_insert" ON inventory_tags;
DROP POLICY IF EXISTS "allow_anonymous_update" ON inventory_tags;
DROP POLICY IF EXISTS "allow_anonymous_delete" ON inventory_tags;

-- Create new policies with proper permissions
CREATE POLICY "allow_anon_select"
  ON inventory_tags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_anon_insert"
  ON inventory_tags FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anon_update"
  ON inventory_tags FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "allow_anon_delete"
  ON inventory_tags FOR DELETE
  TO anon
  USING (true);

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON inventory_tags TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Recreate functions with proper permissions
CREATE OR REPLACE FUNCTION public.increment_tag_usage(tag_id uuid)
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

CREATE OR REPLACE FUNCTION public.upsert_tag(
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
GRANT EXECUTE ON FUNCTION public.increment_tag_usage(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_tag(text, text, text) TO anon;
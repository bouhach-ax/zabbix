/*
  # Fix RLS Policies for Inventory Management

  This migration updates the RLS policies to:
  1. Allow all operations for anonymous users
  2. Fix the policy naming conflicts
  3. Ensure proper access control

  Changes:
  - Drop and recreate policies with unique names
  - Enable anonymous access
*/

-- Drop existing policies with potential naming conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_tags;
DROP POLICY IF EXISTS "Enable insert access for all users" ON inventory_tags;
DROP POLICY IF EXISTS "Enable update access for all users" ON inventory_tags;
DROP POLICY IF EXISTS "Enable delete access for all users" ON inventory_tags;

-- Create new policies for inventory_tags with unique names
CREATE POLICY "anon_read_tags"
  ON inventory_tags FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_tags"
  ON inventory_tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anon_update_tags"
  ON inventory_tags FOR UPDATE
  USING (true);

CREATE POLICY "anon_delete_tags"
  ON inventory_tags FOR DELETE
  USING (true);

-- Drop existing policies for host groups with potential naming conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_host_groups;
DROP POLICY IF EXISTS "Enable insert access for all users" ON inventory_host_groups;
DROP POLICY IF EXISTS "Enable update access for all users" ON inventory_host_groups;
DROP POLICY IF EXISTS "Enable delete access for all users" ON inventory_host_groups;

-- Create new policies for inventory_host_groups with unique names
CREATE POLICY "anon_read_groups"
  ON inventory_host_groups FOR SELECT
  USING (true);

CREATE POLICY "anon_insert_groups"
  ON inventory_host_groups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "anon_update_groups"
  ON inventory_host_groups FOR UPDATE
  USING (true);

CREATE POLICY "anon_delete_groups"
  ON inventory_host_groups FOR DELETE
  USING (true);
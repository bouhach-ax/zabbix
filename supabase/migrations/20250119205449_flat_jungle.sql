/*
  # Update RLS Policies for Inventory Management

  This migration updates the RLS policies to:
  1. Allow public access for basic operations
  2. Maintain usage tracking functionality
  3. Ensure data integrity

  Changes:
  - Remove authentication requirements for basic CRUD operations
  - Keep security definer functions for usage tracking
  - Maintain unique constraints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for tags" ON inventory_tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON inventory_tags;
DROP POLICY IF EXISTS "Authenticated users can update tags" ON inventory_tags;
DROP POLICY IF EXISTS "Authenticated users can delete tags" ON inventory_tags;

-- Create new policies for inventory_tags
CREATE POLICY "Enable read access for all users"
  ON inventory_tags FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON inventory_tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON inventory_tags FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete access for all users"
  ON inventory_tags FOR DELETE
  USING (true);

-- Drop existing policies for host groups
DROP POLICY IF EXISTS "Public read access for host groups" ON inventory_host_groups;
DROP POLICY IF EXISTS "Authenticated users can create host groups" ON inventory_host_groups;
DROP POLICY IF EXISTS "Authenticated users can update host groups" ON inventory_host_groups;
DROP POLICY IF EXISTS "Authenticated users can delete host groups" ON inventory_host_groups;

-- Create new policies for inventory_host_groups
CREATE POLICY "Enable read access for all users"
  ON inventory_host_groups FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON inventory_host_groups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON inventory_host_groups FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete access for all users"
  ON inventory_host_groups FOR DELETE
  USING (true);
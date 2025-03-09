/*
  # Fix RLS Policies

  This migration safely updates the RLS policies by:
  1. First checking if policies exist before attempting to create them
  2. Using DO blocks to handle policy creation conditionally
  3. Ensuring unique policy names
  4. Maintaining proper access control
*/

DO $$ 
BEGIN
  -- Remove old policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'inventory_tags') THEN
    DROP POLICY "Enable read access for all users" ON inventory_tags;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert access for all users' AND tablename = 'inventory_tags') THEN
    DROP POLICY "Enable insert access for all users" ON inventory_tags;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update access for all users' AND tablename = 'inventory_tags') THEN
    DROP POLICY "Enable update access for all users" ON inventory_tags;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'inventory_tags') THEN
    DROP POLICY "Enable delete access for all users" ON inventory_tags;
  END IF;
END $$;

DO $$ 
BEGIN
  -- Remove old policies for host groups if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'inventory_host_groups') THEN
    DROP POLICY "Enable read access for all users" ON inventory_host_groups;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert access for all users' AND tablename = 'inventory_host_groups') THEN
    DROP POLICY "Enable insert access for all users" ON inventory_host_groups;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update access for all users' AND tablename = 'inventory_host_groups') THEN
    DROP POLICY "Enable update access for all users" ON inventory_host_groups;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete access for all users' AND tablename = 'inventory_host_groups') THEN
    DROP POLICY "Enable delete access for all users" ON inventory_host_groups;
  END IF;
END $$;

DO $$ 
BEGIN
  -- Create new policies for inventory_tags if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_read_tags_v2' AND tablename = 'inventory_tags') THEN
    CREATE POLICY "anon_read_tags_v2"
      ON inventory_tags FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_tags_v2' AND tablename = 'inventory_tags') THEN
    CREATE POLICY "anon_insert_tags_v2"
      ON inventory_tags FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_tags_v2' AND tablename = 'inventory_tags') THEN
    CREATE POLICY "anon_update_tags_v2"
      ON inventory_tags FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_tags_v2' AND tablename = 'inventory_tags') THEN
    CREATE POLICY "anon_delete_tags_v2"
      ON inventory_tags FOR DELETE
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  -- Create new policies for inventory_host_groups if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_read_groups_v2' AND tablename = 'inventory_host_groups') THEN
    CREATE POLICY "anon_read_groups_v2"
      ON inventory_host_groups FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_insert_groups_v2' AND tablename = 'inventory_host_groups') THEN
    CREATE POLICY "anon_insert_groups_v2"
      ON inventory_host_groups FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_update_groups_v2' AND tablename = 'inventory_host_groups') THEN
    CREATE POLICY "anon_update_groups_v2"
      ON inventory_host_groups FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_delete_groups_v2' AND tablename = 'inventory_host_groups') THEN
    CREATE POLICY "anon_delete_groups_v2"
      ON inventory_host_groups FOR DELETE
      USING (true);
  END IF;
END $$;
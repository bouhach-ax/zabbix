/*
  # Inventory Management Schema

  1. New Tables
    - inventory_tags: Stores tags for inventory items
      - id (uuid, primary key)
      - key (text)
      - value (text)
      - description (text, optional)
      - category (text, optional)
      - usage_count (int)
      - created_at (timestamp)
    
    - inventory_host_groups: Stores host groups
      - id (uuid, primary key)
      - name (text, unique)
      - description (text, optional)
      - usage_count (int)
      - created_at (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
    - Create functions for usage tracking
*/

-- Table des tags d'inventaire
CREATE TABLE IF NOT EXISTS inventory_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text NOT NULL,
  description text,
  category text,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(key, value)
);

-- Table des groupes d'hôtes d'inventaire
CREATE TABLE IF NOT EXISTS inventory_host_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE inventory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_host_groups ENABLE ROW LEVEL SECURITY;

-- Fonction pour incrémenter le compteur d'utilisation des tags
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE inventory_tags
  SET usage_count = usage_count + 1
  WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur d'utilisation des groupes
CREATE OR REPLACE FUNCTION increment_group_usage(group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE inventory_host_groups
  SET usage_count = usage_count + 1
  WHERE id = group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies pour les tags
CREATE POLICY "Public read access for tags"
  ON inventory_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON inventory_tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tags"
  ON inventory_tags FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tags"
  ON inventory_tags FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policies pour les groupes
CREATE POLICY "Public read access for host groups"
  ON inventory_host_groups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create host groups"
  ON inventory_host_groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update host groups"
  ON inventory_host_groups FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete host groups"
  ON inventory_host_groups FOR DELETE
  USING (auth.role() = 'authenticated');
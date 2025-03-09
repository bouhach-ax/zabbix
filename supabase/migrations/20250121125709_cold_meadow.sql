/*
  # Mise à jour du schéma des alertes mock pour correspondre au format Zabbix

  1. Modifications
    - Ajout des colonnes pour la sévérité et le statut de récupération
    - Ajout des colonnes pour les informations de classification
    - Mise à jour de la structure des tags
*/

-- Ajouter les nouvelles colonnes pour correspondre au format Zabbix
ALTER TABLE mock_alerts
ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'Average',
ADD COLUMN IF NOT EXISTS recovery_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS info TEXT,
ADD COLUMN IF NOT EXISTS class VARCHAR(50),
ADD COLUMN IF NOT EXISTS component VARCHAR(50),
ADD COLUMN IF NOT EXISTS scope VARCHAR(50);

-- Mettre à jour la structure des tags pour inclure les classifications Zabbix
UPDATE mock_alerts
SET 
  severity = CASE 
    WHEN priority >= 4 THEN 'High'
    WHEN priority = 3 THEN 'Average'
    ELSE 'Warning'
  END,
  class = CASE 
    WHEN alert_type IN ('system', 'process') THEN 'os'
    WHEN alert_type = 'application' THEN 'software'
    ELSE alert_type
  END,
  component = CASE 
    WHEN alert_type IN ('system', 'os') THEN 'system'
    WHEN alert_type = 'application' THEN 'status'
    WHEN alert_type = 'network' THEN 'network'
    ELSE 'service'
  END,
  scope = 'availability',
  tags = tags || jsonb_build_object(
    'class', CASE 
      WHEN alert_type IN ('system', 'process') THEN 'os'
      WHEN alert_type = 'application' THEN 'software'
      ELSE alert_type
    END,
    'component', CASE 
      WHEN alert_type IN ('system', 'os') THEN 'system'
      WHEN alert_type = 'application' THEN 'status'
      WHEN alert_type = 'network' THEN 'network'
      ELSE 'service'
    END,
    'scope', 'availability'
  );

-- Ajouter des temps de récupération aléatoires pour certaines alertes
UPDATE mock_alerts
SET recovery_time = last_change + (random() * interval '2 hours')
WHERE random() < 0.3;  -- 30% des alertes auront un temps de récupération
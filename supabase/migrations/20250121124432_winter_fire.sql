/*
  # Enrichir les alertes mockées avec des tags

  1. Modifications
    - Ajout de colonnes pour les tags
    - Mise à jour des alertes existantes avec des tags pertinents

  2. Nouvelles colonnes
    - tags: JSONB pour stocker les tags (category, impact, service, etc.)
    - dependencies: JSONB pour stocker les dépendances
    - occurrence_count: Nombre d'occurrences
*/

-- Ajouter les nouvelles colonnes
ALTER TABLE mock_alerts
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS occurrence_count INT DEFAULT 1;

-- Mettre à jour les alertes réseau
UPDATE mock_alerts
SET tags = jsonb_build_object(
  'category', 'network',
  'impact', CASE 
    WHEN description LIKE '%BGP%' OR description LIKE '%core%' THEN 'critical'
    WHEN description LIKE '%latency%' THEN 'high'
    ELSE 'medium'
  END,
  'service', 'Network_Infrastructure',
  'resolution_hint', CASE
    WHEN description LIKE '%BGP%' THEN 'Check_BGP_Peer_Status'
    WHEN description LIKE '%latency%' THEN 'Check_Network_Congestion'
    WHEN description LIKE '%interface%' THEN 'Verify_Interface_Status'
    ELSE 'Check_Network_Connectivity'
  END
),
dependencies = CASE 
  WHEN host_name LIKE '%router%' THEN '["switch-core-01"]'
  WHEN host_name LIKE '%switch%' THEN '["router-edge-01"]'
  ELSE '[]'
END::jsonb
WHERE alert_type = 'network';

-- Mettre à jour les alertes système
UPDATE mock_alerts
SET tags = jsonb_build_object(
  'category', 'system',
  'impact', CASE 
    WHEN description LIKE '%critical%' THEN 'critical'
    WHEN description LIKE '%high%' THEN 'high'
    ELSE 'medium'
  END,
  'service', CASE
    WHEN host_name LIKE '%app%' THEN 'Application_Server'
    ELSE 'System_Infrastructure'
  END,
  'resolution_hint', CASE
    WHEN description LIKE '%CPU%' THEN 'Check_Process_Usage'
    WHEN description LIKE '%memory%' THEN 'Verify_Memory_Allocation'
    WHEN description LIKE '%disk%' THEN 'Clean_Disk_Space'
    ELSE 'Check_System_Resources'
  END
),
dependencies = CASE 
  WHEN host_name LIKE '%app%' THEN '["db-server-01"]'
  ELSE '[]'
END::jsonb
WHERE alert_type = 'system';

-- Mettre à jour les alertes base de données
UPDATE mock_alerts
SET tags = jsonb_build_object(
  'category', 'database',
  'impact', CASE 
    WHEN description LIKE '%connection%' OR description LIKE '%replication%' THEN 'critical'
    WHEN description LIKE '%performance%' THEN 'high'
    ELSE 'medium'
  END,
  'service', 'Database_Service',
  'resolution_hint', CASE
    WHEN description LIKE '%connection%' THEN 'Check_Connection_Pool'
    WHEN description LIKE '%performance%' THEN 'Analyze_Query_Performance'
    WHEN description LIKE '%space%' THEN 'Clean_Table_Space'
    ELSE 'Check_Database_Health'
  END
),
dependencies = '["app-server-01", "app-server-02"]'::jsonb
WHERE alert_type = 'database';

-- Mettre à jour les alertes application
UPDATE mock_alerts
SET tags = jsonb_build_object(
  'category', 'application',
  'impact', CASE 
    WHEN description LIKE '%error%' OR description LIKE '%critical%' THEN 'critical'
    WHEN description LIKE '%response time%' THEN 'high'
    ELSE 'medium'
  END,
  'service', 'Business_Application',
  'resolution_hint', CASE
    WHEN description LIKE '%response time%' THEN 'Check_Application_Performance'
    WHEN description LIKE '%error%' THEN 'Review_Error_Logs'
    WHEN description LIKE '%queue%' THEN 'Check_Queue_Processing'
    ELSE 'Verify_Application_Status'
  END
),
dependencies = '["db-server-01"]'::jsonb
WHERE alert_type = 'application';

-- Mettre à jour les alertes process
UPDATE mock_alerts
SET tags = jsonb_build_object(
  'category', 'process',
  'impact', CASE 
    WHEN description LIKE '%not responding%' OR description LIKE '%stopped%' THEN 'critical'
    WHEN description LIKE '%memory leak%' THEN 'high'
    ELSE 'medium'
  END,
  'service', 'Process_Management',
  'resolution_hint', CASE
    WHEN description LIKE '%not responding%' THEN 'Restart_Process'
    WHEN description LIKE '%memory leak%' THEN 'Check_Memory_Usage'
    WHEN description LIKE '%zombie%' THEN 'Clean_Zombie_Processes'
    ELSE 'Check_Process_Status'
  END
),
dependencies = '[]'::jsonb
WHERE alert_type = 'process';

-- Mettre à jour les occurrence_count aléatoirement pour la simulation
UPDATE mock_alerts
SET occurrence_count = floor(random() * 5 + 1)::int;
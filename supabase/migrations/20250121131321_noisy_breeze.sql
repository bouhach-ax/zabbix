/*
  # Enrichissement des alertes mock pour la vue service

  1. Nouvelles alertes
    - Ajout d'alertes pour chaque service (E-Commerce, CRM, Network, Monitoring)
    - Tags enrichis pour le mapping service
    - Dépendances entre composants

  2. Structure
    - Service tag pour le mapping
    - Component tag pour identifier le composant impacté
    - Impact tag pour la criticité
    - Dependencies pour les relations entre composants
*/

-- Ajouter des alertes pour le service E-Commerce
INSERT INTO mock_alerts (
  description,
  priority,
  host_name,
  host_ip,
  alert_type,
  status,
  tags,
  dependencies
) VALUES
-- Frontend E-Commerce
(
  'High response time on product catalog pages',
  3,
  'ecom-front-01',
  '192.168.10.10',
  'application',
  'active',
  '{
    "service": "E-Commerce",
    "component": "Frontend",
    "impact": "high",
    "category": "performance"
  }',
  '["ecom-api-01", "ecom-db-01"]'
),
(
  'JavaScript errors on checkout page',
  4,
  'ecom-front-02',
  '192.168.10.11',
  'application',
  'active',
  '{
    "service": "E-Commerce",
    "component": "Frontend",
    "impact": "critical",
    "category": "functionality"
  }',
  '["ecom-api-01"]'
),

-- Backend API E-Commerce
(
  'Payment gateway timeout',
  4,
  'ecom-api-01',
  '192.168.10.20',
  'application',
  'active',
  '{
    "service": "E-Commerce",
    "component": "Backend API",
    "impact": "critical",
    "category": "availability"
  }',
  '["ecom-db-01"]'
),
(
  'Order processing queue backup',
  3,
  'ecom-api-02',
  '192.168.10.21',
  'application',
  'active',
  '{
    "service": "E-Commerce",
    "component": "Backend API",
    "impact": "high",
    "category": "performance"
  }',
  '["ecom-db-01"]'
),

-- Database E-Commerce
(
  'High database connection pool usage',
  4,
  'ecom-db-01',
  '192.168.10.30',
  'database',
  'active',
  '{
    "service": "E-Commerce",
    "component": "Database",
    "impact": "critical",
    "category": "resources"
  }',
  '[]'
),

-- Alertes pour le service CRM
(
  'Web interface session handling errors',
  4,
  'crm-web-01',
  '192.168.20.10',
  'application',
  'active',
  '{
    "service": "CRM",
    "component": "Web Interface",
    "impact": "critical",
    "category": "functionality"
  }',
  '["crm-app-01", "crm-db-01"]'
),
(
  'Application server memory leak detected',
  4,
  'crm-app-01',
  '192.168.20.20',
  'application',
  'active',
  '{
    "service": "CRM",
    "component": "Application Server",
    "impact": "critical",
    "category": "resources"
  }',
  '["crm-db-01"]'
),
(
  'Customer data synchronization lag',
  3,
  'crm-db-01',
  '192.168.20.30',
  'database',
  'active',
  '{
    "service": "CRM",
    "component": "Database",
    "impact": "high",
    "category": "performance"
  }',
  '[]'
),

-- Alertes pour le Network Backbone
(
  'BGP session down on edge router',
  4,
  'router-edge-01',
  '192.168.1.1',
  'network',
  'active',
  '{
    "service": "Network Backbone",
    "component": "Edge Routers",
    "impact": "critical",
    "category": "connectivity"
  }',
  '["switch-core-01"]'
),
(
  'High latency on core switch',
  3,
  'switch-core-01',
  '192.168.1.2',
  'network',
  'active',
  '{
    "service": "Network Backbone",
    "component": "Core Switches",
    "impact": "high",
    "category": "performance"
  }',
  '[]'
),
(
  'Load balancer health check failures',
  3,
  'lb-01',
  '192.168.1.3',
  'network',
  'active',
  '{
    "service": "Network Backbone",
    "component": "Load Balancers",
    "impact": "high",
    "category": "availability"
  }',
  '["switch-core-01"]'
),

-- Alertes pour le service Monitoring
(
  'Metrics collection delay',
  3,
  'monitor-collector-01',
  '192.168.30.10',
  'application',
  'active',
  '{
    "service": "Monitoring",
    "component": "Collectors",
    "impact": "high",
    "category": "performance"
  }',
  '["monitor-tsdb-01"]'
),
(
  'Time series database high write latency',
  4,
  'monitor-tsdb-01',
  '192.168.30.20',
  'database',
  'active',
  '{
    "service": "Monitoring",
    "component": "Time Series DB",
    "impact": "critical",
    "category": "performance"
  }',
  '[]'
),
(
  'Alert manager notification delay',
  3,
  'monitor-alert-01',
  '192.168.30.30',
  'application',
  'active',
  '{
    "service": "Monitoring",
    "component": "Alert Manager",
    "impact": "high",
    "category": "functionality"
  }',
  '["monitor-tsdb-01"]'
);

-- Mettre à jour les timestamps pour avoir des alertes récentes
UPDATE mock_alerts
SET 
  created_at = now() - (random() * interval '4 hours'),
  last_change = now() - (random() * interval '4 hours')
WHERE description LIKE 'High response time%'
   OR description LIKE 'JavaScript errors%'
   OR description LIKE 'Payment gateway%'
   OR description LIKE 'Order processing%'
   OR description LIKE 'High database%'
   OR description LIKE 'Web interface%'
   OR description LIKE 'Application server%'
   OR description LIKE 'Customer data%'
   OR description LIKE 'BGP session%'
   OR description LIKE 'High latency%'
   OR description LIKE 'Load balancer%'
   OR description LIKE 'Metrics collection%'
   OR description LIKE 'Time series%'
   OR description LIKE 'Alert manager%';
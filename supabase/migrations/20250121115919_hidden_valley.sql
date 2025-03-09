/*
  # Mock Alerts Schema

  1. New Tables
    - mock_alerts: Stores simulated alerts for testing
      - id (uuid, primary key)
      - description (text)
      - priority (int)
      - host_name (text)
      - host_ip (text)
      - alert_type (text)
      - created_at (timestamp)
      - status (text)
      - last_change (timestamp)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- Create mock alerts table
CREATE TABLE IF NOT EXISTS mock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  priority int NOT NULL,
  host_name text NOT NULL,
  host_ip text NOT NULL,
  alert_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  last_change timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_all_mock_alerts"
  ON mock_alerts FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert mock data
INSERT INTO mock_alerts (description, priority, host_name, host_ip, alert_type, last_change)
VALUES
  -- Network alerts
  ('High network latency detected', 3, 'router-01', '192.168.1.1', 'network', now() - interval '30 minutes'),
  ('Network interface down on core switch', 4, 'switch-core-01', '192.168.1.2', 'network', now() - interval '2 hours'),
  ('Packet loss exceeds threshold', 3, 'router-02', '192.168.1.3', 'network', now() - interval '45 minutes'),
  ('BGP session down', 4, 'router-edge-01', '192.168.1.4', 'network', now() - interval '15 minutes'),
  ('High bandwidth utilization', 2, 'switch-access-01', '192.168.1.5', 'network', now() - interval '1 hour'),

  -- System alerts
  ('High CPU usage', 3, 'srv-app-01', '192.168.2.10', 'system', now() - interval '20 minutes'),
  ('Low disk space on /var', 4, 'srv-app-02', '192.168.2.11', 'system', now() - interval '1 hour'),
  ('Memory usage critical', 4, 'srv-app-03', '192.168.2.12', 'system', now() - interval '10 minutes'),
  ('System load too high', 3, 'srv-app-04', '192.168.2.13', 'system', now() - interval '5 minutes'),
  ('Swap usage critical', 3, 'srv-app-05', '192.168.2.14', 'system', now() - interval '25 minutes'),

  -- Application alerts
  ('Application response time exceeds threshold', 3, 'app-server-01', '192.168.3.10', 'application', now() - interval '15 minutes'),
  ('Too many HTTP 500 errors', 4, 'app-server-02', '192.168.3.11', 'application', now() - interval '30 minutes'),
  ('Queue size critical', 3, 'app-server-03', '192.168.3.12', 'application', now() - interval '40 minutes'),
  ('Cache hit ratio too low', 2, 'app-server-04', '192.168.3.13', 'application', now() - interval '1 hour'),
  ('Application thread deadlock detected', 4, 'app-server-05', '192.168.3.14', 'application', now() - interval '5 minutes'),

  -- Database alerts
  ('Database connection pool exhausted', 4, 'db-server-01', '192.168.4.10', 'database', now() - interval '10 minutes'),
  ('Slow query performance', 3, 'db-server-02', '192.168.4.11', 'database', now() - interval '25 minutes'),
  ('High number of deadlocks', 3, 'db-server-03', '192.168.4.12', 'database', now() - interval '45 minutes'),
  ('Database replication lag', 4, 'db-server-04', '192.168.4.13', 'database', now() - interval '15 minutes'),
  ('Table space nearly full', 3, 'db-server-05', '192.168.4.14', 'database', now() - interval '30 minutes'),

  -- Process alerts
  ('Process not responding', 4, 'proc-server-01', '192.168.5.10', 'process', now() - interval '5 minutes'),
  ('Too many zombie processes', 2, 'proc-server-02', '192.168.5.11', 'process', now() - interval '20 minutes'),
  ('Process memory leak detected', 3, 'proc-server-03', '192.168.5.12', 'process', now() - interval '35 minutes'),
  ('Process CPU usage too high', 3, 'proc-server-04', '192.168.5.13', 'process', now() - interval '50 minutes'),
  ('Critical service stopped', 4, 'proc-server-05', '192.168.5.14', 'process', now() - interval '15 minutes');

-- Generate more alerts by duplicating with different timestamps
INSERT INTO mock_alerts (description, priority, host_name, host_ip, alert_type, last_change)
SELECT 
  description,
  priority,
  host_name || '-' || floor(random() * 100)::text,
  host_ip,
  alert_type,
  now() - (random() * interval '4 hours')
FROM mock_alerts
WHERE random() < 0.7
LIMIT 75;
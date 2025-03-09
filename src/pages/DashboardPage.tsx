import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { mockAlertsService } from '../lib/supabase';
import { 
  AlertTriangle, 
  Pin, 
  RefreshCw, 
  Clock, 
  Info,
  Server,
  Shield,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Database,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clusterAlerts } from '../lib/clustering';

export default function DashboardPage() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const [isGrouped, setIsGrouped] = useState(false);

  React.useEffect(() => {
    if (!config) {
      navigate('/configuration');
    }
  }, [config, navigate]);

  // Fetch both Zabbix and mock alerts
  const { data: zabbixAlerts = [], isLoading: loadingZabbix } = useQuery({
    queryKey: ['zabbix-alerts'],
    queryFn: async () => {
      if (!config) return [];
      try {
        const api = new ZabbixAPI(config);
        return api.getAlerts();
      } catch (error) {
        console.error("Error fetching Zabbix alerts:", error);
        return [];
      }
    },
    enabled: !!config,
    refetchInterval: 30000,
  });

  const { data: mockAlerts = [], isLoading: loadingMock } = useQuery({
    queryKey: ['mock-alerts'],
    queryFn: () => mockAlertsService.getAlerts(),
    refetchInterval: 30000,
  });

  // Combine and format alerts
  const combinedAlerts = React.useMemo(() => [
    ...zabbixAlerts.map(alert => ({
      id: alert.triggerid,
      time: alert.lastchange,
      severity: alert.priority >= 4 ? 'High' : alert.priority >= 3 ? 'Average' : 'Warning',
      recovery_time: null,
      status: 'PROBLEM',
      info: alert.description,
      host: alert.hosts?.[0]?.name || '',
      problem: alert.description,
      duration: alert.lastchange,
      tags: {
        category: 'system',
        impact: alert.priority >= 4 ? 'critical' : alert.priority >= 3 ? 'high' : 'medium',
        service: 'Infrastructure',
        resolution_hint: 'Check system logs'
      }
    })),
    ...mockAlerts.map(alert => ({
      id: alert.id,
      time: new Date(alert.last_change).getTime() / 1000,
      severity: alert.severity,
      recovery_time: alert.recovery_time,
      status: 'PROBLEM',
      info: alert.info,
      host: alert.host_name,
      problem: alert.description,
      duration: new Date(alert.last_change).getTime() / 1000,
      tags: alert.tags || {}
    }))
  ], [zabbixAlerts, mockAlerts]);

  // Process clusters when grouping is enabled
  const clusters = React.useMemo(() => 
    isGrouped ? clusterAlerts(combinedAlerts) : [],
    [isGrouped, combinedAlerts]
  );

  // Limiter le nombre d'alertes affichées sur le tableau de bord
  const limitedAlerts = combinedAlerts.slice(0, 10);
  const limitedClusters = clusters.slice(0, 5);

  // Calculate statistics
  const stats = {
    total: combinedAlerts.length,
    critical: combinedAlerts.filter(a => a.severity === 'High' || a.severity === 'Disaster').length,
    warning: combinedAlerts.filter(a => a.severity === 'Warning' || a.severity === 'Average').length,
    resolved: combinedAlerts.filter(a => a.recovery_time).length,
    byCategory: {
      system: combinedAlerts.filter(a => a.tags.class === 'os' || a.tags.category === 'system').length,
      network: combinedAlerts.filter(a => a.tags.component === 'network' || a.tags.category === 'network').length,
      application: combinedAlerts.filter(a => a.tags.class === 'software' || a.tags.category === 'application').length,
      database: combinedAlerts.filter(a => a.tags.component === 'database' || a.tags.category === 'database').length,
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'disaster':
      case 'high':
        return 'bg-red-500 text-white';
      case 'average':
        return 'bg-orange-400 text-white';
      case 'warning':
        return 'bg-yellow-300 text-black';
      case 'information':
        return 'bg-blue-400 text-white';
      case 'not classified':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loadingZabbix || loadingMock) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-primary-500">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue sur Zabscaler, votre plateforme de monitoring et provisioning Zabbix</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              isGrouped
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Pin className={`h-4 w-4 ${isGrouped ? 'text-white' : 'text-gray-500'} mr-2`} />
            Grouper les alertes similaires
          </button>
        </div>
        <button
          onClick={() => {
            window.location.reload();
            toast.success('Données rafraîchies');
          }}
          className="inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 text-gray-500 mr-2" />
          Rafraîchir
        </button>
      </div>

      {/* Widgets de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total des alertes */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total des alertes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Actives</span>
              <span className="font-medium text-gray-900">{stats.total - stats.resolved}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Résolues</span>
              <span className="font-medium text-gray-900">{stats.resolved}</span>
            </div>
          </div>
        </div>

        {/* Alertes par sévérité */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sévérité</p>
              <p className="text-2xl font-semibold text-red-600">{stats.critical}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Critiques</span>
              <span className="font-medium text-red-600">{stats.critical}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-500">Avertissements</span>
              <span className="font-medium text-yellow-600">{stats.warning}</span>
            </div>
          </div>
        </div>

        {/* Alertes par catégorie */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Par catégorie</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.keys(stats.byCategory).length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Server className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Système</span>
              <span className="font-medium text-gray-900">{stats.byCategory.system}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Réseau</span>
              <span className="font-medium text-gray-900">{stats.byCategory.network}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Application</span>
              <span className="font-medium text-gray-900">{stats.byCategory.application}</span>
            </div>
          </div>
        </div>

        {/* Statut global */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Statut global</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.critical > 0 ? 'Critique' : stats.warning > 0 ? 'Attention' : 'Normal'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              stats.critical > 0 
                ? 'bg-red-50' 
                : stats.warning > 0 
                  ? 'bg-yellow-50' 
                  : 'bg-green-50'
            }`}>
              <Activity className={`h-6 w-6 ${
                stats.critical > 0 
                  ? 'text-red-600' 
                  : stats.warning > 0 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
              }`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <div className={`flex-1 h-2 rounded-full ${
                stats.critical > 0 
                  ? 'bg-red-200' 
                  : stats.warning > 0 
                    ? 'bg-yellow-200' 
                    : 'bg-green-200'
              }`}>
                <div
                  className={`h-2 rounded-full ${
                    stats.critical > 0 
                      ? 'bg-red-600' 
                      : stats.warning > 0 
                        ? 'bg-yellow-600' 
                        : 'bg-green-600'
                  }`}
                  style={{
                    width: `${100 - (stats.resolved / Math.max(stats.total, 1) * 100)}%`
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {stats.total > 0 ? Math.round(stats.resolved / stats.total * 100) : 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Widgets de monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded">
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">CPU</p>
              <p className="text-lg font-semibold text-gray-900">
                {combinedAlerts.filter(a => a.problem.toLowerCase().includes('cpu')).length} alertes
              </p>
            </div>
          </div>
        </div>

        {/* Mémoire */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded">
              <HardDrive className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Mémoire</p>
              <p className="text-lg font-semibold text-gray-900">
                {combinedAlerts.filter(a => 
                  a.problem.toLowerCase().includes('memory') || 
                   a.problem.toLowerCase().includes('swap')
                ).length} alertes
              </p>
            </div>
          </div>
        </div>

        {/* Réseau */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded">
              <Network className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Réseau</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.byCategory.network} alertes
              </p>
            </div>
          </div>
        </div>

        {/* Base de données */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded">
              <Database className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Base de données</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.byCategory.database} alertes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau d'alertes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Alertes récentes</h2>
          <button
            onClick={() => navigate('/all-alerts')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Voir toutes les alertes
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
        
        {isGrouped ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {limitedClusters.map((cluster, index) => (
              <div key={index} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Groupe {index + 1} ({cluster.alerts.length} alertes)
                    </h3>
                    <span className="text-xs text-gray-500">
                      Score: {cluster.similarity.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {cluster.alerts.slice(0, 3).map((alert: any) => (
                    <div key={alert.id} className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {alert.problem}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            {Object.entries(alert.tags).slice(0, 2).map(([key, value]) => (
                              <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            <Clock className="inline-block h-3 w-3 mr-1" />
                            {formatDuration(alert.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cluster.alerts.length > 3 && (
                    <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
                      + {cluster.alerts.length - 3} autres alertes similaires
                    </div>
                  )}
                </div>
              </div>
            ))}
            {clusters.length > limitedClusters.length && (
              <div className="col-span-full text-center py-4">
                <button
                  onClick={() => navigate('/all-alerts')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Voir {clusters.length - limitedClusters.length} groupes supplémentaires
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {limitedAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(alert.time * 1000).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className="text-red-600 font-medium text-sm">
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                        {alert.host}
                      </a>
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-900 max-w-xs truncate">
                      {alert.problem}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(alert.duration)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                        Update
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {combinedAlerts.length > limitedAlerts.length && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
                <button
                  onClick={() => navigate('/all-alerts')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Voir {combinedAlerts.length - limitedAlerts.length} alertes supplémentaires
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { mockAlertsService } from '../lib/supabase';
import { 
  AlertTriangle, 
  Pin, 
  RefreshCw, 
  Brain,
  Info,
  Clock,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clusterAlerts } from '../lib/clustering';

export default function AIDashboardPage() {
  const { config } = useConfig();
  const [isGrouped, setIsGrouped] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer les alertes Zabbix
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

  // Récupérer les alertes mock
  const { data: mockAlerts = [], isLoading: loadingMock } = useQuery({
    queryKey: ['mock-alerts'],
    queryFn: () => mockAlertsService.getAlerts(),
    refetchInterval: 30000,
  });

  // Combiner et formater les alertes
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

  // Filtrer les alertes selon le terme de recherche
  const filteredAlerts = React.useMemo(() => 
    combinedAlerts.filter(alert =>
      alert.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.entries(alert.tags).some(([key, value]) => 
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [combinedAlerts, searchTerm]
  );

  // Calculer les clusters une seule fois quand nécessaire
  const clusters = React.useMemo(() => 
    isGrouped ? clusterAlerts(filteredAlerts) : [],
    [isGrouped, filteredAlerts]
  );

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Brain className="h-8 w-8 mr-2 text-indigo-600" />
          AI Dashboard
        </h1>
        <div className="flex space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
      </div>

      {/* Tableau d'alertes */}
      {isGrouped ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Groupes d'alertes similaires ({clusters.length} groupes)
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {clusters.map((cluster, index) => (
              <div key={index} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Groupe {index + 1} - Score de similarité: {cluster.similarity.toFixed(2)}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {cluster.alerts.length} alertes
                  </span>
                </div>
                <div className="bg-white shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recovery time
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Info
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
                          Tags
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cluster.alerts.map((alert: any) => (
                        <tr key={alert.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(alert.time * 1000).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getSeverityClass(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                            {alert.recovery_time ? new Date(alert.recovery_time).toLocaleString() : '-'}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className="text-red-600 font-medium text-sm">
                              {alert.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {alert.info && (
                              <Info className="h-4 w-4 text-gray-400" />
                            )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm">
                            <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                              {alert.host}
                            </a>
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {alert.problem}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatDuration(alert.duration)}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(alert.tags).map(([key, value]) => (
                                <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recovery time
                </th>
                <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Info
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
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.time * 1000).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getSeverityClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                    {alert.recovery_time ? new Date(alert.recovery_time).toLocaleString() : '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="text-red-600 font-medium text-sm">
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {alert.info && (
                      <Info className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm">
                    <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                      {alert.host}
                    </a>
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900">
                    {alert.problem}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(alert.duration)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(alert.tags).map(([key, value]) => (
                        <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
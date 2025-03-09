import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Filter,
  Download,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clusterAlerts } from '../lib/clustering';

export default function AllAlertsPage() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const [isGrouped, setIsGrouped] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

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

  // Filtrer les alertes selon les critères
  const filteredAlerts = React.useMemo(() => 
    combinedAlerts.filter(alert => {
      // Filtre de recherche
      const matchesSearch = 
        alert.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.entries(alert.tags).some(([key, value]) => 
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Filtre de sévérité
      const matchesSeverity = severityFilter.length === 0 || 
        severityFilter.includes(alert.severity.toLowerCase());
      
      // Filtre de statut
      const matchesStatus = statusFilter.length === 0 || 
        statusFilter.includes(alert.status.toLowerCase());
      
      return matchesSearch && matchesSeverity && matchesStatus;
    }),
    [combinedAlerts, searchTerm, severityFilter, statusFilter]
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (alertId: string) => {
    if (selectedAlerts.includes(alertId)) {
      setSelectedAlerts(selectedAlerts.filter(id => id !== alertId));
    } else {
      setSelectedAlerts([...selectedAlerts, alertId]);
    }
  };

  const handleAcknowledgeAlerts = () => {
    if (selectedAlerts.length === 0) {
      toast.error('Veuillez sélectionner au moins une alerte');
      return;
    }
    
    toast.success(`${selectedAlerts.length} alerte(s) acquittée(s)`);
    setSelectedAlerts([]);
  };

  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) {
      toast.error('Aucune alerte à exporter');
      return;
    }
    
    // Créer le contenu CSV
    const headers = ['ID', 'Time', 'Severity', 'Status', 'Host', 'Problem', 'Duration'];
    const rows = filteredAlerts.map(alert => [
      alert.id,
      new Date(alert.time * 1000).toLocaleString(),
      alert.severity,
      alert.status,
      alert.host,
      alert.problem,
      formatDuration(alert.duration)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `alerts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Toutes les alertes</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {filteredAlerts.length} alerte(s)
          </span>
        </div>
        <div className="flex items-center space-x-4">
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
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              showFilters || severityFilter.length > 0 || statusFilter.length > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className={`h-4 w-4 ${showFilters ? 'text-white' : 'text-gray-500'} mr-2`} />
            Filtres
            {(severityFilter.length > 0 || statusFilter.length > 0) && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white text-indigo-600">
                {severityFilter.length + statusFilter.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              isGrouped
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Pin className={`h-4 w-4 ${isGrouped ? 'text-white' : 'text-gray-500'} mr-2`} />
            Grouper
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

      {/* Filtres */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtres avancés</h3>
            <button
              onClick={() => {
                setSeverityFilter([]);
                setStatusFilter([]);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sévérité</h4>
              <div className="space-y-2">
                {['high', 'average', 'warning', 'information'].map((severity) => (
                  <label key={severity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={severityFilter.includes(severity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeverityFilter([...severityFilter, severity]);
                        } else {
                          setSeverityFilter(severityFilter.filter(s => s !== severity));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{severity}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Statut</h4>
              <div className="space-y-2">
                {['problem', 'resolved'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status]);
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions sur les alertes sélectionnées */}
      {selectedAlerts.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-indigo-700 font-medium">{selectedAlerts.length} alerte(s) sélectionnée(s)</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleAcknowledgeAlerts}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Acquitter
            </button>
            <button
              onClick={() => setSelectedAlerts([])}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler la sélection
            </button>
          </div>
        </div>
      )}

      {/* Tableau d'alertes */}
      {isGrouped ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Alertes groupées ({clusters.length} groupes)
            </h3>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exporter CSV
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {clusters.map((cluster, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-2">
                      {index + 1}
                    </span>
                    Groupe d'alertes - Score de similarité: {cluster.similarity.toFixed(2)}
                  </h4>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {cluster.alerts.length} alertes
                    </span>
                    <button
                      className="text-indigo-600 hover:text-indigo-500"
                      onClick={() => {
                        const alertIds = cluster.alerts.map((a: any) => a.id);
                        setSelectedAlerts([...new Set([...selectedAlerts, ...alertIds])]);
                      }}
                    >
                      <span className="text-sm">Sélectionner tout</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white shadow overflow-x-auto rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={cluster.alerts.every((a: any) => selectedAlerts.includes(a.id))}
                            onChange={(e) => {
                              const alertIds = cluster.alerts.map((a: any) => a.id);
                              if (e.target.checked) {
                                setSelectedAlerts([...new Set([...selectedAlerts, ...alertIds])]);
                              } else {
                                setSelectedAlerts(selectedAlerts.filter(id => !alertIds.includes(id)));
                              }
                            }}
                          />
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Host
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Problem
                        </th>
                        <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cluster.alerts.map((alert: any) => (
                        <tr key={alert.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedAlerts.includes(alert.id)}
                              onChange={() => handleSelectAlert(alert.id)}
                            />
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(alert.time * 1000).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getSeverityClass(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm">
                            <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                              {alert.host}
                            </a>
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900">
                            {alert.problem}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={() => toast.success(`Alerte ${alert.id} mise à jour`)}
                              >
                                Update
                              </button>
                              <button
                                className="text-green-600 hover:text-green-800 hover:underline"
                                onClick={() => {
                                  handleSelectAlert(alert.id);
                                  handleAcknowledgeAlerts();
                                }}
                              >
                                Ack
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {clusters.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun groupe d'alertes trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Essayez de modifier vos critères de recherche ou de désactiver le groupement.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Liste des alertes ({filteredAlerts.length})
            </h3>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
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
                    Actions
                  </th>
                  <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                      />
                    </td>
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
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => toast.success(`Alerte ${alert.id} mise à jour`)}
                        >
                          Update
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800 hover:underline"
                          onClick={() => {
                            handleSelectAlert(alert.id);
                            handleAcknowledgeAlerts();
                          }}
                        >
                          Ack
                        </button>
                      </div>
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
                {filteredAlerts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-10 text-center text-gray-500">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune alerte trouvée</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucune alerte ne correspond aux critères de recherche actuels.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
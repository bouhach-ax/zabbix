import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  AlertOctagon, 
  Shield, 
  Clock, 
  Server, 
  Database, 
  Globe, 
  Network,
  BarChart3,
  Calendar,
  Users,
  Cpu,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ServiceDetails {
  id: string;
  name: string;
  status: string;
  sla: string;
  lastIncident: string;
  childCount: number;
}

export default function ServiceDetailsPage() {
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    // Récupérer les détails du service depuis le localStorage
    const storedService = localStorage.getItem('selectedService');
    if (storedService) {
      setService(JSON.parse(storedService));
    }
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            OK
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Dégradé
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertOctagon className="h-4 w-4 mr-1" />
            Critique
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Activity className="h-4 w-4 mr-1" />
            Inconnu
          </span>
        );
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('database') || name.includes('db')) {
      return <Database className="h-6 w-6 text-blue-600" />;
    } else if (name.includes('web') || name.includes('frontend') || name.includes('http')) {
      return <Globe className="h-6 w-6 text-green-600" />;
    } else if (name.includes('network') || name.includes('backbone')) {
      return <Network className="h-6 w-6 text-purple-600" />;
    } else if (name.includes('server') || name.includes('backend')) {
      return <Server className="h-6 w-6 text-orange-600" />;
    } else {
      return <Activity className="h-6 w-6 text-gray-600" />;
    }
  };

  // Générer des données de métriques simulées pour le graphique
  const generateMetricData = (days: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      const value = 95 + Math.random() * 5; // Valeur entre 95 et 100
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        value: value.toFixed(2)
      });
    }
    
    return data;
  };

  // Générer des incidents simulés
  const generateIncidents = () => {
    const incidents = [];
    const statuses = ['resolved', 'resolved', 'resolved', 'active'];
    const types = ['performance', 'availability', 'error', 'warning'];
    
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = subDays(new Date(), daysAgo);
      const duration = Math.floor(Math.random() * 120) + 5; // 5-125 minutes
      
      incidents.push({
        id: `inc-${i}`,
        date: format(date, 'yyyy-MM-dd HH:mm'),
        type: types[Math.floor(Math.random() * types.length)],
        description: `Incident ${i+1} sur ${service?.name}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        duration: `${duration} minutes`
      });
    }
    
    return incidents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Générer des composants simulés
  const generateComponents = () => {
    const components = [];
    const statuses = ['ok', 'degraded', 'critical'];
    const types = ['Frontend', 'Backend API', 'Database', 'Cache', 'Load Balancer'];
    
    for (let i = 0; i < 4; i++) {
      components.push({
        id: `comp-${i}`,
        name: types[i % types.length],
        status: statuses[Math.floor(Math.random() * (i === 0 ? 1 : 3))], // Premier composant toujours OK
        sla: (99.5 + Math.random() * 0.5).toFixed(2) + '%'
      });
    }
    
    return components;
  };

  const metricData = generateMetricData(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90);
  const incidents = generateIncidents();
  const components = generateComponents();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Service non trouvé</h2>
        <p className="text-gray-600 mb-6">Les détails du service n'ont pas pu être chargés.</p>
        <button
          onClick={() => navigate('/service-monitoring')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au monitoring
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/service-monitoring')}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100 mr-3">
              {getServiceIcon(service.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
              <div className="flex items-center mt-1">
                {getStatusBadge(service.status)}
                <span className="ml-3 text-sm text-gray-500">
                  <Shield className="inline-block h-4 w-4 mr-1 text-indigo-500" />
                  SLA: {service.sla}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  <Clock className="inline-block h-4 w-4 mr-1 text-gray-500" />
                  Dernier incident: {service.lastIncident}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            toast.success('Données rafraîchies');
          }}
          className="inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 text-gray-500 mr-2" />
          Rafraîchir
        </button>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="inline-block h-4 w-4 mr-2" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'incidents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="inline-block h-4 w-4 mr-2" />
            Incidents
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'components'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Server className="inline-block h-4 w-4 mr-2" />
            Composants
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sla'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline-block h-4 w-4 mr-2" />
            SLA
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Composants</p>
                  <p className="text-2xl font-semibold text-gray-900">{service.childCount}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incidents (30j)</p>
                  <p className="text-2xl font-semibold text-gray-900">{incidents.length}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibilité</p>
                  <p className="text-2xl font-semibold text-green-600">{service.sla}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Statut</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {service.status === 'ok' ? 'OK' : service.status === 'degraded' ? 'Dégradé' : 'Critique'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  service.status === 'ok' 
                    ? 'bg-green-50' 
                    : service.status === 'degraded' 
                      ? 'bg-yellow-50' 
                      : 'bg-red-50'
                }`}>
                  {service.status === 'ok' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : service.status === 'degraded' ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <AlertOctagon className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Graphique de performance */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Performance du service</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '7d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  7 jours
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '30d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30 jours
                </button>
                <button
                  onClick={() => setTimeRange('90d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '90d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  90 jours
                </button>
              </div>
            </div>
            
            {/* Graphique simulé */}
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Graphique de performance simulé</p>
                  <p className="text-sm">Données disponibles pour {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} jours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Derniers incidents */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Derniers incidents</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {incidents.slice(0, 3).map((incident) => (
                <div key={incident.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        incident.status === 'active' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {incident.status === 'active' ? (
                          <AlertOctagon className="h-5 w-5 text-red-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">{incident.description}</h4>
                        <div className="mt-1 flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{incident.date}</span>
                          <span className="mx-2 text-gray-300">|</span>
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{incident.duration}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'active' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {incident.status === 'active' ? 'Actif' : 'Résolu'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('incidents')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voir tous les incidents
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Historique des incidents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        incident.type === 'performance' 
                          ? 'bg-blue-100 text-blue-800' 
                          : incident.type === 'availability' 
                            ? 'bg-red-100 text-red-800'
                            : incident.type === 'error'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        incident.status === 'active' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {incident.status === 'active' ? 'Actif' : 'Résolu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Composants du service</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ressources
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {components.map((component) => (
                    <tr key={component.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100">
                            {component.name.toLowerCase().includes('database') ? (
                              <Database className="h-5 w-5 text-blue-600" />
                            ) : component.name.toLowerCase().includes('frontend') ? (
                              <Globe className="h-5 w-5 text-green-600" />
                            ) : component.name.toLowerCase().includes('api') ? (
                              <Server className="h-5 w-5 text-orange-600" />
                            ) : component.name.toLowerCase().includes('cache') ? (
                              <HardDrive className="h-5 w-5 text-purple-600" />
                            ) : (
                              <Network className="h-5 w-5 text-indigo-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{component.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(component.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <Shield className="h-4 w-4 mr-1 text-indigo-500" />
                          <span className="text-sm font-medium">{component.sla}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Cpu className="h-3 w-3 mr-1" />
                            CPU: {Math.floor(Math.random() * 30) + 10}%
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <HardDrive className="h-3 w-3 mr-1" />
                            RAM: {Math.floor(Math.random() * 40) + 20}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toast.success(`Détails du composant ${component.name}`)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dépendances</h3>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-3xl">
                <div className="flex justify-center mb-8">
                  <div className="p-4 border-2 border-indigo-500 rounded-lg bg-indigo-50 text-center">
                    <div className="flex justify-center mb-2">
                      {getServiceIcon(service.name)}
                    </div>
                    <div className="font-medium">{service.name}</div>
                  </div>
                </div>
                
                <div className="border-l-2 border-indigo-200 h-8 mx-auto w-0"></div>
                
                <div className="grid grid-cols-3 gap-4">
                  {components.map((component) => (
                    <div key={component.id} className="flex flex-col items-center">
                      <div className="border-t-2 border-indigo-200 w-full"></div>
                      <div className="border-l-2 border-indigo-200 h-4 w-0"></div>
                      <div className={`p-3 border-2 rounded-lg text-center ${
                        component.status === 'ok' 
                          ? 'border-green-500 bg-green-50' 
                          : component.status === 'degraded'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-red-500 bg-red-50'
                      }`}>
                        <div className="flex justify-center mb-2">
                          {component.name.toLowerCase().includes('database') ? (
                            <Database className="h-5 w-5 text-blue-600" />
                          ) : component.name.toLowerCase().includes('frontend') ? (
                            <Globe className="h-5 w-5 text-green-600" />
                          ) : component.name.toLowerCase().includes('api') ? (
                            <Server className="h-5 w-5 text-orange-600" />
                          ) : component.name.toLowerCase().includes('cache') ? (
                            <HardDrive className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Network className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="font-medium text-sm">{component.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Historique SLA</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '7d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  7 jours
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '30d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30 jours
                </button>
                <button
                  onClick={() => setTimeRange('90d')}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    timeRange === '90d'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  90 jours
                </button>
              </div>
            </div>
            
            {/* Graphique SLA simulé */}
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Graphique SLA simulé</p>
                  <p className="text-sm">Données disponibles pour {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} jours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Détails SLA</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Objectifs de service</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SLA cible</span>
                      <span className="text-sm font-medium text-gray-900">99.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SLA actuel</span>
                      <span className="text-sm font-medium text-gray-900">{service.sla}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Période de calcul</span>
                      <span className="text-sm font-medium text-gray-900">30 jours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Dernière mise à jour</span>
                      <span className="text-sm font-medium text-gray-900">{format(new Date(), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Temps d'indisponibilité</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Temps d'arrêt (30j)</span>
                      <span className="text-sm font-medium text-gray-900">43 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Temps d'arrêt autorisé (30j)</span>
                      <span className="text-sm font-medium text-gray-900">4 heures 22 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Incidents critiques</span>
                      <span className="text-sm font-medium text-gray-900">2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">MTTR (temps moyen de résolution)</span>
                      <span className="text-sm font-medium text-gray-900">21 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">SLA par composant</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Composant
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SLA
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temps d'arrêt (30j)
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {components.map((component) => (
                    <tr key={component.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-gray-100">
                            {component.name.toLowerCase().includes('database') ? (
                              <Database className="h-4 w-4 text-blue-600" />
                            ) : component.name.toLowerCase().includes('frontend') ? (
                              <Globe className="h-4 w-4 text-green-600" />
                            ) : component.name.toLowerCase().includes('api') ? (
                              <Server className="h-4 w-4 text-orange-600" />
                            ) : component.name.toLowerCase().includes('cache') ? (
                              <HardDrive className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Network className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{component.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <Shield className="h-4 w-4 mr-1 text-indigo-500" />
                          <span className="text-sm font-medium">{component.sla}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {Math.floor(Math.random() * 60)} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          component.name.toLowerCase().includes('database') 
                            ? 'bg-red-100 text-red-800' 
                            : component.name.toLowerCase().includes('api')
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {component.name.toLowerCase().includes('database') 
                            ? 'Critique' 
                            : component.name.toLowerCase().includes('api')
                              ? 'Élevé'
                              : 'Moyen'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
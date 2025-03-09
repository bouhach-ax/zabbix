import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { 
  Plus, 
  Search,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Server,
  Database,
  Globe,
  Network,
  Activity,
  Layers,
  ShoppingCart,
  Users2,
  MonitorCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Shield,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ServiceProposal } from '../types/zabbix';

export default function ServiceViewPage() {
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  // Récupérer les services existants
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      if (!config) return [];
      const api = new ZabbixAPI(config);
      return api.getServices();
    },
    enabled: !!config
  });

  // Mutation pour créer un service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      if (!config) throw new Error('Configuration manquante');
      const api = new ZabbixAPI(config);
      return api.createService({
        name: serviceName,
        algorithm: 1, // Worst status of all child services
        sortorder: 1,
        weight: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    }
  });

  // Mutation pour supprimer un service
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!config) throw new Error('Configuration manquante');
      const api = new ZabbixAPI(config);
      return api.deleteService(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Simuler des propositions de services basées sur les tags
  const serviceProposals: ServiceProposal[] = [
    {
      name: 'E-Commerce',
      hosts: [],
      tags: {
        type: ['web', 'business'],
        priority: ['high'],
        environment: ['production']
      }
    },
    {
      name: 'CRM',
      hosts: [],
      tags: {
        type: ['application', 'business'],
        priority: ['high'],
        environment: ['production']
      }
    },
    {
      name: 'Network Backbone',
      hosts: [],
      tags: {
        type: ['infrastructure', 'network'],
        priority: ['critical'],
        environment: ['production']
      }
    },
    {
      name: 'Monitoring',
      hosts: [],
      tags: {
        type: ['infrastructure', 'monitoring'],
        priority: ['medium'],
        environment: ['production']
      }
    }
  ];

  // Filtrer les propositions selon le terme de recherche
  const filteredProposals = serviceProposals.filter(proposal =>
    proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.entries(proposal.tags).some(([key, values]) =>
      values.some(value => 
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  // Filtrer les propositions pour exclure celles qui existent déjà
  const existingServiceNames = services.map(s => s.name.toLowerCase());
  const availableProposals = filteredProposals.filter(
    proposal => !existingServiceNames.includes(proposal.name.toLowerCase())
  );

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le service "${serviceName}" ?`)) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  if (loadingServices) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
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

      {/* Service Proposals Section */}
      {availableProposals.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Propositions de services ({availableProposals.length})
            </h2>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProposals.length === availableProposals.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProposals(availableProposals.map(p => p.name));
                    } else {
                      setSelectedProposals([]);
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Tout sélectionner</span>
              </label>
              {selectedProposals.length > 0 && (
                <button
                  onClick={async () => {
                    for (const proposal of selectedProposals) {
                      await createServiceMutation.mutate(proposal);
                    }
                    setSelectedProposals([]);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer {selectedProposals.length} service{selectedProposals.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProposals.map((proposal) => (
              <div
                key={proposal.name}
                className={`border rounded-lg p-4 ${
                  selectedProposals.includes(proposal.name)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProposals.includes(proposal.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProposals([...selectedProposals, proposal.name]);
                        } else {
                          setSelectedProposals(selectedProposals.filter(name => name !== proposal.name));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{proposal.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(proposal.tags).map(([key, values]) =>
                          values.map(value => (
                            <span
                              key={`${key}-${value}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {key}: {value}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des services existants */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Services existants ({services.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {services.map((service) => (
            <div key={service.serviceid} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Activity className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                    {service.tags && service.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {service.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag.tag}: {tag.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Actif
                  </span>
                  <button
                    onClick={() => handleDeleteService(service.serviceid, service.name)}
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50"
                    title="Supprimer le service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
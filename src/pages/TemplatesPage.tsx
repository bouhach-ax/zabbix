import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { Settings, Search, Activity, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MetricsTable from '../components/MetricsTable';
import { ZabbixTemplate, ZabbixItem } from '../types/zabbix';

export default function TemplatesPage() {
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Créer une instance de l'API Zabbix
  const api = config ? new ZabbixAPI(config) : null;

  // Récupérer les templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      if (!api) throw new Error('API non configurée');
      return api.getTemplates();
    },
    enabled: !!api
  });

  // Récupérer les items du template sélectionné
  const { data: templateItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['template-items', selectedTemplateId],
    queryFn: async () => {
      if (!api || !selectedTemplateId) return [];
      return api.getItems(selectedTemplateId);
    },
    enabled: !!api && !!selectedTemplateId
  });

  // Récupérer les hôtes
  const { data: hosts = [], isLoading: loadingHosts } = useQuery({
    queryKey: ['hosts'],
    queryFn: async () => {
      if (!api) throw new Error('API non configurée');
      return api.getHosts();
    },
    enabled: !!api
  });

  // Mutation pour assigner un template à des hôtes
  const assignTemplateMutation = useMutation({
    mutationFn: async ({ templateId, hostIds }: { templateId: string, hostIds: string[] }) => {
      if (!api) throw new Error('API non configurée');
      return api.assignTemplateToHosts(templateId, hostIds);
    },
    onSuccess: () => {
      toast.success('Template assigné avec succès');
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      setSelectedTemplateId(null);
      setSelectedHosts([]);
      setShowAssignModal(false);
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'assignation: ${error.message}`);
    }
  });

  // Mutation pour activer/désactiver un item
  const toggleItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!api) throw new Error('API non configurée');
      
      // Trouver l'item pour connaître son statut actuel
      const item = templateItems.find((item: ZabbixItem) => item.itemid === itemId);
      if (!item) throw new Error('Item non trouvé');
      
      // Inverser le statut (0 = activé, 1 = désactivé)
      const newStatus = item.status === '0' || item.status === 0 ? 1 : 0;
      
      return api.updateItemStatus(itemId, newStatus);
    },
    onSuccess: () => {
      toast.success('Statut de la métrique mis à jour');
      queryClient.invalidateQueries({ queryKey: ['template-items', selectedTemplateId] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  // Filtrer les templates selon le terme de recherche
  const filteredTemplates = templates.filter((template: ZabbixTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId || selectedHosts.length === 0) return;
    
    assignTemplateMutation.mutate({
      templateId: selectedTemplateId,
      hostIds: selectedHosts
    });
  };

  const handleToggleMetric = (itemId: string) => {
    toggleItemMutation.mutate(itemId);
  };

  if (loadingTemplates) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un template..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Templates disponibles ({filteredTemplates.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom du template
                </th>
                <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Métriques
                </th>
                <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template: ZabbixTemplate) => (
                <tr 
                  key={template.templateid}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedTemplateId === template.templateid ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedTemplateId(template.templateid)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <span className="inline-flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-gray-400" />
                      {template.items?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplateId(template.templateid);
                        setShowAssignModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Assigner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détails du template sélectionné */}
      {selectedTemplateId && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Métriques du template: {templates.find(t => t.templateid === selectedTemplateId)?.name}
            </h3>
          </div>
          <div className="p-4">
            {loadingItems ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : templateItems.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Aucune métrique disponible</p>
            ) : (
              <MetricsTable 
                items={templateItems} 
                onToggleMetric={handleToggleMetric} 
              />
            )}
          </div>
        </div>
      )}

      {/* Modal d'assignation */}
      {showAssignModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assigner le template aux hôtes
                </h3>

                <div className="mt-4 max-h-60 overflow-y-auto">
                  {loadingHosts ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hosts.map((host) => (
                        <label key={host.hostid} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600"
                            checked={selectedHosts.includes(host.hostid)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedHosts([...selectedHosts, host.hostid]);
                              } else {
                                setSelectedHosts(selectedHosts.filter(id => id !== host.hostid));
                              }
                            }}
                          />
                          <span className="text-sm text-gray-900">{host.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAssignTemplate}
                  disabled={selectedHosts.length === 0 || assignTemplateMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {assignTemplateMutation.isPending ? 'Assignation...' : 'Assigner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedHosts([]);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { 
  Plus, 
  Trash2, 
  Server, 
  Shield, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ServiceDefinition, ServiceComponentDefinition } from '../types/zabbix';

interface ServiceDefinitionFormProps {
  onSubmit: (serviceDefinition: ServiceDefinition) => void;
  initialData?: ServiceDefinition;
}

export default function ServiceDefinitionForm({ onSubmit, initialData }: ServiceDefinitionFormProps) {
  const { config } = useConfig();
  const [formData, setFormData] = useState<ServiceDefinition>(initialData || {
    name: '',
    components: [],
    sla: '99.9%',
    algorithm: 1,
    tags: {}
  });
  const [expandedSection, setExpandedSection] = useState<string | null>('general');
  const [newComponent, setNewComponent] = useState<ServiceComponentDefinition>({
    name: '',
    hosts: [],
    sla: '99.9%',
    algorithm: 1,
    impact: 'medium',
    tags: {}
  });
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch hosts
  const { data: hosts = [], isLoading: loadingHosts } = useQuery({
    queryKey: ['hosts'],
    queryFn: async () => {
      if (!config) return [];
      const api = new ZabbixAPI(config);
      return api.getHosts();
    },
    enabled: !!config
  });

  const filteredHosts = hosts.filter(host => 
    host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      tags: {
        ...formData.tags,
        [name]: value
      }
    });
  };

  const handleComponentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewComponent({
      ...newComponent,
      [name]: value
    });
  };

  const handleComponentTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewComponent({
      ...newComponent,
      tags: {
        ...newComponent.tags,
        [name]: value
      }
    });
  };

  const handleAddComponent = () => {
    if (!newComponent.name) {
      toast.error('Le nom du composant est requis');
      return;
    }

    if (selectedHosts.length === 0) {
      toast.error('Veuillez sélectionner au moins un hôte');
      return;
    }

    const component: ServiceComponentDefinition = {
      ...newComponent,
      hosts: selectedHosts
    };

    setFormData({
      ...formData,
      components: [...formData.components, component]
    });

    // Reset form
    setNewComponent({
      name: '',
      hosts: [],
      sla: '99.9%',
      algorithm: 1,
      impact: 'medium',
      tags: {}
    });
    setSelectedHosts([]);
    toast.success('Composant ajouté');
  };

  const handleRemoveComponent = (index: number) => {
    const updatedComponents = [...formData.components];
    updatedComponents.splice(index, 1);
    setFormData({
      ...formData,
      components: updatedComponents
    });
    toast.success('Composant supprimé');
  };

  const handleToggleHost = (hostId: string) => {
    if (selectedHosts.includes(hostId)) {
      setSelectedHosts(selectedHosts.filter(id => id !== hostId));
    } else {
      setSelectedHosts([...selectedHosts, hostId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Le nom du service est requis');
      return;
    }

    if (formData.components.length === 0) {
      toast.error('Veuillez ajouter au moins un composant');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section générale */}
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('general')}
          >
            <h3 className="text-md font-medium text-gray-900">Informations générales</h3>
            {expandedSection === 'general' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSection === 'general' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom du service <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="E-Commerce"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SLA cible
                </label>
                <input
                  type="text"
                  name="sla"
                  value={formData.sla}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="99.9%"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Algorithme de calcul
                </label>
                <select
                  name="algorithm"
                  value={formData.algorithm}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value={0}>Propagation critique (le pire statut)</option>
                  <option value={1}>Moyenne pondérée</option>
                  <option value={2}>Seuil de tolérance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Type</label>
                    <input
                      type="text"
                      name="type"
                      value={formData.tags?.type || ''}
                      onChange={handleTagChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="business_service"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Environnement</label>
                    <input
                      type="text"
                      name="environment"
                      value={formData.tags?.environment || ''}
                      onChange={handleTagChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="production"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Propriétaire</label>
                    <input
                      type="text"
                      name="owner"
                      value={formData.tags?.owner || ''}
                      onChange={handleTagChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="E-Commerce Team"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Criticité</label>
                    <input
                      type="text"
                      name="criticality"
                      value={formData.tags?.criticality || ''}
                      onChange={handleTagChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="high"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Section composants */}
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('components')}
          >
            <h3 className="text-md font-medium text-gray-900">Composants du service</h3>
            {expandedSection === 'components' ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSection === 'components' && (
            <div className="p-4 space-y-4">
              {/* Liste des composants existants */}
              {formData.components.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-medium text-gray-700">Composants ajoutés</h4>
                  <div className="divide-y divide-gray-200 border rounded-md">
                    {formData.components.map((component, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{component.name}</div>
                          <div className="text-sm text-gray-500">
                            {component.hosts.length} hôtes | SLA: {component.sla} | Impact: {component.impact}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Formulaire d'ajout de composant */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Ajouter un composant</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nom du composant <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newComponent.name}
                        onChange={handleComponentInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Frontend"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        SLA cible
                      </label>
                      <input
                        type="text"
                        name="sla"
                        value={newComponent.sla}
                        onChange={handleComponentInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="99.9%"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Algorithme de calcul
                      </label>
                      <select
                        name="algorithm"
                        value={newComponent.algorithm}
                        onChange={handleComponentInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value={0}>Propagation critique (le pire statut)</option>
                        <option value={1}>Moyenne pondérée</option>
                        <option value={2}>Seuil de tolérance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Impact
                      </label>
                      <select
                        name="impact"
                        value={newComponent.impact}
                        onChange={handleComponentInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="critical">Critique</option>
                        <option value="high">Élevé</option>
                        <option value="medium">Moyen</option>
                        <option value="low">Faible</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Type</label>
                        <input
                          type="text"
                          name="type"
                          value={newComponent.tags?.type || ''}
                          onChange={handleComponentTagChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="component"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Catégorie</label>
                        <input
                          type="text"
                          name="category"
                          value={newComponent.tags?.category || ''}
                          onChange={handleComponentTagChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="frontend"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hôtes <span className="text-red-500">*</span>
                    </label>
                    <div className="flex mb-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Rechercher des hôtes..."
                      />
                    </div>
                    
                    {loadingHosts ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border rounded-md">
                        {filteredHosts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">Aucun hôte trouvé</div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filteredHosts.map((host) => (
                              <div key={host.hostid} className="p-2 flex items-center">
                                <input
                                  type="checkbox"
                                  id={`host-${host.hostid}`}
                                  checked={selectedHosts.includes(host.hostid)}
                                  onChange={() => handleToggleHost(host.hostid)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`host-${host.hostid}`} className="ml-2 block text-sm text-gray-900">
                                  {host.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 text-sm text-gray-500">
                      {selectedHosts.length} hôte(s) sélectionné(s)
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddComponent}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le composant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Shield className="h-4 w-4 mr-2" />
            Créer le service
          </button>
        </div>
      </form>
    </div>
  );
}
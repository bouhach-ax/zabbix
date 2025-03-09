import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ServiceDefinitionForm from '../components/ServiceDefinitionForm';
import { ServiceDefinition } from '../types/zabbix';

export default function ServiceCreationPage() {
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  const createServiceMutation = useMutation({
    mutationFn: async (serviceDefinition: ServiceDefinition) => {
      if (!config) throw new Error('Configuration Zabbix manquante');
      
      const api = new ZabbixAPI(config);
      
      // Convertir les tags en format attendu par l'API
      const serviceTags = Object.entries(serviceDefinition.tags || {}).map(([key, value]) => ({
        tag: key,
        value
      }));
      
      // Créer le service parent
      const serviceResult = await api.createService({
        name: serviceDefinition.name,
        algorithm: serviceDefinition.algorithm,
        sortorder: 1,
        weight: 1,
        tags: serviceTags
      });
      
      const serviceId = serviceResult.serviceids[0];
      
      // Créer les composants
      for (const component of serviceDefinition.components) {
        // Convertir les tags du composant
        const componentTags = Object.entries(component.tags || {}).map(([key, value]) => ({
          tag: key,
          value
        }));
        
        // Ajouter les tags standards
        componentTags.push({ tag: 'component', value: component.name });
        componentTags.push({ tag: 'impact', value: component.impact });
        componentTags.push({ tag: 'sla', value: component.sla });
        
        // Créer le composant
        const componentResult = await api.createService({
          name: `${serviceDefinition.name} - ${component.name}`,
          parentid: serviceId,
          algorithm: component.algorithm,
          sortorder: 1,
          weight: 1,
          tags: componentTags
        });
        
        const componentId = componentResult.serviceids[0];
        
        // Récupérer les triggers des hôtes
        if (component.hosts.length > 0) {
          const triggers = await api.getTriggers(component.hosts);
          
          // Lier le premier trigger critique au composant si disponible
          if (triggers.length > 0) {
            const criticalTriggers = triggers.filter((t: any) => t.priority >= 4);
            const triggerToLink = criticalTriggers.length > 0 ? criticalTriggers[0] : triggers[0];
            
            await api.linkServiceToTrigger(componentId, triggerToLink.triggerid);
          }
        }
      }
      
      return serviceId;
    },
    onSuccess: (serviceId) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setCreatedServiceId(serviceId);
      setCreationSuccess(true);
      toast.success('Service créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création du service: ${error.message}`);
    },
    onSettled: () => {
      setIsCreating(false);
    }
  });

  const handleSubmit = (serviceDefinition: ServiceDefinition) => {
    setIsCreating(true);
    createServiceMutation.mutate(serviceDefinition);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/service-monitoring')}
          className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Création d'un service</h1>
      </div>

      {creationSuccess ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Service créé avec succès</h2>
          <p className="mt-2 text-sm text-gray-500">
            Le service a été créé avec succès dans Zabbix.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/service-monitoring')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Shield className="h-4 w-4 mr-2" />
              Voir les services
            </button>
            <button
              onClick={() => {
                setCreationSuccess(false);
                setCreatedServiceId(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer un autre service
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Créez un service métier avec ses composants et définissez les SLA associés. Les services seront automatiquement liés aux hôtes sélectionnés.
                </p>
              </div>
            </div>
          </div>

          <ServiceDefinitionForm 
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}
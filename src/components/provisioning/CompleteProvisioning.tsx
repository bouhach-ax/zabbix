import React, { useState } from 'react';
import { Upload, HelpCircle } from 'lucide-react';
import { ProvisioningHost } from '../../types/zabbix';
import { toast } from 'react-hot-toast';
import { ZabbixAPI } from '../../lib/api';
import { useConfig } from '../../lib/config';
import { inventoryService } from '../../lib/supabase';
import TagSelector from './TagSelector';

const REQUIRED_TAGS = [
  { key: 'service', description: 'Nom du service métier (ex: E-Commerce, CRM)' },
  { key: 'component', description: 'Composant technique (ex: Frontend, Backend, Database)' },
  { key: 'impact', description: 'Impact sur le service (critical, high, medium, low)' },
  { key: 'category', description: 'Catégorie technique (performance, availability, security)' },
  { key: 'sla', description: 'Niveau de SLA requis (ex: 99.9%)' }
];

const OPTIONAL_TAGS = [
  { key: 'environment', description: 'Environnement (production, staging, development)' },
  { key: 'owner', description: 'Équipe responsable' },
  { key: 'criticality', description: 'Niveau de criticité métier (1-5)' },
];

export default function CompleteProvisioning() {
  const { config } = useConfig();
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedHosts, setParsedHosts] = useState<ProvisioningHost[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedHostIndex, setSelectedHostIndex] = useState<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);

      try {
        // Parse CSV content
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Vérifier les colonnes requises
        const requiredColumns = ['hostname', 'ip_address', 'template_names', 'group_name'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          toast.error(`Colonnes manquantes: ${missingColumns.join(', ')}`);
          return;
        }

        // Parse les hôtes
        const hosts: ProvisioningHost[] = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            const host: ProvisioningHost = {
              hostname: values[headers.indexOf('hostname')],
              ip_address: values[headers.indexOf('ip_address')],
              template_names: values[headers.indexOf('template_names')].split(';'),
              group_name: values[headers.indexOf('group_name')],
              tags: {},
            };

            // Parse les tags s'ils sont présents dans le CSV
            REQUIRED_TAGS.forEach(({ key }) => {
              const index = headers.indexOf(`tag_${key}`);
              if (index !== -1) {
                host.tags![key] = values[index];
              }
            });

            OPTIONAL_TAGS.forEach(({ key }) => {
              const index = headers.indexOf(`tag_${key}`);
              if (index !== -1) {
                host.tags![key] = values[index];
              }
            });

            return host;
          });

        setParsedHosts(hosts);
        toast.success(`${hosts.length} hôtes analysés avec succès`);
      } catch (error) {
        toast.error('Erreur lors du parsing du CSV: ' + error);
      }
    };

    reader.readAsText(file);
  };

  const validateTags = (host: ProvisioningHost): boolean => {
    const missingTags = REQUIRED_TAGS
      .map(tag => tag.key)
      .filter(key => !host.tags?.[key]);

    if (missingTags.length > 0) {
      toast.error(`Tags obligatoires manquants pour ${host.hostname}: ${missingTags.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleProvision = async () => {
    if (!config) {
      toast.error('Configuration Zabbix manquante');
      return;
    }

    // Vérifier les tags obligatoires
    const invalidHosts = parsedHosts.filter(host => !validateTags(host));
    if (invalidHosts.length > 0) {
      return;
    }

    setIsProcessing(true);
    const api = new ZabbixAPI(config);

    try {
      // Organiser les hôtes par service et composant
      const serviceMap = new Map<string, Map<string, ProvisioningHost[]>>();
      
      for (const host of parsedHosts) {
        const serviceName = host.tags?.service;
        const componentName = host.tags?.component;
        
        if (!serviceName || !componentName) continue;
        
        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, new Map<string, ProvisioningHost[]>());
        }
        
        const componentMap = serviceMap.get(serviceName)!;
        if (!componentMap.has(componentName)) {
          componentMap.set(componentName, []);
        }
        
        componentMap.get(componentName)!.push(host);
      }

      // Créer les services et composants
      for (const [serviceName, componentMap] of serviceMap.entries()) {
        // Vérifier si le service existe déjà
        const existingServices = await api.getServiceByName(serviceName);
        let serviceId: string;
        
        if (existingServices.length === 0) {
          // Créer le service parent
          const serviceResult = await api.createService({
            name: serviceName,
            algorithm: 0, // Propagation critique par défaut
            sortorder: 1,
            weight: 1,
            tags: [
              { tag: 'type', value: 'business_service' }
            ]
          });
          serviceId = serviceResult.serviceids[0];
          toast.success(`Service "${serviceName}" créé avec succès`);
        } else {
          serviceId = existingServices[0].serviceid;
          toast.info(`Service "${serviceName}" existe déjà, utilisation de l'existant`);
        }
        
        // Créer les composants
        for (const [componentName, hosts] of componentMap.entries()) {
          // Vérifier si le composant existe déjà
          const componentFullName = `${serviceName} - ${componentName}`;
          const existingComponents = await api.getServiceByName(componentFullName);
          let componentId: string;
          
          // Déterminer l'algorithme en fonction de l'impact
          const impactValue = hosts[0].tags?.impact || 'medium';
          let algorithm = 1; // Moyenne pondérée par défaut
          
          if (impactValue === 'critical') {
            algorithm = 0; // Propagation critique
          } else if (impactValue === 'low') {
            algorithm = 2; // Seuil de tolérance
          }
          
          if (existingComponents.length === 0) {
            // Créer le composant
            const componentResult = await api.createService({
              name: componentFullName,
              parentid: serviceId,
              algorithm: algorithm,
              sortorder: 1,
              weight: 1,
              tags: [
                { tag: 'type', value: 'component' },
                { tag: 'component', value: componentName },
                { tag: 'impact', value: impactValue },
                { tag: 'sla', value: hosts[0].tags?.sla || '99.9%' }
              ]
            });
            componentId = componentResult.serviceids[0];
            toast.success(`Composant "${componentFullName}" créé avec succès`);
          } else {
            componentId = existingComponents[0].serviceid;
            toast.info(`Composant "${componentFullName}" existe déjà, utilisation de l'existant`);
          }
          
          // Créer les hôtes et les lier au composant
          for (const host of hosts) {
            // Créer l'hôte
            const hostResult = await api.createHost(host);
            const hostId = hostResult.hostids[0];
            
            // Récupérer les triggers de l'hôte
            const hostDetails = await api.getHost(hostId);
            const triggers = hostDetails.triggers || [];
            
            if (triggers.length > 0) {
              // Lier le premier trigger critique au composant
              const criticalTriggers = triggers.filter((t: any) => t.priority >= 4);
              const triggerToLink = criticalTriggers.length > 0 ? criticalTriggers[0] : triggers[0];
              
              await api.linkServiceToTrigger(componentId, triggerToLink.triggerid);
              toast.success(`Hôte "${host.hostname}" lié au composant "${componentFullName}"`);
            }
            
            // Sauvegarder les tags dans Supabase
            if (host.tags && Object.keys(host.tags).length > 0) {
              for (const [key, value] of Object.entries(host.tags)) {
                try {
                  await inventoryService.createTag({
                    key,
                    value,
                    description: `Tag créé lors du provisioning de ${host.hostname}`
                  });
                } catch (error) {
                  console.log('Tag déjà existant:', error);
                }
              }
            }
          }
        }
      }
      
      toast.success('Provisioning terminé avec succès');
      setParsedHosts([]);
      setCsvContent('');
      setSelectedHostIndex(null);
    } catch (error) {
      toast.error(`Erreur lors du provisioning: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTagsChange = (index: number, tags: Record<string, string>) => {
    const updatedHosts = [...parsedHosts];
    updatedHosts[index] = {
      ...updatedHosts[index],
      tags
    };
    setParsedHosts(updatedHosts);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-secondary-600">Import CSV Complet</h2>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center text-secondary-500 hover:text-secondary-700"
            title="Voir le guide d'importation"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 cursor-pointer transition-colors duration-200">
          <Upload className="h-4 w-4 mr-2" />
          Sélectionner un fichier
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Guide d'importation */}
      {showGuide && (
        <div className="mb-6 bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <h3 className="text-sm font-medium text-secondary-700 mb-2">Guide d'importation CSV</h3>
          <div className="space-y-3 text-sm text-secondary-600">
            <p>Le fichier CSV doit respecter le format suivant :</p>
            <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs overflow-x-auto">
              hostname,ip_address,template_names,group_name,tag_service,tag_component,tag_impact,tag_category,tag_sla,tag_environment,tag_owner,tag_criticality
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Colonnes obligatoires :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>hostname</strong> : Nom unique de l'hôte (ex: srv-linux-01)</li>
                <li><strong>ip_address</strong> : Adresse IP de l'hôte (ex: 192.168.1.10)</li>
                <li><strong>template_names</strong> : Liste des templates séparés par des points-virgules</li>
                <li><strong>group_name</strong> : Nom du groupe d'hôtes</li>
                {REQUIRED_TAGS.map(tag => (
                  <li key={tag.key}>
                    <strong>tag_{tag.key}</strong> : {tag.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Tags optionnels :</p>
              <ul className="list-disc pl-5 space-y-1">
                {OPTIONAL_TAGS.map(tag => (
                  <li key={tag.key}>
                    <strong>tag_{tag.key}</strong> : {tag.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Exemple de contenu :</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs whitespace-pre">
hostname,ip_address,template_names,group_name,tag_service,tag_component,tag_impact,tag_category,tag_sla,tag_environment,tag_owner
web-server-01,192.168.1.30,Template OS Linux by Zabbix agent;Template App HTTP Service,Web Servers,E-Commerce,Frontend,high,availability,99.9%,production,WebTeam
db-server-01,192.168.1.40,Template OS Linux by Zabbix agent;Template App MySQL,Database Servers,E-Commerce,Database,critical,performance,99.99%,production,DBTeam</div>
            </div>
          </div>
        </div>
      )}

      {/* Aperçu des hôtes parsés */}
      {parsedHosts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-secondary-600 mb-4">
            Aperçu des hôtes à provisionner
          </h3>
          <div className="space-y-4">
            {parsedHosts.map((host, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-secondary-900">{host.hostname}</h4>
                    <p className="text-sm text-secondary-500">IP: {host.ip_address}</p>
                    <p className="text-sm text-secondary-500">Groupe: {host.group_name}</p>
                    <p className="text-sm text-secondary-500">
                      Templates: {host.template_names.join(', ')}
                    </p>
                    {/* Afficher les tags existants */}
                    {host.tags && Object.keys(host.tags).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-secondary-700">Tags configurés:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(host.tags).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedHostIndex(selectedHostIndex === index ? null : index)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {selectedHostIndex === index ? 'Masquer' : 'Configurer les tags'}
                  </button>
                </div>

                {selectedHostIndex === index && (
                  <div className="mt-4 border-t pt-4">
                    <TagSelector
                      selectedTags={host.tags || {}}
                      onTagsChange={(tags) => handleTagsChange(index, tags)}
                      requiredTags={REQUIRED_TAGS}
                      optionalTags={OPTIONAL_TAGS}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleProvision}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Provisioning en cours...
                </>
              ) : (
                'Lancer le provisioning'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
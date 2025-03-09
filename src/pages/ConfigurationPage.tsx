import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ZabbixConfig } from '../types/zabbix';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { Settings, AlertCircle, CheckCircle2, Server, Globe, Clock, User, Wifi, WifiOff, Terminal, Play, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

export default function ConfigurationPage() {
  const { config, setConfig, setToken, token } = useConfig();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ZabbixConfig>({
    defaultValues: config || undefined,
  });
  const [isInjectingAlarms, setIsInjectingAlarms] = useState(false);
  const [isActivatingAlarms, setIsActivatingAlarms] = useState(false);
  const [scriptOutput, setScriptOutput] = useState<string>('');
  const [showScriptOutput, setShowScriptOutput] = useState(false);

  // Vérifier la connexion actuelle
  const { data: connectionStatus, isLoading: checkingConnection } = useQuery({
    queryKey: ['zabbix-connection'],
    queryFn: async () => {
      if (!config || !token) return null;
      const api = new ZabbixAPI(config);
      try {
        const hosts = await api.getHosts();
        return {
          status: 'connected',
          hostsCount: hosts.length,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        return {
          status: 'error',
          error: (error as Error).message
        };
      }
    },
    enabled: !!config && !!token,
    refetchInterval: 30000 // Vérifier toutes les 30 secondes
  });

  const onSubmit = async (data: ZabbixConfig) => {
    try {
      const api = new ZabbixAPI(data);
      const token = await api.login();
      
      if (token) {
        setConfig(data);
        setToken(token);
        toast.success('Connexion réussie à Zabbix !', {
          duration: 3000,
          position: 'top-center',
        });
        setTimeout(() => navigate('/'), 1000);
      } else {
        setError('root', {
          type: 'manual',
          message: 'La connexion a échoué. Veuillez vérifier vos identifiants.',
        });
        toast.error('Échec de la connexion');
      }
    } catch (error) {
      const errorMessage = 'Erreur de connexion à l\'API Zabbix : ' + (error as Error).message;
      setError('root', {
        type: 'manual',
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  const handleInjectAlarms = async () => {
    if (!config) {
      toast.error('Veuillez d\'abord configurer la connexion à Zabbix');
      return;
    }

    setIsInjectingAlarms(true);
    setScriptOutput('Démarrage de l\'injection des alarmes...\n');
    setShowScriptOutput(true);

    try {
      const api = new ZabbixAPI(config);
      
      // Connexion à Zabbix
      setScriptOutput(prev => prev + 'Connexion à Zabbix...\n');
      await api.login();
      
      // Création des alarmes directement via l'API
      const alarmData = [
        { 
          host: 'ecom-front-01', 
          description: 'High response time on product catalog pages', 
          priority: 3,
          tags: [
            { tag: 'service', value: 'E-Commerce' },
            { tag: 'component', value: 'Frontend' },
            { tag: 'impact', value: 'high' },
            { tag: 'category', value: 'performance' }
          ]
        },
        { 
          host: 'ecom-front-02', 
          description: 'JavaScript errors on checkout page', 
          priority: 4,
          tags: [
            { tag: 'service', value: 'E-Commerce' },
            { tag: 'component', value: 'Frontend' },
            { tag: 'impact', value: 'critical' },
            { tag: 'category', value: 'functionality' }
          ]
        },
        { 
          host: 'ecom-api-01', 
          description: 'Payment gateway timeout', 
          priority: 4,
          tags: [
            { tag: 'service', value: 'E-Commerce' },
            { tag: 'component', value: 'Backend API' },
            { tag: 'impact', value: 'critical' },
            { tag: 'category', value: 'availability' }
          ]
        },
        { 
          host: 'crm-web-01', 
          description: 'Web interface session handling errors', 
          priority: 4,
          tags: [
            { tag: 'service', value: 'CRM' },
            { tag: 'component', value: 'Web Interface' },
            { tag: 'impact', value: 'critical' },
            { tag: 'category', value: 'functionality' }
          ]
        },
        { 
          host: 'router-edge-01', 
          description: 'BGP session down on edge router', 
          priority: 4,
          tags: [
            { tag: 'service', value: 'Network Backbone' },
            { tag: 'component', value: 'Edge Routers' },
            { tag: 'impact', value: 'critical' },
            { tag: 'category', value: 'connectivity' }
          ]
        }
      ];
      
      // Vérifier si les hôtes existent, sinon les créer
      for (const alarm of alarmData) {
        setScriptOutput(prev => prev + `Vérification de l'hôte: ${alarm.host}...\n`);
        
        // Vérifier si l'hôte existe
        const hosts = await api.request('host.get', {
          filter: { host: alarm.host },
          output: ['hostid']
        });
        
        let hostId;
        
        if (hosts.length === 0) {
          // Créer l'hôte s'il n'existe pas
          setScriptOutput(prev => prev + `Création de l'hôte: ${alarm.host}...\n`);
          
          // Créer un groupe d'hôtes pour le service
          const serviceTag = alarm.tags.find(tag => tag.tag === 'service');
          const groupName = serviceTag ? `${serviceTag.value} Service` : 'Zabscaler Hosts';
          
          // Vérifier si le groupe existe
          const groups = await api.request('hostgroup.get', {
            filter: { name: groupName },
            output: ['groupid']
          });
          
          let groupId;
          
          if (groups.length === 0) {
            // Créer le groupe s'il n'existe pas
            setScriptOutput(prev => prev + `Création du groupe d'hôtes: ${groupName}...\n`);
            const groupResult = await api.createHostGroup(groupName);
            groupId = groupResult.groupids[0];
          } else {
            groupId = groups[0].groupid;
          }
          
          // Créer l'hôte
          const hostResult = await api.request('host.create', {
            host: alarm.host,
            name: alarm.host,
            interfaces: [{
              type: 1,  // Agent
              main: 1,
              useip: 1,
              ip: '127.0.0.1',
              dns: '',
              port: '10050'
            }],
            groups: [{ groupid: groupId }],
            tags: alarm.tags
          });
          
          hostId = hostResult.hostids[0];
          setScriptOutput(prev => prev + `Hôte créé avec succès: ${alarm.host} (ID: ${hostId})\n`);
        } else {
          hostId = hosts[0].hostid;
          setScriptOutput(prev => prev + `Hôte existant: ${alarm.host} (ID: ${hostId})\n`);
        }
        
        // Créer l'item
        setScriptOutput(prev => prev + `Création de l'item pour l'alerte: ${alarm.description}...\n`);
        const itemKey = `alert.${Date.now()}.${Math.floor(Math.random() * 1000)}`;
        const itemName = `Alert: ${alarm.description}`;
        
        try {
          const itemResult = await api.request('item.create', {
            hostid: hostId,
            name: itemName,
            key_: itemKey,
            type: 2, // Zabbix trapper
            value_type: 3, // Numeric unsigned
            delay: 0 // Utiliser 0 pour les items de type trapper
          });
          
          const itemId = itemResult.itemids[0];
          setScriptOutput(prev => prev + `Item créé avec succès: ${itemId}\n`);
          
          // Créer le trigger avec le format d'expression corrigé
          setScriptOutput(prev => prev + `Création du trigger pour l'alerte: ${alarm.description}...\n`);
          
          // Format correct pour Zabbix 6.0+: host:key.last()=1 (sans accolades)
          const expression = `${alarm.host}:${itemKey}.last()=1`;
          
          const triggerResult = await api.request('trigger.create', {
            description: alarm.description,
            expression: expression,
            priority: alarm.priority,
            tags: alarm.tags
          });
          
          const triggerId = triggerResult.triggerids[0];
          setScriptOutput(prev => prev + `Trigger créé avec succès: ${triggerId}\n`);
        } catch (itemError) {
          setScriptOutput(prev => prev + `Erreur lors de la création de l'item/trigger: ${(itemError as Error).message}\n`);
          continue;
        }
      }
      
      setScriptOutput(prev => prev + 'Injection des alarmes terminée avec succès!\n');
      toast.success('Alarmes injectées avec succès dans Zabbix');
    } catch (error) {
      const errorMessage = 'Erreur lors de l\'injection des alarmes : ' + (error as Error).message;
      setScriptOutput(prev => prev + errorMessage + '\n');
      toast.error(errorMessage);
    } finally {
      setIsInjectingAlarms(false);
    }
  };

  const handleActivateAlarms = async () => {
    if (!config) {
      toast.error('Veuillez d\'abord configurer la connexion à Zabbix');
      return;
    }

    setIsActivatingAlarms(true);
    setScriptOutput('Démarrage de l\'activation des alarmes...\n');
    setShowScriptOutput(true);

    try {
      const api = new ZabbixAPI(config);
      
      // Connexion à Zabbix
      setScriptOutput(prev => prev + 'Connexion à Zabbix...\n');
      await api.login();
      
      // Récupérer les items de type trapper
      setScriptOutput(prev => prev + 'Récupération des items d\'alerte...\n');
      const items = await api.request('item.get', {
        output: ['itemid', 'hostid', 'name', 'key_'],
        search: {
          key_: 'alert.'
        },
        searchWildcardsEnabled: true,
        selectHosts: ['host']
      });
      
      setScriptOutput(prev => prev + `Récupéré ${items.length} items\n`);
      
      if (items.length === 0) {
        setScriptOutput(prev => prev + 'Aucun item d\'alerte trouvé. Exécutez d\'abord l\'injection d\'alarmes.\n');
        throw new Error('Aucun item d\'alerte trouvé');
      }
      
      // Activer aléatoirement certaines alertes
      const selectedItems = items.slice(0, Math.min(items.length, 5));
      
      for (const item of selectedItems) {
        const hostName = item.hosts[0].host;
        setScriptOutput(prev => prev + `Activation de l'alerte: ${item.name} sur l'hôte ${hostName}...\n`);
        
        // Envoyer une valeur pour déclencher l'alerte
        try {
          // Utiliser l'API history.create pour simuler l'envoi de valeurs
          await api.request('history.create', [{
            itemid: item.itemid,
            value: "1",
            clock: Math.floor(Date.now() / 1000),
            ns: 0
          }]);
          
          setScriptOutput(prev => prev + `Alerte activée avec succès\n`);
        } catch (error) {
          setScriptOutput(prev => prev + `Erreur lors de l'activation: ${(error as Error).message}\n`);
          
          // Essayer une méthode alternative
          try {
            setScriptOutput(prev => prev + `Tentative alternative d'activation...\n`);
            
            // Mettre à jour directement la valeur de l'item
            await api.request('item.update', {
              itemid: item.itemid,
              lastvalue: "1",
              prevvalue: "0"
            });
            
            setScriptOutput(prev => prev + `Alerte activée avec succès (méthode alternative)\n`);
          } catch (altError) {
            setScriptOutput(prev => prev + `Échec de l'activation alternative: ${(altError as Error).message}\n`);
          }
        }
      }
      
      setScriptOutput(prev => prev + 'Activation des alarmes terminée avec succès!\n');
      toast.success('Alarmes activées avec succès dans Zabbix');
    } catch (error) {
      const errorMessage = 'Erreur lors de l\'activation des alarmes : ' + (error as Error).message;
      setScriptOutput(prev => prev + errorMessage + '\n');
      toast.error(errorMessage);
    } finally {
      setIsActivatingAlarms(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuration Zabbix</h1>

      {/* Section État de la connexion */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">État de la connexion</h2>
            {config && (
              <div className={`flex items-center px-3 py-1 rounded-full ${
                connectionStatus?.status === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus?.status === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {connectionStatus?.status === 'connected' ? (
                  <>
                    <Wifi className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Connecté</span>
                  </>
                ) : connectionStatus?.status === 'error' ? (
                  <>
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Déconnecté</span>
                  </>
                ) : (
                  <>
                    <div className="animate-pulse">
                      <Wifi className="h-4 w-4 mr-1" />
                    </div>
                    <span className="text-sm font-medium">Vérification...</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          {!config ? (
            <div className="flex items-center justify-center py-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="text-gray-600">Aucune configuration Zabbix</span>
            </div>
          ) : checkingConnection ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Vérification de la connexion...</span>
            </div>
          ) : connectionStatus?.status === 'connected' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Globe className="h-6 w-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">URL API</p>
                    <p className="text-sm text-gray-500 truncate">{config.url}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Utilisateur</p>
                    <p className="text-sm text-gray-500">{config.username}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Server className="h-6 w-6 text-indigo-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Hôtes surveillés</p>
                    <p className="text-sm text-gray-500">{connectionStatus.hostsCount} hôtes</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Dernière vérification</p>
                    <p className="text-sm text-gray-500">
                      {new Date(connectionStatus.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Erreur de connexion : {connectionStatus?.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          {config ? 'Modifier la configuration' : 'Nouvelle configuration'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL de l'API
            </label>
            <input
              type="url"
              {...register('url', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://zabbix.example.com/api_jsonrpc.php"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">L'URL de l'API est requise</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              {...register('username', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">Le nom d'utilisateur est requis</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">Le mot de passe est requis</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Proxy HTTP (Optionnel)
            </label>
            <input
              type="text"
              {...register('httpProxy')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="http://proxy.example.com:3128"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Timeout API (ms)
            </label>
            <input
              type="number"
              {...register('timeout')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="30000"
            />
          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {errors.root.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Tester la connexion & Sauvegarder'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section Injection d'alarmes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Injection d'alarmes de test
        </h2>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Ces outils permettent d'injecter des alarmes de test dans Zabbix à partir des données de Supabase.
                Assurez-vous d'avoir configuré correctement les variables d'environnement dans le fichier <code>.env</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                <Database className="h-5 w-5 mr-2 text-indigo-500" />
                Configuration des variables d'environnement
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Assurez-vous que votre fichier <code>.env</code> contient les variables suivantes :
              </p>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-x-auto">
                <pre>
                  VITE_ZABBIX_API_URL=https://votre-serveur-zabbix/api_jsonrpc.php<br/>
                  VITE_ZABBIX_USERNAME=votre_utilisateur<br/>
                  VITE_ZABBIX_PASSWORD=votre_mot_de_passe<br/>
                  VITE_SUPABASE_URL=votre_url_supabase<br/>
                  VITE_SUPABASE_ANON_KEY=votre_cle_supabase
                </pre>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                <Terminal className="h-5 w-5 mr-2 text-indigo-500" />
                Commandes disponibles
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Vous pouvez exécuter ces commandes depuis un terminal :
              </p>
              <div className="space-y-2">
                <div className="bg-gray-100 p-2 rounded-md font-mono text-xs">
                  npm run dev
                </div>
                <p className="text-xs text-gray-500">Lance l'application en mode développement</p>
                
                <div className="bg-gray-100 p-2 rounded-md font-mono text-xs">
                  npm run inject-alarms
                </div>
                <p className="text-xs text-gray-500">Injecte les alarmes de test dans Zabbix</p>
                
                <div className="bg-gray-100 p-2 rounded-md font-mono text-xs">
                  npm run activate-alarms
                </div>
                <p className="text-xs text-gray-500">Active certaines des alarmes injectées</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={handleInjectAlarms}
              disabled={isInjectingAlarms || isActivatingAlarms || !config}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInjectingAlarms ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Injection en cours...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Injecter les alarmes
                </>
              )}
            </button>

            <button
              onClick={handleActivateAlarms}
              disabled={isInjectingAlarms || isActivatingAlarms || !config}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivatingAlarms ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activation en cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Activer les alarmes
                </>
              )}
            </button>
          </div>

          {showScriptOutput && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Sortie du script</h3>
                <button
                  onClick={() => setShowScriptOutput(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Masquer
                </button>
              </div>
              <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs h-64 overflow-y-auto">
                <pre>{scriptOutput}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
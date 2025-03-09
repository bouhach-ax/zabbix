import axios, { AxiosError } from 'axios';
import { ZabbixConfig, ProvisioningHost, TagItem, ZabbixService, ServiceSLA } from '../types/zabbix';

export class ZabbixAPI {
  private token: string | null = null;
  private config: ZabbixConfig;

  constructor(config: ZabbixConfig) {
    this.config = config;
  }

  private async request(method: string, params: any = {}) {
    try {
      const response = await axios.post(
        this.config.url,
        {
          jsonrpc: '2.0',
          method,
          params,
          id: 1,
          auth: method === 'user.login' ? null : this.token
        },
        {
          headers: {
            'Content-Type': 'application/json-rpc',
          },
          ...(this.config.httpProxy ? { proxy: { host: this.config.httpProxy } } : {}),
          timeout: this.config.timeout || 30000,
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.data || response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(axiosError.message);
      }
      throw error;
    }
  }

  async login() {
    try {
      const result = await this.request('user.login', {
        username: this.config.username,
        password: this.config.password
      });
      
      if (typeof result === 'string' && result.length > 0) {
        this.token = result;
        return result;
      } else {
        throw new Error('Invalid token received from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async getHosts() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('host.get', {
        output: ['hostid', 'host', 'name', 'status'],
        selectTags: 'extend',
        selectInterfaces: 'extend',
        selectGroups: 'extend',
        selectParentTemplates: ['templateid', 'name', 'description'],
        selectItems: ['itemid', 'name', 'key_', 'status'],
        selectTriggers: ['triggerid', 'description', 'priority', 'status', 'value', 'lastchange']
      });
    } catch (error) {
      console.error("Failed to get hosts:", error);
      return [];
    }
  }

  async getServices() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('service.get', {
        output: 'extend',
        selectTags: 'extend',
        selectChildren: 'extend',
        selectParents: 'extend',
        selectProblemTags: 'extend'
      });
    } catch (error) {
      console.error("Failed to get services:", error);
      return [];
    }
  }

  async createService(serviceData: Partial<ZabbixService>) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }

    // Ensure required fields are present with correct parameters according to Zabbix API
    const requiredData = {
      name: serviceData.name,
      algorithm: serviceData.algorithm || 1,
      sortorder: serviceData.sortorder || 1,
      weight: serviceData.weight || 1,
      tags: serviceData.tags || [],
      parentid: serviceData.parentid,
      triggerid: serviceData.triggerid,
      problem_tags: serviceData.problem_tags || []
    };

    return this.request('service.create', requiredData);
  }

  async updateService(serviceId: string, updates: Partial<ZabbixService>) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('service.update', {
      serviceid: serviceId,
      ...updates
    });
  }

  async deleteService(serviceId: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('service.delete', [serviceId]);
  }

  async getServiceSLA(serviceId: string, periodFrom: number, periodTo: number): Promise<ServiceSLA> {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('service.getsla', {
      serviceids: serviceId,
      intervals: [{
        from: periodFrom,
        to: periodTo
      }]
    });
  }

  async getTemplates() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('template.get', {
        output: ['templateid', 'name', 'description'],
        selectItems: ['itemid', 'name', 'key_', 'status']
      });
    } catch (error) {
      console.error("Failed to get templates:", error);
      return [];
    }
  }

  async getItems(templateId: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('item.get', {
        output: ['itemid', 'name', 'key_', 'status'],
        templateids: [templateId]
      });
    } catch (error) {
      console.error("Failed to get items:", error);
      return [];
    }
  }

  async updateItemStatus(itemId: string, status: number) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('item.update', {
      itemid: itemId,
      status: status  // 0 = enabled, 1 = disabled
    });
  }

  async createHost(hostData: ProvisioningHost) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    const zabbixHostData: any = {
      host: hostData.hostname,
      interfaces: [{
        type: 1,  // Agent
        main: 1,
        useip: 1,
        ip: hostData.ip_address,
        dns: "",
        port: "10050"
      }],
      groups: [{ name: hostData.group_name }],
      templates: hostData.template_names.map(name => ({ name }))
    };
    
    if (hostData.proxy_name) {
      zabbixHostData.proxy_hostid = hostData.proxy_name;
    }
    
    if (hostData.tags) {
      zabbixHostData.tags = Object.entries(hostData.tags).map(([key, value]) => ({
        tag: key,
        value
      }));
    }
    
    return this.request('host.create', zabbixHostData);
  }

  async getHostGroups() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('hostgroup.get', {
        output: ['groupid', 'name']
      });
    } catch (error) {
      console.error("Failed to get host groups:", error);
      return [];
    }
  }

  async createHostGroup(name: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('hostgroup.create', {
      name
    });
  }

  async updateHostGroup(groupId: string, updates: any) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('hostgroup.update', {
      groupid: groupId,
      ...updates
    });
  }

  async deleteHostGroup(groupId: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('hostgroup.delete', [groupId]);
  }

  async getProxies() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('proxy.get', {
        output: ['proxyid', 'host', 'status']
      });
    } catch (error) {
      console.error("Failed to get proxies:", error);
      return [];
    }
  }

  async getAlerts() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('trigger.get', {
        output: ['triggerid', 'description', 'priority', 'value', 'lastchange'],
        selectHosts: ['hostid', 'name'],
        selectItems: ['itemid', 'name'],
        selectTags: 'extend',
        filter: {
          value: 1  // Only active problems
        },
        sortfield: 'lastchange',
        sortorder: 'DESC',
        limit: 100
      });
    } catch (error) {
      console.error("Failed to get alerts:", error);
      return [];
    }
  }

  async getProblems() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('problem.get', {
        output: 'extend',
        selectAcknowledges: 'extend',
        recent: true,
        sortfield: ['eventid'],
        sortorder: 'DESC'
      });
    } catch (error) {
      console.error("Failed to get problems:", error);
      return [];
    }
  }

  async getHost(hostId: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('host.get', {
      output: 'extend',
      hostids: [hostId],
      selectInterfaces: 'extend',
      selectGroups: 'extend',
      selectParentTemplates: 'extend',
      selectTriggers: 'extend'
    });
  }

  async getHostInventory() {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('host.get', {
        output: ['hostid', 'name', 'status'],
        selectInventory: true,
        selectInterfaces: true
      });
    } catch (error) {
      console.error("Failed to get host inventory:", error);
      return [];
    }
  }

  async deleteHosts(hostIds: string[]) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('host.delete', hostIds);
  }

  async assignTemplateToHosts(templateId: string, hostIds: string[]) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }

    try {
      // Récupérer les informations actuelles des hôtes
      const hosts = await this.request('host.get', {
        hostids: hostIds,
        selectParentTemplates: ['templateid'],
        selectInterfaces: 'extend'
      });

      // Pour chaque hôte
      for (const host of hosts) {
        // Vérifier si l'hôte a une interface agent
        const hasAgentInterface = host.interfaces.some((iface: any) => iface.type === '1');
        
        // Si l'hôte n'a pas d'interface agent, en créer une
        if (!hasAgentInterface) {
          // Créer une interface agent par défaut
          await this.request('hostinterface.create', {
            hostid: host.hostid,
            type: 1, // Agent
            main: 1,
            useip: 1,
            ip: '127.0.0.1',
            dns: '',
            port: '10050'
          });
        }

        // Mettre à jour les templates de l'hôte
        const existingTemplates = host.parentTemplates || [];
        const existingTemplateIds = existingTemplates.map((t: any) => ({ templateid: t.templateid }));
        
        // Ajouter le nouveau template s'il n'existe pas déjà
        if (!existingTemplateIds.some((t: any) => t.templateid === templateId)) {
          existingTemplateIds.push({ templateid: templateId });
        }

        // Mettre à jour l'hôte avec la nouvelle liste de templates
        await this.request('host.update', {
          hostid: host.hostid,
          templates: existingTemplateIds
        });
      }

      return true;
    } catch (error) {
      console.error('Error assigning template:', error);
      throw error;
    }
  }

  async getTriggers(hostIds: string[]) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('trigger.get', {
        output: ['triggerid', 'description', 'priority', 'status', 'value'],
        hostids: hostIds,
        filter: {
          status: 0 // Only enabled triggers
        }
      });
    } catch (error) {
      console.error("Failed to get triggers:", error);
      return [];
    }
  }

  async linkServiceToTrigger(serviceId: string, triggerId: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    return this.request('service.update', {
      serviceid: serviceId,
      triggerid: triggerId
    });
  }

  async getServiceByName(serviceName: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('service.get', {
        filter: {
          name: serviceName
        },
        output: 'extend'
      });
    } catch (error) {
      console.error("Failed to get service by name:", error);
      return [];
    }
  }
  
  async createServiceHierarchy(serviceName: string, components: any[], algorithm: number = 1, tags: any[] = []) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    // Create parent service
    const parentService = await this.request('service.create', {
      name: serviceName,
      algorithm: algorithm,
      sortorder: 1,
      weight: 1,
      tags: tags
    });
    
    const parentServiceId = parentService.serviceids[0];
    
    // Create child services
    for (const component of components) {
      await this.request('service.create', {
        name: component.name,
        parentid: parentServiceId,
        algorithm: component.algorithm || 1,
        sortorder: component.sortorder || 1,
        weight: component.weight || 1,
        tags: component.tags || []
      });
    }
    
    return parentServiceId;
  }

  // Nouvelle méthode pour acquitter les événements
  async acknowledgeEvents(eventIds: string[], message: string = 'Acknowledged via Zabscaler') {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    return this.request('event.acknowledge', {
      eventids: eventIds,
      action: 6, // Add message + Acknowledge
      message: message
    });
  }

  // Méthode pour obtenir les événements à partir des triggers
  async getEventsByTriggerIds(triggerIds: string[]) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        return [];
      }
    }
    
    try {
      return await this.request('event.get', {
        output: 'extend',
        select_acknowledges: 'extend',
        objectids: triggerIds,
        sortfield: ['clock', 'eventid'],
        sortorder: 'DESC',
        filter: {
          object: 0, // Trigger events
          value: 1  // Problem events
        }
      });
    } catch (error) {
      console.error("Failed to get events by trigger IDs:", error);
      return [];
    }
  }

  // Méthode pour envoyer des valeurs à Zabbix via l'API sender
  async sendValues(host: string, items: { key: string, value: string | number }[]) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    // Utiliser l'API history.create pour simuler l'envoi de valeurs
    const data = items.map(item => ({
      itemid: item.key,
      value: item.value.toString(),
      clock: Math.floor(Date.now() / 1000),
      ns: 0
    }));
    
    return this.request('history.create', data);
  }

  // Méthode pour créer un item de type trapper
  async createTrapperItem(hostId: string, name: string, key: string) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    return this.request('item.create', {
      hostid: hostId,
      name: name,
      key_: key,
      type: 2, // Zabbix trapper
      value_type: 3, // Numeric unsigned
      delay: 0 // Correction: utiliser 0 au lieu de "30s" pour les items de type trapper
    });
  }

  // Méthode pour créer un trigger basé sur un item
  async createTrigger(description: string, expression: string, priority: number = 3, tags: any[] = []) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    // Corriger le format de l'expression pour Zabbix 6.0+
    // Format correct: host:key.function()>0
    // Pas de {} autour de l'expression
    const fixedExpression = expression.replace(/\{([^:]+):([^.]+)\.([^}]+)\}/, '$1:$2.$3');
    
    return this.request('trigger.create', {
      description: description,
      expression: fixedExpression,
      priority: priority,
      tags: tags
    });
  }

  // Méthode pour injecter directement une alerte
  async injectAlert(hostName: string, alertDescription: string, priority: number = 3, tags: any[] = []) {
    if (!this.token) {
      try {
        await this.login();
      } catch (error) {
        console.error("Failed to login:", error);
        throw error;
      }
    }
    
    try {
      // 1. Récupérer l'hôte
      const hosts = await this.request('host.get', {
        filter: { host: hostName },
        output: ['hostid']
      });
      
      if (hosts.length === 0) {
        throw new Error(`Host ${hostName} not found`);
      }
      
      const hostId = hosts[0].hostid;
      
      // 2. Créer un item trapper
      const itemKey = `alert.${Date.now()}`;
      const itemName = `Alert: ${alertDescription}`;
      
      const itemResult = await this.createTrapperItem(hostId, itemName, itemKey);
      const itemId = itemResult.itemids[0];
      
      // 3. Créer un trigger avec l'expression corrigée
      const expression = `${hostName}:${itemKey}.last()=1`;
      const triggerResult = await this.createTrigger(alertDescription, expression, priority, tags);
      const triggerId = triggerResult.triggerids[0];
      
      // 4. Envoyer une valeur pour déclencher l'alerte
      await this.sendValues(hostName, [{ key: itemKey, value: 1 }]);
      
      return {
        hostId,
        itemId,
        triggerId
      };
    } catch (error) {
      console.error('Error injecting alert:', error);
      throw error;
    }
  }
}
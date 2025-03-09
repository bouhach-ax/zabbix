import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Using fallback data.');
}

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface MockAlert {
  id: string;
  description: string;
  priority: number;
  host_name: string;
  host_ip: string;
  alert_type: string;
  created_at: string;
  status: string;
  last_change: string;
  tags: {
    category: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    service: string;
    resolution_hint: string;
  };
  dependencies: string[];
  occurrence_count: number;
  severity: string;
}

export interface Tag {
  id: string;
  key: string;
  value: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export interface HostGroup {
  id: string;
  name: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export const mockAlertsService = {
  async getAlerts() {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning mock data.');
      return getMockAlertsFallback();
    }
    
    try {
      const { data, error } = await supabase
        .from('mock_alerts')
        .select('*')
        .order('last_change', { ascending: false });
        
      if (error) {
        console.error('Error fetching mock alerts:', error);
        return getMockAlertsFallback();
      }
      return data || getMockAlertsFallback();
    } catch (error) {
      console.error('Error fetching mock alerts:', error);
      return getMockAlertsFallback();
    }
  }
};

export const inventoryService = {
  async getTags() {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning fallback data.');
      return getTagsFallback();
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || getTagsFallback();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return getTagsFallback();
    }
  },

  async createTag({ key, value, description }: Omit<Tag, 'id' | 'usage_count' | 'created_at'>) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning fallback data.');
      return getTagsFallback()[0];
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_tags')
        .insert([{ key, value, description }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      // Create a fallback tag with the provided data
      const fallbackTag = {
        id: crypto.randomUUID(),
        key,
        value,
        description,
        usage_count: 0,
        created_at: new Date().toISOString()
      };
      return fallbackTag;
    }
  },

  async updateTag(id: string, updates: Partial<Tag>) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot update tag.');
      return getTagsFallback().find(tag => tag.id === id);
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tag:', error);
      // Return a fallback updated tag
      const fallbackTags = getTagsFallback();
      const tagIndex = fallbackTags.findIndex(tag => tag.id === id);
      if (tagIndex >= 0) {
        fallbackTags[tagIndex] = { ...fallbackTags[tagIndex], ...updates };
        return fallbackTags[tagIndex];
      }
      return null;
    }
  },

  async deleteTag(id: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot delete tag.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('inventory_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  },

  async incrementTagUsage(id: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot increment tag usage.');
      return;
    }
    
    try {
      const { error } = await supabase
        .rpc('increment_tag_usage', { tag_id: id });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing tag usage:', error);
      // Fallback: just return without incrementing
    }
  },

  async getHostGroups() {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning fallback data.');
      return getHostGroupsFallback();
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_host_groups')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || getHostGroupsFallback();
    } catch (error) {
      console.error('Error fetching host groups:', error);
      return getHostGroupsFallback();
    }
  },

  async createHostGroup({ name, description }: Omit<HostGroup, 'id' | 'usage_count' | 'created_at'>) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Returning fallback data.');
      return getHostGroupsFallback()[0];
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_host_groups')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating host group:', error);
      // Create a fallback host group with the provided data
      const fallbackGroup = {
        id: crypto.randomUUID(),
        name,
        description,
        usage_count: 0,
        created_at: new Date().toISOString()
      };
      return fallbackGroup;
    }
  },

  async updateHostGroup(id: string, updates: Partial<HostGroup>) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot update host group.');
      return getHostGroupsFallback().find(group => group.id === id);
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_host_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating host group:', error);
      // Return a fallback updated group
      const fallbackGroups = getHostGroupsFallback();
      const groupIndex = fallbackGroups.findIndex(group => group.id === id);
      if (groupIndex >= 0) {
        fallbackGroups[groupIndex] = { ...fallbackGroups[groupIndex], ...updates };
        return fallbackGroups[groupIndex];
      }
      return null;
    }
  },

  async deleteHostGroup(id: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot delete host group.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('inventory_host_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting host group:', error);
    }
  },

  async incrementGroupUsage(id: string) {
    if (!supabase) {
      console.warn('Supabase client not initialized. Cannot increment group usage.');
      return;
    }
    
    try {
      const { error } = await supabase
        .rpc('increment_group_usage', { group_id: id });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing group usage:', error);
      // Fallback: just return without incrementing
    }
  }
};

// Fallback mock data when Supabase is not available
function getMockAlertsFallback() {
  return [
    {
      id: '1',
      description: 'High CPU usage on web server',
      priority: 4,
      host_name: 'web-server-01',
      host_ip: '192.168.1.10',
      alert_type: 'system',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        category: 'system',
        impact: 'critical',
        service: 'Web Application',
        resolution_hint: 'Check running processes'
      },
      dependencies: [],
      occurrence_count: 1,
      severity: 'High'
    },
    {
      id: '2',
      description: 'Database connection timeout',
      priority: 4,
      host_name: 'db-server-01',
      host_ip: '192.168.1.20',
      alert_type: 'database',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        category: 'database',
        impact: 'critical',
        service: 'Database',
        resolution_hint: 'Check database logs'
      },
      dependencies: [],
      occurrence_count: 1,
      severity: 'High'
    },
    {
      id: '3',
      description: 'Network latency high',
      priority: 3,
      host_name: 'router-01',
      host_ip: '192.168.1.1',
      alert_type: 'network',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        category: 'network',
        impact: 'high',
        service: 'Network',
        resolution_hint: 'Check network traffic'
      },
      dependencies: [],
      occurrence_count: 1,
      severity: 'Average'
    },
    {
      id: '4',
      description: 'High response time on product catalog pages',
      priority: 3,
      host_name: 'ecom-front-01',
      host_ip: '192.168.10.10',
      alert_type: 'application',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        service: 'E-Commerce',
        component: 'Frontend',
        impact: 'high',
        category: 'performance'
      },
      dependencies: ['ecom-api-01', 'ecom-db-01'],
      occurrence_count: 1,
      severity: 'Average'
    },
    {
      id: '5',
      description: 'JavaScript errors on checkout page',
      priority: 4,
      host_name: 'ecom-front-02',
      host_ip: '192.168.10.11',
      alert_type: 'application',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        service: 'E-Commerce',
        component: 'Frontend',
        impact: 'critical',
        category: 'functionality'
      },
      dependencies: ['ecom-api-01'],
      occurrence_count: 1,
      severity: 'High'
    },
    {
      id: '6',
      description: 'Payment gateway timeout',
      priority: 4,
      host_name: 'ecom-api-01',
      host_ip: '192.168.10.20',
      alert_type: 'application',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        service: 'E-Commerce',
        component: 'Backend API',
        impact: 'critical',
        category: 'availability'
      },
      dependencies: ['ecom-db-01'],
      occurrence_count: 1,
      severity: 'High'
    },
    {
      id: '7',
      description: 'Web interface session handling errors',
      priority: 4,
      host_name: 'crm-web-01',
      host_ip: '192.168.20.10',
      alert_type: 'application',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        service: 'CRM',
        component: 'Web Interface',
        impact: 'critical',
        category: 'functionality'
      },
      dependencies: ['crm-app-01', 'crm-db-01'],
      occurrence_count: 1,
      severity: 'High'
    },
    {
      id: '8',
      description: 'BGP session down on edge router',
      priority: 4,
      host_name: 'router-edge-01',
      host_ip: '192.168.1.1',
      alert_type: 'network',
      created_at: new Date().toISOString(),
      status: 'active',
      last_change: new Date().toISOString(),
      tags: {
        service: 'Network Backbone',
        component: 'Edge Routers',
        impact: 'critical',
        category: 'connectivity'
      },
      dependencies: ['switch-core-01'],
      occurrence_count: 1,
      severity: 'High'
    }
  ];
}

function getTagsFallback() {
  return [
    {
      id: '1',
      key: 'service',
      value: 'E-Commerce',
      description: 'E-Commerce service',
      usage_count: 10,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      key: 'component',
      value: 'Frontend',
      description: 'Frontend component',
      usage_count: 8,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      key: 'component',
      value: 'Backend API',
      description: 'Backend API component',
      usage_count: 7,
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      key: 'component',
      value: 'Database',
      description: 'Database component',
      usage_count: 6,
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      key: 'impact',
      value: 'critical',
      description: 'Critical impact',
      usage_count: 5,
      created_at: new Date().toISOString()
    },
    {
      id: '6',
      key: 'impact',
      value: 'high',
      description: 'High impact',
      usage_count: 4,
      created_at: new Date().toISOString()
    },
    {
      id: '7',
      key: 'category',
      value: 'performance',
      description: 'Performance category',
      usage_count: 3,
      created_at: new Date().toISOString()
    },
    {
      id: '8',
      key: 'category',
      value: 'availability',
      description: 'Availability category',
      usage_count: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '9',
      key: 'category',
      value: 'functionality',
      description: 'Functionality category',
      usage_count: 1,
      created_at: new Date().toISOString()
    }
  ];
}

function getHostGroupsFallback() {
  return [
    {
      id: '1',
      name: 'Web Servers',
      description: 'Web servers group',
      usage_count: 5,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Database Servers',
      description: 'Database servers group',
      usage_count: 4,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'API Servers',
      description: 'API servers group',
      usage_count: 3,
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Network Devices',
      description: 'Network devices group',
      usage_count: 2,
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Monitoring Servers',
      description: 'Monitoring servers group',
      usage_count: 1,
      created_at: new Date().toISOString()
    }
  ];
}
export interface ZabbixConfig {
  url: string;
  username: string;
  password: string;
  httpProxy?: string;
  timeout?: number;
}

export interface ZabbixTemplate {
  templateid: string;
  name: string;
  description?: string;
  items?: ZabbixItem[];
}

export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  status: string | number;
}

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
  interfaces: any[];
  groups: any[];
  parentTemplates?: any[];
  items?: any[];
  tags?: any[];
  triggers?: ZabbixTrigger[];
}

export interface ZabbixTrigger {
  triggerid: string;
  description: string;
  priority: string;
  status: string;
  value: string;
  lastchange: string;
}

export interface ZabbixHostGroup {
  groupid: string;
  name: string;
}

export interface ZabbixProxy {
  proxyid: string;
  host: string;
  status: string;
}

export interface ProvisioningHost {
  hostname: string;
  ip_address: string;
  template_names: string[];
  group_name: string;
  proxy_name?: string;
  tags?: Record<string, string>;
  disabled_metrics?: string[];
  [key: string]: any;
}

export interface TemplateRule {
  id: string;
  condition: {
    field: 'hostname' | 'ip_address';
    operator: 'startsWith' | 'contains' | 'endsWith' | 'matches';
    value: string;
  };
  templates: string[];
  disabled_metrics: string[];
  group_name: string;
  proxy_host?: string;
}

export interface TagItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  usage_count: number;
  created_at: string;
}

export interface ZabbixService {
  serviceid?: string;
  name: string;
  status?: number;
  algorithm?: number;
  sortorder?: number;
  weight?: number;
  triggerid?: string;
  parentid?: string;
  parents?: ZabbixService[];
  children?: ZabbixService[];
  tags?: Array<{
    tag: string;
    value: string;
  }>;
  problem_tags?: Array<{
    tag: string;
    value: string;
  }>;
  sla?: number;
  goodsla?: number;
}

export interface ServiceStatus {
  status: 'ok' | 'problem' | 'warning' | 'disaster';
  problems: number;
  lastChange: number;
  sla?: number;
}

export interface ServiceProposal {
  name: string;
  hosts: any[];
  tags: Record<string, string[]>;
  algorithm?: number;
  weight?: number;
  triggerid?: string;
}

export interface ServiceComponent {
  id: string;
  name: string;
  parentId: string;
  algorithm: number;
  sla: string;
  status: 'ok' | 'degraded' | 'critical';
  hosts: string[];
}

export interface ServiceSLA {
  serviceid: string;
  sla: Array<{
    from: number;
    to: number;
    sla: Array<{
      status: string;
      sla: number;
      okTime: number;
      problemTime: number;
      downtimeTime: number;
    }>;
  }>;
}

export interface ServiceDefinition {
  name: string;
  components: ServiceComponentDefinition[];
  sla: string;
  algorithm: number;
  tags?: Record<string, string>;
}

export interface ServiceComponentDefinition {
  name: string;
  hosts: string[];
  sla: string;
  algorithm: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
  tags?: Record<string, string>;
}

export interface ZabbixEvent {
  eventid: string;
  source: string;
  object: string;
  objectid: string;
  clock: string;
  value: string;
  acknowledged: string;
  ns: string;
  name: string;
  severity: string;
}
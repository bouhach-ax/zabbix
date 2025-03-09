import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, Check, X } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { TemplateRule, ZabbixTemplate, ZabbixItem } from '../types/zabbix';

interface TemplateRulesProps {
  rules: TemplateRule[];
  onAddRule: (rule: TemplateRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

const initialRule: Partial<TemplateRule> = {
  condition: { field: 'hostname', operator: 'contains', value: '' },
  templates: [],
  disabled_metrics: [],
  group_name: '',
  proxy_host: '',
};

export default function TemplateRules({ rules, onAddRule, onDeleteRule }: TemplateRulesProps) {
  const { config } = useConfig();
  const api = new ZabbixAPI(config!);

  // États locaux
  const [newRule, setNewRule] = useState<Partial<TemplateRule>>(initialRule);
  const [templateQuery, setTemplateQuery] = useState('');
  const [metricQuery, setMetricQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [proxyQuery, setProxyQuery] = useState('');

  // Récupération des données
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.getTemplates(),
  });

  const { data: proxies = [] } = useQuery({
    queryKey: ['proxies'],
    queryFn: () => api.getProxies(),
  });

  const { data: hostGroups = [] } = useQuery({
    queryKey: ['hostgroups'],
    queryFn: () => api.getHostGroups(),
  });

  const { data: selectedTemplatesItems = [] } = useQuery({
    queryKey: ['template-items', newRule.templates],
    queryFn: async () => {
      const items: ZabbixItem[] = [];
      for (const templateName of newRule.templates || []) {
        const template = templates.find(t => t.name === templateName);
        if (template && template.items) {
          items.push(...template.items);
        }
      }
      return items;
    },
    enabled: Boolean(newRule.templates?.length),
  });

  // Filtrage des données
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(templateQuery.toLowerCase())
  );

  const filteredMetrics = selectedTemplatesItems.filter(item =>
    item.name.toLowerCase().includes(metricQuery.toLowerCase()) ||
    item.key_.toLowerCase().includes(metricQuery.toLowerCase())
  );

  const filteredGroups = hostGroups.filter(group =>
    group.name.toLowerCase().includes(groupQuery.toLowerCase())
  );

  const filteredProxies = proxies.filter(proxy =>
    proxy.host.toLowerCase().includes(proxyQuery.toLowerCase())
  );

  const handleAddRule = () => {
    if (newRule.condition?.value && newRule.templates?.length && newRule.group_name) {
      onAddRule({
        id: crypto.randomUUID(),
        condition: newRule.condition as TemplateRule['condition'],
        templates: newRule.templates,
        disabled_metrics: newRule.disabled_metrics || [],
        group_name: newRule.group_name,
        proxy_host: newRule.proxy_host || undefined,
      });
      setNewRule(initialRule);
      setTemplateQuery('');
      setMetricQuery('');
      setGroupQuery('');
      setProxyQuery('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          {/* Champs existants */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Field</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={newRule.condition?.field || 'hostname'}
              onChange={(e) => setNewRule({
                ...newRule,
                condition: { ...newRule.condition!, field: e.target.value as 'hostname' | 'ip_address' }
              })}
            >
              <option value="hostname">Hostname</option>
              <option value="ip_address">IP Address</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Operator</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={newRule.condition?.operator || 'contains'}
              onChange={(e) => setNewRule({
                ...newRule,
                condition: { ...newRule.condition!, operator: e.target.value as TemplateRule['condition']['operator'] }
              })}
            >
              <option value="startsWith">Starts With</option>
              <option value="contains">Contains</option>
              <option value="endsWith">Ends With</option>
              <option value="matches">Matches (Regex)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Value</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={newRule.condition?.value || ''}
              onChange={(e) => setNewRule({
                ...newRule,
                condition: { ...newRule.condition!, value: e.target.value }
              })}
            />
          </div>

          {/* Sélection du groupe d'hôtes avec autocomplétion */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Host Group</label>
            <div className="mt-1">
              <Combobox
                value={newRule.group_name || ''}
                onChange={(group_name) => setNewRule({ ...newRule, group_name })}
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setGroupQuery(event.target.value)}
                    displayValue={(group_name: string) => group_name}
                    placeholder="Sélectionner un groupe d'hôtes..."
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredGroups.map((group) => (
                      <Combobox.Option
                        key={group.groupid}
                        value={group.name}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                              {group.name}
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          </div>

          {/* Sélection du proxy avec autocomplétion */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Proxy (Optionnel)</label>
            <div className="mt-1">
              <Combobox
                value={newRule.proxy_host || ''}
                onChange={(proxy_host) => setNewRule({ ...newRule, proxy_host })}
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setProxyQuery(event.target.value)}
                    displayValue={(proxy_host: string) => proxy_host}
                    placeholder="Sélectionner un proxy..."
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <Combobox.Option
                      value=""
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      Aucun proxy
                    </Combobox.Option>
                    {filteredProxies.map((proxy) => (
                      <Combobox.Option
                        key={proxy.proxyid}
                        value={proxy.host}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                              {proxy.host}
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          </div>

          {/* Sélection des templates avec autocomplétion */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Templates</label>
            <div className="mt-1">
              <Combobox
                multiple
                value={newRule.templates || []}
                onChange={(templates) => setNewRule({ ...newRule, templates })}
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setTemplateQuery(event.target.value)}
                    onFocus={() => setTemplateQuery('')}
                    displayValue={(templates: string[]) => templates.join(', ')}
                    placeholder="Rechercher des templates..."
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredTemplates.map((template) => (
                      <Combobox.Option
                        key={template.templateid}
                        value={template.name}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                              {template.name}
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
              <div className="mt-2 flex flex-wrap gap-2">
                {newRule.templates?.map((template) => (
                  <span
                    key={template}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {template}
                    <button
                      type="button"
                      onClick={() => setNewRule({
                        ...newRule,
                        templates: newRule.templates?.filter(t => t !== template)
                      })}
                      className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sélection des métriques à désactiver avec autocomplétion */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Disabled Metrics</label>
            <div className="mt-1">
              <Combobox
                multiple
                value={newRule.disabled_metrics || []}
                onChange={(metrics) => setNewRule({ ...newRule, disabled_metrics: metrics })}
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setMetricQuery(event.target.value)}
                    onFocus={() => setMetricQuery('')}
                    displayValue={(metrics: string[]) => metrics.join(', ')}
                    placeholder="Rechercher des métriques..."
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {!newRule.templates?.length ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        Veuillez d'abord sélectionner un template.
                      </div>
                    ) : filteredMetrics.map((item) => (
                      <Combobox.Option
                        key={item.itemid}
                        value={item.key_}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                              {`${item.name} (${item.key_})`}
                            </span>
                            {selected && (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}
                              >
                                <Check className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
              <div className="mt-2 flex flex-wrap gap-2">
                {newRule.disabled_metrics?.map((metric) => (
                  <span
                    key={metric}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {metric}
                    <button
                      type="button"
                      onClick={() => setNewRule({
                        ...newRule,
                        disabled_metrics: newRule.disabled_metrics?.filter(m => m !== metric)
                      })}
                      className="ml-1 inline-flex items-center p-0.5 rounded-full text-red-400 hover:bg-red-200 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddRule}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Liste des règles existantes */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  When {rule.condition.field} {rule.condition.operator} "{rule.condition.value}"
                </p>
                <p className="text-sm text-gray-500">
                  Group: {rule.group_name}
                  {rule.proxy_host && ` | Proxy: ${rule.proxy_host}`}
                </p>
                <p className="text-sm text-gray-500">
                  Apply templates: {rule.templates.join(', ')}
                </p>
                {rule.disabled_metrics.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Disable metrics: {rule.disabled_metrics.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
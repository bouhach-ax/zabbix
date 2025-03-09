import React, { useState } from 'react';
import { Upload, HelpCircle, BookOpen } from 'lucide-react';
import { ProvisioningHost, TemplateRule } from '../../types/zabbix';
import { toast } from 'react-hot-toast';
import { ZabbixAPI } from '../../lib/api';
import { useConfig } from '../../lib/config';
import TemplateRules from '../TemplateRules';

export default function RuleBasedProvisioning() {
  const { config } = useConfig();
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedHosts, setParsedHosts] = useState<ProvisioningHost[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [templateRules, setTemplateRules] = useState<TemplateRule[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const handleAddRule = (rule: TemplateRule) => {
    setTemplateRules([...templateRules, rule]);
    toast.success('Règle ajoutée avec succès');
  };

  const handleDeleteRule = (ruleId: string) => {
    setTemplateRules(templateRules.filter(rule => rule.id !== ruleId));
    toast.success('Règle supprimée avec succès');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);

      // Parse CSV content
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      // Mode avec règles : CSV minimal (hostname, IP)
      const hosts: ProvisioningHost[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          return {
            hostname: values[0],
            ip_address: values[1],
            template_names: [],  // Sera rempli par les règles
            group_name: 'Default',  // Groupe par défaut
          };
        });

      // Appliquer les règles de templates
      const hostsWithRules = hosts.map(host => {
        const matchingRules = templateRules.filter(rule => {
          const value = host[rule.condition.field];
          switch (rule.condition.operator) {
            case 'startsWith':
              return value.startsWith(rule.condition.value);
            case 'contains':
              return value.includes(rule.condition.value);
            case 'endsWith':
              return value.endsWith(rule.condition.value);
            case 'matches':
              return new RegExp(rule.condition.value).test(value);
            default:
              return false;
          }
        });

        // Ajouter les templates des règles correspondantes
        const templates = new Set<string>();
        matchingRules.forEach(rule => {
          rule.templates.forEach(template => templates.add(template));
        });

        return {
          ...host,
          template_names: Array.from(templates)
        };
      });

      setParsedHosts(hostsWithRules);
      toast.success(`${hostsWithRules.length} hôtes analysés avec succès`);
    };

    reader.readAsText(file);
  };

  const handleProvision = async () => {
    if (!config) {
      toast.error('Configuration Zabbix manquante');
      return;
    }

    setIsProcessing(true);
    const api = new ZabbixAPI(config);

    try {
      for (const host of parsedHosts) {
        await api.createHost(host);
      }
      toast.success('Provisioning terminé avec succès');
      setParsedHosts([]);
      setCsvContent('');
    } catch (error) {
      toast.error(`Erreur lors du provisioning: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section des règles de templates */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Règles d'application des templates</h2>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <BookOpen className="h-5 w-5 mr-1" />
            Guide des règles
          </button>
        </div>

        {showGuide && (
          <div className="mb-6 bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-800 mb-2">Format CSV pour le mode Règles</h3>
            <div className="space-y-2 text-sm text-indigo-700">
              <p>Le fichier CSV doit contenir uniquement :</p>
              <div className="bg-white p-2 rounded border border-indigo-200 font-mono">
                hostname,ip_address
              </div>
              <p>Exemple :</p>
              <div className="bg-white p-2 rounded border border-indigo-200 font-mono">
                srv-web-01,192.168.1.10
                srv-db-01,192.168.1.11
              </div>
              <p>Les templates et autres configurations seront appliqués selon les règles définies.</p>
            </div>
          </div>
        )}

        <TemplateRules
          rules={templateRules}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
        />
      </div>

      {/* Section d'import CSV */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900">Import CSV Minimal</h2>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
              title="Voir le guide d'importation"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
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

        {/* Aperçu des hôtes parsés */}
        {parsedHosts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Aperçu des hôtes à provisionner
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Hostname
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Templates
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Groupe
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedHosts.map((host, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {host.hostname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {host.template_names.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.group_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleProvision}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
    </div>
  );
}
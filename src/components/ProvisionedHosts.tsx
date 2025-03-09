import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { Server, AlertTriangle, CheckCircle, Activity, Users, Network, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProvisionedHosts() {
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['hosts'],
    queryFn: () => config ? new ZabbixAPI(config).getHosts() : Promise.resolve([]),
    enabled: !!config
  });

  const deleteHostsMutation = useMutation({
    mutationFn: async (hostIds: string[]) => {
      if (!config) throw new Error('No configuration');
      return new ZabbixAPI(config).deleteHosts(hostIds);
    },
    onSuccess: () => {
      // Use invalidateQueries instead of invalidateQuery
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
      setSelectedHosts([]);
      toast.success('Hôtes supprimés avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression: ${error}`);
    }
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedHosts(hosts.map(host => host.hostid));
    } else {
      setSelectedHosts([]);
    }
  };

  const handleSelectHost = (hostId: string) => {
    if (selectedHosts.includes(hostId)) {
      setSelectedHosts(selectedHosts.filter(id => id !== hostId));
    } else {
      setSelectedHosts([...selectedHosts, hostId]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedHosts.length === 0) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedHosts.length} hôte(s) ?`)) {
      deleteHostsMutation.mutate(selectedHosts);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedHosts.length > 0 && (
        <div className="flex justify-between items-center bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <span className="text-secondary-700">
            {selectedHosts.length} hôte(s) sélectionné(s)
          </span>
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer la sélection
          </button>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                  checked={selectedHosts.length === hosts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">IP</th>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Groupe</th>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Templates</th>
              <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Métriques</th>
              <th className="px-6 py-3 bg-secondary-50 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hosts.map((host) => (
              <tr key={host.hostid}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                    checked={selectedHosts.includes(host.hostid)}
                    onChange={() => handleSelectHost(host.hostid)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                  {host.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {host.interfaces[0]?.ip || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {host.groups.map(g => g.name).join(', ')}
                </td>
                <td className="px-6 py-4 text-sm text-secondary-500">
                  {host.parentTemplates?.map(t => t.name).join(', ') || 'Aucun template'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                  {host.items?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {host.status === '0' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Désactivé
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
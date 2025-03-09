import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, X } from 'lucide-react';
import { ZabbixAPI } from '../../lib/api';
import { useConfig } from '../../lib/config';
import { inventoryService } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface HostGroupSelectorProps {
  selectedGroup: string | null;
  onGroupChange: (group: string) => void;
}

export default function HostGroupSelector({ selectedGroup, onGroupChange }: HostGroupSelectorProps) {
  const { config } = useConfig();
  const api = new ZabbixAPI(config!);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  // Récupérer les groupes depuis Zabbix et l'inventaire
  const { data: zabbixGroups = [], isLoading: loadingZabbixGroups } = useQuery({
    queryKey: ['zabbix-hostgroups'],
    queryFn: () => api.getHostGroups()
  });

  const { data: inventoryGroups = [], isLoading: loadingInventoryGroups } = useQuery({
    queryKey: ['inventory-hostgroups'],
    queryFn: () => inventoryService.getHostGroups()
  });

  // Fusionner les groupes
  const mergedGroups = [...zabbixGroups].map(zGroup => {
    const inventoryGroup = inventoryGroups.find(iGroup => iGroup.name === zGroup.name);
    return {
      ...zGroup,
      ...inventoryGroup,
      description: inventoryGroup?.description || '',
      usage_count: inventoryGroup?.usage_count || 0
    };
  });

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast.error('Le nom du groupe est requis');
      return;
    }

    try {
      // Créer le groupe dans Zabbix
      await api.createHostGroup(newGroup.name);
      
      // Créer le groupe dans l'inventaire
      await inventoryService.createHostGroup({
        name: newGroup.name,
        description: newGroup.description
      });

      onGroupChange(newGroup.name);
      setNewGroup({ name: '', description: '' });
      setShowNewGroupForm(false);
      toast.success('Groupe créé avec succès');
    } catch (error: any) {
      toast.error(`Erreur lors de la création du groupe: ${error.message}`);
    }
  };

  if (loadingZabbixGroups || loadingInventoryGroups) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Liste des groupes existants */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mergedGroups.map((group) => (
          <button
            key={group.groupid}
            onClick={() => onGroupChange(group.name)}
            className={`flex items-center p-3 rounded-lg border ${
              selectedGroup === group.name
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <Users className={`h-5 w-5 mr-2 ${
              selectedGroup === group.name ? 'text-indigo-500' : 'text-gray-400'
            }`} />
            <div className="text-left">
              <p className="text-sm font-medium">{group.name}</p>
              {group.description && (
                <p className="text-xs text-gray-500">{group.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Formulaire de création de groupe */}
      {!showNewGroupForm ? (
        <button
          onClick={() => setShowNewGroupForm(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau groupe
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Créer un nouveau groupe</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Nom</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Linux Servers"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Serveurs Linux de production"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewGroupForm(false);
                  setNewGroup({ name: '', description: '' });
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateGroup}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
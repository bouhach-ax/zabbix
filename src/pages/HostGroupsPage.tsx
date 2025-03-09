import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ZabbixAPI } from '../lib/api';
import { useConfig } from '../lib/config';
import { inventoryService } from '../lib/supabase';

export default function HostGroupsPage() {
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [editingGroup, setEditingGroup] = useState<any>(null);

  const api = new ZabbixAPI(config!);

  // Récupération des groupes depuis Zabbix et Supabase
  const { data: zabbixGroups = [], isLoading: loadingZabbixGroups } = useQuery({
    queryKey: ['zabbix-hostgroups'],
    queryFn: () => api.getHostGroups()
  });

  const { data: inventoryGroups = [], isLoading: loadingInventoryGroups } = useQuery({
    queryKey: ['inventory-hostgroups'],
    queryFn: () => inventoryService.getHostGroups()
  });

  // Mutations pour les groupes
  const createGroupMutation = useMutation({
    mutationFn: async (group: any) => {
      // Créer le groupe dans Zabbix
      await api.createHostGroup(group.name);
      
      // Créer le groupe dans l'inventaire
      return inventoryService.createHostGroup({
        name: group.name,
        description: group.description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-hostgroups'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostgroups'] });
      setNewGroup({ name: '', description: '' });
      toast.success('Groupe créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, updates }: { groupId: string; updates: any }) => {
      // Mettre à jour le groupe dans Zabbix
      await api.updateHostGroup(groupId, updates);
      
      // Mettre à jour le groupe dans l'inventaire
      return inventoryService.updateHostGroup(groupId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-hostgroups'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostgroups'] });
      setEditingGroup(null);
      toast.success('Groupe mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Supprimer le groupe dans Zabbix
      await api.deleteHostGroup(groupId);
      
      // Supprimer le groupe dans l'inventaire
      return inventoryService.deleteHostGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zabbix-hostgroups'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-hostgroups'] });
      toast.success('Groupe supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) {
      toast.error('Le nom du groupe est requis');
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const handleUpdateGroup = (group: any) => {
    if (!group.name) {
      toast.error('Le nom du groupe est requis');
      return;
    }
    updateGroupMutation.mutate({
      groupId: group.id,
      updates: {
        name: group.name,
        description: group.description
      }
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  // Fusionner et filtrer les groupes
  const mergedGroups = [...zabbixGroups].map(zGroup => {
    const inventoryGroup = inventoryGroups.find(iGroup => iGroup.name === zGroup.name);
    return {
      ...zGroup,
      ...inventoryGroup,
      description: inventoryGroup?.description || '',
      usage_count: inventoryGroup?.usage_count || 0
    };
  });

  const filteredGroups = mergedGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Groupes d'hôtes</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un groupe..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout de groupe */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un nouveau groupe</h3>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Linux Servers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Serveurs Linux de production"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </button>
          </div>
        </form>
      </div>

      {/* Liste des groupes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Groupes disponibles</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loadingZabbixGroups || loadingInventoryGroups ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun groupe disponible
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.groupid} className="p-4">
                {editingGroup?.groupid === group.groupid ? (
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={editingGroup.name}
                      onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={editingGroup.description || ''}
                      onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Description"
                    />
                    <button
                      onClick={() => handleUpdateGroup(editingGroup)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingGroup(null)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-gray-500">{group.description}</p>
                        )}
                      </div>
                      {group.usage_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Utilisé {group.usage_count} fois
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.groupid)}
                        className="p-1 rounded-full text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Users, Plus, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { inventoryService } from '../lib/supabase';

export default function TagsAndGroupsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tags');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState({ key: '', value: '', description: '' });
  const [editingTag, setEditingTag] = useState<any>(null);

  // Récupération des tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['inventory-tags'],
    queryFn: () => inventoryService.getTags()
  });

  // Mutations pour les tags
  const createTagMutation = useMutation({
    mutationFn: (tag: any) => inventoryService.createTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
      setNewTag({ key: '', value: '', description: '' });
      toast.success('Tag créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      inventoryService.updateTag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
      setEditingTag(null);
      toast.success('Tag mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-tags'] });
      toast.success('Tag supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.key || !newTag.value) {
      toast.error('La clé et la valeur sont requises');
      return;
    }
    createTagMutation.mutate(newTag);
  };

  const handleUpdateTag = (tag: any) => {
    if (!tag.key || !tag.value) {
      toast.error('La clé et la valeur sont requises');
      return;
    }
    updateTagMutation.mutate({
      id: tag.id,
      updates: {
        key: tag.key,
        value: tag.value,
        description: tag.description
      }
    });
  };

  const handleDeleteTag = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
      deleteTagMutation.mutate(id);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Tags</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un tag..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout de tag */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un nouveau tag</h3>
        <form onSubmit={handleCreateTag} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Clé</label>
              <input
                type="text"
                value={newTag.key}
                onChange={(e) => setNewTag({ ...newTag, key: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="service.type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valeur</label>
              <input
                type="text"
                value={newTag.value}
                onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="database"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Type de service"
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

      {/* Liste des tags */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tags disponibles</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun tag disponible
            </div>
          ) : (
            filteredTags.map((tag) => (
              <div key={tag.id} className="p-4">
                {editingTag?.id === tag.id ? (
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={editingTag.key}
                      onChange={(e) => setEditingTag({ ...editingTag, key: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={editingTag.value}
                      onChange={(e) => setEditingTag({ ...editingTag, value: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={editingTag.description || ''}
                      onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Description"
                    />
                    <button
                      onClick={() => handleUpdateTag(editingTag)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingTag(null)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {tag.key}={tag.value}
                      </span>
                      {tag.description && (
                        <span className="text-sm text-gray-500">{tag.description}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingTag(tag)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
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
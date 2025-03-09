import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Plus, X } from 'lucide-react';
import { inventoryService } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface TagSelectorProps {
  selectedTags: Record<string, string>;
  onTagsChange: (tags: Record<string, string>) => void;
  requiredTags?: Array<{ key: string; description: string }>;
  optionalTags?: Array<{ key: string; description: string }>;
}

export default function TagSelector({ 
  selectedTags, 
  onTagsChange,
  requiredTags = [],
  optionalTags = []
}: TagSelectorProps) {
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [showNewTagForm, setShowNewTagForm] = useState(false);

  const { data: existingTags = [], isLoading } = useQuery({
    queryKey: ['inventory-tags'],
    queryFn: () => inventoryService.getTags(),
  });

  const handleAddExistingTag = async (tag: any) => {
    try {
      onTagsChange({
        ...selectedTags,
        [tag.key]: tag.value
      });
      
      await inventoryService.incrementTagUsage(tag.id);
      toast.success(`Tag ajouté: ${tag.key}=${tag.value}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du tag:', error);
      toast.error('Erreur lors de l\'ajout du tag');
    }
  };

  const handleAddNewTag = async () => {
    if (!newTagKey || !newTagValue) {
      toast.error('La clé et la valeur sont requises');
      return;
    }

    try {
      const newTag = await inventoryService.createTag({
        key: newTagKey,
        value: newTagValue,
        description: 'Tag créé lors du provisioning'
      });

      onTagsChange({
        ...selectedTags,
        [newTagKey]: newTagValue
      });

      setNewTagKey('');
      setNewTagValue('');
      setShowNewTagForm(false);
      toast.success(`Nouveau tag ajouté: ${newTagKey}=${newTagValue}`);
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création du tag';
      console.error('Erreur lors de la création du tag:', error);
      toast.error(errorMessage);
    }
  };

  const handleRemoveTag = (key: string) => {
    const newTags = { ...selectedTags };
    delete newTags[key];
    onTagsChange(newTags);
  };

  return (
    <div className="space-y-4">
      {/* Tags requis */}
      {requiredTags.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Tags obligatoires</h4>
          {requiredTags.map(tag => (
            <div key={tag.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {tag.key}
                <span className="text-red-500 ml-1">*</span>
                <span className="text-gray-500 text-xs ml-2">({tag.description})</span>
              </label>
              <input
                type="text"
                value={selectedTags[tag.key] || ''}
                onChange={(e) => onTagsChange({
                  ...selectedTags,
                  [tag.key]: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Entrer la valeur pour ${tag.key}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags optionnels */}
      {optionalTags.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Tags optionnels</h4>
          {optionalTags.map(tag => (
            <div key={tag.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {tag.key}
                <span className="text-gray-500 text-xs ml-2">({tag.description})</span>
              </label>
              <input
                type="text"
                value={selectedTags[tag.key] || ''}
                onChange={(e) => onTagsChange({
                  ...selectedTags,
                  [tag.key]: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Entrer la valeur pour ${tag.key}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags personnalisés */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Tags personnalisés</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedTags)
            .filter(([key]) => 
              !requiredTags.some(t => t.key === key) && 
              !optionalTags.some(t => t.key === key)
            )
            .map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {key}={value}
                <button
                  onClick={() => handleRemoveTag(key)}
                  className="ml-1 inline-flex items-center p-0.5 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
          ))}
        </div>

        {!showNewTagForm ? (
          <button
            onClick={() => setShowNewTagForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un tag personnalisé
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTagKey}
              onChange={(e) => setNewTagKey(e.target.value)}
              placeholder="Clé"
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <span>=</span>
            <input
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              placeholder="Valeur"
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              onClick={handleAddNewTag}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setShowNewTagForm(false);
                setNewTagKey('');
                setNewTagValue('');
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
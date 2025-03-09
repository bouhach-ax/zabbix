import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain } from 'lucide-react';
import TagSelector from './TagSelector';
import { ZabbixAPI } from '../../lib/api';
import { useConfig } from '../../lib/config';

interface SmartTagsAssistantProps {
  hostname: string;
  templateNames: string[];
  onTagsChange: (tags: Record<string, string>) => void;
  onDependenciesChange: (dependencies: string[]) => void;
}

export default function SmartTagsAssistant({
  hostname,
  templateNames,
  onTagsChange,
  onDependenciesChange
}: SmartTagsAssistantProps) {
  const { config } = useConfig();
  const [selectedTags, setSelectedTags] = useState<Record<string, string>>({});
  const [suggestedTags, setSuggestedTags] = useState<Record<string, string>>({});

  // Générer des suggestions de tags basées sur le hostname et les templates
  useEffect(() => {
    const suggestions: Record<string, string> = {};

    // Analyser le hostname pour des patterns courants
    if (hostname.includes('web')) {
      suggestions['service.type'] = 'web';
    } else if (hostname.includes('db')) {
      suggestions['service.type'] = 'database';
    }

    // Analyser les templates pour des suggestions
    templateNames.forEach(template => {
      if (template.toLowerCase().includes('linux')) {
        suggestions['os.type'] = 'linux';
      } else if (template.toLowerCase().includes('windows')) {
        suggestions['os.type'] = 'windows';
      }

      if (template.toLowerCase().includes('apache')) {
        suggestions['web.server'] = 'apache';
      } else if (template.toLowerCase().includes('nginx')) {
        suggestions['web.server'] = 'nginx';
      }
    });

    setSuggestedTags(suggestions);
  }, [hostname, templateNames]);

  const handleTagsChange = (tags: Record<string, string>) => {
    setSelectedTags(tags);
    onTagsChange(tags);
  };

  return (
    <div className="space-y-6">
      {/* Section des suggestions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 text-blue-500 mr-2" />
          <h4 className="text-sm font-medium text-blue-900">Suggestions intelligentes</h4>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(suggestedTags).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleTagsChange({ ...selectedTags, [key]: value })}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {key}={value}
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-700">
            Ces suggestions sont basées sur le nom de l'hôte et les templates sélectionnés.
          </p>
        </div>
      </div>

      {/* Sélecteur de tags personnalisés */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Tags personnalisés</h4>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
        />
      </div>
    </div>
  );
}
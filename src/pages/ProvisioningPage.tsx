import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import RuleBasedProvisioning from '../components/provisioning/RuleBasedProvisioning';
import CompleteProvisioning from '../components/provisioning/CompleteProvisioning';
import ProvisionedHosts from '../components/ProvisionedHosts';

export default function ProvisioningPage() {
  const [activeTab, setActiveTab] = useState('complete');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mass Provisioning</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="complete">Provisioning CSV Complet</TabsTrigger>
          <TabsTrigger value="rules">Provisioning avec Règles</TabsTrigger>
        </TabsList>

        <TabsContent value="complete" className="space-y-6">
          <CompleteProvisioning />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <RuleBasedProvisioning />
        </TabsContent>
      </Tabs>

      {/* Section des hôtes provisionnés */}
      <ProvisionedHosts />
    </div>
  );
}
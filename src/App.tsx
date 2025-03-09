import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings, Layout, BarChart3, Users, Server, Tags, Brain, Network, Shield, PlusCircle, Menu, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConnectionStatus from './components/ConnectionStatus';
import ConfigurationPage from './pages/ConfigurationPage';
import ProvisioningPage from './pages/ProvisioningPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import TagsAndGroupsPage from './pages/TagsAndGroupsPage';
import AIDashboardPage from './pages/AIDashboardPage';
import ServiceViewPage from './pages/ServiceViewPage';
import ServiceMonitoringPage from './pages/ServiceMonitoringPage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import ServiceCreationPage from './pages/ServiceCreationPage';
import AllAlertsPage from './pages/AllAlertsPage';

const queryClient = new QueryClient();

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Services', href: '/services', icon: Network },
  { name: 'Service Monitoring', href: '/service-monitoring', icon: Shield },
  { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain },
  { name: 'Provisioning', href: '/provisioning', icon: Server },
  { name: 'Templates', href: '/templates', icon: Layout },
  { name: 'Host Groups', href: '/host-groups', icon: Users },
  { name: 'Tags & Macros', href: '/tags', icon: Tags },
  { name: 'Configuration', href: '/configuration', icon: Settings },
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <div className="fixed inset-0 flex z-40">
              <div
                className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300 ${
                  sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setSidebarOpen(false)}
              ></div>
              
              <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-primary-600 transform transition ease-in-out duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}>
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <Sidebar navigation={navigation} />
              </div>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64">
              <div className="flex-1 flex flex-col min-h-0">
                <Sidebar navigation={navigation} />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo5m3W2MIbUMc5ujiudAAtVJmJtreWBARX4w&s"
                  alt="Zabbix Logo"
                  className="h-8 w-8"
                />
                <span className="ml-2 text-xl font-bold text-primary-600">
                  Zabscaler
                </span>
              </div>
              <button
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block">
              <Header />
            </div>

            <main className="flex-1 overflow-y-auto">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/all-alerts" element={<AllAlertsPage />} />
                    <Route path="/services" element={<ServiceViewPage />} />
                    <Route path="/service-monitoring" element={<ServiceMonitoringPage />} />
                    <Route path="/service-details" element={<ServiceDetailsPage />} />
                    <Route path="/service-creation" element={<ServiceCreationPage />} />
                    <Route path="/ai-dashboard" element={<AIDashboardPage />} />
                    <Route path="/provisioning" element={<ProvisioningPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/tags" element={<TagsAndGroupsPage />} />
                    <Route path="/configuration" element={<ConfigurationPage />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </div>
        <ConnectionStatus />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}
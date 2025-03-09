import React from 'react';
import { useConfig } from '../lib/config';
import { CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConnectionStatus() {
  const { config, token, clearConfig } = useConfig();
  const navigate = useNavigate();
  const isConnected = Boolean(config && token);

  const handleLogout = () => {
    clearConfig();
    navigate('/configuration');
  };

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white p-3 rounded-lg shadow-lg z-50">
      {isConnected ? (
        <>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700">Connecté à Zabbix</span>
          <button
            onClick={handleLogout}
            className="ml-2 p-1 hover:bg-gray-100 rounded-full"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">Non connecté à Zabbix</span>
        </>
      )}
    </div>
  );
}
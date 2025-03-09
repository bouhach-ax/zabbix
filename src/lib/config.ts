import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ZabbixConfig } from '../types/zabbix';

interface ConfigState {
  config: ZabbixConfig | null;
  token: string | null;
  setConfig: (config: ZabbixConfig) => void;
  setToken: (token: string) => void;
  clearConfig: () => void;
}

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      config: null,
      token: null,
      setConfig: (config) => set({ config }),
      setToken: (token) => set({ token }),
      clearConfig: () => set({ config: null, token: null }),
    }),
    {
      name: 'zabbix-config',
    }
  )
);
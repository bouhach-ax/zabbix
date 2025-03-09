import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
  }>;
}

export default function Sidebar({ navigation }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-primary-600 text-white">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-primary-700">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo5m3W2MIbUMc5ujiudAAtVJmJtreWBARX4w&s"
          alt="Zabbix Logo"
          className="h-8 w-8"
        />
        <span className="ml-2 text-xl font-bold text-white">
          Zabscaler
        </span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-white hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-primary-300 group-hover:text-white" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <p className="text-xs font-medium text-primary-200">
                Zabbix Mass Provisioning
              </p>
              <p className="text-xs text-primary-300">
                v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
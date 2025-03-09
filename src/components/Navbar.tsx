import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavbarProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
  }>;
}

export default function Navbar({ navigation }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo5m3W2MIbUMc5ujiudAAtVJmJtreWBARX4w&s"
                alt="Zabbix Logo"
                className="h-8 w-8"
              />
              <span className="ml-2 text-xl font-bold text-secondary-500">
                Zabscaler
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-secondary-400 hover:border-secondary-300 hover:text-secondary-500'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
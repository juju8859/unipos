import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Receipt,
  UtensilsCrossed,
  TrendingUp,
  FileText,
  Settings,
  Lock
} from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab, isAdminLoggedIn } = useApp();

  const navItems = [
    {
      id: 'pos',
      label: 'Kasir',
      icon: ShoppingCart,
      adminOnly: false
    },
    {
      id: 'history',
      label: 'Riwayat',
      icon: Receipt,
      adminOnly: false
    },
    {
      id: 'menu',
      label: 'Menu & HPP',
      icon: UtensilsCrossed,
      adminOnly: true
    },
    {
      id: 'finance',
      label: 'Laba Rugi',
      icon: TrendingUp,
      adminOnly: true
    },
    {
      id: 'logs',
      label: 'Log Audit',
      icon: FileText,
      adminOnly: true
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      adminOnly: false
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-surface/95 backdrop-blur-lg border-t border-dark-border px-2 py-1.5 transition-all">
      <div className="max-w-3xl mx-auto grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.adminOnly && !isAdminLoggedIn;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
                {isLocked && (
                  <span className="absolute -top-1 -right-2 bg-amber-500/90 text-slate-950 p-0.5 rounded-full shadow-sm">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-indigo-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import React from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AdminAuthModal from './components/AdminAuthModal';
import ReceiptModal from './components/ReceiptModal';

import CashierTab from './views/CashierTab';
import HistoryTab from './views/HistoryTab';
import MenuManagementTab from './views/MenuManagementTab';
import FinanceTab from './views/FinanceTab';
import AuditLogTab from './views/AuditLogTab';
import SettingsTab from './views/SettingsTab';

export default function App() {
  const { activeTab, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-3 shadow-lg shadow-indigo-600/40 font-black text-xl">
          U
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Memuat UniPOS...</p>
        <span className="text-xs text-slate-500 mt-1">Sistem Kasir Universal Offline-First</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans">
      {/* Sticky App Header */}
      <Header />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'pos' && <CashierTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'menu' && <MenuManagementTab />}
        {activeTab === 'finance' && <FinanceTab />}
        {activeTab === 'logs' && <AuditLogTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <AdminAuthModal />
      <ReceiptModal />
    </div>
  );
}

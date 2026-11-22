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
      <div className="min-h-screen bg-[#06131c] flex flex-col items-center justify-center text-white relative overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700"></div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center animate-pulse mb-3 shadow-xl shadow-cyan-500/30 font-black text-2xl border border-white/20">
          U
        </div>
        <p className="text-base font-bold tracking-wide text-white">UniPOS Pro</p>
        <span className="text-xs text-cyan-300 font-medium mt-1">Sistem Kasir Universal Offline-First</span>
        <div className="mt-4 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono tracking-widest text-cyan-400">
          POWERED BY RSYFL DEVELOPMENT
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06131c] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Ambient Aurora Mesh Glow (V2 Dashboard Aesthetic) */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed top-[40%] right-[10%] w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Sticky App Header */}
      <Header />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {activeTab === 'pos' && <CashierTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'menu' && <MenuManagementTab />}
        {activeTab === 'finance' && <FinanceTab />}
        {activeTab === 'logs' && <AuditLogTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Subtle Persistent Watermark */}
      <div className="hidden lg:flex fixed bottom-2 right-4 z-30 pointer-events-none items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="text-[10px] font-mono text-cyan-300 tracking-wider">
          RSYFL DEVELOPMENT
        </span>
      </div>

      {/* Modals */}
      <AdminAuthModal />
      <ReceiptModal />
    </div>
  );
}

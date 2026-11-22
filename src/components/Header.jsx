import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, Store, Shield, ShieldAlert, Clock } from 'lucide-react';

export default function Header() {
  const {
    settings,
    isAdminLoggedIn,
    currentAdmin,
    hasRegisteredAdmin,
    setShowAdminAuthModal,
    logoutAdmin
  } = useApp();

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/\./g, ':')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Information */}
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoBase64 ? (
            <img
              src={settings.logoBase64}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight truncate leading-tight flex items-center gap-1.5">
              <span>{settings.brandName || 'UniPOS Store'}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate leading-normal">
              {settings.subtitle || 'Kasir Universal Offline-First'}
            </p>
          </div>
        </div>

        {/* Status, Clock & Admin Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Digital Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-bg/60 border border-dark-border text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTime}</span>
          </div>

          {/* Mode Admin / Kasir Button */}
          {isAdminLoggedIn ? (
            <button
              onClick={logoutAdmin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-medium active:scale-95 shadow-sm"
              title="Klik untuk mengunci Mode Admin"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <div className="text-left hidden sm:block">
                <span className="block font-bold leading-none">Mode Admin</span>
                <span className="text-[10px] text-amber-200/70">{currentAdmin?.name || 'Owner'}</span>
              </div>
              <span className="sm:hidden font-semibold">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAdminAuthModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all text-xs font-medium active:scale-95"
              title={hasRegisteredAdmin ? 'Login Admin untuk membuka menu & laporan' : 'Daftar Akun Admin Pertama Kali'}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-left hidden sm:block">
                <span className="block font-medium leading-none text-slate-300">Mode Kasir</span>
                <span className="text-[10px] text-indigo-400 font-medium">Buka Akses Admin</span>
              </div>
              <span className="sm:hidden text-slate-300">Kasir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

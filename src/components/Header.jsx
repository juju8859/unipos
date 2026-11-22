import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, Store, Shield, ShieldAlert, Clock, UserCheck, X, Check, Users } from 'lucide-react';

export default function Header() {
  const {
    settings,
    isAdminLoggedIn,
    currentAdmin,
    hasRegisteredAdmin,
    setShowAdminAuthModal,
    logoutAdmin,
    activeCashier,
    setActiveCashier
  } = useApp();

  const [currentTime, setCurrentTime] = useState('');
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [cashierInput, setCashierInput] = useState('');

  // Preset quick cashier names
  const presetCashiers = ['Kasir 1', 'Kasir 2', 'Shift Pagi', 'Shift Malam'];

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

  const handleSaveCashier = (name) => {
    const finalName = name || cashierInput;
    if (finalName.trim()) {
      setActiveCashier(finalName.trim());
      setCashierInput('');
      setShowCashierModal(false);
    }
  };

  return (
    <>
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

          {/* Status, Cashier Shift, Clock & Admin Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Cashier Shift Selector */}
            <button
              onClick={() => {
                setCashierInput(activeCashier);
                setShowCashierModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 transition-all text-xs font-medium active:scale-95 shadow-sm"
              title="Ganti nama kasir bertugas hari ini (tercetak di struk)"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left leading-tight hidden xs:block">
                <span className="text-[9px] text-slate-400 block font-normal">Kasir:</span>
                <span className="font-semibold text-xs text-indigo-200 max-w-[80px] sm:max-w-[120px] truncate block">
                  {activeCashier}
                </span>
              </div>
              <span className="xs:hidden text-[11px] font-semibold text-indigo-200 truncate max-w-[65px]">
                {activeCashier}
              </span>
            </button>

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

      {/* Modal Ganti Kasir Bertugas Hari Ini */}
      {showCashierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Kasir Bertugas Hari Ini</h3>
                  <p className="text-[11px] text-slate-400">Nama tercetak otomatis di struk belanja</p>
                </div>
              </div>
              <button
                onClick={() => setShowCashierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Select Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Pilih Cepat:</label>
                <div className="grid grid-cols-2 gap-2">
                  {presetCashiers.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSaveCashier(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        activeCashier === p
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-dark-card border-dark-border text-slate-300 hover:bg-dark-hover hover:border-slate-600'
                      }`}
                    >
                      <span>{p}</span>
                      {activeCashier === p && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Cashier Name Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Atau Ketik Nama Kasir / Karyawan:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Rian, Siti, dll"
                    value={cashierInput}
                    onChange={(e) => setCashierInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCashier()}
                    className="flex-1 px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => handleSaveCashier()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/30"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

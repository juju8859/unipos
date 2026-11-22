import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, ShieldAlert, KeyRound, User, Lock, X, Check } from 'lucide-react';

export default function AdminAuthModal() {
  const {
    showAdminAuthModal,
    setShowAdminAuthModal,
    hasRegisteredAdmin,
    registerFirstAdmin,
    loginAdmin
  } = useApp();

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');

  // Login Form State
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!showAdminAuthModal) return null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regUsername.trim()) {
      setErrorMsg('Nama dan Username wajib diisi');
      return;
    }
    if (regPin.length < 4) {
      setErrorMsg('PIN minimal 4 digit');
      return;
    }
    if (regPin !== regPinConfirm) {
      setErrorMsg('Konfirmasi PIN tidak cocok');
      return;
    }

    setLoading(true);
    const success = await registerFirstAdmin(regName, regUsername, regPin);
    setLoading(false);
    if (success) {
      setRegName('');
      setRegUsername('');
      setRegPin('');
      setRegPinConfirm('');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginPin) {
      setErrorMsg('Masukkan PIN Admin');
      return;
    }

    setLoading(true);
    const success = await loginAdmin(loginPin);
    setLoading(false);
    if (success) {
      setLoginPin('');
    } else {
      setErrorMsg('PIN salah, silakan coba lagi');
    }
  };

  const handleNumClick = (digit) => {
    if (loginPin.length < 8) {
      setLoginPin((prev) => prev + digit);
    }
  };

  const handleNumBackspace = () => {
    setLoginPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button (only if admin is already registered) */}
        {hasRegisteredAdmin && (
          <button
            onClick={() => setShowAdminAuthModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            {hasRegisteredAdmin ? <KeyRound className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {hasRegisteredAdmin ? 'Login Mode Admin' : 'Pendaftaran Admin Utama'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasRegisteredAdmin
              ? 'Masukkan PIN Admin untuk mengakses Menu, HPP, Pembukuan, dan Audit Log.'
              : 'Setup pertama kali: Daftarkan akun Owner untuk mengamankan data keuangan dan toko.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form: First-Time Setup */}
        {!hasRegisteredAdmin ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nama Pemilik / Admin</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username Admin</label>
              <input
                type="text"
                required
                placeholder="Contoh: owner"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">PIN Rahasia (4-6 digit)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-center font-mono tracking-widest text-base focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ulangi PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="••••"
                  value={regPinConfirm}
                  onChange={(e) => setRegPinConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-center font-mono tracking-widest text-base focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-500 hover:to-brand-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Buat Akun Admin & Masuk'}
            </button>
          </form>
        ) : (
          /* Form: Login with PIN Keypad */
          <div>
            <form onSubmit={handleLoginSubmit} className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-mono font-bold transition-all ${
                      loginPin[i]
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20'
                        : 'bg-dark-bg/60 border-dark-border text-slate-500'
                    }`}
                  >
                    {loginPin[i] ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Numeric Keypad for fast touchscreen POS input */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumClick(num)}
                    className="py-3 rounded-xl bg-dark-card hover:bg-dark-hover active:bg-indigo-600/30 text-white font-mono text-lg font-semibold border border-dark-border transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setLoginPin('')}
                  className="py-3 rounded-xl bg-dark-card hover:bg-dark-hover text-rose-400 font-semibold text-xs border border-dark-border transition-all"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleNumClick(0)}
                  className="py-3 rounded-xl bg-dark-card hover:bg-dark-hover active:bg-indigo-600/30 text-white font-mono text-lg font-semibold border border-dark-border transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumBackspace}
                  className="py-3 rounded-xl bg-dark-card hover:bg-dark-hover text-amber-400 font-semibold text-xs border border-dark-border transition-all"
                >
                  DEL
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuthModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !loginPin}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Verifikasi...' : 'Buka Kunci'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

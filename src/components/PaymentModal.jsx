import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import {
  Banknote,
  QrCode,
  ArrowRightLeft,
  X,
  Printer,
  CheckCircle,
  Coins,
  User
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose }) {
  const {
    grandTotal,
    checkout,
    customerName,
    setCustomerName,
    settings
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState('tunai'); // 'tunai' | 'qris' | 'transfer'
  const [cashReceived, setCashReceived] = useState(grandTotal);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCashReceived(grandTotal);
      setPaymentMethod('tunai');
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, Number(cashReceived || 0) - grandTotal);
  const isCashInsufficient = paymentMethod === 'tunai' && Number(cashReceived || 0) < grandTotal;

  // Preset quick cash buttons
  const quickAmounts = [
    { label: 'Uang Pas', value: grandTotal },
    { label: '10.000', value: 10000 },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 },
  ].filter(q => q.label === 'Uang Pas' || q.value >= grandTotal);

  const handlePay = async (autoPrint = true) => {
    if (isCashInsufficient) return;

    setLoading(true);
    const trx = await checkout({
      paymentMethod,
      cashReceived: paymentMethod === 'tunai' ? Number(cashReceived) : grandTotal
    });
    setLoading(false);

    if (trx) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-400">Pilih metode & selesaikan transaksi</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Total Tagihan Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 text-center">
            <span className="text-xs font-medium text-indigo-300">Total Tagihan</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Customer Name Optional */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Pelanggan / Meja (Opsional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: Meja 05 / Kak Ani"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('tunai')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'tunai'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold'
                    : 'bg-dark-card border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10 font-bold'
                    : 'bg-dark-card border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10 font-bold'
                    : 'bg-dark-card border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`}
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span className="text-xs">Transfer Bank</span>
              </button>
            </div>
          </div>

          {/* Cash Details if 'tunai' */}
          {paymentMethod === 'tunai' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nominal Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-white font-mono text-lg font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashReceived(q.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-xs font-mono text-slate-200 transition-all active:scale-95"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Highlight */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isCashInsufficient
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {isCashInsufficient ? 'Uang Masih Kurang' : 'Kembalian'}
                  </span>
                </div>
                <div className="font-mono text-base font-extrabold">
                  {isCashInsufficient
                    ? '-' + formatCurrency(grandTotal - Number(cashReceived || 0))
                    : formatCurrency(changeAmount)}
                </div>
              </div>
            </div>
          )}

          {/* QRIS Display when 'qris' is selected */}
          {paymentMethod === 'qris' && (
            <div className="p-4 rounded-2xl bg-white text-slate-900 text-center flex flex-col items-center justify-center space-y-2.5 shadow-md">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                QRIS Dinamis / Statis {settings?.brandName || 'Toko'}
              </span>

              {settings?.qrisBase64 ? (
                <img
                  src={settings.qrisBase64}
                  alt="QRIS Toko"
                  className="w-44 h-44 object-contain rounded-xl border border-slate-200 p-1"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3">
                  <QrCode className="w-24 h-24 text-slate-800 mb-1" />
                  <span className="text-[10px] font-bold text-slate-700">Scan QRIS Pembayaran</span>
                </div>
              )}

              <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg w-full">
                <span className="text-[11px] text-slate-600 block">Total Tagihan:</span>
                <span className="text-base font-extrabold text-indigo-700 font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay & Semua Bank.
              </p>
            </div>
          )}

          {/* Non-cash guidance note */}
          {paymentMethod !== 'tunai' && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Pembayaran via {paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank'} akan otomatis dicatat ke database transaksi dan log audit.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-dark-border bg-dark-surface flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={loading || isCashInsufficient}
            onClick={() => handlePay(true)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'BAYAR & CETAK STRUK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

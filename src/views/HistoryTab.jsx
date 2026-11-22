import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function HistoryTab() {
  const { transactions, printReceipt, setReceiptModalData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | '7days' | 'all'

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return transactions.filter((trx) => {
      // Date filter
      if (dateFilter === 'today') {
        const trxDate = trx.date?.slice(0, 10);
        if (trxDate !== todayStr) return false;
      } else if (dateFilter === '7days') {
        const diffTime = Math.abs(now - new Date(trx.date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = trx.id?.toLowerCase().includes(query);
        const matchCustomer = trx.customerName?.toLowerCase().includes(query);
        const matchItem = trx.items?.some((i) => i.name.toLowerCase().includes(query));
        return matchId || matchCustomer || matchItem;
      }

      return true;
    });
  }, [transactions, dateFilter, searchQuery]);

  const totalOmzetPeriod = filteredTransactions.reduce((acc, t) => acc + (t.total || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 max-w-5xl mx-auto w-full space-y-4 pb-20 lg:pb-6">
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-card border border-dark-border p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <span>Riwayat Transaksi Penjualan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daftar penjualan toko, struk, dan pencetakan ulang nota
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-right">
            <span className="text-[10px] text-indigo-300 block leading-tight">Total Omzet Filter</span>
            <span className="text-sm font-extrabold text-white font-mono">
              {formatCurrency(totalOmzetPeriod)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari ID Nota, nama pelanggan, atau item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 bg-dark-card border border-dark-border p-1 rounded-xl">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dateFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dateFilter === '7days'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              dateFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6 bg-dark-surface/40 rounded-2xl border border-dark-border">
            <Clock className="w-10 h-10 text-slate-600 mb-2" />
            <p className="font-semibold text-sm">Belum ada transaksi</p>
            <p className="text-xs text-slate-500 mt-1">Transaksi yang diselesaikan di tab Kasir akan tampil di sini.</p>
          </div>
        ) : (
          filteredTransactions.map((trx) => (
            <div
              key={trx.id}
              className="p-3.5 rounded-2xl bg-dark-card border border-dark-border hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-300">
                    {trx.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {trx.paymentMethod?.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {trx.dateFormatted || new Date(trx.date).toLocaleString('id-ID')}
                  </span>
                  {trx.customerName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                      {trx.customerName}
                    </span>
                  )}
                </div>

                {/* Items preview */}
                <p className="text-xs text-slate-300 line-clamp-1">
                  {trx.items?.map((i) => `${i.name} (${i.qty}x)`).join(', ')}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Kasir: {trx.cashierName || 'Kasir 1'}</span>
                  {trx.discount > 0 && (
                    <span className="text-rose-400 font-mono">
                      Diskon: -{formatCurrency(trx.discount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Total & Reprint Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block leading-none">Total</span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-emerald-400">
                    {formatCurrency(trx.total)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReceiptModalData(trx)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium"
                    title="Pratinjau Struk"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => printReceipt(trx)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Ulang</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import { exportMonthlyReportCSV } from '../utils/exportCsv';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Plus,
  Trash2,
  PieChart,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function FinanceTab() {
  const { transactions, expenses, saveExpense, deleteExpense, settings, showToast } = useApp();

  // Current month default: YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Form State for Expense
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Bahan Baku');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  // Filter transactions and expenses for selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => (t.monthYear || t.date?.slice(0, 7)) === selectedMonth);
  }, [transactions, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => (e.monthYear || e.date?.slice(0, 7)) === selectedMonth);
  }, [expenses, selectedMonth]);

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => acc + (t.total || 0), 0);
  }, [monthlyTransactions]);

  const totalCost = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => {
      const trxHpp = (t.items || []).reduce(
        (sum, item) => sum + ((item.costPrice || 0) * (item.qty || 1)),
        0
      );
      return acc + trxHpp;
    }, 0);
  }, [monthlyTransactions]);

  const grossProfit = totalRevenue - totalCost;

  const totalExpense = useMemo(() => {
    return monthlyExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [monthlyExpenses]);

  const netProfit = grossProfit - totalExpense;

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expTitle.trim()) {
      showToast('Keterangan pengeluaran wajib diisi', 'warning');
      return;
    }
    const num = Number(expAmount);
    if (isNaN(num) || num <= 0) {
      showToast('Nominal harus lebih dari 0', 'warning');
      return;
    }

    const success = await saveExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount: num,
      date: expDate
    });

    if (success) {
      setExpTitle('');
      setExpAmount('');
      setIsExpenseModalOpen(false);
    }
  };

  const handleExportCSV = () => {
    exportMonthlyReportCSV(
      selectedMonth,
      {
        totalRevenue,
        totalCost,
        grossProfit,
        totalExpense,
        netProfit,
        transactionCount: monthlyTransactions.length
      },
      monthlyTransactions,
      monthlyExpenses,
      settings?.brandName
    );
    showToast(`Laporan bulan ${selectedMonth} berhasil di-export ke CSV!`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 max-w-6xl mx-auto w-full space-y-4 pb-20 lg:pb-6">
      {/* Top Header with Month Selector and Export CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-card border border-dark-border p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Pembukuan & Laba Rugi Bulanan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Rekap omzet, HPP, pengeluaran operasional, dan laba bersih
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pengeluaran</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 5 Financial Metric Cards (Admin Dashboard V2 Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Omzet / Revenue */}
        <div className="p-4 rounded-2xl glass-card border border-cyan-500/25 shadow-lg shadow-cyan-500/5 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
              Total Omzet
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[11px] text-cyan-400 font-medium mt-1.5 block">
            {monthlyTransactions.length} Transaksi
          </span>
        </div>

        {/* 2. Total HPP */}
        <div className="p-4 rounded-2xl glass-card border border-amber-500/25 shadow-lg shadow-amber-500/5 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Total HPP / Modal
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
            {formatCurrency(totalCost)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5 block">Modal Terjual</span>
        </div>

        {/* 3. Laba Kotor */}
        <div className="p-4 rounded-2xl glass-card border border-teal-500/25 shadow-lg shadow-teal-500/5 relative overflow-hidden group hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
              Laba Kotor
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-teal-300 font-mono">
            {formatCurrency(grossProfit)}
          </div>
          <span className="text-[10px] text-teal-400/80 mt-1.5 block">Omzet - HPP</span>
        </div>

        {/* 4. Pengeluaran Operasional */}
        <div className="p-4 rounded-2xl glass-card border border-rose-500/25 shadow-lg shadow-rose-500/5 relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
              Pengeluaran Ops
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-300 font-mono">
            {formatCurrency(totalExpense)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1.5 block">
            {monthlyExpenses.length} Biaya tercatat
          </span>
        </div>

        {/* 5. Laba Bersih (NET PROFIT) */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl glass-card-glow border border-emerald-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              LABA BERSIH (NET)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
            {formatCurrency(netProfit)}
          </div>
          <span className="text-[10px] text-emerald-200/80 mt-1.5 block">Bersih Masuk Dompet</span>
        </div>
      </div>

      {/* Expenses Table List */}
      <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-400" />
            <span>Rincian Pengeluaran Operasional ({selectedMonth})</span>
          </h3>
          <span className="text-xs font-mono text-rose-300 font-bold">
            Total: {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {monthlyExpenses.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">Belum ada catatan pengeluaran di bulan ini.</p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-2 text-xs text-indigo-400 font-semibold hover:underline"
              >
                + Tambah Pengeluaran Baru
              </button>
            </div>
          ) : (
            monthlyExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {exp.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{exp.date}</span>
                  </div>
                  <h4 className="font-semibold text-white text-xs mt-1 truncate">{exp.title}</h4>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono font-bold text-xs text-rose-400">
                    -{formatCurrency(exp.amount)}
                  </span>
                  <button
                    onClick={() => deleteExpense(exp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-5">
            <h3 className="font-bold text-white text-base mb-3">Catat Pengeluaran Operasional</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Keterangan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Gas Elpiji, Kantong Plastik, Listrik"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none bg-dark-bg"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Utilitas / Listrik / Air">Utilitas / Listrik / Air</option>
                    <option value="Gaji Karyawan">Gaji Karyawan</option>
                    <option value="Sewa Tempat">Sewa Tempat</option>
                    <option value="Peralatan & Perlengkapan">Peralatan & Perlengkapan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  placeholder="50000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white font-mono text-sm focus:outline-none text-rose-400 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

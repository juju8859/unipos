import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { exportAuditLogsCSV } from '../utils/exportCsv';
import {
  FileText,
  Search,
  Download,
  Filter,
  Shield,
  Activity,
  User,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function AuditLogTab() {
  const { auditLogs, refreshLogs, settings, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const actionCategories = [
    { id: 'ALL', label: 'Semua Aktivitas' },
    { id: 'TRANSAKSI', label: 'Transaksi & Struk' },
    { id: 'MENU', label: 'Menu & Harga' },
    { id: 'PENGELUARAN', label: 'Pengeluaran' },
    { id: 'ADMIN', label: 'Admin & Akun' },
    { id: 'PENGATURAN', label: 'Pengaturan Toko' }
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter by category
      if (actionFilter !== 'ALL') {
        const type = (log.actionType || '').toUpperCase();
        if (actionFilter === 'TRANSAKSI' && !type.includes('TRANSAKSI') && !type.includes('STRUK')) return false;
        if (actionFilter === 'MENU' && !type.includes('MENU')) return false;
        if (actionFilter === 'PENGELUARAN' && !type.includes('PENGELUARAN')) return false;
        if (actionFilter === 'ADMIN' && !type.includes('ADMIN') && !type.includes('LOGIN') && !type.includes('PENDAFTARAN')) return false;
        if (actionFilter === 'PENGATURAN' && !type.includes('PENGATURAN') && !type.includes('RESTORE')) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = log.description?.toLowerCase().includes(q);
        const matchActor = log.actor?.toLowerCase().includes(q);
        const matchType = log.actionType?.toLowerCase().includes(q);
        return matchDesc || matchActor || matchType;
      }

      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  const handleExportCSV = () => {
    exportAuditLogsCSV(filteredLogs, settings?.brandName);
    showToast('Database Log Aktivitas berhasil diexport ke CSV!', 'success');
  };

  const getActionBadgeColor = (type = '') => {
    const t = type.toUpperCase();
    if (t.includes('TRANSAKSI')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (t.includes('MENU')) return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    if (t.includes('PENGELUARAN')) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (t.includes('ADMIN')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-slate-700/50 text-slate-300 border-slate-600';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 max-w-6xl mx-auto w-full space-y-4 pb-20 lg:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-card border border-dark-border p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Database Log Aktivitas (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pencatatan otomatis seluruh riwayat aksi, perubahan harga menu, transaksi, dan pengeluaran
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Muat Ulang Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari deskripsi aktivitas, aktor, atau aksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Action Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {actionCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActionFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                actionFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-dark-card border border-dark-border text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table List */}
      <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl overflow-hidden flex flex-col">
        <div className="p-3 border-b border-dark-border bg-dark-surface/40 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Menampilkan {filteredLogs.length} Catatan Aktivitas</span>
          <span className="font-mono text-[11px]">Database: IndexedDB Offline</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-dark-border/60">
          {filteredLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">Tidak ada log aktivitas sesuai kriteria pencarian.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-dark-surface/40 transition-colors space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getActionBadgeColor(log.actionType)}`}>
                      {log.actionType || 'SISTEM'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {log.formattedTimestamp || new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-medium flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {log.actor || 'Kasir'}
                  </span>
                </div>

                <p className="text-xs text-white leading-relaxed font-normal">
                  {log.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

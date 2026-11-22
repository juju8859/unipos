import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  TrendingUp,
  Percent,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function MenuManagementTab() {
  const { products, saveProduct, deleteProduct, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [code, setCode] = useState('');

  // Delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory(categories[1] || 'Umum');
    setPrice('');
    setCostPrice('');
    setIsAvailable(true);
    setCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category || 'Umum');
    setPrice(prod.price);
    setCostPrice(prod.costPrice || '');
    setIsAvailable(prod.isAvailable ?? true);
    setCode(prod.code || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi', 'warning');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Harga jual harus berupa angka valid', 'warning');
      return;
    }

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: name.trim(),
      category: category.trim() || 'Umum',
      price: numPrice,
      costPrice: Number(costPrice) || 0,
      isAvailable,
      code: code.trim() || ''
    };

    const success = await saveProduct(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  // Live margin calculation for the active modal form
  const modalMargin = Math.max(0, Number(price || 0) - Number(costPrice || 0));
  const modalMarginPercent = price > 0 ? ((modalMargin / Number(price)) * 100).toFixed(1) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 max-w-6xl mx-auto w-full space-y-4 pb-20 lg:pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-card border border-dark-border p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-indigo-400" />
            <span>Kelola Menu & Harga (HPP)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tambah, edit, dan pantau kalkulasi margin laba setiap produk
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nama menu atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-dark-card border border-dark-border text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((prod) => {
            const hpp = prod.costPrice || 0;
            const profit = prod.price - hpp;
            const marginPct = prod.price > 0 ? ((profit / prod.price) * 100).toFixed(1) : 0;

            return (
              <div
                key={prod.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all bg-dark-card ${
                  prod.isAvailable ? 'border-dark-border' : 'border-rose-900/40 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 uppercase">
                      {prod.category || 'Umum'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.isAvailable
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {prod.isAvailable ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm leading-snug mb-1">{prod.name}</h3>
                  {prod.code && <p className="text-[10px] font-mono text-slate-500 mb-2">Kode: {prod.code}</p>}
                </div>

                {/* Financial & Margin Info */}
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Harga Jual:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">HPP / Modal:</span>
                    <span className="font-mono text-slate-300 text-xs">
                      {formatCurrency(hpp)}
                    </span>
                  </div>

                  {/* Calculated Margin */}
                  <div className="p-2 rounded-xl bg-dark-bg/60 border border-dark-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-emerald-400 font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Laba Bersih / Margin:</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-300">
                        {formatCurrency(profit)}
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono ml-1">
                        ({marginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setProductToDelete(prod)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border mb-4">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Edit Menu & Harga' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Produk / Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Es Teh Manis Jumbo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori Bebas *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Minuman"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kode / Barcode (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: MN-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">HPP / Modal (Rp)</label>
                  <input
                    type="number"
                    placeholder="6000"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
                <span>Perkiraan Keuntungan:</span>
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(modalMargin)} ({modalMarginPercent}%)
                </span>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/60 border border-dark-border">
                <div>
                  <span className="font-semibold text-white text-xs block">Status Ketersediaan</span>
                  <span className="text-[10px] text-slate-400">Tampilkan produk ini di kasir</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-dark-surface border border-dark-border rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base mb-1">Hapus Menu Ini?</h4>
            <p className="text-xs text-slate-400 mb-4">
              "{productToDelete.name}" akan dihapus secara permanen dari daftar produk. Riwayat transaksi sebelumnya tetap aman.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteProduct(productToDelete);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

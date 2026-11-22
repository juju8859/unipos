import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import PaymentModal from '../components/PaymentModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Percent,
  Receipt,
  ShoppingCart,
  RotateCcw,
  Tag,
  AlertCircle,
  FileText,
  ChevronUp,
  X
} from 'lucide-react';

export default function CashierTab() {
  const {
    products,
    cart,
    addToCart,
    updateCartQty,
    updateCartNotes,
    removeFromCart,
    clearCart,
    cartSubtotal,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    discountAmount,
    taxEnabled,
    setTaxEnabled,
    taxRate,
    taxAmount,
    grandTotal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [editingNoteItem, setEditingNoteItem] = useState(null); // { id, name, notes }

  // Extract unique categories from active products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filter products by search and category
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

  const totalItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden pb-16 lg:pb-0">
      {/* LEFT SECTION: Search, Category Chips & Products Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 lg:p-4 space-y-3">
        {/* Search Bar & Stats */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama produk atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-slate-300 text-xs font-medium">
            <span>{filteredProducts.length} Produk</span>
          </div>
        </div>

        {/* Dynamic Category Chips Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-dark-card border border-dark-border text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
              <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tambahkan menu baru di tab Menu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find((i) => i.product.id === product.id);
                const isOutOfStock = !product.isAvailable;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 active:scale-95 group ${
                      isOutOfStock
                        ? 'opacity-40 bg-dark-surface/40 border-dark-border cursor-not-allowed'
                        : inCartItem
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-dark-card hover:bg-dark-hover border-dark-border hover:border-slate-600'
                    }`}
                  >
                    {/* Badge In Cart Qty */}
                    {inCartItem && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold font-mono shadow-sm">
                        {inCartItem.qty}x
                      </span>
                    )}

                    {/* Badge Out of Stock */}
                    {isOutOfStock && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/80 text-white text-[9px] font-bold">
                        HABIS
                      </span>
                    )}

                    {/* Product Photo or Category Icon */}
                    {product.image ? (
                      <div className="w-full h-24 sm:h-28 mb-2 rounded-xl overflow-hidden bg-slate-900 border border-white/5 relative flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-16 sm:h-20 mb-2 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Tag className="w-5 h-5 opacity-40" />
                      </div>
                    )}

                    <div className="flex-1">
                      <span className="inline-block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5 truncate max-w-full">
                        {product.category || 'Umum'}
                      </span>
                      <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
                        {formatCurrency(product.price)}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT / SIDE PANEL: Cart Panel (Fixed above bottom nav on mobile, Sticky on desktop) */}
      <div
        className={`fixed lg:static inset-x-0 top-0 bottom-16 lg:bottom-0 lg:inset-auto right-0 z-30 w-full sm:w-96 lg:w-96 bg-dark-surface border-l border-dark-border flex flex-col transition-transform duration-300 ${
          isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Cart Header */}
        <div className="p-3.5 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Keranjang Kasir</h3>
              <span className="text-[10px] text-slate-400">{totalItemCount} Total Item</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Kosongkan Keranjang"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle: Items & Discount Adjustments */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <ShoppingCart className="w-12 h-12 text-slate-600 mb-2 stroke-[1.5]" />
              <p className="font-medium text-sm text-slate-300">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-500 mt-0.5">Pilih produk di sebelah kiri untuk menambahkan pesanan.</p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-dark-card border border-dark-border hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="font-semibold text-white text-xs leading-snug truncate">
                          {item.product.name}
                        </h5>
                        <span className="font-mono text-xs text-cyan-300">
                          {formatCurrency(item.product.price)}
                        </span>
                      </div>

                      <span className="font-mono font-bold text-xs text-white">
                        {formatCurrency(item.product.price * item.qty)}
                      </span>
                    </div>

                    {/* Optional Order Note */}
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      {item.notes ? (
                        <button
                          onClick={() => setEditingNoteItem({ id: item.product.id, name: item.product.name, notes: item.notes })}
                          className="text-amber-300/80 hover:text-amber-200 truncate flex items-center gap-1 text-[10px]"
                        >
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">"{item.notes}"</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingNoteItem({ id: item.product.id, name: item.product.name, notes: '' })}
                          className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>+ Catatan</span>
                        </button>
                      )}

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-dark-bg/80 border border-dark-border rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                        >
                          {item.qty === 1 ? <Trash2 className="w-3 h-3 text-rose-400" /> : <Minus className="w-3 h-3" />}
                        </button>

                        <span className="w-6 text-center font-mono font-bold text-xs text-white">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal, Diskon & Pajak Options Inside Scroll Area */}
              <div className="p-3 rounded-2xl bg-dark-card/60 border border-dark-border space-y-2.5 mt-2">
                {/* Subtotal */}
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal Pesanan</span>
                  <span className="font-mono font-medium">{formatCurrency(cartSubtotal)}</span>
                </div>

                {/* Discount Form Row */}
                <div className="space-y-1 pt-1.5 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Potongan / Diskon</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDiscountType('nominal')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          discountType === 'nominal' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Rp
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          discountType === 'percent' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={discountType === 'percent' ? '0 - 100%' : 'Nominal potongan (Rp)'}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs text-white font-mono focus:outline-none"
                    />
                    {discountAmount > 0 && (
                      <span className="text-xs font-mono text-rose-400 font-bold whitespace-nowrap">
                        -{formatCurrency(discountAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tax PB1 Toggle */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-cyan-500"
                    />
                    <span className="text-slate-300">Pajak / PB1 ({taxRate}%)</span>
                  </label>
                  <span className="font-mono text-slate-400">
                    {taxEnabled ? '+' + formatCurrency(taxAmount) : 'OFF'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ALWAYS VISIBLE PINNED BOTTOM BAR: Grand Total & Checkout Button */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 p-3.5 sm:p-4 bg-dark-surface/98 backdrop-blur-xl border-t border-dark-border shadow-2xl flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Total Tagihan
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5 flex-shrink-0" />
              <span>PROSES BAYAR & CETAK STRUK</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar for Mobile when cart has items */}
      {cart.length > 0 && !isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 bg-indigo-600 rounded-2xl shadow-xl p-3 flex items-center justify-between text-white animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs font-mono">
              {totalItemCount}
            </div>
            <div>
              <span className="text-[10px] text-indigo-100 block leading-none">Total Tagihan</span>
              <span className="text-sm font-extrabold font-mono">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-md flex items-center gap-1 active:scale-95"
          >
            <span>Buka Keranjang</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Item Note Modal */}
      {editingNoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-dark-surface border border-dark-border rounded-2xl p-5 shadow-2xl">
            <h4 className="font-bold text-white text-sm mb-1">Catatan Khusus Pesanan</h4>
            <p className="text-xs text-slate-400 mb-3">{editingNoteItem.name}</p>
            <input
              type="text"
              autoFocus
              placeholder="Contoh: Pedas sedang, tanpa es batu, dll"
              value={editingNoteItem.notes}
              onChange={(e) => setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCartNotes(editingNoteItem.id, editingNoteItem.notes);
                  setEditingNoteItem(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db, DEFAULT_SETTINGS, INITIAL_PRODUCTS } from '../db/indexedDB';
import { executePrint, generateTestReceipt } from '../utils/printer';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history' | 'menu' | 'finance' | 'logs' | 'settings'

  // Application Data States
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Admin Auth States
  const [hasRegisteredAdmin, setHasRegisteredAdmin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null); // Callback or Tab switch to run on login

  // Cashier Shift State
  const [activeCashier, setActiveCashierState] = useState(() => {
    return localStorage.getItem('unipos_active_cashier') || 'Kasir 1';
  });

  const setActiveCashier = (name) => {
    const val = (name || '').trim() || 'Kasir 1';
    setActiveCashierState(val);
    localStorage.setItem('unipos_active_cashier', val);
    showToast(`Kasir bertugas: ${val}`, 'info');
  };

  // Cart State
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('nominal'); // 'nominal' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [customerName, setCustomerName] = useState('');

  // Modals & UI States
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Helper toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Initial Data Load
  const reloadData = async () => {
    try {
      const storedSettings = await db.getSettings();
      if (storedSettings) {
        setSettings(storedSettings);
        setTaxEnabled(storedSettings.taxEnabled || false);
      }

      const allAdmins = await db.getAll('admins');
      setHasRegisteredAdmin(allAdmins.length > 0);

      let allProducts = await db.getAll('products');
      // If products exist in phone from version 1 without images, automatically backfill images now
      let needsRefresh = false;
      for (const prod of allProducts) {
        if (!prod.image) {
          const match = INITIAL_PRODUCTS.find((p) => p.name === prod.name);
          if (match && match.image) {
            prod.image = match.image;
            await db.update('products', prod);
            needsRefresh = true;
          }
        }
      }
      if (needsRefresh) {
        allProducts = await db.getAll('products');
      }
      setProducts(allProducts.sort((a, b) => (a.name || '').localeCompare(b.name || '')));

      const allTrx = await db.getAll('transactions');
      setTransactions(allTrx.sort((a, b) => new Date(b.date) - new Date(a.date)));

      const allExpenses = await db.getAll('expenses');
      setExpenses(allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)));

      const allLogs = await db.getAll('audit_logs');
      setAuditLogs(allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

      // Don't block initial POS screen, user can register from Header or when accessing Admin tabs
      if (allAdmins.length === 0) {
        setShowAdminAuthModal(false);
      }
    } catch (err) {
      console.error('Failed to load initial DB data:', err);
      showToast('Gagal memuat data lokal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Admin Auth Actions
  const registerFirstAdmin = async (name, username, pin) => {
    try {
      const newAdmin = {
        name,
        username: username.toLowerCase().trim(),
        pin: String(pin).trim(),
        role: 'owner',
        createdAt: new Date().toISOString()
      };
      await db.add('admins', newAdmin);
      const updatedSettings = { ...settings, adminRegistered: true };
      await db.saveSettings(updatedSettings);
      setSettings(updatedSettings);

      setHasRegisteredAdmin(true);
      setIsAdminLoggedIn(true);
      setCurrentAdmin(newAdmin);
      setShowAdminAuthModal(false);

      await db.logActivity(
        'PENDAFTARAN_ADMIN',
        `Admin utama "${name}" (@${username}) berhasil didaftarkan`,
        { username },
        'Admin'
      );
      showToast(`Selamat datang, ${name}! Mode Admin aktif.`, 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Gagal mendaftarkan admin: ' + err.message, 'error');
      return false;
    }
  };

  const loginAdmin = async (pin) => {
    try {
      const allAdmins = await db.getAll('admins');
      const found = allAdmins.find((a) => String(a.pin) === String(pin).trim());
      if (found) {
        setIsAdminLoggedIn(true);
        setCurrentAdmin(found);
        setShowAdminAuthModal(false);
        showToast(`Mode Admin aktif: ${found.name}`, 'success');

        await db.logActivity(
          'LOGIN_ADMIN',
          `Admin "${found.name}" berhasil login`,
          { adminId: found.id },
          'Admin'
        );

        if (pendingAdminAction) {
          if (typeof pendingAdminAction === 'function') {
            pendingAdminAction();
          } else if (typeof pendingAdminAction === 'string') {
            setActiveTab(pendingAdminAction);
          }
          setPendingAdminAction(null);
        }
        return true;
      } else {
        showToast('PIN atau Password salah!', 'error');
        return false;
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat verifikasi PIN', 'error');
      return false;
    }
  };

  const logoutAdmin = async () => {
    const adminName = currentAdmin?.name || 'Admin';
    setIsAdminLoggedIn(false);
    setCurrentAdmin(null);
    showToast('Mode Admin dikunci (Kembali ke Mode Kasir)', 'info');

    await db.logActivity(
      'LOGOUT_ADMIN',
      `Admin "${adminName}" keluar dari sesi`,
      {},
      'Kasir'
    );

    // If on a protected tab, redirect to POS
    if (['menu', 'finance', 'logs'].includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  // Guard navigation to protected tabs
  const requestTabChange = (targetTab) => {
    const adminTabs = ['menu', 'finance', 'logs'];
    if (adminTabs.includes(targetTab) && !isAdminLoggedIn) {
      setPendingAdminAction(targetTab);
      setShowAdminAuthModal(true);
      return;
    }
    setActiveTab(targetTab);
  };

  // Cart Operations
  const addToCart = (product) => {
    if (!product.isAvailable) {
      showToast(`${product.name} sedang habis`, 'warning');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          qty: next[existingIndex].qty + 1
        };
        return next;
      } else {
        return [...prev, { product, qty: 1, notes: '' }];
      }
    });
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  const updateCartNotes = (productId, notes) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName('');
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountValue)));
      return Math.round((cartSubtotal * pct) / 100);
    }
    return Math.min(cartSubtotal, Number(discountValue) || 0);
  }, [cartSubtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);

  const taxRate = settings?.taxRate || 10;
  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    return Math.round((taxableAmount * taxRate) / 100);
  }, [taxEnabled, taxableAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return taxableAmount + taxAmount;
  }, [taxableAmount, taxAmount]);

  // Checkout and Save Transaction
  const checkout = async ({ paymentMethod, cashReceived }) => {
    if (cart.length === 0) {
      showToast('Keranjang masih kosong', 'warning');
      return null;
    }

    try {
      const now = new Date();
      const dateFormatted = now.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\./g, ':');

      const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const trxId = `TRX-${dateCode}-${randomCode}`;
      const monthYear = now.toISOString().slice(0, 7); // YYYY-MM

      const itemsSnapshot = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice || 0, // Lock HPP for historical audit & P&L
        category: item.product.category,
        qty: item.qty,
        notes: item.notes || ''
      }));

      const changeAmount = paymentMethod === 'tunai'
        ? Math.max(0, (cashReceived || grandTotal) - grandTotal)
        : 0;

      const transactionData = {
        id: trxId,
        date: now.toISOString(),
        dateFormatted,
        monthYear,
        customerName: customerName.trim(),
        cashierName: activeCashier || (isAdminLoggedIn ? (currentAdmin?.name || 'Admin') : 'Kasir 1'),
        items: itemsSnapshot,
        subtotal: cartSubtotal,
        discount: discountAmount,
        discountType,
        discountPercent: discountType === 'percent' ? Number(discountValue) : 0,
        tax: taxAmount,
        taxRate: taxEnabled ? taxRate : 0,
        total: grandTotal,
        paymentMethod, // 'tunai' | 'qris' | 'transfer'
        cashReceived: paymentMethod === 'tunai' ? Number(cashReceived || grandTotal) : grandTotal,
        changeAmount
      };

      await db.add('transactions', transactionData);
      setTransactions((prev) => [transactionData, ...prev]);

      // Audit Log
      await db.logActivity(
        'TRANSAKSI_BARU',
        `Transaksi ${trxId} senilai Rp ${grandTotal.toLocaleString('id-ID')} (${itemsSnapshot.length} item, Metode: ${paymentMethod.toUpperCase()})`,
        { trxId, total: grandTotal, paymentMethod },
        isAdminLoggedIn ? 'Admin' : 'Kasir'
      );

      // Auto-print receipt if enabled
      if (settings?.autoPrintOnCheckout) {
        executePrint(transactionData, settings, () => {
          setReceiptModalData(transactionData);
        });
      }

      // Open visual receipt modal
      setReceiptModalData(transactionData);

      // Clear Cart
      clearCart();
      showToast('Transaksi berhasil disimpan!', 'success');
      return transactionData;
    } catch (err) {
      console.error('Checkout failed:', err);
      showToast('Gagal memproses transaksi: ' + err.message, 'error');
      return null;
    }
  };

  // Product CRUD
  const saveProduct = async (productData) => {
    try {
      const isEdit = Boolean(productData.id);
      let updated;
      if (isEdit) {
        const oldProduct = products.find((p) => p.id === productData.id);
        updated = {
          ...productData,
          updatedAt: new Date().toISOString()
        };
        await db.put('products', updated);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

        // Audit Log for price update
        const priceChange = oldProduct && oldProduct.price !== updated.price
          ? `(Harga lama: Rp ${oldProduct.price.toLocaleString('id-ID')} -> Harga baru: Rp ${updated.price.toLocaleString('id-ID')})`
          : '';

        await db.logActivity(
          'UPDATE_MENU',
          `Menu "${updated.name}" diperbarui ${priceChange}`,
          { id: updated.id, oldPrice: oldProduct?.price, newPrice: updated.price },
          'Admin'
        );
        showToast(`Menu "${updated.name}" berhasil diperbarui`, 'success');
      } else {
        const newProduct = {
          ...productData,
          createdAt: new Date().toISOString()
        };
        const id = await db.add('products', newProduct);
        newProduct.id = id;
        setProducts((prev) => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));

        await db.logActivity(
          'TAMBAH_MENU',
          `Menu baru ditambahkan: "${newProduct.name}" (Harga: Rp ${newProduct.price.toLocaleString('id-ID')}, HPP: Rp ${(newProduct.costPrice || 0).toLocaleString('id-ID')})`,
          { id, name: newProduct.name, price: newProduct.price },
          'Admin'
        );
        showToast(`Menu "${newProduct.name}" berhasil ditambahkan`, 'success');
      }
      return true;
    } catch (err) {
      showToast('Gagal menyimpan menu: ' + err.message, 'error');
      return false;
    }
  };

  const deleteProduct = async (product) => {
    try {
      await db.delete('products', product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));

      await db.logActivity(
        'HAPUS_MENU',
        `Menu "${product.name}" dihapus dari database`,
        { id: product.id, name: product.name },
        'Admin'
      );
      showToast(`Menu "${product.name}" telah dihapus`, 'info');
      return true;
    } catch (err) {
      showToast('Gagal menghapus menu: ' + err.message, 'error');
      return false;
    }
  };

  // Expenses CRUD
  const saveExpense = async (expenseData) => {
    try {
      const now = new Date(expenseData.date || new Date());
      const monthYear = now.toISOString().slice(0, 7);
      const newExp = {
        ...expenseData,
        monthYear,
        createdAt: new Date().toISOString()
      };
      const id = await db.add('expenses', newExp);
      newExp.id = id;
      setExpenses((prev) => [newExp, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));

      await db.logActivity(
        'TAMBAH_PENGELUARAN',
        `Pengeluaran dicatat: "${newExp.title}" (Kategori: ${newExp.category}, Rp ${Number(newExp.amount).toLocaleString('id-ID')})`,
        { id, amount: newExp.amount, category: newExp.category },
        'Admin'
      );
      showToast('Pengeluaran berhasil dicatat', 'success');
      return true;
    } catch (err) {
      showToast('Gagal mencatat pengeluaran: ' + err.message, 'error');
      return false;
    }
  };

  const deleteExpense = async (expense) => {
    try {
      await db.delete('expenses', expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));

      await db.logActivity(
        'HAPUS_PENGELUARAN',
        `Pengeluaran dihapus: "${expense.title}" (Rp ${Number(expense.amount).toLocaleString('id-ID')})`,
        { id: expense.id, amount: expense.amount },
        'Admin'
      );
      showToast('Pengeluaran berhasil dihapus', 'info');
      return true;
    } catch (err) {
      showToast('Gagal menghapus pengeluaran: ' + err.message, 'error');
      return false;
    }
  };

  // Settings & Brand Updates
  const updateSettings = async (newSettings) => {
    try {
      await db.saveSettings(newSettings);
      setSettings(newSettings);
      setTaxEnabled(newSettings.taxEnabled || false);

      await db.logActivity(
        'UPDATE_PENGATURAN',
        `Pengaturan toko/brand atau printer diperbarui`,
        {},
        'Admin'
      );
      showToast('Pengaturan berhasil disimpan!', 'success');
      return true;
    } catch (err) {
      showToast('Gagal menyimpan pengaturan: ' + err.message, 'error');
      return false;
    }
  };

  // Print Dispatcher
  const printReceipt = async (transaction) => {
    try {
      const result = await executePrint(transaction, settings, () => {
        setReceiptModalData(transaction);
      });
      if (result.success) {
        showToast(`Struk dicetak (Mode: ${result.mode?.toUpperCase()})`, 'success');
      }

      await db.logActivity(
        'CETAK_STRUK',
        `Struk untuk transaksi ${transaction.id} dicetak ulang`,
        { trxId: transaction.id },
        isAdminLoggedIn ? 'Admin' : 'Kasir'
      );
    } catch (err) {
      showToast('Gagal mencetak struk: ' + err.message, 'error');
      setReceiptModalData(transaction);
    }
  };

  const triggerTestPrint = () => {
    const testTrx = generateTestReceipt(settings);
    printReceipt(testTrx);
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        activeTab,
        setActiveTab: requestTabChange,
        settings,
        updateSettings,
        products,
        saveProduct,
        deleteProduct,
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
        grandTotal,
        customerName,
        setCustomerName,
        checkout,
        transactions,
        expenses,
        saveExpense,
        deleteExpense,
        auditLogs,
        refreshLogs: async () => {
          const logs = await db.getAll('audit_logs');
          setAuditLogs(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        },
        activeCashier,
        setActiveCashier,
        hasRegisteredAdmin,
        isAdminLoggedIn,
        currentAdmin,
        showAdminAuthModal,
        setShowAdminAuthModal,
        registerFirstAdmin,
        loginAdmin,
        logoutAdmin,
        receiptModalData,
        setReceiptModalData,
        printReceipt,
        triggerTestPrint,
        showToast,
        reloadData
      }}
    >
      {children}

      {/* Floating Toast Alerts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border backdrop-blur-md transition-all animate-bounce-in flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

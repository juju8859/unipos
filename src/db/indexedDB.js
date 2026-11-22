// IndexedDB Database Manager for UniPOS Universal Cashier
const DB_NAME = 'UniPOS_DB';
const DB_VERSION = 1;

// Default brand settings
export const DEFAULT_SETTINGS = {
  brandName: 'UniPOS Store',
  subtitle: 'Solusi Kasir Universal UMKM & Retail',
  address: 'Jl. Pemuda No. 88, Jakarta Pusat',
  phone: '0812-3456-7890',
  receiptFooter: 'Terima Kasih Atas Kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar.',
  logoBase64: '',
  printerMode: 'rawbt', // 'rawbt' | 'ble' | 'dialog'
  paperWidth: 58, // 58 or 80
  autoPrintOnCheckout: true,
  taxEnabled: false,
  taxRate: 10, // 10%
  currencySymbol: 'Rp',
  adminRegistered: false,
};

// Seed initial universal products so the cashier works right away
const INITIAL_PRODUCTS = [
  {
    name: 'Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 18000,
    costPrice: 8000,
    isAvailable: true,
    code: 'MIN-001'
  },
  {
    name: 'Teh Manis Solo (Ice/Hot)',
    category: 'Minuman',
    price: 6000,
    costPrice: 2000,
    isAvailable: true,
    code: 'MIN-002'
  },
  {
    name: 'Matcha Latte Premium',
    category: 'Minuman',
    price: 22000,
    costPrice: 10000,
    isAvailable: true,
    code: 'MIN-003'
  },
  {
    name: 'Nasi Goreng Spesial Telur',
    category: 'Makanan',
    price: 25000,
    costPrice: 12000,
    isAvailable: true,
    code: 'MAK-001'
  },
  {
    name: 'Ayam Geprek Sambal Bawang + Nasi',
    category: 'Makanan',
    price: 22000,
    costPrice: 11000,
    isAvailable: true,
    code: 'MAK-002'
  },
  {
    name: 'Roti Bakar Coklat Keju',
    category: 'Makanan',
    price: 15000,
    costPrice: 6500,
    isAvailable: true,
    code: 'MAK-003'
  },
  {
    name: 'French Fries Crispy',
    category: 'Snack',
    price: 14000,
    costPrice: 6000,
    isAvailable: true,
    code: 'SNK-001'
  },
  {
    name: 'Jasa Cetak / Print Dokumen A4',
    category: 'Jasa & Retail',
    price: 1000,
    costPrice: 300,
    isAvailable: true,
    code: 'JSA-001'
  },
  {
    name: 'Kaos Polos Cotton Combed 30s',
    category: 'Jasa & Retail',
    price: 45000,
    costPrice: 28000,
    isAvailable: true,
    code: 'RTL-001'
  }
];

class Database {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Settings store (key-value)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Admin store
        if (!db.objectStoreNames.contains('admins')) {
          const adminStore = db.createObjectStore('admins', { keyPath: 'id', autoIncrement: true });
          adminStore.createIndex('username', 'username', { unique: true });
        }

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('isAvailable', 'isAvailable', { unique: false });
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const trxStore = db.createObjectStore('transactions', { keyPath: 'id' });
          trxStore.createIndex('date', 'date', { unique: false });
          trxStore.createIndex('monthYear', 'monthYear', { unique: false });
          trxStore.createIndex('paymentMethod', 'paymentMethod', { unique: false });
        }

        // Expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const expStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
          expStore.createIndex('date', 'date', { unique: false });
          expStore.createIndex('monthYear', 'monthYear', { unique: false });
          expStore.createIndex('category', 'category', { unique: false });
        }

        // Audit Logs store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const logStore = db.createObjectStore('audit_logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('actionType', 'actionType', { unique: false });
          logStore.createIndex('actor', 'actor', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this.initDefaults();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async initDefaults() {
    // Check if settings exists
    const settings = await this.getSettings();
    if (!settings) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }

    // Check if products exist, otherwise seed
    const products = await this.getAll('products');
    if (products.length === 0) {
      for (const prod of INITIAL_PRODUCTS) {
        await this.add('products', {
          ...prod,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // Generic helpers
  async getSettings() {
    const db = await this.open();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('app_settings');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async saveSettings(settings) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put(settings, 'app_settings');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getById(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async add(storeName, item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // Audit logging helper
  async logActivity(actionType, description, metadata = {}, actor = 'Kasir') {
    try {
      const timestamp = new Date().toISOString();
      const formattedTimestamp = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\./g, ':');

      await this.add('audit_logs', {
        timestamp,
        formattedTimestamp,
        actor,
        actionType,
        description,
        metadata
      });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  }

  // Backup entire database to JSON
  async exportFullBackup() {
    const settings = await this.getSettings();
    const admins = await this.getAll('admins');
    const products = await this.getAll('products');
    const transactions = await this.getAll('transactions');
    const expenses = await this.getAll('expenses');
    const audit_logs = await this.getAll('audit_logs');

    return {
      version: '1.0',
      appName: 'UniPOS',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        admins,
        products,
        transactions,
        expenses,
        audit_logs
      }
    };
  }

  // Restore database from JSON
  async importFullBackup(backupJson) {
    if (!backupJson || !backupJson.data) {
      throw new Error('Format file backup tidak valid');
    }

    const { settings, admins, products, transactions, expenses, audit_logs } = backupJson.data;

    if (settings) await this.saveSettings(settings);

    if (Array.isArray(admins)) {
      await this.clear('admins');
      for (const a of admins) await this.put('admins', a);
    }

    if (Array.isArray(products)) {
      await this.clear('products');
      for (const p of products) await this.put('products', p);
    }

    if (Array.isArray(transactions)) {
      await this.clear('transactions');
      for (const t of transactions) await this.put('transactions', t);
    }

    if (Array.isArray(expenses)) {
      await this.clear('expenses');
      for (const e of expenses) await this.put('expenses', e);
    }

    if (Array.isArray(audit_logs)) {
      await this.clear('audit_logs');
      for (const l of audit_logs) await this.put('audit_logs', l);
    }

    await this.logActivity(
      'SISTEM_RESTORE',
      `Data berhasil dipulihkan dari backup: ${products?.length || 0} produk, ${transactions?.length || 0} transaksi`,
      {},
      'Admin'
    );

    return true;
  }
}

export const db = new Database();

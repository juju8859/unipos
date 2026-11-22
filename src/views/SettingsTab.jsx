import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../db/indexedDB';
import {
  Settings,
  Store,
  Printer,
  Download,
  Upload,
  Shield,
  Percent,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export default function SettingsTab() {
  const {
    settings,
    updateSettings,
    triggerTestPrint,
    isAdminLoggedIn,
    showToast,
    reloadData
  } = useApp();

  // Local state for brand settings
  const [brandName, setBrandName] = useState(settings.brandName || '');
  const [subtitle, setSubtitle] = useState(settings.subtitle || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');
  const [logoBase64, setLogoBase64] = useState(settings.logoBase64 || '');
  const [qrisBase64, setQrisBase64] = useState(settings.qrisBase64 || '');

  // Local state for printer settings
  const [printerMode, setPrinterMode] = useState(settings.printerMode || 'rawbt');
  const [paperWidth, setPaperWidth] = useState(settings.paperWidth || 58);
  const [autoPrintOnCheckout, setAutoPrintOnCheckout] = useState(settings.autoPrintOnCheckout ?? true);

  // Local state for tax settings
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled ?? false);
  const [taxRate, setTaxRate] = useState(settings.taxRate || 10);

  // Backup / Restore states
  const [isRestoring, setIsRestoring] = useState(false);

  // Handle Logo Upload to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      showToast('Ukuran gambar logo maksimal 1MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoBase64(event.target.result);
      showToast('Logo berhasil diunggah (belum disimpan)', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Handle QRIS Barcode Upload to Base64
  const handleQrisUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran gambar QRIS maksimal 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setQrisBase64(event.target.result);
      showToast('Gambar QRIS berhasil diunggah (belum disimpan)', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!isAdminLoggedIn) {
      showToast('Wajib Login Mode Admin untuk mengubah pengaturan toko', 'warning');
      return;
    }

    const payload = {
      ...settings,
      brandName: brandName.trim() || 'UniPOS Store',
      subtitle: subtitle.trim(),
      address: address.trim(),
      phone: phone.trim(),
      receiptFooter: receiptFooter.trim(),
      logoBase64,
      qrisBase64,
      printerMode,
      paperWidth: Number(paperWidth),
      autoPrintOnCheckout,
      taxEnabled,
      taxRate: Number(taxRate)
    };

    await updateSettings(payload);
  };

  // Export full JSON Backup
  const handleDownloadBackup = async () => {
    try {
      const backupData = await db.exportFullBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const todayStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `unipos-backup-${todayStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Backup database JSON berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal membuat file backup: ' + err.message, 'error');
    }
  };

  // Restore from JSON File
  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const parsed = JSON.parse(event.target.result);
        if (window.confirm('PERINGATAN: Memulihkan database akan menimpa data yang ada saat ini. Lanjutkan restore?')) {
          await db.importFullBackup(parsed);
          await reloadData();
          showToast('Data database berhasil dipulihkan secara utuh!', 'success');
        }
      } catch (err) {
        showToast('Gagal memulihkan database: Format JSON tidak valid', 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-5 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Pengaturan Toko & Printer</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kustomisasi brand usaha Anda, printer thermal, dan cadangan data
          </p>
        </div>

        {isAdminLoggedIn && (
          <button
            onClick={handleSaveAll}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            Simpan Pengaturan
          </button>
        )}
      </div>

      {!isAdminLoggedIn && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <Shield className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            Mode Kasir Aktif: Anda dapat melihat pengaturan dan uji coba printer. Untuk mengubah brand atau merestore database, silakan klik tombol <strong>Login Mode Admin</strong> di pojok kanan atas.
          </span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-5">
        {/* SECTION 1: Brand & Toko Identity */}
        <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-dark-border">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Identitas Toko / Brand Anda</span>
          </h3>

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Logo Brand / Toko (Tampil di Header & Struk)
            </label>
            <div className="flex items-center gap-4">
              {logoBase64 ? (
                <div className="relative group">
                  <img
                    src={logoBase64}
                    alt="Logo Toko"
                    className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md"
                  />
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64('')}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-500 transition-all"
                      title="Hapus Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-dark-bg border border-dashed border-dark-border flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="w-6 h-6 mb-0.5" />
                  <span className="text-[9px]">No Logo</span>
                </div>
              )}

              {isAdminLoggedIn && (
                <div>
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Format PNG/JPG/WebP, disarankan rasio 1:1 persegi (Maks 1MB).</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Gambar QRIS Toko */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Barcode / Gambar QRIS Toko (Tampil Saat Pembeli Bayar via QRIS)
            </label>
            <div className="flex items-center gap-4">
              {qrisBase64 ? (
                <div className="relative group">
                  <img
                    src={qrisBase64}
                    alt="QRIS Toko"
                    className="w-20 h-20 rounded-2xl object-contain bg-white p-1 border border-white/20 shadow-md"
                  />
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setQrisBase64('')}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-500 transition-all"
                      title="Hapus QRIS"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-dark-bg border border-dashed border-dark-border flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="w-6 h-6 mb-0.5" />
                  <span className="text-[9px]">Belum Ada QRIS</span>
                </div>
              )}

              {isAdminLoggedIn && (
                <div>
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Barcode QRIS</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Screenshot atau foto QRIS toko Anda (BCA, GoPay, Dana, dll).</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nama Brand / Toko *</label>
              <input
                type="text"
                disabled={!isAdminLoggedIn}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Contoh: UniPOS Cafe & Resto"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subjudul / Slogan</label>
              <input
                type="text"
                disabled={!isAdminLoggedIn}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Contoh: Aneka Makanan & Minuman Kekinian"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                disabled={!isAdminLoggedIn}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Merdeka Barat No. 12, Surabaya"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nomor WhatsApp / Telepon</label>
              <input
                type="text"
                disabled={!isAdminLoggedIn}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Catatan Footer Struk</label>
            <textarea
              rows={2}
              disabled={!isAdminLoggedIn}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Contoh: Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar."
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* SECTION 2: Printer Thermal Configuration */}
        <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-dark-border">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Pengaturan Koneksi Printer Thermal</span>
            </h3>

            <button
              type="button"
              onClick={triggerTestPrint}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition-all active:scale-95"
            >
              Test Print Struk
            </button>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Pilihan Mode Cetak Thermal (ESC/POS)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  printerMode === 'rawbt'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="printerMode"
                    value="rawbt"
                    disabled={!isAdminLoggedIn}
                    checked={printerMode === 'rawbt'}
                    onChange={() => setPrinterMode('rawbt')}
                    className="accent-indigo-500"
                  />
                  <span className="font-bold text-xs">RawBT Android (Rekomendasi)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Paling stabil di Android untuk semua merk printer Bluetooth 58mm/80mm.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  printerMode === 'ble'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="printerMode"
                    value="ble"
                    disabled={!isAdminLoggedIn}
                    checked={printerMode === 'ble'}
                    onChange={() => setPrinterMode('ble')}
                    className="accent-indigo-500"
                  />
                  <span className="font-bold text-xs">Web Bluetooth (BLE)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Koneksi langsung browser ke printer Bluetooth tanpa aplikasi ketiga.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  printerMode === 'dialog'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="printerMode"
                    value="dialog"
                    disabled={!isAdminLoggedIn}
                    checked={printerMode === 'dialog'}
                    onChange={() => setPrinterMode('dialog')}
                    className="accent-indigo-500"
                  />
                  <span className="font-bold text-xs">Dialog Print (Fallback)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Menggunakan dialog print bawaan Android / Browser (WiFi/USB printer).
                </p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lebar Kertas Struk</label>
              <select
                disabled={!isAdminLoggedIn}
                value={paperWidth}
                onChange={(e) => setPaperWidth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none bg-dark-bg"
              >
                <option value={58}>58 mm (Standar Printer Mini Mobile Bluetooth)</option>
                <option value={80}>80 mm (Printer Desktop Kasir Besar)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-bg border border-dark-border">
              <div>
                <span className="font-semibold text-white text-xs block">Auto-Print Saat Bayar</span>
                <span className="text-[10px] text-slate-400">Otomatis kirim struk ke printer saat transaksi selesai</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdminLoggedIn}
                  checked={autoPrintOnCheckout}
                  onChange={(e) => setAutoPrintOnCheckout(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: Pajak / PB1 Default Setting */}
        <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-dark-border">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>Pajak Restoran / PB1 / PPN Default</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-bg border border-dark-border">
              <div>
                <span className="font-semibold text-white text-xs block">Aktifkan Pajak Default</span>
                <span className="text-[10px] text-slate-400">Otomatis centang pajak saat kasir dibuka</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdminLoggedIn}
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Persentase Pajak (%)</label>
              <input
                type="number"
                disabled={!isAdminLoggedIn}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Database Offline Backup & Restore */}
        <div className="p-5 rounded-2xl bg-dark-card border border-dark-border space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-dark-border">
            <Download className="w-4 h-4 text-sky-400" />
            <span>Cadangan & Pemulihan Database (Backup JSON)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Seluruh data UniPOS (Produk, Transaksi, Pengeluaran, Brand, & Log Aktivitas) tersimpan 100% lokal di memori HP Anda. Buat backup secara rutin untuk keamanan data.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>

            {isAdminLoggedIn && (
              <label className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-slate-700">
                <Upload className="w-4 h-4" />
                <span>{isRestoring ? 'Memulihkan...' : 'Restore Data dari File JSON'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  disabled={isRestoring}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Save button sticky for mobile */}
        {isAdminLoggedIn && (
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.99]"
            >
              Simpan Semua Pengaturan
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

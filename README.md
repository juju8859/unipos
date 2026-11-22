# UniPOS — Kasir Universal (Offline-First Android POS)

Aplikasi kasir Android (APK) offline-first yang bersifat **UNIVERSAL** (dapat digunakan untuk usaha apa saja: F&B/Kafe/Resto, Retail/Toko Kelontong, Laundry, Konter HP/Pulsa, Bengkel, hingga Jasa). Dibangun dengan teknologi modern **Capacitor v6 + React + Vite + Tailwind CSS + IndexedDB** yang siap langsung di-build menjadi file `.apk` melalui **GitHub Actions** maupun **Gradle lokal**.

---

## 🌟 Fitur Utama & Arsitektur

### 1. Identitas Universal & UI/UX Modern
- **ID Aplikasi Android**: `com.rsyfl.unipos` | **Nama**: "UniPOS — Kasir Universal".
- **Kustomisasi Brand Sendiri**:
  - Pengguna bebas mengatur Nama Brand/Toko, Subjudul/Slogan, Alamat Lengkap, Nomor WhatsApp/Telepon, dan Catatan Footer Struk.
  - **Upload Logo Toko**: Disimpan otomatis dalam format base64 di database lokal dan langsung tampil di header aplikasi serta struk thermal.
- **Desain Dark Mode Glassmorphism**: High-contrast, bersih, responsif di HP maupun Tablet Android dengan navigasi bawah (*Bottom Navigation Bar*).

### 2. Sistem Proteksi Role: Mode Kasir vs Mode Admin
- **First-Time Setup (Pendaftaran Admin Pertama Kali)**: Saat pertama kali dijalankan, sistem otomatis menampilkan dialog pendaftaran Admin/Owner utama (Nama, Username, PIN 4-6 digit).
- **Mode Kasir (Umum / Default)**: Kasir dapat langsung bertransaksi cepat, menghitung kembalian, melihat riwayat transaksi hari ini, dan mencetak struk tanpa ribet.
- **Mode Admin (Terkunci PIN/Password)**: Wajib membuka kunci Admin untuk mengakses fitur sensitif:
  1. Kelola Menu & Kalkulasi Margin Laba (Tambah/Edit/Hapus/HPP/Harga Jual).
  2. Catat & Hapus Pengeluaran Operasional Toko.
  3. Laporan Laba Rugi Bulanan & Export Laporan ke Excel (CSV).
  4. Database Log Aktivitas (Audit Trail) & Export Log ke CSV.
  5. Pengaturan Brand Toko, Mode Printer, serta Backup/Restore Database.
- Tombol **Mode Admin / Kasir** mudah dijangkau di bagian atas (*Header*).

### 3. POS Kasir Cepat & Perhitungan Otomatis
- **Pencarian Cepat & Filter Kategori Dinamis**: Menyesuaikan secara otomatis dengan kategori yang dibuat oleh Admin.
- **Keranjang Belanja Interaktif**:
  - Tombol stepper `+` dan `-` quantity.
  - Catatan pesanan khusus per item (misal: "Pedas sedang", "Tanpa es batu", "Bungkus terpisah").
  - Tombol kosongkan keranjang (*Reset*).
- **Perhitungan Otomatis Akurat**:
  - Subtotal per item dan keseluruhan.
  - Opsi Diskon (bisa berupa Nominal Rp atau Persentase %).
  - Opsi Pajak Restoran / PB1 / PPN (%) yang bisa diaktifkan/dinonaktifkan secara instan.
  - Total Akhir yang selalu sinkron secara *real-time*.
- **Metode Pembayaran**:
  - **Tunai (Cash)**: Tombol nominal cepat (Uang Pas, 10rb, 20rb, 50rb, 100rb, 200rb) dan kalkulasi kembalian otomatis.
  - **QRIS**.
  - **Transfer Bank**.
- **Tombol "BAYAR & CETAK STRUK"**:
  - Menyimpan transaksi ke database lokal.
  - Mengunci *snapshot* HPP/harga modal pada saat transaksi berlangsung untuk keakuratan laporan laba rugi historis.
  - Mencatat aktivitas ke Database Log Audit.
  - Mengirim data ke printer thermal atau membuka pratinjau struk.

### 4. Koneksi Printer Thermal (58mm & 80mm) & Auto-Print
- Format struk rapi standar ESC/POS: Logo Toko, Nama Brand, Alamat, No. Nota, Tanggal/Jam, Kasir, Pelanggan, Rincian Item + Qty + Harga, Subtotal, Diskon, Pajak, Total, Bayar, Kembalian, dan Pesan Footer.
- **3 Mode Cetak di Pengaturan**:
  1. **RawBT Android (`rawbt:base64,...`)**: Mode utama dan paling direkomendasikan untuk stabilitas maksimal di semua merk printer Bluetooth Android.
  2. **Web Bluetooth (BLE)**: Koneksi langsung ke printer Bluetooth melalui protokol GATT Web Bluetooth.
  3. **Dialog Print Browser/Android**: Fallback cetak sistem Android ke printer WiFi/USB.
- **Fitur Printer**:
  - Toggle **Auto-Print saat Bayar** (otomatis cetak begitu tombol bayar ditekan).
  - Pilihan lebar kertas **58 mm** (printer saku Bluetooth) atau **80 mm** (printer kasir besar).
  - Tombol **Test Print Struk** untuk uji coba koneksi.
  - Tombol **Cetak Ulang Struk** di riwayat transaksi.

### 5. Kelola Menu & Kalkulasi Margin Laba (Admin)
- Tambah, Edit, dan Hapus menu/produk secara dinamis.
- Field: Nama Produk, Kategori (bebas ketik kategori baru), Harga Jual, HPP/Modal Barang, dan Status Ketersediaan (Tersedia / Habis).
- **Kalkulasi Otomatis Margin Laba per Produk**: Menampilkan selisih keuntungan (Rp) dan persentase margin secara live saat input maupun di daftar produk.
- Menampilkan status perubahan harga di log audit jika harga diubah (`Harga lama: Rp X -> Harga baru: Rp Y`).

### 6. Pembukuan & Laporan Laba Rugi Bulanan (Admin)
- Form pencatatan pengeluaran operasional (Keterangan, Kategori, Nominal, Tanggal).
- **Dashboard Laporan Bulanan (Filter `YYYY-MM`)**:
  - **Total Omzet** (Penjualan Bersih)
  - **Total HPP** (Berdasarkan *snapshot* modal transaksi di bulan tersebut)
  - **Laba Kotor (Gross Profit)** = Omzet - HPP
  - **Total Pengeluaran Operasional**
  - **Laba Bersih (Net Profit)** = Laba Kotor - Pengeluaran
- **Tombol Export Laporan ke Excel (CSV)**: Menghasilkan file CSV berstandar UTF-8 BOM yang langsung rapi dibuka di Microsoft Excel.

### 7. Database Log Aktivitas / Audit Trail (Admin)
- Mencatat secara otomatis setiap aksi penting beserta waktu (`YYYY-MM-DD HH:mm:ss`), aktor (Kasir/Admin), dan deskripsi lengkap:
  - Registrasi, Login, dan Logout Admin.
  - Transaksi baru dan cetak ulang nota.
  - Penambahan, pengeditan harga, dan penghapusan menu.
  - Penambahan dan penghapusan pengeluaran.
  - Pembaruan pengaturan toko dan backup/restore.
- Filter pencarian berdasarkan kategori aktivitas dan kata kunci.
- Tombol **Export Log ke CSV**.

### 8. Database 100% Offline & Backup/Restore
- Seluruh data disimpan secara *offline-first* di memori lokal perangkat menggunakan **IndexedDB**.
- Fitur **Download Backup JSON**: Mengunduh seluruh database toko dalam satu file `.json`.
- Fitur **Restore Data JSON**: Memulihkan database secara utuh ke perangkat baru tanpa koneksi internet.

---

## 📁 Struktur Direktori Project

```
unipos/
├── .github/
│   └── workflows/
│       └── build-apk.yml           # GitHub Actions Auto-Build APK
├── android/                        # Platform native Android Capacitor v6
│   ├── app/
│   │   ├── build.gradle            # Config Gradle Android (com.rsyfl.unipos)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Permission Bluetooth & RawBT Queries
│   │       └── res/
│   └── build.gradle
├── src/
│   ├── components/
│   │   ├── AdminAuthModal.jsx      # Modal Setup & Login PIN Admin Keypad
│   │   ├── BottomNav.jsx           # Navigasi Bawah 6 Tab
│   │   ├── Header.jsx              # Header Brand, Jam Digital, Toggle Admin
│   │   ├── PaymentModal.jsx        # Modal Pembayaran, Nominal Cepat & Kembalian
│   │   └── ReceiptModal.jsx        # Pratinjau Struk Thermal Simulative
│   ├── context/
│   │   └── AppContext.jsx          # State Management Global & Event Handler
│   ├── db/
│   │   └── indexedDB.js            # Database Offline IndexedDB, Seed & Backup
│   ├── utils/
│   │   ├── exportCsv.js            # Export CSV Excel UTF-8 BOM
│   │   └── printer.js              # ESC/POS Builder, RawBT, BLE, Dialog Print
│   ├── views/
│   │   ├── AuditLogTab.jsx         # Tampilan Database Log Aktivitas
│   │   ├── CashierTab.jsx          # Tampilan POS Transaksi Kasir
│   │   ├── FinanceTab.jsx          # Tampilan Pembukuan & Laba Rugi Bulanan
│   │   ├── HistoryTab.jsx          # Tampilan Riwayat Penjualan & Cetak Ulang
│   │   ├── MenuManagementTab.jsx   # Tampilan Kelola Menu & Margin HPP
│   │   └── SettingsTab.jsx         # Tampilan Pengaturan Brand, Printer & Backup
│   ├── App.jsx
│   ├── index.css                   # Tailwind CSS, Glassmorphism & Print CSS
│   └── main.jsx
├── capacitor.config.json           # Konfigurasi Capacitor Android
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Cara Menjalankan & Build APK

### 1. Menjalankan di Mode Web / Development
```bash
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

### 2. Cara Auto-Build APK via GitHub Actions (Rekomendasi Paling Mudah)
File `.github/workflows/build-apk.yml` telah disediakan secara lengkap:
1. Buat repository baru di akun GitHub Anda (misal: `unipos-app`).
2. Push seluruh file project ini ke branch `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit UniPOS Universal Cashier"
   git branch -M main
   git remote add origin https://github.com/USERNAME/unipos-app.git
   git push -u origin main
   ```
3. Buka tab **Actions** di repository GitHub Anda.
4. Workflow **Build Android APK (UniPOS)** akan berjalan otomatis selama ~3-4 menit.
5. Setelah selesai, buka build tersebut dan unduh artifact **`UniPOS-Universal-Cashier-Debug-APK`** (berisi file `app-debug.apk` yang siap langsung diinstall di HP Android Anda).

### 3. Cara Build APK Secara Lokal (Gradle / Android Studio)
Pastikan Anda telah menginstal **Android SDK** dan **Java JDK 17**:
```bash
# 1. Build web assets
npm run build

# 2. Sinkronkan ke folder Android
npx cap sync android

# 3. Buka di Android Studio (Opsional)
npx cap open android

# 4. Atau langsung compile APK lewat terminal Gradle:
cd android
./gradlew assembleDebug
```
File APK yang dihasilkan akan berada di:
`android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🖨️ Panduan Cetak Struk Bluetooth Thermal

1. **Menggunakan Aplikasi RawBT (Sangat Direkomendasikan)**:
   - Install aplikasi gratis **RawBT Print Service** dari Google Play Store di HP Android Anda.
   - Buka RawBT, sambungkan dengan printer Bluetooth thermal Anda (58mm atau 80mm).
   - Di UniPOS, pastikan mode printer di menu **Pengaturan** diatur ke **RawBT Android**.
   - Setiap kali klik **BAYAR & CETAK STRUK**, nota akan langsung dicetak otomatis dengan hasil hitam pekat dan rapi.
2. **Menggunakan Web Bluetooth**:
   - Pilih mode **Web Bluetooth (BLE)** di Pengaturan.
   - Klik **Test Print** atau lakukan transaksi, browser akan meminta izin pairing ke printer Bluetooth Anda.
3. **Menggunakan Dialog Print Bawaan**:
   - Jika menggunakan printer WiFi atau kabel USB, pilih mode **Dialog Print**.

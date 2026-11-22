// CSV Export Utility for UniPOS (UTF-8 BOM Excel Friendly)

function downloadCSV(csvContent, fileName) {
  // \uFEFF is the UTF-8 BOM so Microsoft Excel correctly parses UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. Export Laporan Keuangan Bulanan
export function exportMonthlyReportCSV(monthYear, summary, transactions, expenses, brandName) {
  const rows = [];

  // Title & Header
  rows.push([`LAPORAN LABA RUGI BULANAN - ${brandName || 'UniPOS'}`]);
  rows.push([`Periode: ${monthYear}`]);
  rows.push([`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`]);
  rows.push([]);

  // Ringkasan Keuangan
  rows.push(['RINGKASAN KEUANGAN']);
  rows.push(['Komponen', 'Nominal (Rp)']);
  rows.push(['Total Omzet (Penjualan Bersih)', summary.totalRevenue]);
  rows.push(['Total HPP / Modal Barang', summary.totalCost]);
  rows.push(['Laba Kotor (Gross Profit)', summary.grossProfit]);
  rows.push(['Total Pengeluaran Operasional', summary.totalExpense]);
  rows.push(['LABA BERSIH (NET PROFIT)', summary.netProfit]);
  rows.push(['Total Transaksi Penjualan', summary.transactionCount]);
  rows.push([]);

  // Rincian Transaksi
  rows.push(['RINCIAN TRANSAKSI PENJUALAN']);
  rows.push([
    'ID Transaksi',
    'Tanggal & Waktu',
    'Kasir',
    'Metode Bayar',
    'Subtotal',
    'Diskon',
    'Pajak',
    'Total Penjualan',
    'Total HPP',
    'Margin Kotor',
    'Item Terjual'
  ]);

  for (const trx of transactions) {
    const itemDetails = (trx.items || []).map(i => `${i.name} (${i.qty}x)`).join('; ');
    const trxHpp = (trx.items || []).reduce((acc, i) => acc + ((i.costPrice || 0) * i.qty), 0);
    const trxProfit = (trx.total || 0) - trxHpp;

    rows.push([
      trx.id,
      trx.dateFormatted || new Date(trx.date).toLocaleString('id-ID'),
      trx.cashierName || 'Kasir',
      trx.paymentMethod || 'Tunai',
      trx.subtotal || 0,
      trx.discount || 0,
      trx.tax || 0,
      trx.total || 0,
      trxHpp,
      trxProfit,
      itemDetails
    ]);
  }

  rows.push([]);

  // Rincian Pengeluaran
  rows.push(['RINCIAN PENGELUARAN OPERASIONAL']);
  rows.push([
    'ID',
    'Tanggal',
    'Kategori',
    'Keterangan',
    'Nominal (Rp)'
  ]);

  for (const exp of expenses) {
    rows.push([
      exp.id,
      exp.date,
      exp.category || 'Operasional',
      exp.title || '-',
      exp.amount || 0
    ]);
  }

  // Format to CSV string
  const csvContent = rows
    .map(row => row.map(escapeCsvField).join(','))
    .join('\r\n');

  downloadCSV(csvContent, `Laporan-Keuangan-${monthYear}.csv`);
}

// 2. Export Audit Log
export function exportAuditLogsCSV(logs, brandName) {
  const rows = [];

  rows.push([`DATABASE LOG AKTIVITAS (AUDIT TRAIL) - ${brandName || 'UniPOS'}`]);
  rows.push([`Tanggal Export: ${new Date().toLocaleString('id-ID')}`]);
  rows.push([`Total Record: ${logs.length}`]);
  rows.push([]);

  rows.push([
    'ID',
    'Waktu (Timestamp)',
    'Aktor',
    'Kategori Aksi',
    'Deskripsi & Rincian Perubahan'
  ]);

  for (const log of logs) {
    rows.push([
      log.id,
      log.formattedTimestamp || log.timestamp,
      log.actor || 'Kasir',
      log.actionType || 'SISTEM',
      log.description || '-'
    ]);
  }

  const csvContent = rows
    .map(row => row.map(escapeCsvField).join(','))
    .join('\r\n');

  const todayStr = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `Audit-Log-UniPOS-${todayStr}.csv`);
}

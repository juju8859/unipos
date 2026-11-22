// ESC/POS Thermal Printer Utility for UniPOS
// Supports RawBT Android App, Web Bluetooth (BLE), and Browser Print Dialog

class EscPosBuilder {
  constructor(paperWidth = 58) {
    this.buffer = [];
    this.paperWidth = paperWidth;
    this.lineWidth = paperWidth === 80 ? 48 : 32;
    this.init();
  }

  init() {
    this.buffer.push(0x1B, 0x40); // ESC @ (Initialize)
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(enabled = true) {
    this.buffer.push(0x1B, 0x45, enabled ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enabled = true) {
    this.buffer.push(0x1D, 0x21, enabled ? 0x11 : 0x00);
    return this;
  }

  text(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let b of bytes) {
      this.buffer.push(b);
    }
    return this;
  }

  line(str = '') {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  separator(char = '-') {
    this.line(char.repeat(this.lineWidth));
    return this;
  }

  // Row with left label and right value
  twoColumn(left, right) {
    const leftStr = String(left || '');
    const rightStr = String(right || '');
    const spaceNeeded = this.lineWidth - leftStr.length - rightStr.length;

    if (spaceNeeded <= 0) {
      // If it overflows, print on two lines or truncate
      this.line(leftStr);
      this.alignRight();
      this.line(rightStr);
      this.alignLeft();
    } else {
      this.line(leftStr + ' '.repeat(spaceNeeded) + rightStr);
    }
    return this;
  }

  cut() {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, 0x41, 0x10); // GS V A (Cut)
    return this;
  }

  getBytes() {
    return new Uint8Array(this.buffer);
  }

  toBase64() {
    const uint8 = this.getBytes();
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
}

export function formatCurrency(amount) {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

export function buildReceiptEscPos(transaction, settings) {
  const width = settings?.paperWidth === 80 ? 80 : 58;
  const builder = new EscPosBuilder(width);

  // Header
  builder.alignCenter();
  builder.bold(true);
  builder.doubleSize(true);
  builder.line(settings?.brandName || 'UniPOS Store');
  builder.doubleSize(false);
  builder.bold(false);

  if (settings?.subtitle) {
    builder.line(settings.subtitle);
  }
  if (settings?.address) {
    builder.line(settings.address);
  }
  if (settings?.phone) {
    builder.line('Telp/WA: ' + settings.phone);
  }

  builder.separator('=');

  // Metadata
  builder.alignLeft();
  builder.twoColumn('No. Nota', transaction.id);
  builder.twoColumn('Tanggal', transaction.dateFormatted || new Date(transaction.date).toLocaleString('id-ID'));
  builder.twoColumn('Kasir', transaction.cashierName || 'Kasir 1');
  if (transaction.customerName) {
    builder.twoColumn('Pelanggan', transaction.customerName);
  }

  builder.separator('-');

  // Items
  for (const item of transaction.items) {
    builder.line(item.name);
    const detail = `${item.qty} x ${formatCurrency(item.price)}`;
    const total = formatCurrency(item.qty * item.price);
    builder.twoColumn('  ' + detail, total);
    if (item.notes) {
      builder.line(`  * Note: ${item.notes}`);
    }
  }

  builder.separator('-');

  // Financial Summary
  builder.twoColumn('Subtotal', formatCurrency(transaction.subtotal));

  if (transaction.discount > 0) {
    const discLabel = transaction.discountType === 'percent'
      ? `Diskon (${transaction.discountPercent}%)`
      : 'Diskon';
    builder.twoColumn(discLabel, '-' + formatCurrency(transaction.discount));
  }

  if (transaction.tax > 0) {
    builder.twoColumn(`Pajak/PB1 (${transaction.taxRate}%)`, '+' + formatCurrency(transaction.tax));
  }

  builder.separator('=');
  builder.bold(true);
  builder.twoColumn('TOTAL AKHIR', formatCurrency(transaction.total));
  builder.bold(false);

  // Payment Details
  builder.twoColumn('Metode Bayar', transaction.paymentMethod?.toUpperCase() || 'TUNAI');
  if (transaction.paymentMethod === 'tunai') {
    builder.twoColumn('Tunai Diterima', formatCurrency(transaction.cashReceived || transaction.total));
    builder.twoColumn('Kembalian', formatCurrency(transaction.changeAmount || 0));
  }

  builder.separator('-');

  // Footer
  builder.alignCenter();
  const footerLines = (settings?.receiptFooter || 'Terima kasih atas kunjungan Anda!').split('\n');
  for (const fLine of footerLines) {
    if (fLine.trim()) builder.line(fLine.trim());
  }

  builder.feed(2);
  builder.cut();

  return builder;
}

// 1. RawBT Android Print Mode
export function printViaRawBT(base64Data) {
  const rawbtUrl = `rawbt:base64,${base64Data}`;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = rawbtUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch (e) {
      // ignore
    }
  }, 2000);

  // Fallback anchor click
  const a = document.createElement('a');
  a.href = rawbtUrl;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch (e) {}
  }, 1000);
}

// 2. Web Bluetooth API (BLE)
let bleDevice = null;
let bleCharacteristic = null;

export async function connectWebBluetooth() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth tidak didukung pada browser ini. Gunakan aplikasi RawBT Android atau Dialog Print.');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
      { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] },
      { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
      { services: [0xffe0] }
    ],
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      0xffe0
    ]
  });

  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();

  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    for (const char of characteristics) {
      if (char.properties.write || char.properties.writeWithoutResponse) {
        bleDevice = device;
        bleCharacteristic = char;
        return device.name || 'Printer Bluetooth Terhubung';
      }
    }
  }

  throw new Error('Tidak ditemukan karakteristik printer yang dapat ditulisi.');
}

export async function printViaBluetooth(bytes) {
  if (!bleCharacteristic) {
    await connectWebBluetooth();
  }

  // Chunk bytes to 512 bytes limit for BLE MTU
  const CHUNK_SIZE = 100;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    if (bleCharacteristic.writeValueWithoutResponse) {
      await bleCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await bleCharacteristic.writeValue(chunk);
    }
    // Small delay between chunks
    await new Promise((r) => setTimeout(r, 20));
  }
}

// 3. Unified Print Dispatcher
export async function executePrint(transaction, settings, onDialogFallback) {
  const mode = settings?.printerMode || 'rawbt';
  const escpos = buildReceiptEscPos(transaction, settings);

  if (mode === 'rawbt') {
    const base64 = escpos.toBase64();
    printViaRawBT(base64);
    return { success: true, mode: 'rawbt' };
  } else if (mode === 'ble') {
    try {
      await printViaBluetooth(escpos.getBytes());
      return { success: true, mode: 'ble' };
    } catch (err) {
      console.warn('BLE print failed, falling back to dialog:', err);
      if (onDialogFallback) onDialogFallback();
      else window.print();
      return { success: false, error: err.message, fallback: 'dialog' };
    }
  } else {
    // Dialog print
    if (onDialogFallback) onDialogFallback();
    else window.print();
    return { success: true, mode: 'dialog' };
  }
}

// Test Print Generator
export function generateTestReceipt(settings) {
  return {
    id: 'TRX-TEST-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString(),
    dateFormatted: new Date().toLocaleString('id-ID'),
    cashierName: 'Admin / Kasir Test',
    customerName: 'Pelanggan Uji Coba',
    items: [
      { name: 'Kopi Susu Gula Aren', qty: 2, price: 18000, notes: 'Less sugar' },
      { name: 'Roti Bakar Coklat Keju', qty: 1, price: 15000, notes: '' },
      { name: 'Air Mineral 600ml', qty: 1, price: 5000, notes: 'Dingin' }
    ],
    subtotal: 56000,
    discount: 5000,
    discountType: 'nominal',
    discountPercent: 0,
    tax: 5100,
    taxRate: 10,
    total: 56100,
    paymentMethod: 'tunai',
    cashReceived: 60000,
    changeAmount: 3900
  };
}

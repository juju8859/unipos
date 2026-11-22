import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/printer';
import { Printer, Share2, X, Check, Copy } from 'lucide-react';

export default function ReceiptModal() {
  const {
    receiptModalData,
    setReceiptModalData,
    settings,
    printReceipt,
    showToast
  } = useApp();

  const receiptRef = useRef(null);

  if (!receiptModalData) return null;

  const trx = receiptModalData;

  const handleShareOrCopy = () => {
    const textLines = [
      settings?.brandName || 'UniPOS Store',
      settings?.subtitle || '',
      settings?.address || '',
      '--------------------------------',
      `Nota: ${trx.id}`,
      `Tanggal: ${trx.dateFormatted}`,
      `Kasir: ${trx.cashierName || 'Kasir'}`,
      trx.customerName ? `Pelanggan: ${trx.customerName}` : null,
      '--------------------------------',
      ...trx.items.map(
        (i) => `${i.name}\n  ${i.qty} x ${formatCurrency(i.price)} = ${formatCurrency(i.qty * i.price)}`
      ),
      '--------------------------------',
      `Subtotal: ${formatCurrency(trx.subtotal)}`,
      trx.discount > 0 ? `Diskon: -${formatCurrency(trx.discount)}` : null,
      trx.tax > 0 ? `Pajak (${trx.taxRate}%): +${formatCurrency(trx.tax)}` : null,
      `TOTAL: ${formatCurrency(trx.total)}`,
      `Metode: ${trx.paymentMethod?.toUpperCase()}`,
      trx.paymentMethod === 'tunai' ? `Bayar: ${formatCurrency(trx.cashReceived)}` : null,
      trx.paymentMethod === 'tunai' ? `Kembali: ${formatCurrency(trx.changeAmount)}` : null,
      '--------------------------------',
      settings?.receiptFooter || 'Terima kasih!'
    ].filter(Boolean);

    const fullText = textLines.join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      showToast('Teks struk berhasil disalin ke clipboard!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="p-3 border-b border-dark-border flex items-center justify-between bg-dark-card">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Printer className="w-4 h-4" />
            <span>Pratinjau Struk Belanja</span>
          </div>
          <button
            onClick={() => setReceiptModalData(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-900/60">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white text-slate-900 font-mono text-xs p-4 rounded-lg shadow-inner max-w-xs mx-auto border border-slate-300 leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              {settings.logoBase64 && (
                <img
                  src={settings.logoBase64}
                  alt="Logo"
                  className="w-12 h-12 object-contain mx-auto mb-1 rounded filter grayscale contrast-125"
                />
              )}
              <h4 className="font-bold text-sm uppercase tracking-wide">
                {settings?.brandName || 'UniPOS Store'}
              </h4>
              {settings?.subtitle && <p className="text-[10px] text-slate-600">{settings.subtitle}</p>}
              {settings?.address && <p className="text-[10px] text-slate-600">{settings.address}</p>}
              {settings?.phone && <p className="text-[10px] text-slate-600">Telp: {settings.phone}</p>}
            </div>

            {/* Transaction Info */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-semibold">{trx.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{trx.dateFormatted || new Date(trx.date).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{trx.cashierName || 'Kasir'}</span>
              </div>
              {trx.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-medium">{trx.customerName}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
              {trx.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium">{item.name}</div>
                  <div className="flex justify-between text-slate-700 pl-2">
                    <span>
                      {item.qty} x {Number(item.price).toLocaleString('id-ID')}
                    </span>
                    <span className="font-semibold">
                      {(item.qty * item.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-slate-500 italic pl-2">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{Number(trx.subtotal).toLocaleString('id-ID')}</span>
              </div>
              {trx.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon</span>
                  <span>-{Number(trx.discount).toLocaleString('id-ID')}</span>
                </div>
              )}
              {trx.tax > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Pajak ({trx.taxRate}%)</span>
                  <span>+{Number(trx.tax).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL</span>
                <span>{formatCurrency(trx.total)}</span>
              </div>
            </div>

            {/* Payment & Change */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Metode</span>
                <span className="uppercase font-semibold">{trx.paymentMethod}</span>
              </div>
              {trx.paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between">
                    <span>Tunai</span>
                    <span>{Number(trx.cashReceived || trx.total).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Kembali</span>
                    <span>{Number(trx.changeAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[10px] text-slate-600 space-y-0.5">
              {(settings?.receiptFooter || 'Terima kasih atas kunjungan Anda!').split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p className="text-[9px] text-slate-400 mt-1">*** UniPOS Universal Cashier ***</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-dark-border bg-dark-surface flex gap-2">
          <button
            onClick={handleShareOrCopy}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            title="Salin Teks Struk"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Salin</span>
          </button>

          <button
            onClick={() => printReceipt(trx)}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Thermal ({settings?.printerMode?.toUpperCase() || 'RAWBT'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

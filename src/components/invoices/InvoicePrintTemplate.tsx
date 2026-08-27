import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  Edit,
  Building2,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Invoice, CompanySetting } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  formatShortDate,
} from '../../services/calculation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { initialCompany } from '../../services/initialData';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  company?: CompanySetting;
  onBack: () => void;
  onEdit?: (invoice: Invoice) => void;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  company = initialCompany,
  onBack,
  onEdit,
}) => {
  const activeCompany = company || initialCompany;
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = printAreaRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Helper to convert oklch colors into rgb/hex via canvas 2D context
          const canvasHelper = document.createElement('canvas');
          const ctx = canvasHelper.getContext('2d');

          const convertColor = (colorStr: string): string => {
            if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) {
              return colorStr;
            }
            try {
              if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = colorStr;
                return ctx.fillStyle;
              }
            } catch {
              // fallback
            }
            return '#000000';
          };

          const convertAllOklchInString = (text: string): string => {
            if (!text || typeof text !== 'string' || !text.includes('oklch')) {
              return text;
            }
            return text.replace(/oklch\([^)]+\)/gi, (match) => convertColor(match));
          };

          // 1. Sanitize all <style> tags in cloned document (converts Tailwind v4 oklch CSS variables)
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = convertAllOklchInString(styleTag.textContent);
            }
          });

          // 2. Sanitize all elements in cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes('oklch')) {
              htmlEl.style.cssText = convertAllOklchInString(htmlEl.style.cssText);
            }

            // Check and override any computed oklch colors
            try {
              const comp = window.getComputedStyle(el);
              const colorProperties: string[] = [
                'color',
                'backgroundColor',
                'borderColor',
                'borderTopColor',
                'borderRightColor',
                'borderBottomColor',
                'borderLeftColor',
                'outlineColor',
                'fill',
                'stroke',
              ];
              for (const prop of colorProperties) {
                const val = (comp as Record<string, any>)[prop];
                if (typeof val === 'string' && val.includes('oklch')) {
                  (htmlEl.style as Record<string, any>)[prop] = convertColor(val);
                }
              }
            } catch {
              // ignore
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      const cleanInvNum = invoice.invoiceNumber.replace(/[\/\\]/g, '-');
      pdf.save(`Invoice_${cleanInvNum}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const currentBank =
    invoice.bankAccountSnapshot ||
    company.bankAccounts.find((b) => b.id === invoice.bankAccountId) ||
    company.bankAccounts.find((b) => b.isDefault) ||
    company.bankAccounts[0];

  const companySlogan =
    activeCompany.tagline?.trim() ||
    initialCompany.tagline ||
    'Solusi Terpadu Pengadaan Barang, Jasa TI, Percetakan & Multimedia';

  const isPaid = invoice.status === 'paid';
  const isPartial = invoice.status === 'partial';
  const isOverdue = invoice.status === 'overdue';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </button>

        <div className="flex items-center gap-2">
          {onEdit && invoice.status !== 'cancelled' && (
            <button
              onClick={() => onEdit(invoice)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Invoice</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Download PDF Langsung"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer"
            title="Cetak via Printer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 INVOICE SHEET CONTAINER */}
      <div className="bg-slate-100/80 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-white flex justify-center">
        <div
          ref={printAreaRef}
          id="invoice-document"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white p-8 sm:p-10 shadow-lg print:shadow-none print:p-8 text-slate-900 flex flex-col justify-between font-sans border border-slate-200 print:border-none relative"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Status Watermark Stamp */}
          {isPaid && (
            <div className="absolute top-28 right-12 pointer-events-none opacity-20 rotate-[-12deg] select-none">
              <div className="border-4 border-emerald-600 rounded-xl px-5 py-1.5 text-center">
                <span className="text-4xl font-black tracking-widest text-emerald-700 uppercase">
                  LUNAS / PAID
                </span>
              </div>
            </div>
          )}

          <div>
            {/* 1. HEADER: COMPANY IDENTITY & INVOICE META */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              {/* Left: Company Identity */}
              <div className="max-w-[58%]">
                <div className="flex items-center gap-3.5 mb-2">
                  {activeCompany.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.name}
                      className="max-h-14 max-w-[150px] w-auto h-auto object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {activeCompany.name?.substring(0, 2).toUpperCase() || 'CV'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                      {activeCompany.name}
                    </h1>
                    {/* SLOGAN TOKO / PERUSAHAAN DITAMPILKAN DIBAWAH NAMA CV */}
                    <p className="text-[11px] font-semibold text-blue-800 tracking-normal italic mt-0.5">
                      "{companySlogan}"
                    </p>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-600 leading-relaxed space-y-0.5 pl-0.5 mt-1.5">
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {activeCompany.address} {activeCompany.rtRw ? `${activeCompany.rtRw}, ` : ''}
                      {activeCompany.village ? `${activeCompany.village}, ` : ''}
                      {activeCompany.district ? `${activeCompany.district}, ` : ''}
                      {activeCompany.city}, {activeCompany.province} {activeCompany.postalCode}
                    </span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span>
                      <strong className="text-slate-800 font-semibold">NPWP:</strong> {activeCompany.npwp || '-'}
                    </span>
                    <span>
                      <strong className="text-slate-800 font-semibold">Telp/WA:</strong> {activeCompany.phone}
                    </span>
                  </p>
                  {activeCompany.email && (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{activeCompany.email}</span>
                      {activeCompany.website && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{activeCompany.website}</span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Invoice Title & Meta Card */}
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase mb-1">
                  FAKTUR PENJUALAN
                </div>
                <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  INVOICE
                </div>
                <div className="text-xs font-bold text-blue-900 font-mono mt-0.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                  {invoice.invoiceNumber}
                </div>

                <div className="mt-2.5 space-y-1 text-[11px] text-right">
                  <div className="flex justify-end gap-2 text-slate-600">
                    <span className="text-slate-500">Tanggal Invoice:</span>
                    <strong className="text-slate-900 font-semibold font-mono">
                      {formatShortDate(invoice.invoiceDate)}
                    </strong>
                  </div>
                  <div className="flex justify-end gap-2 text-slate-600">
                    <span className="text-slate-500">Jatuh Tempo:</span>
                    <strong className="text-rose-700 font-bold font-mono">
                      {formatShortDate(invoice.dueDate)}
                    </strong>
                  </div>
                  {invoice.poNumber && (
                    <div className="flex justify-end gap-2 text-slate-600">
                      <span className="text-slate-500">No. PO:</span>
                      <strong className="text-slate-800 font-medium">{invoice.poNumber}</strong>
                    </div>
                  )}
                  {invoice.deliveryDate && (
                    <div className="flex justify-end gap-2 text-slate-600">
                      <span className="text-slate-500">Tgl Pengiriman:</span>
                      <span className="text-slate-800 font-medium font-mono">
                        {formatShortDate(invoice.deliveryDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & BILL TO BOX */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 text-[11px]">
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>TAGIHAN DITUJUKAN KEPADA (BILL TO):</span>
                </div>
                <div className="text-xs font-black text-slate-900">
                  {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.name}
                </div>
                {invoice.customerSnapshot?.companyName && (
                  <div className="text-slate-700 font-semibold mt-0.5">
                    Attn: {invoice.customerSnapshot?.name}
                  </div>
                )}
                <div className="text-slate-600 mt-1 leading-relaxed">
                  {invoice.customerSnapshot?.address}, {invoice.customerSnapshot?.city}{' '}
                  {invoice.customerSnapshot?.postalCode}
                </div>
              </div>

              <div className="flex flex-col justify-end text-left sm:text-right space-y-0.5 text-slate-600 border-t sm:border-t-0 pt-2 sm:pt-0 sm:border-l sm:border-slate-200 sm:pl-4">
                {invoice.customerSnapshot?.npwp && (
                  <div>
                    <span className="text-slate-500 font-normal">NPWP Pelanggan:</span>{' '}
                    <span className="font-semibold text-slate-800 font-mono">
                      {invoice.customerSnapshot.npwp}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-normal">Telepon / Kontak:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {invoice.customerSnapshot?.phone || '-'}
                  </span>
                </div>
                {invoice.customerSnapshot?.email && (
                  <div>
                    <span className="text-slate-500 font-normal">Email:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {invoice.customerSnapshot.email}
                    </span>
                  </div>
                )}
                {invoice.salesSnapshot && (
                  <div className="pt-1 text-slate-700">
                    <span className="text-slate-500 font-normal">Sales In Charge:</span>{' '}
                    <span className="font-semibold text-slate-900">
                      {invoice.salesSnapshot.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. TABLE ITEM RINCIAN */}
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-300">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[9.5px] tracking-wider">
                    <th className="py-2.5 px-3 w-8 text-center border-r border-slate-800">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Deskripsi Barang & Jasa Layanan</th>
                    <th className="py-2.5 px-2 w-14 text-center border-r border-slate-800">Qty</th>
                    <th className="py-2.5 px-2 w-16 text-center border-r border-slate-800">Satuan</th>
                    <th className="py-2.5 px-3 w-28 text-right border-r border-slate-800">Harga Satuan</th>
                    <th className="py-2.5 px-3 w-20 text-right border-r border-slate-800">Diskon</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`align-top ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                    >
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-600 whitespace-pre-line mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 font-semibold text-slate-800 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono text-slate-800">
                        {formatRupiah(item.unitPrice, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-600 font-mono">
                        {item.discountAmount > 0 ? (
                          <span className="text-rose-700 font-medium">
                            {formatRupiah(item.discountAmount, false)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        {formatRupiah(item.totalPrice, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. SUMMARY / TOTALS SECTION */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-5 border-t border-slate-200 pt-3">
              {/* Left Side: Terbilang Box & Bank Payment Details */}
              <div className="w-full sm:w-[54%] space-y-2.5">
                {/* Terbilang Box */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1">
                    <span>JUMLAH TERBILANG:</span>
                  </div>
                  <div className="font-bold italic text-slate-800 leading-snug">
                    # {invoice.terbilang} #
                  </div>
                </div>

                {/* Bank Account Transfer Info */}
                {currentBank && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[10.5px] space-y-1 text-slate-700 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-1 mb-1">
                      <span className="font-bold text-blue-900 uppercase text-[10px] flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                        <span>INFORMASI TRANSFER PEMBAYARAN</span>
                      </span>
                      <span className="text-[9px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                        Rekening Resmi CV
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {currentBank.bankName}{' '}
                          {currentBank.branch && (
                            <span className="text-[10px] font-normal text-slate-500">
                              ({currentBank.branch})
                            </span>
                          )}
                        </div>
                        <div className="font-black font-mono text-sm text-blue-950 tracking-wider">
                          {currentBank.accountNumber}
                        </div>
                        <div className="text-slate-600 text-[10px]">
                          A.N.{' '}
                          <strong className="text-slate-900 font-semibold">
                            {currentBank.accountHolder}
                          </strong>
                        </div>
                      </div>
                      <div className="text-center pl-2">
                        <div className="w-12 h-12 bg-white border border-blue-200 rounded p-1 flex items-center justify-center shadow-2xs">
                          <QrCode className="w-10 h-10 text-slate-800" />
                        </div>
                        <span className="text-[8px] text-slate-400 block mt-0.5">Validasi Tagihan</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Totals Calculation Table */}
              <div className="w-full sm:w-[44%] text-[11px]">
                <table className="w-full text-right">
                  <tbody>
                    <tr>
                      <td className="text-slate-600 py-1 font-medium">
                        {invoice.taxCalculationType === 'inclusive' && invoice.isPpnActive
                          ? 'Subtotal (Inc. PPN):'
                          : 'Subtotal Produk/Jasa:'}
                      </td>
                      <td className="font-bold font-mono text-slate-900 py-1">
                        {formatRupiah(invoice.subtotal)}
                      </td>
                    </tr>
                    {invoice.invoiceDiscountAmount > 0 && (
                      <tr>
                        <td className="text-rose-700 py-1 font-medium">Diskon Faktur:</td>
                        <td className="font-bold font-mono text-rose-700 py-1">
                          - {formatRupiah(invoice.invoiceDiscountAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.isPpnActive && (
                      <>
                        <tr className="border-t border-slate-100">
                          <td className="text-slate-500 py-0.5 text-[10px]">Dasar Pengenaan Pajak (DPP):</td>
                          <td className="font-medium font-mono text-slate-700 py-0.5 text-[10px]">
                            {formatRupiah(invoice.taxableBase)}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-slate-700 py-1 font-medium">
                            PPN ({invoice.ppnRate}%){invoice.taxCalculationType === 'inclusive' ? ' (Termasuk)' : ''}:
                          </td>
                          <td className="font-bold font-mono text-slate-900 py-1">
                            {formatRupiah(invoice.ppnAmount)}
                          </td>
                        </tr>
                      </>
                    )}
                    {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                      <tr>
                        <td className="text-slate-600 py-1 font-medium">Bea Materai:</td>
                        <td className="font-bold font-mono text-slate-900 py-1">
                          {formatRupiah(invoice.materaiAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-900 bg-slate-900 text-white">
                      <td className="py-2.5 px-3 text-xs font-black uppercase text-left rounded-l-lg">
                        TOTAL TAGIHAN:
                      </td>
                      <td className="py-2.5 px-3 text-base font-black font-mono text-right rounded-r-lg">
                        {formatRupiah(invoice.grandTotal)}
                      </td>
                    </tr>

                    {/* Paid & Balance if partial or paid */}
                    {invoice.amountPaid > 0 && (
                      <>
                        <tr className="border-t border-slate-200">
                          <td className="text-emerald-700 py-1 font-semibold text-[10.5px]">Telah Dibayar:</td>
                          <td className="font-bold font-mono text-emerald-700 py-1 text-[10.5px]">
                            {formatRupiah(invoice.amountPaid)}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-amber-800 py-1 font-bold text-[11px]">Sisa Piutang:</td>
                          <td className="font-bold font-mono text-amber-800 py-1 text-[11px]">
                            {formatRupiah(invoice.remainingBalance)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. NOTES & TERMS */}
            {(invoice.notes || invoice.terms) && (
              <div className="mt-3.5 pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-slate-600">
                {invoice.notes && (
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 uppercase text-[9px] mb-0.5">
                      Catatan Tagihan:
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{invoice.notes}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 uppercase text-[9px] mb-0.5">
                      Syarat & Ketentuan:
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{invoice.terms}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. SIGNATURES & FOOTER */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px]">
            <div className="grid grid-cols-3 gap-4">
              {/* Signatory 1: Customer */}
              <div>
                <div className="text-slate-600 font-medium">Penerima / Pelanggan,</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-slate-400 w-36" />
                </div>
                <div className="font-bold text-slate-900 mt-1 truncate px-2">
                  ( {invoice.signatoryCustomerName || '...............................'} )
                </div>
              </div>

              {/* Signatory 2: Sales */}
              <div>
                <div className="text-slate-600 font-medium">Hormat Kami,</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-slate-400 w-36" />
                </div>
                <div className="font-bold text-slate-900 mt-1 truncate px-2">
                  ( {invoice.signatorySalesName || invoice.salesSnapshot?.name || 'Budi Prasetyo, S.Kom'} )
                </div>
              </div>

              {/* Signatory 3: Director / Finance with Materai slot if active */}
              <div>
                <div className="text-slate-600 font-medium">
                  Mengetahui ({activeCompany.name}),
                </div>
                <div className="h-16 flex items-center justify-center relative">
                  {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                    <div className="border border-dashed border-slate-300 text-[8px] text-slate-400 px-2 py-1 rounded">
                      Materai Tempel Rp 10.000
                    </div>
                  )}
                  <div className="border-b border-slate-400 w-36 absolute bottom-0" />
                </div>
                <div className="font-bold text-slate-900 mt-1 truncate px-2">
                  ( {invoice.signatoryFinanceName || 'Ahmad Miza, S.T.'} )
                </div>
              </div>
            </div>

            {/* Document Footer Note */}
            <div className="mt-5 pt-2 border-t border-slate-100 text-[9px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
              <span>
                Dokumen resmi ini dicetak secara sah melalui sistem manajemen faktur {activeCompany.name}
              </span>
              <span>
                Dicetak: {formatIndonesianDate(new Date().toISOString())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


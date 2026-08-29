import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  Edit,
  CreditCard,
  Scissors,
  FileText,
  Layers,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Invoice, CompanySetting } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  formatShortDate,
  numberToTerbilang,
} from '../../services/calculation';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { initialCompany } from '../../services/initialData';
import { MizaLogoIcon } from '../common/MizaBrandLogo';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  company?: CompanySetting;
  onBack: () => void;
  onEdit?: (invoice: Invoice) => void;
}

type PrintMode = 'half-a4' | 'double-half' | 'full-a4';

interface SingleSlipProps {
  invoice: Invoice;
  company: CompanySetting;
  currentBank: any;
  companySlogan: string;
  isPaid: boolean;
  copyLabel?: string;
  isCompact?: boolean;
}

const SingleInvoiceSlip: React.FC<SingleSlipProps> = ({
  invoice,
  company,
  currentBank,
  companySlogan,
  isPaid,
  copyLabel,
  isCompact = true,
}) => {
  return (
    <div
      className={`w-full bg-white text-slate-900 font-sans relative ${
        isCompact ? 'p-3.5 sm:p-5' : 'p-6 sm:p-8'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. HEADER: COMPANY IDENTITY (LEFT) & INVOICE META / RECIPIENT (RIGHT) */}
      <div className="grid grid-cols-2 gap-4 items-start border-b-2 border-slate-900 pb-2.5">
        {/* Left Column (50%): Company Identity */}
        <div className="pr-1">
          <div className="flex items-center gap-2.5">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="max-h-11 max-w-[110px] w-auto h-auto object-contain shrink-0"
              />
            ) : (
              <MizaLogoIcon className="h-9 w-auto shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-[16px] sm:text-[17px] font-black tracking-tight leading-none uppercase font-sans">
                {company.name?.toUpperCase().includes('MIZA') ? (
                  <>
                    <span className="text-black">CV.</span>
                    <span className="text-[#00AEEF]">MIZA</span>{' '}
                    <span className="text-black">MEDIATAMA</span>
                  </>
                ) : (
                  <span className="text-slate-900">{company.name}</span>
                )}
              </h1>
              <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-700 tracking-wider uppercase leading-tight mt-1">
                {companySlogan}
              </p>
            </div>
          </div>

          <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-snug space-y-0.5 mt-1.5">
            <p className="line-clamp-2">
              {company.address} {company.rtRw ? `${company.rtRw}, ` : ''}
              {company.village ? `${company.village}, ` : ''}
              {company.district ? `${company.district}, ` : ''}
              {company.city}, {company.province} {company.postalCode}
            </p>
            <div className="flex flex-wrap gap-x-3 text-slate-700">
              <span>
                <strong className="text-slate-900 font-semibold">NPWP:</strong> {company.npwp || '-'}
              </span>
              <span>
                <strong className="text-slate-900 font-semibold">Telp/WA:</strong> {company.phone}
              </span>
            </div>
            {company.email && (
              <p className="text-slate-500 truncate text-[9.5px] sm:text-[10px]">
                <span>{company.email}</span>
                {company.website && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{company.website}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right Column (50%): Invoice Title, Meta Card & KEPADA Section */}
        <div className="pl-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="inline-block bg-slate-900 text-white px-2.5 py-1 rounded text-xs sm:text-[13px] font-black tracking-wider uppercase leading-none shadow-2xs">
                NOTA PENJUALAN
              </div>
              {copyLabel && (
                <span className="text-[8.5px] sm:text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                  {copyLabel}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-[13px] font-black text-blue-950 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block shadow-2xs">
                {invoice.invoiceNumber}
              </div>
            </div>
          </div>

          {/* Date & PO Meta */}
          <div className="mt-1.5 flex flex-wrap justify-between items-center text-[10px] sm:text-[10.5px] text-slate-700 leading-snug gap-x-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-bold uppercase text-[9.5px] sm:text-[10px]">TANGGAL :</span>
              <span className="text-xs sm:text-[12.5px] font-bold text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-300 inline-block shadow-2xs">
                {formatShortDate(invoice.invoiceDate)}
              </span>
            </div>
            {invoice.poNumber && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[9px] uppercase font-bold">PO:</span>
                <span className="text-slate-800 font-semibold text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                  {invoice.poNumber}
                </span>
              </div>
            )}
            {invoice.deliveryDate && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Kirim:</span>
                <span className="text-slate-800 font-medium font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                  {formatShortDate(invoice.deliveryDate)}
                </span>
              </div>
            )}
          </div>

          {/* KEPADA Section */}
          <div className="mt-1.5 bg-slate-50/90 p-2 rounded-lg border border-slate-200 text-left">
            <div className="text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="font-extrabold text-slate-800">KEPADA YTH:</span>
            </div>
            <div className="text-[11.5px] sm:text-[12.5px] font-black text-slate-900 leading-tight mt-0.5 truncate">
              {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.name}
            </div>
            {invoice.customerSnapshot?.companyName && invoice.customerSnapshot?.name && (
              <div className="text-slate-700 font-semibold text-[9.5px] sm:text-[10px] leading-tight truncate">
                Attn: {invoice.customerSnapshot?.name}
              </div>
            )}
            {invoice.customerSnapshot?.address && (
              <div className="text-slate-600 text-[9.5px] sm:text-[10px] leading-snug mt-0.5 truncate">
                {invoice.customerSnapshot.address}
                {invoice.customerSnapshot.city ? `, ${invoice.customerSnapshot.city}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. TABLE ITEM RINCIAN (Proportional Clear Font Size) */}
      <div className="mt-2 overflow-hidden rounded border border-slate-300">
        <table className="w-full text-left text-[10.5px] sm:text-[11px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[9px] sm:text-[9.5px] tracking-wider">
              <th className="py-1.5 px-2 w-7 text-center border-r border-slate-800">No</th>
              <th className="py-1.5 px-2 border-r border-slate-800">Deskripsi Barang &amp; Jasa Layanan</th>
              <th className="py-1.5 px-1.5 w-11 text-center border-r border-slate-800">Qty</th>
              <th className="py-1.5 px-1.5 w-14 text-center border-r border-slate-800">Satuan</th>
              <th className="py-1.5 px-2 w-24 text-right border-r border-slate-800">Harga (Rp)</th>
              <th className="py-1.5 px-2 w-18 text-right border-r border-slate-800">Diskon</th>
              <th className="py-1.5 px-2 w-28 text-right">Total (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr
                key={item.id}
                className={`align-top ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
              >
                <td className="py-1.5 px-2 text-center border-r border-slate-200 text-slate-500 font-medium">
                  {idx + 1}
                </td>
                <td className="py-1.5 px-2 border-r border-slate-200">
                  <div className="font-bold text-slate-900 leading-tight text-[11px] sm:text-[11.5px]">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-[9.5px] sm:text-[10px] text-slate-500 whitespace-pre-line leading-tight mt-0.5">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="py-1.5 px-1.5 text-center border-r border-slate-200 font-bold text-slate-800 font-mono">
                  {item.quantity}
                </td>
                <td className="py-1.5 px-1.5 text-center border-r border-slate-200 text-slate-600 text-[10px]">
                  {item.unit}
                </td>
                <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono text-slate-800">
                  {formatRupiah(item.unitPrice, false)}
                </td>
                <td className="py-1.5 px-2 text-right border-r border-slate-200 text-slate-600 font-mono">
                  {item.discountAmount > 0 ? (
                    <span className="text-rose-700 font-medium">
                      {formatRupiah(item.discountAmount, false)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-1.5 px-2 text-right font-bold font-mono text-slate-900 text-[11px] sm:text-[11.5px]">
                  {formatRupiah(item.totalPrice, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. SUMMARY SECTION (Terbilang, Syarat & Ketentuan, Bank + Totals) */}
      <div className="mt-2 flex justify-between items-start gap-3 border-t border-slate-200 pt-2">
        {/* Left Side (54%): Terbilang, Terms, Bank Info */}
        <div className="w-[54%] space-y-1.5">
          {/* Terbilang Box */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[9.5px]">
            <div className="text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 leading-none mb-0.5">
              JUMLAH TERBILANG:
            </div>
            <div className="font-bold italic text-slate-900 leading-snug text-[10.5px] sm:text-[11px]">
              # {invoice.grandTotal !== undefined ? `${numberToTerbilang(invoice.grandTotal)} Rupiah` : (invoice.terbilang || 'Nol Rupiah')} #
            </div>
          </div>

          {/* Syarat & Ketentuan (Tepat mepet di bawah Jumlah Terbilang) */}
          {invoice.terms && (
            <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200/80 text-[9px] sm:text-[9.5px] text-slate-700 leading-snug">
              <div className="font-bold text-slate-900 uppercase text-[8.5px] sm:text-[9px] mb-0.5">
                Syarat &amp; Ketentuan:
              </div>
              <div className="whitespace-pre-line leading-snug">{invoice.terms}</div>
            </div>
          )}

          {/* Bank Account Transfer Info */}
          {invoice.showPaymentInfo !== false && currentBank && (
            <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-200 text-[9.5px] space-y-0.5 text-slate-700">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-1 mb-1">
                <span className="font-bold text-blue-950 uppercase text-[8.5px] sm:text-[9px] flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-blue-700" />
                  <span>PEMBAYARAN TRANSFER</span>
                </span>
                <span className="text-[8px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                  Rekening Resmi
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 leading-tight">
                <span className="font-bold text-slate-900 text-[10px] sm:text-[10.5px]">
                  {currentBank.bankName} {currentBank.branch ? `(${currentBank.branch})` : ''}
                </span>
                <span className="font-black font-mono text-[11px] sm:text-[11.5px] text-blue-950">
                  {currentBank.accountNumber}
                </span>
              </div>
              <div className="text-slate-600 text-[9px] sm:text-[9.5px] leading-tight">
                A.N. <strong className="text-slate-900 font-semibold">{currentBank.accountHolder}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right Side (44%): Totals Calculation Table */}
        <div className="w-[44%] text-[10.5px] sm:text-[11px]">
          <table className="w-full text-right leading-tight">
            <tbody>
              <tr>
                <td className="text-slate-600 py-0.5 font-medium">
                  {invoice.taxCalculationType === 'inclusive' && invoice.isPpnActive
                    ? 'Subtotal (Inc. PPN):'
                    : 'Subtotal Produk/Jasa:'}
                </td>
                <td className="font-bold font-mono text-slate-900 py-0.5">
                  {formatRupiah(invoice.subtotal)}
                </td>
              </tr>
              {invoice.invoiceDiscountAmount > 0 && (
                <tr>
                  <td className="text-rose-700 py-0.5 font-medium">Diskon Faktur:</td>
                  <td className="font-bold font-mono text-rose-700 py-0.5">
                    - {formatRupiah(invoice.invoiceDiscountAmount)}
                  </td>
                </tr>
              )}
              {invoice.isPpnActive && (
                <>
                  <tr className="border-t border-slate-100">
                    <td className="text-slate-500 py-0.5 text-[9px] sm:text-[9.5px]">DPP:</td>
                    <td className="font-medium font-mono text-slate-700 py-0.5 text-[9px] sm:text-[9.5px]">
                      {formatRupiah(invoice.taxableBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-slate-700 py-0.5 font-medium">
                      PPN ({invoice.ppnRate}%){invoice.taxCalculationType === 'inclusive' ? ' (Inc)' : ''}:
                    </td>
                    <td className="font-bold font-mono text-slate-900 py-0.5">
                      {formatRupiah(invoice.ppnAmount)}
                    </td>
                  </tr>
                </>
              )}
              {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                <tr>
                  <td className="text-slate-600 py-0.5 font-medium">Bea Materai:</td>
                  <td className="font-bold font-mono text-slate-900 py-0.5">
                    {formatRupiah(invoice.materaiAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-900 bg-slate-900 text-white">
                <td className="py-1 px-2 text-[10px] sm:text-[10.5px] font-black uppercase text-left rounded-l">
                  TOTAL TAGIHAN:
                </td>
                <td className="py-1 px-2 text-xs sm:text-[13px] font-black font-mono text-right rounded-r">
                  {formatRupiah(invoice.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. COMPACT SIGNATURES: 2 SIGNATORIES (PENERIMA & MARKETING) */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-200 text-center text-[10px]">
        <div className="flex justify-between items-start px-4 sm:px-10">
          {/* 1. Signatory: Customer / Penerima */}
          <div className="w-36 sm:w-48 flex flex-col items-center">
            <div className="text-slate-800 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wide">
              PENERIMA,
            </div>
            <div className="h-10 sm:h-12 flex items-end justify-center w-full">
              <div className="border-b border-slate-400 w-32 sm:w-40" />
            </div>
            <div className="mt-1 text-center w-full">
              <div className="font-bold text-slate-900 truncate px-0.5 text-[10.5px] sm:text-[11px]">
                ( {invoice.signatoryCustomerName || invoice.customerSnapshot?.contactPerson || invoice.customerSnapshot?.name || '................................'} )
              </div>
            </div>
          </div>

          {/* 2. Signatory: MARKETING (Filled with Sales name) */}
          <div className="w-36 sm:w-48 flex flex-col items-center">
            <div className="text-slate-800 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wide">
              MARKETING,
            </div>
            <div className="h-10 sm:h-12 flex items-center justify-center relative w-full">
              {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                <div className="border border-dashed border-slate-300 text-[8px] text-slate-500 px-2 py-0.5 rounded leading-none mb-1">
                  Materai Rp 10.000
                </div>
              )}
              <div className="border-b border-slate-400 w-32 sm:w-40 absolute bottom-0" />
            </div>
            <div className="mt-1 text-center w-full">
              <div className="font-bold text-slate-900 truncate px-0.5 text-[10.5px] sm:text-[11px]">
                ( {invoice.salesSnapshot?.name || invoice.signatorySalesName || invoice.createdByName || '................................'} )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  company = initialCompany,
  onBack,
  onEdit,
}) => {
  const activeCompany = company || initialCompany;
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>('half-a4');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = printAreaRef.current;

      const imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const isA5 = printMode === 'half-a4';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isA5 ? 'a5' : 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const renderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));
      const cleanInvNum = invoice.invoiceNumber.replace(/[\/\\]/g, '-');
      pdf.save(`Invoice_${cleanInvNum}_${printMode}.pdf`);
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

  const companySlogan = (
    activeCompany.tagline?.trim() ||
    'KOMPUTER – ELEKTRONIK – FURNITUR – PERDAGANGAN UMUM'
  ).toUpperCase();

  const isPaid = invoice.status === 'paid';

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Print Format Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPrintMode('half-a4')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                printMode === 'half-a4'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cetak 1 Nota Kompak (Setengah A4 / Kertas A5)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Setengah A4 (A5)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('double-half')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                printMode === 'double-half'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cetak 2 Nota dalam 1 Kertas A4 (Rangkap Pelanggan & Arsip Kantor)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2 Rangkap / A4</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('full-a4')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                printMode === 'full-a4'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cetak 1 Lembar Penuh A4"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>1 Lembar A4 Penuh</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && invoice.status !== 'cancelled' && (
            <button
              onClick={() => onEdit(invoice)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Invoice</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Download PDF Sesuai Format Pilihan"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>{isGeneratingPdf ? 'Proses PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer"
            title="Cetak ke Printer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {printMode === 'double-half'
                ? 'Print 2 Rangkap (A4)'
                : printMode === 'half-a4'
                ? 'Print Nota (1/2 A4)'
                : 'Print Faktur (A4)'}
            </span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <div className="bg-slate-200/70 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-white flex justify-center overflow-x-auto">
        <div
          ref={printAreaRef}
          id="invoice-document"
          className={`w-full bg-white shadow-lg print:shadow-none border border-slate-300 print:border-none ${
            printMode === 'half-a4'
              ? 'max-w-[210mm] max-h-[148mm] min-h-[125mm]'
              : printMode === 'double-half'
              ? 'max-w-[210mm] min-h-[280mm]'
              : 'max-w-[210mm] min-h-[285mm]'
          }`}
        >
          {/* MODE 1: SINGLE HALF-A4 / A5 COMPACT (DEFAULT) */}
          {printMode === 'half-a4' && (
            <SingleInvoiceSlip
              invoice={invoice}
              company={activeCompany}
              currentBank={currentBank}
              companySlogan={companySlogan}
              isPaid={isPaid}
              isCompact={true}
            />
          )}

          {/* MODE 2: 2 COPIES IN 1 A4 SHEET (RANGKAP 1: CUSTOMER, RANGKAP 2: ARSIP) */}
          {printMode === 'double-half' && (
            <div className="flex flex-col justify-between">
              {/* Slip 1: Customer Copy */}
              <SingleInvoiceSlip
                invoice={invoice}
                company={activeCompany}
                currentBank={currentBank}
                companySlogan={companySlogan}
                isPaid={isPaid}
                copyLabel="RANGKAP 1 (PELANGGAN)"
                isCompact={true}
              />

              {/* Scissors Separator Line */}
              <div className="relative py-1 border-t border-dashed border-slate-400 my-0.5 text-center select-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white text-[8px] font-bold text-slate-500 border border-slate-300 rounded-full">
                  <Scissors className="w-2.5 h-2.5 text-slate-600" />
                  <span>POTONG / GUNTING DI SINI (SETENGAH KERTAS A4)</span>
                </span>
              </div>

              {/* Slip 2: Company / Sales Archive Copy */}
              <SingleInvoiceSlip
                invoice={invoice}
                company={activeCompany}
                currentBank={currentBank}
                companySlogan={companySlogan}
                isPaid={isPaid}
                copyLabel="RANGKAP 2 (ARSIP KANTOR / MARKETING)"
                isCompact={true}
              />
            </div>
          )}

          {/* MODE 3: FULL A4 SINGLE SHEET */}
          {printMode === 'full-a4' && (
            <SingleInvoiceSlip
              invoice={invoice}
              company={activeCompany}
              currentBank={currentBank}
              companySlogan={companySlogan}
              isPaid={isPaid}
              isCompact={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintTemplate;

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
      className={`w-full bg-white text-black font-sans relative ${
        isCompact ? 'p-3 sm:p-4.5' : 'p-6 sm:p-8'
      }`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. HEADER: COMPANY IDENTITY (LEFT) & INVOICE META / RECIPIENT (RIGHT) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 items-start border-b-2 border-black pb-2 sm:pb-2.5">
        {/* Left Column (50%): Company Identity (Enlarged & Crisp Solid Black) */}
        <div className="pr-1">
          <div className="flex items-center gap-2.5">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="max-h-12 max-w-[125px] w-auto h-auto object-contain shrink-0"
              />
            ) : (
              <MizaLogoIcon className="h-10 w-auto shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-[17px] sm:text-[19px] font-black tracking-tight leading-none uppercase font-sans text-black">
                {company.name?.toUpperCase().includes('MIZA') ? (
                  <>
                    <span className="text-black">CV. </span>
                    <span className="text-[#00AEEF] font-black">MIZA</span>{' '}
                    <span className="text-black">MEDIATAMA</span>
                  </>
                ) : (
                  <span className="text-black">{company.name}</span>
                )}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-black text-black tracking-wider uppercase leading-tight mt-1">
                {companySlogan}
              </p>
            </div>
          </div>

          <div className="text-[11px] sm:text-[11.5px] text-black font-semibold leading-snug space-y-0.5 mt-1.5">
            <p className="line-clamp-2 text-black">
              {company.address} {company.rtRw ? `${company.rtRw}, ` : ''}
              {company.village ? `${company.village}, ` : ''}
              {company.district ? `${company.district}, ` : ''}
              {company.city}, {company.province} {company.postalCode}
            </p>
            <div className="flex flex-wrap gap-x-3 text-black font-bold">
              <span>
                <strong className="text-black font-black">NPWP:</strong> {company.npwp || '-'}
              </span>
              <span>
                <strong className="text-black font-black">Telp/WA:</strong> {company.phone}
              </span>
            </div>
            {company.email && (
              <p className="text-black font-medium truncate text-[10px] sm:text-[10.5px]">
                <span>{company.email}</span>
                {company.website && (
                  <>
                    <span className="mx-1 font-bold">•</span>
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
              <div className="inline-block bg-black text-white px-2.5 py-1 rounded text-[12px] sm:text-[13.5px] font-black tracking-wider uppercase leading-none shadow-xs">
                NOTA PENJUALAN
              </div>
              {copyLabel && (
                <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-400 uppercase">
                  {copyLabel}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-[12.5px] sm:text-[14px] font-black text-black font-mono bg-slate-100 px-2.5 py-0.5 rounded border border-slate-400 inline-block shadow-2xs">
                {invoice.invoiceNumber}
              </div>
            </div>
          </div>

          {/* Date & PO Meta */}
          <div className="mt-1.5 flex flex-wrap justify-between items-center text-[11px] sm:text-[11.5px] text-black leading-snug gap-x-2">
            <div className="flex items-center gap-1.5">
              <span className="text-black font-black uppercase text-[10px] sm:text-[11px]">TANGGAL :</span>
              <span className="text-[12px] sm:text-[13px] font-black text-black font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-400 inline-block shadow-2xs">
                {formatShortDate(invoice.invoiceDate)}
              </span>
            </div>
            {invoice.poNumber && (
              <div className="flex items-center gap-1">
                <span className="text-black text-[10px] uppercase font-black">PO:</span>
                <span className="text-black font-bold text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-300 font-mono">
                  {invoice.poNumber}
                </span>
              </div>
            )}
            {invoice.deliveryDate && (
              <div className="flex items-center gap-1">
                <span className="text-black text-[10px] uppercase font-black">Kirim:</span>
                <span className="text-black font-bold font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-300">
                  {formatShortDate(invoice.deliveryDate)}
                </span>
              </div>
            )}
          </div>

          {/* KEPADA Section */}
          <div className="mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-300 text-left">
            <div className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black flex items-center justify-between">
              <span>KEPADA YTH:</span>
            </div>
            <div className="text-[13px] sm:text-[14.5px] font-black text-black leading-tight mt-0.5 truncate">
              {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.name}
            </div>
            {(invoice.customerSnapshot?.name || invoice.customerSnapshot?.contactPerson) && (
              <div className="text-black font-bold text-[10.5px] sm:text-[11.5px] leading-tight truncate mt-0.5">
                Attn : {invoice.customerSnapshot?.name || invoice.customerSnapshot?.contactPerson}
              </div>
            )}
            {invoice.customerSnapshot?.address && (
              <div className="text-black font-medium text-[10px] sm:text-[11px] leading-snug mt-0.5 truncate">
                {invoice.customerSnapshot.address}
                {invoice.customerSnapshot.city ? `, ${invoice.customerSnapshot.city}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. TABLE ITEM RINCIAN (Enlarged & Crisp Font Size) */}
      <div className="mt-2 overflow-hidden rounded border border-slate-400">
        <table className="w-full text-left text-[11px] sm:text-[11.5px] border-collapse">
          <thead>
            <tr className="bg-black text-white font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider">
              <th className="py-1.5 px-2 w-7 text-center border-r border-slate-800">No</th>
              <th className="py-1.5 px-2 border-r border-slate-800">Deskripsi Barang &amp; Jasa Layanan</th>
              <th className="py-1.5 px-1.5 w-12 text-center border-r border-slate-800">Qty</th>
              <th className="py-1.5 px-1.5 w-14 text-center border-r border-slate-800">Satuan</th>
              <th className="py-1.5 px-2 w-24 text-right border-r border-slate-800">Harga (Rp)</th>
              <th className="py-1.5 px-2 w-18 text-right border-r border-slate-800">Diskon</th>
              <th className="py-1.5 px-2 w-28 text-right">Total (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {invoice.items.map((item, idx) => (
              <tr
                key={item.id}
                className={`align-top ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
              >
                <td className="py-1.5 px-2 text-center border-r border-slate-300 text-black font-bold">
                  {idx + 1}
                </td>
                <td className="py-1.5 px-2 border-r border-slate-300">
                  <div className="font-bold text-black leading-tight text-[11.5px] sm:text-[12.5px]">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-[10px] sm:text-[10.5px] text-slate-800 font-medium whitespace-pre-line leading-tight mt-0.5">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="py-1.5 px-1.5 text-center border-r border-slate-300 font-black text-black font-mono text-[11.5px] sm:text-[12px]">
                  {item.quantity}
                </td>
                <td className="py-1.5 px-1.5 text-center border-r border-slate-300 text-black font-semibold text-[10.5px] sm:text-[11px]">
                  {item.unit}
                </td>
                <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono font-bold text-black text-[11px] sm:text-[11.5px]">
                  {formatRupiah(item.unitPrice, false)}
                </td>
                <td className="py-1.5 px-2 text-right border-r border-slate-300 text-black font-mono font-semibold text-[10.5px] sm:text-[11px]">
                  {item.discountAmount > 0 ? (
                    <span className="text-rose-800 font-bold">
                      {formatRupiah(item.discountAmount, false)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-1.5 px-2 text-right font-black font-mono text-black text-[12px] sm:text-[12.5px]">
                  {formatRupiah(item.totalPrice, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. SUMMARY SECTION (Terbilang, Syarat & Ketentuan, Bank + Totals) */}
      <div className="mt-2 flex justify-between items-start gap-3 border-t-2 border-black pt-2">
        {/* Left Side (54%): Terbilang, Terms, Bank Info */}
        <div className="w-[54%] space-y-1.5">
          {/* Terbilang Box */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-300 text-[10.5px]">
            <div className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black leading-none mb-0.5">
              JUMLAH TERBILANG:
            </div>
            <div className="font-bold italic text-black leading-snug text-[11.5px] sm:text-[12px]">
              # {invoice.grandTotal !== undefined ? `${numberToTerbilang(invoice.grandTotal)} Rupiah` : (invoice.terbilang || 'Nol Rupiah')} #
            </div>
          </div>

          {/* Syarat & Ketentuan (Tepat mepet di bawah Jumlah Terbilang) */}
          {invoice.terms && (
            <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-300 text-[10px] sm:text-[10.5px] text-black leading-snug">
              <div className="font-black text-black uppercase text-[9px] sm:text-[9.5px] mb-0.5">
                Syarat &amp; Ketentuan:
              </div>
              <div className="whitespace-pre-line leading-snug font-medium">{invoice.terms}</div>
            </div>
          )}

          {/* Bank Account Transfer Info */}
          {invoice.showPaymentInfo !== false && currentBank && (
            <div className="p-2 bg-blue-50/80 rounded-lg border border-blue-300 text-[10px] sm:text-[10.5px] space-y-0.5 text-black">
              <div className="flex items-center justify-between border-b border-blue-200 pb-1 mb-1">
                <span className="font-black text-black uppercase text-[9.5px] sm:text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-800" />
                  <span>PEMBAYARAN TRANSFER</span>
                </span>
                <span className="text-[8.5px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded border border-blue-200">
                  Rekening Resmi
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 leading-tight">
                <span className="font-bold text-black text-[11px] sm:text-[11.5px]">
                  {currentBank.bankName} {currentBank.branch ? `(${currentBank.branch})` : ''}
                </span>
                <span className="font-black font-mono text-[12px] sm:text-[13px] text-black">
                  {currentBank.accountNumber}
                </span>
              </div>
              <div className="text-black font-medium text-[10px] sm:text-[10.5px] leading-tight">
                A.N. <strong className="text-black font-black">{currentBank.accountHolder}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Right Side (44%): Totals Calculation Table */}
        <div className="w-[44%] text-[11px] sm:text-[11.5px]">
          <table className="w-full text-right leading-tight">
            <tbody>
              <tr>
                <td className="text-black py-0.5 font-bold">
                  {invoice.taxCalculationType === 'inclusive' && invoice.isPpnActive
                    ? 'Subtotal (Inc. PPN):'
                    : 'Subtotal Produk/Jasa:'}
                </td>
                <td className="font-black font-mono text-black py-0.5 text-[11.5px] sm:text-[12px]">
                  {formatRupiah(invoice.subtotal)}
                </td>
              </tr>
              {invoice.invoiceDiscountAmount > 0 && (
                <tr>
                  <td className="text-rose-800 py-0.5 font-bold">Diskon Faktur:</td>
                  <td className="font-black font-mono text-rose-800 py-0.5 text-[11.5px] sm:text-[12px]">
                    - {formatRupiah(invoice.invoiceDiscountAmount)}
                  </td>
                </tr>
              )}
              {invoice.isPpnActive && (
                <>
                  <tr className="border-t border-slate-200">
                    <td className="text-black py-0.5 text-[10px] sm:text-[10.5px] font-semibold">DPP:</td>
                    <td className="font-bold font-mono text-black py-0.5 text-[10px] sm:text-[10.5px]">
                      {formatRupiah(invoice.taxableBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-black py-0.5 font-bold">
                      PPN ({invoice.ppnRate}%){invoice.taxCalculationType === 'inclusive' ? ' (Inc)' : ''}:
                    </td>
                    <td className="font-black font-mono text-black py-0.5 text-[11.5px] sm:text-[12px]">
                      {formatRupiah(invoice.ppnAmount)}
                    </td>
                  </tr>
                </>
              )}
              {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                <tr>
                  <td className="text-black py-0.5 font-bold">Bea Materai:</td>
                  <td className="font-black font-mono text-black py-0.5 text-[11.5px] sm:text-[12px]">
                    {formatRupiah(invoice.materaiAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-black bg-black text-white">
                <td className="py-1.5 px-2 text-[11px] sm:text-[12px] font-black uppercase text-left rounded-l">
                  TOTAL TAGIHAN:
                </td>
                <td className="py-1.5 px-2 text-[13.5px] sm:text-[15px] font-black font-mono text-right rounded-r">
                  {formatRupiah(invoice.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. COMPACT SIGNATURES: 2 SIGNATORIES (PENERIMA & HORMAT KAMI) */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-300 text-center text-[10.5px]">
        <div className="flex justify-between items-start px-4 sm:px-10">
          {/* 1. Signatory: Customer / Penerima */}
          <div className="w-36 sm:w-48 flex flex-col items-center">
            <div className="text-black font-black text-[11px] sm:text-[11.5px] uppercase tracking-wide">
              PENERIMA,
            </div>
            <div className="h-10 sm:h-12 flex items-end justify-center w-full">
              <div className="border-b-2 border-black w-32 sm:w-40" />
            </div>
            <div className="mt-1 text-center w-full">
              <div className="font-black text-black truncate px-0.5 text-[11.5px] sm:text-[12.5px]">
                ( {invoice.signatoryCustomerName || invoice.customerSnapshot?.name || invoice.customerSnapshot?.contactPerson || '................................'} )
              </div>
            </div>
          </div>

          {/* 2. Signatory: HORMAT KAMI (Filled with Sales / Company sender name) */}
          <div className="w-36 sm:w-48 flex flex-col items-center">
            <div className="text-black font-black text-[11px] sm:text-[11.5px] uppercase tracking-wide">
              HORMAT KAMI,
            </div>
            <div className="h-10 sm:h-12 flex items-center justify-center relative w-full">
              {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                <div className="border border-dashed border-slate-400 text-[8.5px] text-black font-bold px-2 py-0.5 rounded leading-none mb-1">
                  Materai Rp 10.000
                </div>
              )}
              <div className="border-b-2 border-black w-32 sm:w-40 absolute bottom-0" />
            </div>
            <div className="mt-1 text-center w-full">
              <div className="font-black text-black truncate px-0.5 text-[11.5px] sm:text-[12.5px]">
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

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  Edit,
  Building,
  CreditCard,
  Phone,
  Mail,
  Globe,
  Share2,
  CheckCircle,
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanInvNum = invoice.invoiceNumber.replace(/[\/\\]/g, '-');
      pdf.save(`${cleanInvNum}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    }
  };

  const currentBank =
    invoice.bankAccountSnapshot ||
    company.bankAccounts.find((b) => b.id === invoice.bankAccountId) ||
    company.bankAccounts[0];

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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Download PDF Langsung"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            title="Cetak via Printer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* A4 INVOICE SHEET CONTAINER */}
      <div className="bg-slate-100 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-white flex justify-center">
        <div
          ref={printAreaRef}
          id="invoice-document"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white p-8 sm:p-12 shadow-xl print:shadow-none print:p-8 text-slate-900 flex flex-col justify-between font-sans border border-slate-200 print:border-none"
          style={{ boxSizing: 'border-box' }}
        >
          <div>
            {/* 1. HEADER PERUSAHAAN & INVOICE BANNER */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
              {/* Left: Company Identity */}
              <div className="max-w-[55%]">
                <div className="flex items-center gap-3 mb-2">
                  {activeCompany.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt="Logo"
                      className="h-12 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-base">
                      MM
                    </div>
                  )}
                  <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                    {activeCompany.name}
                  </h1>
                </div>

                <div className="text-[11px] text-slate-600 leading-tight space-y-0.5">
                  <p>
                    {activeCompany.address} {activeCompany.rtRw ? `${activeCompany.rtRw}, ` : ''}
                    {activeCompany.village ? `${activeCompany.village}, ` : ''}
                    {activeCompany.district ? `${activeCompany.district}, ` : ''}
                    {activeCompany.city}, {activeCompany.province} {activeCompany.postalCode}
                  </p>
                  <p>
                    <span className="font-semibold">NPWP:</span> {activeCompany.npwp}
                  </p>
                  <p>
                    <span className="font-semibold">Telp:</span> {activeCompany.phone} |{' '}
                    <span className="font-semibold">Email:</span> {activeCompany.email}
                  </p>
                </div>
              </div>

              {/* Right: Invoice Title & Meta */}
              <div className="text-right">
                <div className="text-2xl font-black tracking-wider text-slate-900 uppercase">
                  INVOICE
                </div>
                <div className="text-sm font-bold text-blue-800 font-mono mt-0.5">
                  {invoice.invoiceNumber}
                </div>

                <table className="text-[11px] mt-2 text-right inline-table">
                  <tbody>
                    {invoice.poNumber && (
                      <tr>
                        <td className="text-slate-500 pr-2">No. PO:</td>
                        <td className="font-bold text-slate-800">{invoice.poNumber}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-slate-500 pr-2">Tanggal Invoice:</td>
                      <td className="font-semibold text-slate-800">
                        {formatShortDate(invoice.invoiceDate)}
                      </td>
                    </tr>
                    {invoice.deliveryDate && (
                      <tr>
                        <td className="text-slate-500 pr-2">Tgl Pengiriman:</td>
                        <td className="font-semibold text-slate-800">
                          {formatShortDate(invoice.deliveryDate)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-slate-500 pr-2">Jatuh Tempo:</td>
                      <td className="font-bold text-rose-700">
                        {formatShortDate(invoice.dueDate)}
                      </td>
                    </tr>
                    {invoice.salesChannel && (
                      <tr>
                        <td className="text-slate-500 pr-2">Sales Channel:</td>
                        <td className="text-slate-700">{invoice.salesChannel}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. BILL TO / CUSTOMER INFO SECTION */}
            <div className="my-5 grid grid-cols-2 gap-6 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80 text-[11px]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  TAGIHAN DITUJUKAN KEPADA:
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.name}
                </div>
                {invoice.customerSnapshot?.companyName && (
                  <div className="text-slate-700 font-medium">
                    Attn: {invoice.customerSnapshot?.name}
                  </div>
                )}
                <div className="text-slate-600 mt-1 leading-relaxed">
                  {invoice.customerSnapshot?.address}, {invoice.customerSnapshot?.city}{' '}
                  {invoice.customerSnapshot?.postalCode}
                </div>
              </div>

              <div className="text-right flex flex-col justify-end space-y-0.5 text-slate-600">
                {invoice.customerSnapshot?.npwp && (
                  <div>
                    <span className="font-semibold">NPWP Pelanggan:</span>{' '}
                    {invoice.customerSnapshot.npwp}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Telepon:</span>{' '}
                  {invoice.customerSnapshot?.phone || '-'}
                </div>
                {invoice.customerSnapshot?.email && (
                  <div>
                    <span className="font-semibold">Email:</span>{' '}
                    {invoice.customerSnapshot.email}
                  </div>
                )}
                {invoice.salesSnapshot && (
                  <div className="pt-1 text-slate-700">
                    <span className="font-semibold">Sales Representative:</span>{' '}
                    {invoice.salesSnapshot.name}
                  </div>
                )}
              </div>
            </div>

            {/* 3. TABLE ITEM RINCIAN */}
            <div className="mt-4">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 w-8 text-center border border-slate-900">No</th>
                    <th className="py-2.5 px-3 border border-slate-900">Deskripsi Barang & Jasa</th>
                    <th className="py-2.5 px-2 w-12 text-center border border-slate-900">Qty</th>
                    <th className="py-2.5 px-2 w-14 text-center border border-slate-900">Satuan</th>
                    <th className="py-2.5 px-3 w-28 text-right border border-slate-900">Harga Satuan</th>
                    <th className="py-2.5 px-3 w-20 text-right border border-slate-900">Diskon</th>
                    <th className="py-2.5 px-3 w-28 text-right border border-slate-900">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2.5 px-3 text-center border-x border-slate-200 text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-x border-slate-200">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[10px] text-slate-600 whitespace-pre-line mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center border-x border-slate-200 font-semibold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-center border-x border-slate-200 text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right border-x border-slate-200 font-mono text-slate-800">
                        {formatRupiah(item.unitPrice, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right border-x border-slate-200 text-slate-600">
                        {item.discountAmount > 0 ? (
                          <span className="text-rose-700">
                            {formatRupiah(item.discountAmount, false)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right border-x border-slate-200 font-bold font-mono text-slate-900">
                        {formatRupiah(item.totalPrice, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. SUMMARY / TOTALS SECTION */}
            <div className="mt-4 flex justify-between items-start gap-6 border-t-2 border-slate-800 pt-3">
              {/* Left Side: Terbilang Box & Bank Payment Details */}
              <div className="w-[55%] space-y-3">
                {/* Terbilang */}
                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-[11px]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    TERBILANG:
                  </div>
                  <div className="font-bold italic text-slate-800 leading-snug">
                    # {invoice.terbilang} #
                  </div>
                </div>

                {/* Bank Account Details */}
                {currentBank && (
                  <div className="p-2.5 bg-blue-50/50 rounded-md border border-blue-100 text-[10px] space-y-0.5 text-slate-700">
                    <div className="font-bold text-blue-900 uppercase text-[10px]">
                      PEMBAYARAN DITRANSFER KE:
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{currentBank.bankName}</span>{' '}
                      {currentBank.branch && `(${currentBank.branch})`}
                    </div>
                    <div className="font-bold font-mono text-xs text-blue-950">
                      No. Rekening: {currentBank.accountNumber}
                    </div>
                    <div>Atas Nama: <span className="font-semibold text-slate-900">{currentBank.accountHolder}</span></div>
                  </div>
                )}
              </div>

              {/* Right Side: Totals Calculation Table */}
              <div className="w-[42%] text-[11px]">
                <table className="w-full text-right">
                  <tbody>
                    <tr>
                      <td className="text-slate-600 py-1">Subtotal:</td>
                      <td className="font-bold font-mono text-slate-900 py-1">
                        {formatRupiah(invoice.subtotal)}
                      </td>
                    </tr>
                    {invoice.invoiceDiscountAmount > 0 && (
                      <tr>
                        <td className="text-rose-700 py-1">Diskon Tambahan:</td>
                        <td className="font-bold font-mono text-rose-700 py-1">
                          - {formatRupiah(invoice.invoiceDiscountAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.isPpnActive && (
                      <tr>
                        <td className="text-slate-600 py-1">PPN ({invoice.ppnRate}%):</td>
                        <td className="font-bold font-mono text-slate-900 py-1">
                          {formatRupiah(invoice.ppnAmount)}
                        </td>
                      </tr>
                    )}
                    {invoice.isMateraiActive && invoice.materaiAmount > 0 && (
                      <tr>
                        <td className="text-slate-600 py-1">Bea Materai:</td>
                        <td className="font-bold font-mono text-slate-900 py-1">
                          {formatRupiah(invoice.materaiAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-900">
                      <td className="py-2 text-xs font-black uppercase text-slate-900">
                        GRAND TOTAL:
                      </td>
                      <td className="py-2 text-sm font-black font-mono text-slate-950">
                        {formatRupiah(invoice.grandTotal)}
                      </td>
                    </tr>

                    {/* Paid & Balance if partial or paid */}
                    {invoice.amountPaid > 0 && (
                      <>
                        <tr className="border-t border-slate-200">
                          <td className="text-emerald-700 py-1 font-semibold">Telah Dibayar:</td>
                          <td className="font-bold font-mono text-emerald-700 py-1">
                            {formatRupiah(invoice.amountPaid)}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-amber-800 py-1 font-bold">Sisa Tagihan:</td>
                          <td className="font-bold font-mono text-amber-800 py-1">
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
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-600">
                {invoice.notes && (
                  <div>
                    <div className="font-bold text-slate-800 uppercase text-[9px] mb-0.5">
                      Catatan:
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{invoice.notes}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
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
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px]">
            <div className="grid grid-cols-3 gap-4">
              {/* Signatory 1: Customer */}
              <div>
                <div className="text-slate-600 font-medium">Penerima / Pelanggan,</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-slate-400 w-36" />
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  ( {invoice.signatoryCustomerName || '...............................'} )
                </div>
              </div>

              {/* Signatory 2: Sales */}
              <div>
                <div className="text-slate-600 font-medium">Hormat Kami,</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-slate-400 w-36" />
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  ( {invoice.signatorySalesName || invoice.salesSnapshot?.name || 'Budi Prasetyo, S.Kom'} )
                </div>
              </div>

              {/* Signatory 3: Director / Finance */}
              <div>
                <div className="text-slate-600 font-medium">Mengetahui (Pimpinan),</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-slate-400 w-36" />
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  ( {invoice.signatoryFinanceName || 'Ahmad Miza, S.T.'} )
                </div>
              </div>
            </div>

            {/* Document Footer Note */}
            <div className="mt-6 pt-2 border-t border-slate-100 text-[9px] text-slate-400 flex justify-between">
              <span>Dokumen resmi ini dicetak secara sah oleh sistem CV. MIZA MEDIATAMA</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

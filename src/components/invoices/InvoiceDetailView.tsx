import React from 'react';
import {
  FileText,
  ArrowLeft,
  Printer,
  Download,
  CreditCard,
  Building,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { Invoice, Payment, RoleType, CompanySetting } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  formatShortDate,
  numberToTerbilang,
} from '../../services/calculation';
import { StatusBadge } from '../common/Badge';
import { initialCompany } from '../../services/initialData';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  payments: Payment[];
  userRole: RoleType;
  company?: CompanySetting;
  onBack: () => void;
  onPreviewPrint: () => void;
  onRecordPayment: () => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  payments,
  userRole,
  company = initialCompany,
  onBack,
  onPreviewPrint,
  onRecordPayment,
}) => {
  const activeCompany = company || initialCompany;
  const isManager = userRole === 'manager';
  const relatedPayments = payments.filter((p) => p.invoiceId === invoice.id);
  const companySlogan = activeCompany.tagline?.trim() || initialCompany.tagline;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Company Branding & Slogan Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {activeCompany.logoUrl ? (
            <img
              src={activeCompany.logoUrl}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0">
              {activeCompany.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight leading-tight">
              {activeCompany.name}
            </h2>
            {companySlogan && (
              <p className="text-xs text-indigo-200 font-medium italic mt-0.5">
                "{companySlogan}"
              </p>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-300 sm:text-right">
          <span className="text-slate-400">NPWP: </span>
          <span className="font-mono font-medium text-white">{activeCompany.npwp || '-'}</span>
          <span className="hidden sm:inline mx-1.5">•</span>
          <span className="text-slate-400">Telp: </span>
          <span className="text-white">{activeCompany.phone}</span>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diterbitkan pada {formatIndonesianDate(invoice.invoiceDate)} oleh{' '}
              {invoice.createdByName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={onPreviewPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Faktur (A4)</span>
          </button>

          {invoice.remainingBalance > 0 && invoice.status !== 'cancelled' && !isManager && (
            <button
              onClick={onRecordPayment}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Catat Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-slate-500">Nilai Grand Total</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatRupiah(invoice.grandTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sudah termasuk PPN & Diskon</div>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-xs font-semibold text-emerald-700">Telah Dibayar (Masuk)</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            {formatRupiah(invoice.amountPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {relatedPayments.length} kali pencatatan pembayaran
          </div>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-xs font-semibold text-amber-700">Sisa Tagihan (Piutang)</span>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
            {formatRupiah(invoice.remainingBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Jatuh tempo: <span className="font-semibold">{formatShortDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>

      {/* Terbilang Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Jumlah Terbilang:
        </div>
        <div className="font-bold italic text-slate-800 text-sm">
          # {invoice.grandTotal !== undefined ? `${numberToTerbilang(invoice.grandTotal)} Rupiah` : (invoice.terbilang || 'Nol Rupiah')} #
        </div>
      </div>

      {/* Customer & Invoice Meta Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Data Pelanggan</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.name}
          </div>
          {invoice.customerSnapshot?.companyName && (
            <div className="text-slate-600">Attn: {invoice.customerSnapshot?.name}</div>
          )}
          <div className="text-slate-500 leading-relaxed">
            {invoice.customerSnapshot?.address}, {invoice.customerSnapshot?.city}{' '}
            {invoice.customerSnapshot?.postalCode}
          </div>
          <div className="pt-2 text-slate-600 space-y-0.5 border-t border-slate-100">
            <div>NPWP: {invoice.customerSnapshot?.npwp || '-'}</div>
            <div>Telepon: {invoice.customerSnapshot?.phone || '-'}</div>
            <div>Email: {invoice.customerSnapshot?.email || '-'}</div>
          </div>
        </div>

        {/* Invoice Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Rincian Metadata Tagihan</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-slate-400 block">No. PO:</span>
              <span className="font-bold text-slate-800">{invoice.poNumber || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Sales Channel:</span>
              <span className="font-medium text-slate-800">{invoice.salesChannel || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tanggal Terbit:</span>
              <span className="font-medium text-slate-800">{formatShortDate(invoice.invoiceDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Jatuh Tempo:</span>
              <span className="font-bold text-rose-700">{formatShortDate(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Sales In Charge:</span>
              <span className="font-medium text-slate-800">{invoice.salesSnapshot?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Status:</span>
              <div className="mt-0.5"><StatusBadge status={invoice.status} size="sm" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          Daftar Barang & Jasa ({invoice.items.length} Item)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">Nama Barang/Jasa & Deskripsi</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Harga Satuan</th>
                <th className="py-3 px-4 text-right">Diskon</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatRupiah(item.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {item.discountAmount > 0 ? `- ${formatRupiah(item.discountAmount)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                    {formatRupiah(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Log against this invoice */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Histori Pembayaran Masuk ({relatedPayments.length})</span>
          </div>

          {invoice.remainingBalance > 0 && invoice.status !== 'cancelled' && !isManager && (
            <button
              onClick={onRecordPayment}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pembayaran</span>
            </button>
          )}
        </div>

        {relatedPayments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada pembayaran dicatat untuk invoice ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">No. Bukti Bayar</th>
                  <th className="py-2.5 px-3">Tanggal Bayar</th>
                  <th className="py-2.5 px-3">Metode & Rekening</th>
                  <th className="py-2.5 px-3">No. Referensi / Catatan</th>
                  <th className="py-2.5 px-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>
                    <td className="py-2.5 px-3">{formatIndonesianDate(p.paymentDate)}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      {p.bankAccountInfo && (
                        <div className="text-[11px] text-slate-500">{p.bankAccountInfo}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.referenceNumber && (
                        <div className="font-mono text-slate-800">Ref: {p.referenceNumber}</div>
                      )}
                      <div>{p.notes || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                      {formatRupiah(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

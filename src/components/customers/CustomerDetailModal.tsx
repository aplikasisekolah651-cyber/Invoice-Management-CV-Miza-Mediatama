import React from 'react';
import { X, Building, Phone, Mail, MapPin, FileText, CreditCard, ExternalLink } from 'lucide-react';
import { Customer, Invoice, Payment } from '../../types';
import { formatRupiah, formatShortDate } from '../../services/calculation';
import { StatusBadge } from '../common/Badge';

interface CustomerDetailModalProps {
  customer: Customer | null;
  invoices: Invoice[];
  payments: Payment[];
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  invoices,
  payments,
  isOpen,
  onClose,
  onViewInvoice,
}) => {
  if (!isOpen || !customer) return null;

  const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
  const totalBilled = customerInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalPaid = customerInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalRemaining = customerInvoices.reduce((acc, i) => acc + i.remainingBalance, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">
                {customer.companyName || customer.name}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  customer.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {customer.isActive ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>
            {customer.companyName && (
              <p className="text-slate-500 font-medium">Attn: {customer.name}</p>
            )}
            <p className="text-[11px] text-slate-400 font-mono">Kode: {customer.code}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] text-slate-500">Total Transaksi</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {formatRupiah(totalBilled)}
            </div>
            <span className="text-[10px] text-slate-400">{customerInvoices.length} invoice</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
            <span className="text-[11px] text-emerald-800">Total Dibayar</span>
            <div className="font-bold text-emerald-900 text-sm mt-0.5">
              {formatRupiah(totalPaid)}
            </div>
            <span className="text-[10px] text-emerald-700">Lunas / Kas Masuk</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl">
            <span className="text-[11px] text-amber-800">Sisa Piutang</span>
            <div className="font-bold text-amber-900 text-sm mt-0.5">
              {formatRupiah(totalRemaining)}
            </div>
            <span className="text-[10px] text-amber-700">Belum Tertagih</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 font-medium block">Alamat Kantor:</span>
            <span className="text-slate-800 leading-relaxed font-medium">
              {customer.address}, {customer.city} {customer.postalCode}
            </span>
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-slate-400">Telepon / WA:</span>{' '}
              <span className="font-bold text-slate-900">{customer.phone || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400">Email:</span>{' '}
              <span className="text-slate-800">{customer.email || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400">NPWP:</span>{' '}
              <span className="font-mono text-slate-800">{customer.npwp || '-'}</span>
            </div>
          </div>
        </div>

        {/* Invoice list for this customer */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>Daftar Invoice ({customerInvoices.length})</span>
          </h4>
          {customerInvoices.length === 0 ? (
            <div className="py-6 text-center text-slate-400 border border-dashed rounded-xl">
              Belum ada transaksi invoice untuk pelanggan ini.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">No Invoice</th>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Grand Total</th>
                    <th className="p-2.5 text-right">Sisa</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold font-mono text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-2.5 text-slate-600">{formatShortDate(inv.invoiceDate)}</td>
                      <td className="p-2.5">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRupiah(inv.grandTotal)}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-amber-800">
                        {formatRupiah(inv.remainingBalance)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            onClose();
                            onViewInvoice(inv.id);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Buka Invoice"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

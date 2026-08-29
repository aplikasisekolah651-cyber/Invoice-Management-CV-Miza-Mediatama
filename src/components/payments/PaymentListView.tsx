import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Calendar,
  DollarSign,
  Trash2,
  Receipt,
  Building,
  CheckCircle2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Payment, Invoice, RoleType } from '../../types';
import { formatRupiah, formatShortDate, formatIndonesianDate } from '../../services/calculation';
import { ExportService } from '../../services/exportService';
import { Pagination } from '../common/Pagination';

interface PaymentListViewProps {
  payments: Payment[];
  invoices: Invoice[];
  userRole: RoleType;
  onOpenRecordPayment: (invoice?: Invoice) => void;
  onDeletePayment: (payment: Payment) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const PaymentListView: React.FC<PaymentListViewProps> = ({
  payments,
  invoices,
  userRole,
  onOpenRecordPayment,
  onDeletePayment,
  onViewInvoice,
}) => {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected payment for receipt preview modal
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pNum = p.paymentNumber?.toLowerCase() || '';
        const invNum = p.invoiceNumber?.toLowerCase() || '';
        const custName = p.customerName?.toLowerCase() || '';
        const refNum = p.referenceNumber?.toLowerCase() || '';

        if (
          !pNum.includes(q) &&
          !invNum.includes(q) &&
          !custName.includes(q) &&
          !refNum.includes(q)
        ) {
          return false;
        }
      }
      if (dateStart && p.paymentDate < dateStart) return false;
      if (dateEnd && p.paymentDate > dateEnd) return false;
      return true;
    });
  }, [payments, methodFilter, searchQuery, dateStart, dateEnd]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalAmountFiltered = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleExportExcel = () => {
    ExportService.exportPaymentsToExcel(
      filteredPayments,
      `Histori_Pembayaran_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pencatatan Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Histori kas masuk, transfer bank, dan pelunasan piutang pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {!isManager && (
            <button
              onClick={() => onOpenRecordPayment()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Pembayaran Masuk</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            {formatRupiah(totalAmountFiltered)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {filteredPayments.length} transaksi penerimaan dana
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Metode Terpopuler</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            Transfer Bank
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            BCA, Mandiri, dan BPD DIY
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Rata-rata Transaksi</span>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {filteredPayments.length > 0
              ? formatRupiah(Math.round(totalAmountFiltered / filteredPayments.length))
              : 'Rp 0'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Per bukti pembayaran</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari bukti bayar, no invoice, pelanggan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Metode Bayar</option>
            <option value="Transfer Bank">Transfer Bank</option>
            <option value="Cash">Tunai / Cash</option>
            <option value="QRIS">QRIS</option>
            <option value="Giro/Cek">Bilyet Giro / Cek</option>
            <option value="E-Wallet">E-Wallet</option>
          </select>

          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateStart}
              onChange={(e) => {
                setDateStart(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none"
            />
            <span>-</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => {
                setDateEnd(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">No. Bukti Bayar</th>
                <th className="py-3.5 px-4">Invoice Terkait</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Tanggal Bayar</th>
                <th className="py-3.5 px-4">Metode & Info Rekening</th>
                <th className="py-3.5 px-4 text-right">Jumlah Diterima</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada riwayat pembayaran</p>
                    <p className="text-xs text-slate-400">
                      Catat pembayaran pertama dari invoice tagihan.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-700">
                      {p.paymentNumber}
                      {p.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Ref: {p.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onViewInvoice(p.invoiceId)}
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{p.invoiceNumber}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {formatShortDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                      {p.bankAccountInfo && (
                        <div className="text-[11px] text-slate-500">{p.bankAccountInfo}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono whitespace-nowrap text-sm">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Lihat Kuitansi / Bukti Bayar"
                        >
                          Kuitansi
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onDeletePayment(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pembayaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[10, 20, 50, 100]}
          itemLabel="pembayaran"
        />
      </div>

      {/* Kuitansi / Receipt Modal Preview */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Kuitansi Pembayaran Sah</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-900 font-semibold">No. Bukti Bayar:</span>
                <span className="font-bold font-mono text-emerald-950">{selectedReceipt.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Tanggal:</span>
                <span className="font-semibold text-emerald-950">{formatIndonesianDate(selectedReceipt.paymentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Telah Terima Dari:</span>
                <span className="font-bold text-emerald-950">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Untuk Pembayaran:</span>
                <span className="font-semibold text-emerald-950">Invoice {selectedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-900">Metode:</span>
                <span className="font-semibold text-emerald-950">{selectedReceipt.paymentMethod}</span>
              </div>
              {selectedReceipt.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-emerald-900">No. Ref:</span>
                  <span className="font-mono text-emerald-950">{selectedReceipt.referenceNumber}</span>
                </div>
              )}
              <div className="pt-2 border-t border-emerald-200/80 flex justify-between items-center">
                <span className="font-bold text-emerald-950 uppercase text-xs">JUMLAH:</span>
                <span className="text-base font-black text-emerald-900 font-mono">
                  {formatRupiah(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Diterima dan dicatat resmi oleh {selectedReceipt.createdByName}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

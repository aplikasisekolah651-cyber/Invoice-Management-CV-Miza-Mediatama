import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Copy,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Ban,
  Calendar,
  DollarSign,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Clock,
  FileCheck,
} from 'lucide-react';
import { Invoice, InvoiceStatus, RoleType, Customer } from '../../types';
import { formatRupiah, formatShortDate } from '../../services/calculation';
import { StatusBadge } from '../common/Badge';
import { ExportService } from '../../services/exportService';

interface InvoiceListViewProps {
  invoices: Invoice[];
  customers?: Customer[];
  salesList?: any[];
  userRole: RoleType;
  onNavigate?: (view: any, data?: any) => void;
  onCreateInvoice?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onOpenRecordPayment?: (invoice: Invoice) => void;
  onDuplicateInvoice?: (invoice: Invoice) => void;
  onCancelInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  invoices,
  customers = [],
  salesList = [],
  userRole,
  onNavigate,
  onCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onPreviewInvoice,
  onRecordPayment,
  onOpenRecordPayment,
  onDuplicateInvoice,
  onCancelInvoice,
  onDeleteInvoice,
}) => {
  const isAdmin = userRole === 'admin';
  const isOperator = userRole === 'operator';
  const isManager = userRole === 'manager';

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const handleCreate = () => {
    if (onCreateInvoice) {
      onCreateInvoice();
    } else if (onNavigate) {
      onNavigate('invoice_create');
    }
  };

  const handlePreview = (inv: Invoice) => {
    if (onPreviewInvoice) {
      onPreviewInvoice(inv);
    } else if (onNavigate) {
      onNavigate('invoice_print', inv);
    }
  };

  const handleDetail = (inv: Invoice) => {
    if (onViewInvoice) {
      onViewInvoice(inv);
    } else if (onNavigate) {
      onNavigate('invoice_detail', inv);
    }
  };

  const handleEdit = (inv: Invoice) => {
    if (onEditInvoice) {
      onEditInvoice(inv);
    } else if (onNavigate) {
      onNavigate('invoice_edit', inv);
    }
  };

  const handlePayment = (inv: Invoice) => {
    if (onOpenRecordPayment) {
      onOpenRecordPayment(inv);
    } else if (onRecordPayment) {
      onRecordPayment(inv);
    } else if (onNavigate) {
      onNavigate('invoice_payment', inv);
    }
  };

  const handleDuplicate = (inv: Invoice) => {
    if (onDuplicateInvoice) {
      onDuplicateInvoice(inv);
    }
  };

  const handleCancel = (inv: Invoice) => {
    if (onCancelInvoice) {
      onCancelInvoice(inv);
    }
  };

  const handleDelete = (inv: Invoice) => {
    if (onDeleteInvoice) {
      onDeleteInvoice(inv);
    }
  };

  // Filter tabs definition
  const tabs = [
    { id: 'all', label: 'Semua Invoice', count: invoices.length },
    { id: 'draft', label: 'Draft', count: invoices.filter((i) => i.status === 'draft').length },
    { id: 'sent', label: 'Terkirim (Sent)', count: invoices.filter((i) => i.status === 'sent').length },
    { id: 'partial', label: 'Sebagian (Partial)', count: invoices.filter((i) => i.status === 'partial').length },
    { id: 'paid', label: 'Lunas (Paid)', count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'overdue', label: 'Jatuh Tempo (Overdue)', count: invoices.filter((i) => i.status === 'overdue').length },
    { id: 'cancelled', label: 'Dibatalkan', count: invoices.filter((i) => i.status === 'cancelled').length },
  ];

  // Filtering logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (activeTab !== 'all' && inv.status !== activeTab) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invNum = inv.invoiceNumber?.toLowerCase() || '';
        const poNum = inv.poNumber?.toLowerCase() || '';
        const custName = (inv.customerSnapshot?.name || '').toLowerCase();
        const compName = (inv.customerSnapshot?.companyName || '').toLowerCase();
        const salesName = (inv.salesSnapshot?.name || '').toLowerCase();

        if (
          !invNum.includes(q) &&
          !poNum.includes(q) &&
          !custName.includes(q) &&
          !compName.includes(q) &&
          !salesName.includes(q)
        ) {
          return false;
        }
      }

      // Date range filter
      if (dateFilterStart && inv.invoiceDate < dateFilterStart) {
        return false;
      }
      if (dateFilterEnd && inv.invoiceDate > dateFilterEnd) {
        return false;
      }

      return true;
    });
  }, [invoices, activeTab, searchQuery, dateFilterStart, dateFilterEnd]);

  // Tab Summary metrics
  const totalAmountFiltered = filteredInvoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((a, b) => a + b.grandTotal, 0);
  const totalPaidFiltered = filteredInvoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((a, b) => a + b.amountPaid, 0);
  const totalRemainingFiltered = filteredInvoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((a, b) => a + b.remainingBalance, 0);

  const handleExportExcel = () => {
    ExportService.exportInvoicesToExcel(
      filteredInvoices,
      `Daftar_Invoice_CV_Miza_${activeTab.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Invoice Tagihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pembuatan faktur, pelacakan pembayaran, dan penerbitan dokumen tagihan
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Export data invoice ke format Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {!isManager && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Invoice Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no invoice, customer, PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tgl:</span>
            <input
              type="date"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              className="text-xs bg-transparent focus:outline-none"
            />
            <span>s/d</span>
            <input
              type="date"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              className="text-xs bg-transparent focus:outline-none"
            />
          </div>

          {(searchQuery || dateFilterStart || dateFilterEnd) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilterStart('');
                setDateFilterEnd('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Filtered Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-400">Total Nilai Tagihan:</span>
          <span className="font-bold text-sm text-blue-300">{formatRupiah(totalAmountFiltered)}</span>
        </div>
        <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
          <span className="text-xs text-slate-400">Telah Dibayar (Masuk):</span>
          <span className="font-bold text-sm text-emerald-400">{formatRupiah(totalPaidFiltered)}</span>
        </div>
        <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0">
          <span className="text-xs text-slate-400">Sisa Piutang Berjalan:</span>
          <span className="font-bold text-sm text-amber-400">{formatRupiah(totalRemainingFiltered)}</span>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Invoice & PO</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Tanggal / Tempo</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Dibayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Belum ada invoice ditemukan</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery || dateFilterStart || dateFilterEnd
                          ? 'Coba sesuaikan kata kunci pencarian atau rentang tanggal filter'
                          : 'Mulai buat invoice pertama untuk pelanggan Anda.'}
                      </p>
                      {!isManager && (
                        <button
                          onClick={handleCreate}
                          className="mt-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs shadow-sm cursor-pointer"
                        >
                          + Buat Invoice Baru
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isLocked = inv.status === 'paid' || inv.status === 'cancelled';
                  const canEdit = !isLocked || isAdmin;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleDetail(inv)}
                          className="font-bold text-blue-600 hover:text-blue-800 text-left cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </button>
                        {inv.poNumber ? (
                          <div className="text-[11px] text-slate-500 font-mono">
                            PO: {inv.poNumber}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Tanpa PO</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                        </div>
                        {inv.customerSnapshot?.companyName && inv.customerSnapshot?.name && (
                          <div className="text-[11px] text-slate-500">
                            Attn: {inv.customerSnapshot.name}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {inv.customerSnapshot?.city || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{formatShortDate(inv.invoiceDate)}</div>
                        <div className="text-[11px] text-slate-400">
                          Due: {formatShortDate(inv.dueDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-medium whitespace-nowrap">
                        {formatRupiah(inv.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {inv.remainingBalance > 0 ? (
                          <span className="font-bold text-amber-700">
                            {formatRupiah(inv.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Preview / Cetak */}
                          <button
                            onClick={() => handlePreview(inv)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview & Cetak A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Detail view */}
                          <button
                            onClick={() => handleDetail(inv)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Detail & Histori Pembayaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Record Payment */}
                          {inv.remainingBalance > 0 && inv.status !== 'cancelled' && !isManager && (
                            <button
                              onClick={() => handlePayment(inv)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Catat Pembayaran Masuk"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {canEdit && !isManager && (
                            <button
                              onClick={() => handleEdit(inv)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Invoice"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Duplicate */}
                          {!isManager && (
                            <button
                              onClick={() => handleDuplicate(inv)}
                              className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Duplikat Invoice Ini"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          {/* Void / Cancel */}
                          {inv.status !== 'cancelled' && !isManager && (
                            <button
                              onClick={() => handleCancel(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan (Void) Invoice"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

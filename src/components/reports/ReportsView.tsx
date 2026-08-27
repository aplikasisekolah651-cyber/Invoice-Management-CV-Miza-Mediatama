import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Calendar,
  Download,
  DollarSign,
  Building,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  Invoice,
  Payment,
  Customer,
  Product,
  ServiceItem,
  SalesPerson,
  AuditLog,
  RoleType,
} from '../../types';
import {
  formatRupiah,
  formatShortDate,
  formatIndonesianDate,
} from '../../services/calculation';
import { ExportService } from '../../services/exportService';

interface ReportsViewProps {
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  products: Product[];
  services: ServiceItem[];
  salesList: SalesPerson[];
  auditLogs: AuditLog[];
  userRole: RoleType;
  onViewInvoice: (invoiceId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  payments,
  customers,
  products,
  services,
  salesList,
  auditLogs,
  userRole,
  onViewInvoice,
}) => {
  const [reportTab, setReportTab] = useState<
    'sales' | 'aging' | 'cash' | 'products' | 'audit'
  >('sales');

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [selectedSalesId, setSelectedSalesId] = useState('all');

  // Filtered invoices for sales report
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === 'cancelled') return false;
      if (selectedCustomerId !== 'all' && inv.customerId !== selectedCustomerId) return false;
      if (selectedSalesId !== 'all' && inv.salesId !== selectedSalesId) return false;
      if (dateStart && inv.invoiceDate < dateStart) return false;
      if (dateEnd && inv.invoiceDate > dateEnd) return false;
      return true;
    });
  }, [invoices, selectedCustomerId, selectedSalesId, dateStart, dateEnd]);

  // Sales totals
  const totalOmzet = filteredInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalPPN = filteredInvoices.reduce((acc, i) => acc + (i.isPpnActive ? i.ppnAmount : 0), 0);
  const totalDiscount = filteredInvoices.reduce((acc, i) => acc + i.invoiceDiscountAmount, 0);
  const totalCollected = filteredInvoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalReceivables = filteredInvoices.reduce((acc, i) => acc + i.remainingBalance, 0);

  // --- AGING RECEIVABLES CALCULATION ---
  const agingData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current: Invoice[] = [];
    const overdue1to30: Invoice[] = [];
    const overdue31to60: Invoice[] = [];
    const overdueOver60: Invoice[] = [];

    invoices.forEach((inv) => {
      if (inv.remainingBalance <= 0 || inv.status === 'cancelled') return;

      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current.push(inv);
      } else if (diffDays <= 30) {
        overdue1to30.push(inv);
      } else if (diffDays <= 60) {
        overdue31to60.push(inv);
      } else {
        overdueOver60.push(inv);
      }
    });

    const sumBalance = (list: Invoice[]) => list.reduce((acc, i) => acc + i.remainingBalance, 0);

    return {
      current,
      currentTotal: sumBalance(current),
      overdue1to30,
      overdue1to30Total: sumBalance(overdue1to30),
      overdue31to60,
      overdue31to60Total: sumBalance(overdue31to60),
      overdueOver60,
      overdueOver60Total: sumBalance(overdueOver60),
      grandTotalReceivables:
        sumBalance(current) +
        sumBalance(overdue1to30) +
        sumBalance(overdue31to60) +
        sumBalance(overdueOver60),
    };
  }, [invoices]);

  // Cash flow payments filtered
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (dateStart && p.paymentDate < dateStart) return false;
      if (dateEnd && p.paymentDate > dateEnd) return false;
      return true;
    });
  }, [payments, dateStart, dateEnd]);

  const totalCashCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  // Top products performance calculation
  const productPerformance = useMemo(() => {
    const map = new Map<string, { name: string; code: string; qty: number; revenue: number }>();
    invoices.forEach((inv) => {
      if (inv.status === 'cancelled') return;
      inv.items.forEach((item) => {
        const key = item.name;
        const curr = map.get(key) || { name: item.name, code: item.code || '', qty: 0, revenue: 0 };
        curr.qty += item.quantity;
        curr.revenue += item.totalPrice;
        map.set(key, curr);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [invoices]);

  // Handle excel export of currently selected report
  const handleExportCurrentReport = () => {
    if (reportTab === 'sales') {
      ExportService.exportInvoicesToExcel(
        filteredInvoices,
        `Laporan_Penjualan_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } else if (reportTab === 'cash') {
      ExportService.exportPaymentsToExcel(
        filteredPayments,
        `Laporan_Kas_Masuk_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } else if (reportTab === 'aging') {
      const allOverdue = [
        ...agingData.current,
        ...agingData.overdue1to30,
        ...agingData.overdue31to60,
        ...agingData.overdueOver60,
      ];
      ExportService.exportInvoicesToExcel(
        allOverdue,
        `Laporan_Aging_Piutang_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } else if (reportTab === 'products') {
      ExportService.exportProductsToExcel(
        products,
        `Laporan_Katalog_Barang_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Laporan Keuangan & Analitik Bisnis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi penjualan, umur piutang (Aging AR), arus kas, dan jejak audit
          </p>
        </div>

        <button
          onClick={handleExportCurrentReport}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all self-start sm:self-center cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Laporan Ini (.xlsx)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setReportTab('sales')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            reportTab === 'sales'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Laporan Penjualan (Omzet)</span>
        </button>

        <button
          onClick={() => setReportTab('aging')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            reportTab === 'aging'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Umur Piutang (Aging AR)</span>
        </button>

        <button
          onClick={() => setReportTab('cash')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            reportTab === 'cash'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Arus Kas & Pembayaran</span>
        </button>

        <button
          onClick={() => setReportTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            reportTab === 'products'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performa Barang & Jasa</span>
        </button>

        <button
          onClick={() => setReportTab('audit')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            reportTab === 'audit'
              ? 'border-slate-800 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Log Aktivitas</span>
        </button>
      </div>

      {/* GLOBAL FILTER BAR (Except for Audit) */}
      {reportTab !== 'audit' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Filter Periode:</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
              <span>s/d</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
            </div>
            {(dateStart || dateEnd) && (
              <button
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                }}
                className="text-slate-400 hover:text-slate-600 font-semibold"
              >
                Reset Tanggal
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Pelanggan</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
            >
              <option value="all">Semua Sales</option>
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: LAPORAN PENJUALAN */}
      {reportTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Omzet Penjualan</span>
              <div className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">
                {formatRupiah(totalOmzet)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {filteredInvoices.length} Faktur Tagihan
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total PPN 11% / 12%</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                {formatRupiah(totalPPN)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Kewajiban Faktur Pajak</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700">Sudah Diterima (Lunas)</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                {formatRupiah(totalCollected)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {(totalOmzet > 0 ? (totalCollected / totalOmzet) * 100 : 0).toFixed(1)}% tertagih
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-amber-700">Sisa Piutang (Belum Masuk)</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
                {formatRupiah(totalReceivables)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Outstanding Piutang B2B</div>
            </div>
          </div>

          {/* Detailed Invoices Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Rincian Transaksi Penjualan ({filteredInvoices.length} Invoice)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">No</th>
                    <th className="py-3.5 px-4">No. Invoice</th>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Pelanggan</th>
                    <th className="py-3.5 px-4">Sales</th>
                    <th className="py-3.5 px-4 text-right">Subtotal</th>
                    <th className="py-3.5 px-4 text-right">PPN</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-right">Terbayar</th>
                    <th className="py-3.5 px-4 text-right">Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        <button
                          onClick={() => onViewInvoice(inv.id)}
                          className="hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {formatShortDate(inv.invoiceDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.salesSnapshot?.name || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(inv.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(inv.ppnAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        {formatRupiah(inv.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-800">
                        {formatRupiah(inv.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGING PIUTANG */}
      {reportTab === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">
                Belum Jatuh Tempo (Current)
              </span>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {formatRupiah(agingData.currentTotal)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {agingData.current.length} Invoice normal
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/30">
              <span className="text-xs font-semibold text-amber-800">
                Terlambat 1 - 30 Hari
              </span>
              <div className="text-xl font-bold text-amber-900 mt-1">
                {formatRupiah(agingData.overdue1to30Total)}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {agingData.overdue1to30.length} Invoice perlu follow-up
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/30">
              <span className="text-xs font-semibold text-orange-800">
                Terlambat 31 - 60 Hari
              </span>
              <div className="text-xl font-bold text-orange-900 mt-1">
                {formatRupiah(agingData.overdue31to60Total)}
              </div>
              <div className="text-[11px] text-orange-700 mt-0.5">
                {agingData.overdue31to60.length} Invoice kritis
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-xs font-semibold text-rose-800">
                Terlambat &gt; 60 Hari (Macet)
              </span>
              <div className="text-xl font-bold text-rose-900 mt-1">
                {formatRupiah(agingData.overdueOver60Total)}
              </div>
              <div className="text-[11px] text-rose-700 mt-0.5">
                {agingData.overdueOver60.length} Invoice risiko tinggi
              </div>
            </div>
          </div>

          {/* Overdue Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Daftar Tagihan Menunggak & Piutang Berjalan
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">No. Invoice</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right">Sisa Piutang</th>
                    <th className="py-3 px-4 text-center">Status Umur</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ...agingData.overdueOver60.map((i) => ({ ...i, bucket: '> 60 Hari (Macet)', badgeClass: 'bg-rose-100 text-rose-800' })),
                    ...agingData.overdue31to60.map((i) => ({ ...i, bucket: '31 - 60 Hari', badgeClass: 'bg-orange-100 text-orange-800' })),
                    ...agingData.overdue1to30.map((i) => ({ ...i, bucket: '1 - 30 Hari', badgeClass: 'bg-amber-100 text-amber-800' })),
                    ...agingData.current.map((i) => ({ ...i, bucket: 'Current (Belum Jatuh Tempo)', badgeClass: 'bg-blue-100 text-blue-800' })),
                  ].map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        {formatShortDate(inv.dueDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        {formatRupiah(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                        {formatRupiah(inv.remainingBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.badgeClass}`}>
                          {inv.bucket}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewInvoice(inv.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Buka
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ARUS KAS / PEMBAYARAN */}
      {reportTab === 'cash' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">
                Total Realisasi Kas Masuk (Penerimaan)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {formatRupiah(totalCashCollected)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {filteredPayments.length} kali transaksi pembayaran
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Buku Kas Penerimaan Pembayaran
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">No. Bukti</th>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatIndonesianDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-bold text-blue-700">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-900 font-medium">{p.customerName}</td>
                      <td className="py-3 px-4">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatRupiah(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMA BARANG & JASA */}
      {reportTab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Rangking Produk & Jasa Paling Laris (Berdasarkan Nilai Penjualan)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Barang / Jasa</th>
                    <th className="py-3.5 px-4 text-center">Total Qty Terjual</th>
                    <th className="py-3.5 px-4 text-right">Kontribusi Omzet (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productPerformance.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {item.qty} unit
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-900 text-sm">
                        {formatRupiah(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {reportTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Log Jejak Audit Sistem ({auditLogs.length} Entri)</span>
            <span className="text-xs font-normal text-slate-500">
              Merekam setiap aksi pembuatan, edit, dan hapus data secara transparan
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-36">Waktu Transaksi</th>
                  <th className="py-3.5 px-4">Operator / User</th>
                  <th className="py-3.5 px-4">Aksi</th>
                  <th className="py-3.5 px-4">Modul Entitas</th>
                  <th className="py-3.5 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'create'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'update'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

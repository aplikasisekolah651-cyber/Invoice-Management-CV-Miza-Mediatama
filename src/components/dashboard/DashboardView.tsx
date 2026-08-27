import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Receipt,
  Calendar,
  CreditCard,
  Building,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Invoice, Payment, RoleType, Customer, Product, ServiceItem } from '../../types';
import { formatRupiah, formatShortDate, formatIndonesianDate } from '../../services/calculation';
import { StatusBadge } from '../common/Badge';

interface DashboardViewProps {
  invoices: Invoice[];
  payments: Payment[];
  customers?: Customer[];
  products?: Product[];
  services?: ServiceItem[];
  userRole: RoleType;
  onNavigate?: (view: any, data?: any) => void;
  onCreateInvoice?: () => void;
  onViewAllInvoices?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onOpenRecordPayment?: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  payments,
  customers = [],
  products = [],
  services = [],
  userRole,
  onNavigate,
  onCreateInvoice,
  onViewAllInvoices,
  onViewInvoice,
  onRecordPayment,
  onOpenRecordPayment,
}) => {
  const isManager = userRole === 'manager';
  const [chartPeriod, setChartPeriod] = useState<'1M' | '6M' | '1Y' | 'ALL'>('6M');

  const handleNav = (view: string, data?: any) => {
    if (view === 'invoice-form' && onCreateInvoice) {
      onCreateInvoice();
    } else if (view === 'invoices' && onViewAllInvoices) {
      onViewAllInvoices();
    } else if (view.startsWith('reports') && onNavigate) {
      onNavigate('reports', data);
    } else if (onNavigate) {
      onNavigate(view, data);
    }
  };

  const handlePayment = (inv: Invoice) => {
    if (onOpenRecordPayment) onOpenRecordPayment(inv);
    else if (onRecordPayment) onRecordPayment(inv);
  };

  const handleDetail = (inv: Invoice) => {
    if (onViewInvoice) onViewInvoice(inv);
    else if (onNavigate) onNavigate('invoice-detail', inv);
  };

  // Current Date logic
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Metrics
  const totalInvoices = invoices.length;
  const activeInvoices = invoices.filter((i) => i.status !== 'cancelled' && i.status !== 'draft');
  const validInvoices = invoices.filter((i) => i.status !== 'cancelled');

  const totalSalesAmount = activeInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalDppAmount = validInvoices.reduce((acc, i) => acc + (i.taxableBase || 0), 0);
  const totalPpnAmount = validInvoices.reduce((acc, i) => acc + (i.ppnAmount || 0), 0);

  // Calculate HPP and Profit
  const totalHppAmount = validInvoices.reduce((acc, i) => {
    if (i.totalHpp !== undefined && i.totalHpp > 0) return acc + i.totalHpp;
    const calc = i.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
      0
    );
    return acc + calc;
  }, 0);

  const totalGrossProfit = totalDppAmount - totalHppAmount;
  const grossMarginPercent = totalDppAmount > 0 ? ((totalGrossProfit / totalDppAmount) * 100).toFixed(1) : '0';

  const thisMonthInvoices = invoices.filter((i) => {
    const d = new Date(i.invoiceDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && i.status !== 'cancelled';
  });

  const thisMonthAmount = thisMonthInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const thisMonthDpp = thisMonthInvoices.reduce((acc, i) => acc + (i.taxableBase || 0), 0);
  const thisMonthPpn = thisMonthInvoices.reduce((acc, i) => acc + (i.ppnAmount || 0), 0);
  const thisMonthHpp = thisMonthInvoices.reduce((acc, i) => {
    if (i.totalHpp !== undefined && i.totalHpp > 0) return acc + i.totalHpp;
    return (
      acc +
      i.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
        0
      )
    );
  }, 0);
  const thisMonthProfit = thisMonthDpp - thisMonthHpp;

  const unpaidInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'partial' || i.status === 'overdue');
  const totalUnpaidAmount = unpaidInvoices.reduce((acc, i) => acc + i.remainingBalance, 0);

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalPaidAmount = paidInvoices.reduce((acc, i) => acc + i.amountPaid, 0);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const totalOverdueAmount = overdueInvoices.reduce((acc, i) => acc + i.remainingBalance, 0);

  // Status counts for distribution
  const statusCounts = {
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    partial: invoices.filter((i) => i.status === 'partial').length,
    paid: paidInvoices.length,
    overdue: overdueInvoices.length,
    cancelled: invoices.filter((i) => i.status === 'cancelled').length,
  };

  // Percentages
  const totalTracked = totalInvoices || 1;
  const paidPct = Math.round((statusCounts.paid / totalTracked) * 100);
  const partialPct = Math.round((statusCounts.partial / totalTracked) * 100);
  const unpaidPct = Math.round(((statusCounts.sent + statusCounts.overdue) / totalTracked) * 100);
  const otherPct = 100 - paidPct - partialPct - unpaidPct;

  // Recent Invoices (up to 5)
  const recentInvoices = [...invoices].slice(0, 5);

  // Recent Payments (up to 5)
  const recentPayments = [...payments].slice(0, 5);

  // Monthly Sales Chart Data (last 6 months)
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const chartMonths = [];
  const monthRangeCount = chartPeriod === '1M' ? 1 : chartPeriod === '6M' ? 6 : chartPeriod === '1Y' ? 12 : 6;

  for (let i = monthRangeCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = `${monthNames[m]}`;

    const monthInvs = invoices.filter((inv) => {
      const idate = new Date(inv.invoiceDate);
      return idate.getMonth() === m && idate.getFullYear() === y && inv.status !== 'cancelled';
    });

    const monthSales = monthInvs.reduce((acc, cur) => acc + cur.grandTotal, 0);
    const monthPaid = monthInvs.reduce((acc, cur) => acc + cur.amountPaid, 0);

    chartMonths.push({
      label,
      sales: monthSales,
      paid: monthPaid,
      count: monthInvs.length,
    });
  }

  const maxSales = Math.max(...chartMonths.map((m) => Math.max(m.sales, m.paid)), 10000000);

  return (
    <div className="space-y-6">
      {/* Top Header Row with Executive Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            <span>CV. Miza Mediatama</span>
            <span className="text-slate-300">•</span>
            <span>Ikhtisar Eksekutif</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Dashboard Manajemen Keuangan
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            {(['1M', '6M', '1Y', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  chartPeriod === period
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {!isManager && (
            <button
              onClick={() => handleNav('invoice-form')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invoice Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Penjualan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Omset Tagihan
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(totalSalesAmount)}
            </div>
            <div className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalInvoices} invoice terdaftar</span>
            </div>
          </div>
        </div>

        {/* 2. Pembayaran Masuk / Lunas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kas Diterima (Lunas)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(totalPaidAmount)}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {paidInvoices.length} tagihan telah diselesaikan
            </div>
          </div>
        </div>

        {/* 3. Piutang Berjalan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Piutang Belum Lunas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-900 tracking-tight">
              {formatRupiah(totalUnpaidAmount)}
            </div>
            <div className="text-xs font-medium text-amber-700 mt-1">
              {unpaidInvoices.length} invoice aktif menunggu
            </div>
          </div>
        </div>

        {/* 4. Jatuh Tempo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Piutang Overdue
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-900 tracking-tight">
              {formatRupiah(totalOverdueAmount)}
            </div>
            <div className="text-xs font-medium text-rose-600 mt-1">
              {overdueInvoices.length} tagihan melewati tempo
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview: PPN, Omzet DPP, HPP & Laba Rugi */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Rekapitulasi Omzet, PPN & Laba Rugi</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Margin {grossMarginPercent}%
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Akumulasi nilai penjualan bersih DPP, pajak PPN, biaya modal (HPP), dan estimasi laba
              </p>
            </div>
          </div>

          <button
            onClick={() => handleNav('reports-profit-loss')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>Buka Laporan Laba Rugi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Card 1: Total PPN */}
          <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                Total PPN Terpungut
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-400/20 text-indigo-200">
                Pajak
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {formatRupiah(totalPpnAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Bulan ini:</span>
                <span className="font-semibold text-indigo-200">{formatRupiah(thisMonthPpn)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Omzet Bersih DPP */}
          <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
                Omzet Bersih (DPP)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-400/20 text-sky-200">
                Dasar Pajak
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {formatRupiah(totalDppAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Bulan ini:</span>
                <span className="font-semibold text-sky-200">{formatRupiah(thisMonthDpp)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total HPP */}
          <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                Total Biaya Modal (HPP)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200">
                Pengadaan
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-amber-200 font-mono">
                {formatRupiah(totalHppAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Bulan ini:</span>
                <span className="font-semibold text-amber-300">{formatRupiah(thisMonthHpp)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Estimasi Laba Kotor */}
          <div className="bg-emerald-950/50 backdrop-blur-xs p-4 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                Estimasi Laba Kotor
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-200">
                Profit
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                {totalGrossProfit >= 0 ? '+' : ''}{formatRupiah(totalGrossProfit)}
              </div>
              <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center justify-between">
                <span>Bulan ini:</span>
                <span className="font-semibold text-emerald-100">{formatRupiah(thisMonthProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Main Chart & Asset/Allocation Column */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 Cols: Sales & Revenue Trend Chart */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Arus Tagihan & Kas Masuk
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {formatRupiah(thisMonthAmount)}
                </p>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Periode aktif berjalan</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                  <span className="text-slate-600 font-medium">Tagihan (Invoice)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span className="text-slate-600 font-medium">Kas Diterima</span>
                </div>
              </div>
            </div>

            {/* Visual Vector SVG Curve & Bar Representation */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-6 gap-2 sm:gap-4 h-48 items-end border-b border-slate-100 pb-3">
                {chartMonths.map((m, idx) => {
                  const sHeight = Math.max(12, Math.round((m.sales / maxSales) * 100));
                  const pHeight = Math.max(12, Math.round((m.paid / maxSales) * 100));

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-36">
                        <div
                          className="w-1/2 max-w-[20px] bg-indigo-600 rounded-t transition-all duration-300 group-hover:bg-indigo-700"
                          style={{ height: `${sHeight}%` }}
                          title={`Tagihan ${m.label}: ${formatRupiah(m.sales)}`}
                        />
                        <div
                          className="w-1/2 max-w-[20px] bg-emerald-500 rounded-t transition-all duration-300 group-hover:bg-emerald-600"
                          style={{ height: `${pHeight}%` }}
                          title={`Kas Masuk ${m.label}: ${formatRupiah(m.paid)}`}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 mt-3 uppercase font-medium">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Rekapitulasi performa penagihan bulanan</span>
                <button
                  onClick={() => handleNav('reports-sales')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Laporan Finansial</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions / Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Transaksi Invoice Terbaru</h3>
                <p className="text-xs text-slate-500 mt-0.5">5 tagihan paling baru tercatat</p>
              </div>
              <button
                onClick={() => handleNav('invoices')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-6">No. Invoice</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Nilai Tagihan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        <span
                          onClick={() => handleDetail(inv)}
                          className="hover:text-indigo-600 cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </span>
                        {inv.poNumber && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            PO: {inv.poNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {formatShortDate(inv.invoiceDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatRupiah(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDetail(inv)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 cursor-pointer transition-colors"
                          >
                            Detail
                          </button>
                          {inv.remainingBalance > 0 && inv.status !== 'cancelled' && !isManager && (
                            <button
                              onClick={() => handlePayment(inv)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded cursor-pointer transition-colors"
                            >
                              Bayar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Status Distribution & Advisor Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Status Breakdown Box */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-6">Distribusi Status Tagihan</h3>

            {/* Circular Gauge Representation */}
            <div className="flex items-center justify-center relative mb-6">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="56" fill="transparent" stroke="#F1F5F9" strokeWidth="14" />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * paidPct) / 100}
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * (paidPct + partialPct)) / 100}
                  className="opacity-90"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  fill="transparent"
                  stroke="#4F46E5"
                  strokeWidth="14"
                  strokeDasharray="351"
                  strokeDashoffset={351 - (351 * (paidPct + partialPct + unpaidPct)) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{paidPct}%</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Tingkat Lunas
                </span>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Lunas Selesai</span>
                </div>
                <span className="font-semibold text-slate-900">{statusCounts.paid} ({paidPct}%)</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-slate-600">Sebagian / Berjalan</span>
                </div>
                <span className="font-semibold text-slate-900">{statusCounts.partial + statusCounts.sent}</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Jatuh Tempo (Overdue)</span>
                </div>
                <span className="font-semibold text-rose-700">{statusCounts.overdue}</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Draft & Lainnya</span>
                </div>
                <span className="font-semibold text-slate-700">{statusCounts.draft + statusCounts.cancelled}</span>
              </li>
            </ul>
          </div>

          {/* Advisor / Financial Intelligence Card */}
          <div className="bg-indigo-600 p-6 rounded-xl shadow-md relative overflow-hidden text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-indigo-200 text-xs font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Executive Summary & Analytics</span>
              </div>
              <h4 className="font-semibold text-sm mb-1 text-white">
                Analisis Likuiditas & Piutang
              </h4>
              <p className="text-indigo-100 text-xs leading-relaxed mb-4">
                {overdueInvoices.length > 0
                  ? `Terdapat ${overdueInvoices.length} tagihan melewati jatuh tempo (${formatRupiah(totalOverdueAmount)}). Segera kirimkan surat penagihan.`
                  : `Arus penerimaan kas terkontrol dengan baik dengan rasio pelunasan ${paidPct}%.`}
              </p>
              <button
                onClick={() => handleNav('reports-receivables')}
                className="w-full py-2 bg-white text-indigo-700 font-semibold text-xs rounded-lg shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Cek Analisis Umur Piutang
              </button>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500 rounded-full opacity-40 pointer-events-none" />
            <div className="absolute -left-3 top-6 w-14 h-14 border-2 border-indigo-400 rounded-full opacity-30 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

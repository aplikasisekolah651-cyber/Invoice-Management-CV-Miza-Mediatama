import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  TrendingUp,
  BarChart3,
  DollarSign,
  Clock,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import {
  Invoice,
  Payment,
  Customer,
  Product,
  ServiceItem,
  SalesPerson,
  AuditLog,
  User,
  CompanySetting,
} from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  formatShortDate,
} from '../../services/calculation';
import { initialCompany } from '../../services/initialData';
import { MizaLogoIcon } from '../common/MizaBrandLogo';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export type ReportType =
  | 'profit-loss'
  | 'sales'
  | 'ppn'
  | 'aging'
  | 'cash'
  | 'products'
  | 'audit';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  products: Product[];
  services: ServiceItem[];
  salesList: SalesPerson[];
  auditLogs: AuditLog[];
  dateStart?: string;
  dateEnd?: string;
  selectedCustomerId?: string;
  selectedSalesId?: string;
  company?: CompanySetting;
  currentUser?: User;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  reportType: initialReportType,
  invoices,
  payments,
  customers,
  products,
  services,
  salesList,
  auditLogs,
  dateStart = '',
  dateEnd = '',
  selectedCustomerId = 'all',
  selectedSalesId = 'all',
  company = initialCompany,
  currentUser,
}) => {
  const [activeReportType, setActiveReportType] = useState<ReportType>(initialReportType);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activeCompany = company || initialCompany;
  const printDateStr = formatIndonesianDate(new Date());
  const printTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.status === 'cancelled') return false;
    if (selectedCustomerId !== 'all' && inv.customerId !== selectedCustomerId) return false;
    if (selectedSalesId !== 'all' && inv.salesId !== selectedSalesId) return false;
    if (dateStart && inv.invoiceDate < dateStart) return false;
    if (dateEnd && inv.invoiceDate > dateEnd) return false;
    return true;
  });

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (dateStart && p.paymentDate < dateStart) return false;
    if (dateEnd && p.paymentDate > dateEnd) return false;
    return true;
  });

  // Financial recap calculation
  let totalDpp = 0;
  let totalPpn = 0;
  let totalGrandTotal = 0;
  let totalHpp = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;

  const invoiceRecaps = filteredInvoices.map((inv) => {
    const dpp = inv.taxableBase || inv.subtotal;
    const ppn = inv.isPpnActive ? inv.ppnAmount : 0;
    const grand = inv.grandTotal;
    const hpp =
      inv.totalHpp !== undefined && inv.totalHpp > 0
        ? inv.totalHpp
        : inv.items.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPrice) || 0),
            0
          );
    const grossProfit = dpp - hpp;
    const marginPct = dpp > 0 ? (grossProfit / dpp) * 100 : 0;

    totalDpp += dpp;
    totalPpn += ppn;
    totalGrandTotal += grand;
    totalHpp += hpp;
    totalPaid += inv.amountPaid;
    totalUnpaid += inv.remainingBalance;

    return {
      ...inv,
      dpp,
      ppn,
      hpp,
      grossProfit,
      marginPct,
    };
  });

  const netProfit = totalDpp - totalHpp;
  const overallMarginPct = totalDpp > 0 ? (netProfit / totalDpp) * 100 : 0;

  // Aging calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentAging: Invoice[] = [];
  const overdue1to30: Invoice[] = [];
  const overdue31to60: Invoice[] = [];
  const overdueOver60: Invoice[] = [];

  invoices.forEach((inv) => {
    if (inv.remainingBalance <= 0 || inv.status === 'cancelled') return;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      currentAging.push(inv);
    } else if (diffDays <= 30) {
      overdue1to30.push(inv);
    } else if (diffDays <= 60) {
      overdue31to60.push(inv);
    } else {
      overdueOver60.push(inv);
    }
  });

  const sumBalance = (list: Invoice[]) => list.reduce((acc, i) => acc + i.remainingBalance, 0);
  const totalAgingReceivables =
    sumBalance(currentAging) +
    sumBalance(overdue1to30) +
    sumBalance(overdue31to60) +
    sumBalance(overdueOver60);

  // Cash calculation
  const totalCashCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  // Products performance
  const productPerfMap = new Map<string, { name: string; code: string; qty: number; revenue: number }>();
  invoices.forEach((inv) => {
    if (inv.status === 'cancelled') return;
    inv.items.forEach((item) => {
      const key = item.name;
      const curr = productPerfMap.get(key) || { name: item.name, code: item.code || '', qty: 0, revenue: 0 };
      curr.qty += item.quantity;
      curr.revenue += item.totalPrice;
      productPerfMap.set(key, curr);
    });
  });
  const productPerformance = Array.from(productPerfMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Filter text labels
  const selectedCustomerName =
    selectedCustomerId === 'all'
      ? 'Semua Pelanggan'
      : customers.find((c) => c.id === selectedCustomerId)?.companyName ||
        customers.find((c) => c.id === selectedCustomerId)?.name ||
        '-';

  const selectedSalesName =
    selectedSalesId === 'all'
      ? 'Semua Sales'
      : salesList.find((s) => s.id === selectedSalesId)?.name || '-';

  const periodText =
    dateStart && dateEnd
      ? `${formatShortDate(dateStart)} s/d ${formatShortDate(dateEnd)}`
      : dateStart
      ? `Mulai ${formatShortDate(dateStart)}`
      : dateEnd
      ? `Sampai ${formatShortDate(dateEnd)}`
      : 'Semua Periode Transaksi';

  // Report Titles
  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case 'profit-loss':
        return 'LAPORAN REKAPITULASI LABA RUGI & HARGA POKOK PENJUALAN (HPP)';
      case 'sales':
        return 'LAPORAN REKAPITULASI PENJUALAN & FAKTUR TAGIHAN';
      case 'ppn':
        return 'LAPORAN REKAPITULASI PPN & FAKTUR PAJAK KELUARAN';
      case 'aging':
        return 'LAPORAN ANALISIS UMUR PIUTANG (AGING ACCOUNTS RECEIVABLE)';
      case 'cash':
        return 'LAPORAN BUKU KAS MASUK & PENERIMAAN PEMBAYARAN';
      case 'products':
        return 'LAPORAN ANALITIK PERFORMA PENJUALAN PRODUK & JASA';
      case 'audit':
        return 'LAPORAN JEJAK AUDIT & AKTIVITAS OPERASIONAL SISTEM';
      default:
        return 'LAPORAN KEUANGAN & OPERASIONAL';
    }
  };

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
        pixelRatio: 2.2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const renderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));
      const cleanTitle = getReportTitle(activeReportType).replace(/[\s\(\)\/\\]+/g, '_');
      pdf.save(`${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-slate-100 rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-w-none print:w-full print:max-h-none print:shadow-none print:border-0 print:rounded-none print:bg-white">
        
        {/* CONTROL TOOLBAR (HIDDEN ON PRINT) */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cetak Laporan Resmi</h3>
                <p className="text-[11px] text-slate-500">Pratinjau cetak dokumen dengan KOP surat resmi & tanda tangan</p>
              </div>
            </div>

            {/* Select Report Type */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-500 font-normal">Jenis:</span>
              <select
                value={activeReportType}
                onChange={(e) => setActiveReportType(e.target.value as ReportType)}
                className="bg-transparent font-bold text-indigo-950 focus:outline-none cursor-pointer"
              >
                <option value="profit-loss">📈 Laba Rugi & HPP</option>
                <option value="sales">📊 Rekap Penjualan & Omzet</option>
                <option value="ppn">💰 Rekap Pajak PPN</option>
                <option value="aging">⏰ Umur Piutang (Aging AR)</option>
                <option value="cash">💵 Buku Arus Kas Masuk</option>
                <option value="products">🏆 Performa Barang & Jasa</option>
                <option value="audit">🛡️ Log Aktivitas Audit</option>
              </select>
            </div>

            {/* Orientation Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tegak (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mendatar (Landscape)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT SHEET CONTAINER */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/70 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="report-print-document"
            ref={printAreaRef}
            className={`bg-white text-slate-900 shadow-xl print:shadow-none mx-auto border border-slate-200 print:border-none ${
              orientation === 'landscape'
                ? 'w-[297mm] min-h-[210mm] p-[12mm]'
                : 'w-[210mm] min-h-[297mm] p-[14mm]'
            }`}
            style={{ boxSizing: 'border-box' }}
          >
            {/* KOP SURAT RESMI PERUSAHAAN */}
            <div className="border-b-[3px] border-slate-900 pb-3 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {activeCompany.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.name}
                      className="h-14 w-auto object-contain shrink-0"
                    />
                  ) : (
                    <MizaLogoIcon size={52} className="shrink-0" />
                  )}
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight uppercase font-sans">
                      {activeCompany.name || 'CV. MIZA MEDIATAMA'}
                    </h1>
                    <p className="text-[10px] font-bold text-cyan-700 tracking-wider uppercase mt-0.5">
                      {activeCompany.tagline || 'KOMPUTER – ELEKTRONIK – FURNITUR – PERDAGANGAN UMUM'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      {activeCompany.address || 'Gedung Wisma Miza Lt. 2, Jl. Raden Intan No. 45, Bandar Lampung'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[9.5px] text-slate-600 space-y-0.5 shrink-0">
                  {activeCompany.phone && <div>Telp/WA: <span className="font-semibold text-slate-900">{activeCompany.phone}</span></div>}
                  {activeCompany.email && <div>Email: <span className="font-semibold text-slate-900">{activeCompany.email}</span></div>}
                  {activeCompany.npwp && <div>NPWP: <span className="font-mono font-semibold text-slate-900">{activeCompany.npwp}</span></div>}
                  {activeCompany.website && <div>Web: <span className="font-semibold text-slate-900">{activeCompany.website}</span></div>}
                </div>
              </div>
              <div className="border-b border-slate-900 mt-1"></div>
            </div>

            {/* JUDUL LAPORAN & METADATA PERIODE */}
            <div className="text-center my-3">
              <h2 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide">
                {getReportTitle(activeReportType)}
              </h2>
              <div className="inline-block bg-slate-100 px-3 py-0.5 rounded-full text-[11px] font-bold text-slate-800 mt-1 border border-slate-200">
                Periode: {periodText}
              </div>
            </div>

            {/* METADATA INFORMASI FILTER & CETAK */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-4 text-[10px]">
              <div>
                <span className="text-slate-500 block">Filter Pelanggan:</span>
                <span className="font-bold text-slate-900 truncate block">{selectedCustomerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Filter Petugas Sales:</span>
                <span className="font-bold text-slate-900 truncate block">{selectedSalesName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tanggal & Waktu Cetak:</span>
                <span className="font-bold text-slate-900 block">{printDateStr}, {printTimeStr} WIB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dicetak Oleh:</span>
                <span className="font-bold text-indigo-900 block">
                  {currentUser?.name || 'Administrator'} ({currentUser?.role?.toUpperCase() || 'ADMIN'})
                </span>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY METRIC BOXES */}
            {activeReportType === 'profit-loss' && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Omzet Bersih (DPP)</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block mt-0.5">
                    {formatRupiah(totalDpp)}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">Biaya Modal (HPP)</span>
                  <span className="text-xs sm:text-sm font-black text-amber-900 font-mono block mt-0.5">
                    {formatRupiah(totalHpp)}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">
                    Laba Bersih (Margin {overallMarginPct.toFixed(1)}%)
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono block mt-0.5">
                    {netProfit >= 0 ? '+' : ''}{formatRupiah(netProfit)}
                  </span>
                </div>
                <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                  <span className="text-[9px] font-bold text-indigo-800 uppercase block">Total PPN Terpungut</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-900 font-mono block mt-0.5">
                    {formatRupiah(totalPpn)}
                  </span>
                </div>
              </div>
            )}

            {activeReportType === 'sales' && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Nilai Penjualan</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block mt-0.5">
                    {formatRupiah(totalGrandTotal)}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">Pembayaran Diterima</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono block mt-0.5">
                    {formatRupiah(totalPaid)}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">Sisa Piutang</span>
                  <span className="text-xs sm:text-sm font-black text-amber-900 font-mono block mt-0.5">
                    {formatRupiah(totalUnpaid)}
                  </span>
                </div>
                <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                  <span className="text-[9px] font-bold text-indigo-800 uppercase block">Jumlah Faktur</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-900 block mt-0.5">
                    {filteredInvoices.length} Faktur Tagihan
                  </span>
                </div>
              </div>
            )}

            {activeReportType === 'ppn' && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Dasar Pengenaan Pajak (DPP)</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block mt-0.5">
                    {formatRupiah(totalDpp)}
                  </span>
                </div>
                <div className="p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                  <span className="text-[9px] font-bold text-indigo-800 uppercase block">PPN Keluaran Terpungut</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-900 font-mono block mt-0.5">
                    {formatRupiah(totalPpn)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Faktur Dengan PPN</span>
                  <span className="text-xs sm:text-sm font-black text-blue-900 block mt-0.5">
                    {filteredInvoices.filter((i) => i.isPpnActive && i.ppnAmount > 0).length} Faktur Pajak
                  </span>
                </div>
              </div>
            )}

            {activeReportType === 'aging' && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                  <span className="text-[9px] font-bold text-blue-800 uppercase block">Lancar (Current)</span>
                  <span className="text-xs sm:text-sm font-black text-blue-900 font-mono block mt-0.5">
                    {formatRupiah(sumBalance(currentAging))}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">1 - 30 Hari</span>
                  <span className="text-xs sm:text-sm font-black text-amber-900 font-mono block mt-0.5">
                    {formatRupiah(sumBalance(overdue1to30))}
                  </span>
                </div>
                <div className="p-2.5 bg-orange-50/50 border border-orange-200 rounded-xl">
                  <span className="text-[9px] font-bold text-orange-800 uppercase block">31 - 60 Hari</span>
                  <span className="text-xs sm:text-sm font-black text-orange-900 font-mono block mt-0.5">
                    {formatRupiah(sumBalance(overdue31to60))}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl">
                  <span className="text-[9px] font-bold text-rose-800 uppercase block">&gt; 60 Hari (Macet)</span>
                  <span className="text-xs sm:text-sm font-black text-rose-900 font-mono block mt-0.5">
                    {formatRupiah(sumBalance(overdueOver60))}
                  </span>
                </div>
              </div>
            )}

            {activeReportType === 'cash' && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">Total Penerimaan Kas Masuk</span>
                  <span className="text-sm sm:text-base font-black text-emerald-800 font-mono block mt-0.5">
                    {formatRupiah(totalCashCollected)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Frekuensi Pembayaran</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                    {filteredPayments.length} Kwitansi Transaksi
                  </span>
                </div>
              </div>
            )}

            {/* TABEL DATA DETAIL LAPORAN */}
            <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
              {/* 1. TABLE: LABA RUGI */}
              {activeReportType === 'profit-loss' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Invoice & Tanggal</th>
                      <th className="py-2 px-2 border-r border-slate-200">Pelanggan</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Omzet DPP</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Modal (HPP)</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Laba Kotor</th>
                      <th className="py-2 px-2 text-center border-r border-slate-200">Margin</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">PPN</th>
                      <th className="py-2 px-2 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoiceRecaps.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                          Tidak ada data transaksi pada filter periode ini.
                        </td>
                      </tr>
                    ) : (
                      invoiceRecaps.map((inv, idx) => (
                        <tr key={inv.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200">
                            <span className="font-mono font-bold text-slate-900 block">{inv.invoiceNumber}</span>
                            <span className="text-[8.5px] text-slate-500">{formatShortDate(inv.invoiceDate)}</span>
                          </td>
                          <td className="py-1.5 px-2 font-medium text-slate-900 border-r border-slate-200">
                            {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                            {formatRupiah(inv.dpp)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-amber-900 border-r border-slate-200">
                            {formatRupiah(inv.hpp)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                            {formatRupiah(inv.grossProfit)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                            {inv.marginPct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                            {formatRupiah(inv.ppn)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                            {formatRupiah(inv.grandTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {invoiceRecaps.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                          TOTAL KESELURUHAN:
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-900 border-r border-slate-200">
                          {formatRupiah(totalDpp)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-amber-950 border-r border-slate-200">
                          {formatRupiah(totalHpp)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-900 font-black border-r border-slate-200">
                          {formatRupiah(netProfit)}
                        </td>
                        <td className="py-2 px-2 text-center text-emerald-900 border-r border-slate-200">
                          {overallMarginPct.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                          {formatRupiah(totalPpn)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-950 font-black">
                          {formatRupiah(totalGrandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {/* 2. TABLE: PENJUALAN */}
              {activeReportType === 'sales' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Invoice</th>
                      <th className="py-2 px-2 border-r border-slate-200">Tanggal</th>
                      <th className="py-2 px-2 border-r border-slate-200">Pelanggan</th>
                      <th className="py-2 px-2 border-r border-slate-200">Sales</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Subtotal</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">PPN</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Grand Total</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Terbayar</th>
                      <th className="py-2 px-2 text-right">Sisa Piutang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                          Tidak ada data penjualan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv, idx) => (
                        <tr key={inv.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{formatShortDate(inv.invoiceDate)}</td>
                          <td className="py-1.5 px-2 font-medium text-slate-900 border-r border-slate-200">
                            {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                          </td>
                          <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">
                            {inv.salesSnapshot?.name || '-'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                            {formatRupiah(inv.subtotal)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                            {formatRupiah(inv.ppnAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {formatRupiah(inv.grandTotal)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-emerald-800 border-r border-slate-200">
                            {formatRupiah(inv.amountPaid)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-900">
                            {formatRupiah(inv.remainingBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredInvoices.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={5} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                          TOTAL REKAPITULASI:
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                          {formatRupiah(filteredInvoices.reduce((a, b) => a + b.subtotal, 0))}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                          {formatRupiah(totalPpn)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-black text-slate-950 border-r border-slate-200">
                          {formatRupiah(totalGrandTotal)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-900 border-r border-slate-200">
                          {formatRupiah(totalPaid)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-amber-950 font-black">
                          {formatRupiah(totalUnpaid)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}

              {/* 3. TABLE: PPN & FAKTUR PAJAK */}
              {activeReportType === 'ppn' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Faktur / Invoice</th>
                      <th className="py-2 px-2 border-r border-slate-200">Tanggal</th>
                      <th className="py-2 px-2 border-r border-slate-200">Lawan Transaksi (WP)</th>
                      <th className="py-2 px-2 border-r border-slate-200">NPWP Pelanggan</th>
                      <th className="py-2 px-2 text-center border-r border-slate-200">Tarif</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">DPP (Rp)</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">PPN Terpungut</th>
                      <th className="py-2 px-2 text-right">Total Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInvoices.map((inv, idx) => (
                      <tr key={inv.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200">{inv.invoiceNumber}</td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{formatShortDate(inv.invoiceDate)}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-900 border-r border-slate-200">
                          {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-slate-700 border-r border-slate-200">
                          {inv.customerSnapshot?.npwp || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                          {inv.isPpnActive ? `${inv.ppnRate || 11}%` : 'Non-PPN'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                          {formatRupiah(inv.taxableBase || inv.subtotal)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-indigo-900 border-r border-slate-200">
                          {formatRupiah(inv.isPpnActive ? inv.ppnAmount : 0)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                          {formatRupiah(inv.grandTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={6} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                        TOTAL PAJAK TERPUNGUT:
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-900 border-r border-slate-200">
                        {formatRupiah(totalDpp)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-indigo-950 font-black border-r border-slate-200">
                        {formatRupiah(totalPpn)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-950 font-black">
                        {formatRupiah(totalGrandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* 4. TABLE: AGING AR PIUTANG */}
              {activeReportType === 'aging' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Invoice</th>
                      <th className="py-2 px-2 border-r border-slate-200">Pelanggan</th>
                      <th className="py-2 px-2 border-r border-slate-200">Tgl Invoice</th>
                      <th className="py-2 px-2 border-r border-slate-200">Jatuh Tempo</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Total Tagihan</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Terbayar</th>
                      <th className="py-2 px-2 text-right border-r border-slate-200">Sisa Piutang</th>
                      <th className="py-2 px-2 text-center">Status Umur Piutang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      ...overdueOver60.map((i) => ({ ...i, bucket: '> 60 Hari (Macet)' })),
                      ...overdue31to60.map((i) => ({ ...i, bucket: '31 - 60 Hari' })),
                      ...overdue1to30.map((i) => ({ ...i, bucket: '1 - 30 Hari' })),
                      ...currentAging.map((i) => ({ ...i, bucket: 'Current (Lancar)' })),
                    ].map((inv, idx) => (
                      <tr key={inv.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200">{inv.invoiceNumber}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-900 border-r border-slate-200">
                          {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name}
                        </td>
                        <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200">{formatShortDate(inv.invoiceDate)}</td>
                        <td className="py-1.5 px-2 text-slate-800 font-bold border-r border-slate-200">{formatShortDate(inv.dueDate)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-800 border-r border-slate-200">
                          {formatRupiah(inv.grandTotal)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-800 border-r border-slate-200">
                          {formatRupiah(inv.amountPaid)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-900 border-r border-slate-200">
                          {formatRupiah(inv.remainingBalance)}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-800">
                          {inv.bucket}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={7} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                        TOTAL OUTSTANDING PIUTANG TERTUNGGAK:
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-amber-950 text-xs border-r border-slate-200">
                        {formatRupiah(totalAgingReceivables)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* 5. TABLE: KAS MASUK */}
              {activeReportType === 'cash' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Bukti Kwitansi</th>
                      <th className="py-2 px-2 border-r border-slate-200">Tanggal Masuk</th>
                      <th className="py-2 px-2 border-r border-slate-200">No. Invoice Terkait</th>
                      <th className="py-2 px-2 border-r border-slate-200">Pelanggan</th>
                      <th className="py-2 px-2 border-r border-slate-200">Metode Bayar</th>
                      <th className="py-2 px-2 border-r border-slate-200">Catatan / Referensi</th>
                      <th className="py-2 px-2 text-right">Nominal Kas (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPayments.map((p, idx) => (
                      <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-emerald-800 border-r border-slate-200">{p.paymentNumber}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{formatShortDate(p.paymentDate)}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{p.invoiceNumber}</td>
                        <td className="py-1.5 px-2 font-medium text-slate-900 border-r border-slate-200">{p.customerName}</td>
                        <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">{p.paymentMethod}</td>
                        <td className="py-1.5 px-2 text-slate-500 border-r border-slate-200">{p.notes || '-'}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-800">
                          {formatRupiah(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={7} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                        TOTAL KAS MASUK DITERIMA:
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-emerald-900 text-xs">
                        {formatRupiah(totalCashCollected)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* 6. TABLE: PERFORMA BARANG & JASA */}
              {activeReportType === 'products' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">Rangking</th>
                      <th className="py-2 px-2 border-r border-slate-200">Kode</th>
                      <th className="py-2 px-2 border-r border-slate-200">Nama Barang / Jasa</th>
                      <th className="py-2 px-2 text-center border-r border-slate-200">Total Kuantitas Terjual</th>
                      <th className="py-2 px-2 text-right">Kontribusi Omzet Penjualan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {productPerformance.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 border-r border-slate-200">{item.code || '-'}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{item.name}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-800 border-r border-slate-200">{item.qty} unit</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                          {formatRupiah(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={4} className="py-2 px-2 text-right text-slate-900 border-r border-slate-200">
                        TOTAL OMZET BARANG/JASA:
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-slate-950 text-xs">
                        {formatRupiah(productPerformance.reduce((a, b) => a + b.revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* 7. TABLE: AUDIT LOG */}
              {activeReportType === 'audit' && (
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                      <th className="py-2 px-2 border-r border-slate-200">Waktu Transaksi</th>
                      <th className="py-2 px-2 border-r border-slate-200">Operator / User</th>
                      <th className="py-2 px-2 border-r border-slate-200">Aksi</th>
                      <th className="py-2 px-2 border-r border-slate-200">Modul Entitas</th>
                      <th className="py-2 px-2">Rincian Perubahan Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogs.slice(0, 50).map((log, idx) => (
                      <tr key={log.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-mono text-[9px] text-slate-600 border-r border-slate-200">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200">{log.userName}</td>
                        <td className="py-1.5 px-2 font-bold uppercase text-[8.5px] border-r border-slate-200">
                          {log.action}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-slate-700 border-r border-slate-200">{log.entity}</td>
                        <td className="py-1.5 px-2 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* LEMBAR PENGESAHAN & TANDA TANGAN DOKUMEN LAPORAN */}
            <div className="pt-4 border-t border-slate-200 mt-6 break-inside-avoid">
              <div className="flex justify-between items-start text-[10px] text-slate-800">
                {/* Kolom Kiri: Pembuat Laporan */}
                <div className="text-center w-52">
                  <p className="text-slate-500">Dibuat Oleh,</p>
                  <p className="font-semibold text-slate-700 mt-0.5">Bagian Keuangan / Operator</p>
                  <div className="h-16 flex items-end justify-center">
                    {/* Tanda tangan digital / garis */}
                  </div>
                  <p className="font-bold text-slate-900 border-b border-slate-800 pb-0.5 inline-block min-w-[140px]">
                    {currentUser?.name || 'Bagian Keuangan'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    ID: @{currentUser?.username || currentUser?.email?.split('@')[0] || 'admin'}
                  </p>
                </div>

                {/* Kolom Kanan: Pimpinan Perusahaan */}
                <div className="text-center w-56">
                  <p className="text-slate-500">
                    {activeCompany.city || 'Bandar Lampung'}, {printDateStr}
                  </p>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    Disetujui / Mengetahui,
                  </p>
                  <div className="h-16 flex items-end justify-center">
                    {/* Ruang stempel & ttd */}
                  </div>
                  <p className="font-bold text-slate-900 border-b border-slate-800 pb-0.5 inline-block min-w-[150px]">
                    {activeCompany.directorName || 'Ahmad Miza, S.T.'}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase">
                    {activeCompany.directorTitle || 'Pimpinan / Direktur'} {activeCompany.name || 'CV. Miza Mediatama'}
                  </p>
                </div>
              </div>

              {/* Catatan Kaki Kerahasiaan Dokumen */}
              <div className="mt-6 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                <span>Dokumen Resmi Sistem Invoice & Akuntansi CV. Miza Mediatama</span>
                <span>Halaman 1 dari 1 • Waktu Cetak: {printDateStr} {printTimeStr}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

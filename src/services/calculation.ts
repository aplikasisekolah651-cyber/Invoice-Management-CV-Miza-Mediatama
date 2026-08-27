import { Invoice, InvoiceItem, InvoiceStatus } from '../types';

/**
 * Format numbers to Indonesian Rupiah representation: Rp 1.250.000
 */
export function formatRupiah(amount: number, withPrefix: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withPrefix ? 'Rp 0' : '0';
  }
  
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(rounded);

  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format date to Indonesian human-readable format: 27 Agustus 2026
 */
export function formatIndonesianDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format short date (DD/MM/YYYY)
 */
export function formatShortDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate line item discount and total
 */
export function calculateLineItem(item: Partial<InvoiceItem>): {
  discountAmount: number;
  totalPrice: number;
} {
  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const rawTotal = qty * unitPrice;
  
  let discountAmount = 0;
  if (item.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, Number(item.discountValue) || 0));
    discountAmount = (rawTotal * pct) / 100;
  } else {
    discountAmount = Math.min(rawTotal, Math.max(0, Number(item.discountValue) || 0));
  }

  const totalPrice = Math.max(0, rawTotal - discountAmount);
  return {
    discountAmount,
    totalPrice,
  };
}

/**
 * Centralized invoice summary calculation
 */
export function calculateInvoiceSummary(params: {
  items: InvoiceItem[];
  invoiceDiscountType: 'percentage' | 'nominal';
  invoiceDiscountValue: number;
  isPpnActive: boolean;
  ppnRate: number; // e.g. 11 or 12
  taxCalculationType?: 'exclusive' | 'inclusive'; // inclusive: harga termasuk pajak
  isMateraiActive: boolean;
  materaiAmount: number;
  materaiThreshold?: number;
  amountPaid?: number;
}): {
  subtotal: number;
  invoiceDiscountAmount: number;
  taxableBase: number;
  ppnAmount: number;
  materaiAmount: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  terbilang: string;
} {
  const {
    items,
    invoiceDiscountType,
    invoiceDiscountValue,
    isPpnActive,
    ppnRate,
    taxCalculationType = 'exclusive',
    isMateraiActive,
    materaiAmount: configMateraiAmount,
    materaiThreshold = 5000000,
    amountPaid = 0,
  } = params;

  // 1. Calculate subtotal of all items (each item already has item-level discount deducted)
  const subtotal = items.reduce((acc, item) => {
    const calc = calculateLineItem(item);
    return acc + calc.totalPrice;
  }, 0);

  // 2. Invoice-level discount
  let invoiceDiscountAmount = 0;
  if (invoiceDiscountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, Number(invoiceDiscountValue) || 0));
    invoiceDiscountAmount = Math.round((subtotal * pct) / 100);
  } else {
    invoiceDiscountAmount = Math.min(subtotal, Math.max(0, Number(invoiceDiscountValue) || 0));
  }

  const grossAfterDiscount = Math.max(0, subtotal - invoiceDiscountAmount);

  // 3. Tax & DPP calculation
  let taxableBase = grossAfterDiscount;
  let ppnAmount = 0;

  if (isPpnActive && ppnRate > 0) {
    if (taxCalculationType === 'inclusive') {
      // Harga sudah termasuk PPN (Include PPN)
      // DPP = Total / (1 + PPN%)
      // PPN = Total - DPP
      taxableBase = Math.round(grossAfterDiscount / (1 + ppnRate / 100));
      ppnAmount = Math.max(0, grossAfterDiscount - taxableBase);
    } else {
      // Harga belum termasuk PPN (Exclude PPN)
      // DPP = Gross
      // PPN = DPP * PPN%
      taxableBase = grossAfterDiscount;
      ppnAmount = Math.round((taxableBase * ppnRate) / 100);
    }
  } else {
    taxableBase = grossAfterDiscount;
    ppnAmount = 0;
  }

  // 4. Materai (applicable if active)
  let effectiveMaterai = 0;
  if (isMateraiActive) {
    if (taxableBase >= materaiThreshold || isMateraiActive) {
      effectiveMaterai = configMateraiAmount;
    }
  }

  // 5. Grand Total
  const grandTotal =
    taxCalculationType === 'inclusive' && isPpnActive
      ? grossAfterDiscount + effectiveMaterai
      : taxableBase + ppnAmount + effectiveMaterai;

  // 6. Balance
  const cleanAmountPaid = Math.max(0, amountPaid);
  const remainingBalance = Math.max(0, grandTotal - cleanAmountPaid);

  // 7. Terbilang
  const terbilang = numberToTerbilang(grandTotal) + ' Rupiah';

  return {
    subtotal,
    invoiceDiscountAmount,
    taxableBase,
    ppnAmount,
    materaiAmount: effectiveMaterai,
    grandTotal,
    amountPaid: cleanAmountPaid,
    remainingBalance,
    terbilang,
  };
}

/**
 * Determine dynamic invoice status based on payment and due date
 */
export function determineInvoiceStatus(
  currentStatus: InvoiceStatus,
  grandTotal: number,
  amountPaid: number,
  dueDate: string
): InvoiceStatus {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (currentStatus === 'draft') return 'draft';

  if (amountPaid >= grandTotal && grandTotal > 0) {
    return 'paid';
  }

  if (amountPaid > 0 && amountPaid < grandTotal) {
    return 'partial';
  }

  // Check if overdue
  if (dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (today > due && amountPaid < grandTotal) {
      return 'overdue';
    }
  }

  return 'sent';
}

/**
 * Convert integer to Indonesian Terbilang string words
 * Example: 1250000 -> "Satu Juta Dua Ratus Lima Puluh Ribu"
 */
export function numberToTerbilang(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'Nol';
  const n = Math.abs(Math.round(num));
  if (n === 0) return 'Nol';

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function terbilangHelper(val: number): string {
    if (val < 12) {
      return satuan[val];
    } else if (val < 20) {
      return terbilangHelper(val - 10) + ' Belas';
    } else if (val < 100) {
      return (
        terbilangHelper(Math.floor(val / 10)) +
        ' Puluh ' +
        terbilangHelper(val % 10)
      );
    } else if (val < 200) {
      return 'Seratus ' + terbilangHelper(val - 100);
    } else if (val < 1000) {
      return (
        terbilangHelper(Math.floor(val / 10)) +
        ' Ratus ' +
        terbilangHelper(val % 100)
      );
    } else if (val < 2000) {
      return 'Seribu ' + terbilangHelper(val - 1000);
    } else if (val < 1000000) {
      return (
        terbilangHelper(Math.floor(val / 1000)) +
        ' Ribu ' +
        terbilangHelper(val % 1000)
      );
    } else if (val < 1000000000) {
      return (
        terbilangHelper(Math.floor(val / 1000000)) +
        ' Juta ' +
        terbilangHelper(val % 1000000)
      );
    } else if (val < 1000000000000) {
      return (
        terbilangHelper(Math.floor(val / 1000000000)) +
        ' Miliar ' +
        terbilangHelper(val % 1000000000)
      );
    } else {
      return (
        terbilangHelper(Math.floor(val / 1000000000000)) +
        ' Triliun ' +
        terbilangHelper(val % 1000000000000)
      );
    }
  }

  const result = terbilangHelper(n).replace(/\s+/g, ' ').trim();
  return result;
}

/**
 * Calculate HPP and Profit for a single Invoice Line Item
 */
export function calculateItemHppAndProfit(item: Partial<InvoiceItem>): {
  costPrice: number;
  totalCost: number;
  sellingTotal: number;
  grossProfit: number;
  marginPercent: number;
} {
  const qty = Number(item.quantity) || 0;
  const costPrice = Number(item.costPrice) || 0;
  const totalCost = qty * costPrice;
  const sellingTotal = Number(item.totalPrice) || 0;
  const grossProfit = sellingTotal - totalCost;
  const marginPercent = sellingTotal > 0 ? (grossProfit / sellingTotal) * 100 : 0;

  return {
    costPrice,
    totalCost,
    sellingTotal,
    grossProfit,
    marginPercent: Number(marginPercent.toFixed(1)),
  };
}

/**
 * Calculate total HPP and Profit for an entire Invoice
 */
export function calculateInvoiceProfitAndHpp(invoice: Partial<Invoice>): {
  totalHpp: number;
  taxableBase: number;
  grossProfit: number;
  profitMarginPct: number;
  ppnAmount: number;
  grandTotal: number;
} {
  const items = invoice.items || [];
  const totalHpp = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.costPrice) || 0;
    return acc + qty * cost;
  }, 0);

  const taxableBase = Number(invoice.taxableBase) || Number(invoice.subtotal) || 0;
  const grossProfit = taxableBase - totalHpp;
  const profitMarginPct = taxableBase > 0 ? (grossProfit / taxableBase) * 100 : 0;
  const ppnAmount = Number(invoice.ppnAmount) || 0;
  const grandTotal = Number(invoice.grandTotal) || 0;

  return {
    totalHpp,
    taxableBase,
    grossProfit,
    profitMarginPct: Number(profitMarginPct.toFixed(1)),
    ppnAmount,
    grandTotal,
  };
}

/**
 * Comprehensive company financial recap (Omzet, HPP, Laba Kotor, PPN, Kas, Piutang)
 */
export function calculateCompanyFinancialRecap(invoices: Invoice[]): {
  validCount: number;
  totalOmzetBruto: number;
  totalDiskon: number;
  totalOmzetNeto: number; // DPP
  totalHpp: number; // Modal
  totalLabaKotor: number; // Omzet Neto - HPP
  grossMarginPct: number;
  totalPpn: number; // PPN Terkumpul
  totalMaterai: number;
  totalGrandTotal: number;
  totalPaid: number; // Kas Masuk
  totalReceivables: number; // Piutang Aktif
} {
  const validInvoices = invoices.filter((inv) => inv.status !== 'cancelled');

  let totalOmzetBruto = 0;
  let totalDiskon = 0;
  let totalOmzetNeto = 0;
  let totalHpp = 0;
  let totalPpn = 0;
  let totalMaterai = 0;
  let totalGrandTotal = 0;
  let totalPaid = 0;
  let totalReceivables = 0;

  validInvoices.forEach((inv) => {
    totalOmzetBruto += Number(inv.subtotal) || 0;
    totalDiskon += Number(inv.invoiceDiscountAmount) || 0;
    totalOmzetNeto += Number(inv.taxableBase) || 0;
    totalPpn += inv.isPpnActive ? (Number(inv.ppnAmount) || 0) : 0;
    totalMaterai += Number(inv.materaiAmount) || 0;
    totalGrandTotal += Number(inv.grandTotal) || 0;
    totalPaid += Number(inv.amountPaid) || 0;
    totalReceivables += Number(inv.remainingBalance) || 0;

    // HPP sum
    const invHpp = (inv.items || []).reduce((acc, it) => {
      const q = Number(it.quantity) || 0;
      const c = Number(it.costPrice) || 0;
      return acc + q * c;
    }, 0);
    totalHpp += invHpp;
  });

  const totalLabaKotor = totalOmzetNeto - totalHpp;
  const grossMarginPct = totalOmzetNeto > 0 ? (totalLabaKotor / totalOmzetNeto) * 100 : 0;

  return {
    validCount: validInvoices.length,
    totalOmzetBruto,
    totalDiskon,
    totalOmzetNeto,
    totalHpp,
    totalLabaKotor,
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    totalPpn,
    totalMaterai,
    totalGrandTotal,
    totalPaid,
    totalReceivables,
  };
}

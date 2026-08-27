import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Customer, Product, Invoice, Payment, SalesPerson } from '../types';
import { formatRupiah, formatShortDate, formatIndonesianDate } from './calculation';

export const ExportService = {
  // --- EXCEL EXPORTS ---

  /**
   * Export Invoices list to Excel
   */
  exportInvoicesToExcel(invoices: Invoice[], fileName = 'Daftar_Invoice.xlsx') {
    const data = invoices.map((inv, idx) => ({
      No: idx + 1,
      'No. Invoice': inv.invoiceNumber,
      'No. PO': inv.poNumber || '-',
      Tanggal: formatShortDate(inv.invoiceDate),
      'Jatuh Tempo': formatShortDate(inv.dueDate),
      'Nama Pelanggan': inv.customerSnapshot?.companyName || inv.customerSnapshot?.name || '-',
      'Sales / Marketing': inv.salesSnapshot?.name || '-',
      Subtotal: inv.subtotal,
      Diskon: inv.invoiceDiscountAmount,
      PPN: inv.ppnAmount,
      Materai: inv.materaiAmount,
      'Grand Total': inv.grandTotal,
      'Total Dibayar': inv.amountPaid,
      'Sisa Piutang': inv.remainingBalance,
      Status: inv.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export Sales Report to Excel
   */
  exportSalesReportToExcel(params: {
    invoices: Invoice[];
    startDate?: string;
    endDate?: string;
    fileName?: string;
  }) {
    const { invoices, startDate, endDate, fileName = 'Laporan_Penjualan.xlsx' } = params;
    const data = invoices.map((inv, idx) => ({
      No: idx + 1,
      'No. Invoice': inv.invoiceNumber,
      'No. PO': inv.poNumber || '-',
      Tanggal: formatShortDate(inv.invoiceDate),
      Pelanggan: inv.customerSnapshot?.companyName || inv.customerSnapshot?.name || '-',
      Sales: inv.salesSnapshot?.name || '-',
      Subtotal: inv.subtotal,
      Diskon: inv.invoiceDiscountAmount,
      PPN: inv.ppnAmount,
      Materai: inv.materaiAmount,
      'Grand Total': inv.grandTotal,
      Dibayar: inv.amountPaid,
      'Sisa Piutang': inv.remainingBalance,
      Status: inv.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export Receivables Aging Report to Excel
   */
  exportReceivablesReportToExcel(params: {
    items: Array<{
      invoiceNumber: string;
      customerName: string;
      invoiceDate: string;
      dueDate: string;
      grandTotal: number;
      amountPaid: number;
      remainingBalance: number;
      ageDays: number;
      ageCategory: string;
      status: string;
    }>;
    fileName?: string;
  }) {
    const { items, fileName = 'Laporan_Umur_Piutang.xlsx' } = params;
    const data = items.map((item, idx) => ({
      No: idx + 1,
      'No. Invoice': item.invoiceNumber,
      Pelanggan: item.customerName,
      'Tgl Invoice': formatShortDate(item.invoiceDate),
      'Jatuh Tempo': formatShortDate(item.dueDate),
      'Nilai Tagihan': item.grandTotal,
      'Telah Dibayar': item.amountPaid,
      'Sisa Piutang': item.remainingBalance,
      'Umur (Hari)': item.ageDays,
      'Kategori Umur': item.ageCategory,
      Status: item.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Umur Piutang');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export Payments History to Excel
   */
  exportPaymentsToExcel(payments: Payment[], fileName = 'Laporan_Pembayaran.xlsx') {
    const data = payments.map((p, idx) => ({
      No: idx + 1,
      'No. Bukti Bayar': p.paymentNumber,
      'No. Invoice': p.invoiceNumber,
      Pelanggan: p.customerName,
      'Tgl Pembayaran': formatShortDate(p.paymentDate),
      'Jumlah Bayar': p.amount,
      Metode: p.paymentMethod,
      'No. Referensi': p.referenceNumber || '-',
      'Rekening Tujuan': p.bankAccountInfo || '-',
      Catatan: p.notes || '-',
      'Diterima Oleh': p.createdByName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pembayaran');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export Customers to Excel
   */
  exportCustomersToExcel(customers: Customer[], fileName = 'Master_Data_Pelanggan.xlsx') {
    const data = customers.map((c, idx) => ({
      No: idx + 1,
      'Kode Pelanggan': c.code,
      'Nama Kontak': c.name,
      'Nama Perusahaan': c.companyName,
      Alamat: c.address,
      Kota: c.city,
      Provinsi: c.province,
      'Kode Pos': c.postalCode || '',
      NPWP: c.npwp || '',
      Telepon: c.phone,
      Email: c.email || '',
      'Kontak Person': c.contactPerson || '',
      Catatan: c.notes || '',
      Status: c.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelanggan');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Export Products to Excel
   */
  exportProductsToExcel(products: Product[], fileName = 'Master_Data_Barang.xlsx') {
    const data = products.map((p, idx) => ({
      No: idx + 1,
      'Kode Barang': p.code,
      SKU: p.sku || '',
      'Nama Barang': p.name,
      Kategori: p.categoryName || '',
      Satuan: p.unit,
      'Harga Beli': p.costPrice,
      'Harga Jual': p.sellingPrice,
      Deskripsi: p.description || '',
      Status: p.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barang');
    XLSX.writeFile(workbook, fileName);
  },

  // --- EXCEL IMPORTS ---

  /**
   * Parse Customer Excel file
   */
  parseCustomerExcel(file: File): Promise<Partial<Customer>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsed: Partial<Customer>[] = rawRows.map((row, i) => ({
            code: row['Kode Pelanggan'] || row['Kode'] || `CUST-${String(i + 10).padStart(3, '0')}`,
            name: row['Nama Kontak'] || row['Nama'] || row['Nama Pelanggan'] || '',
            companyName: row['Nama Perusahaan'] || row['Perusahaan'] || row['Nama'] || '',
            address: row['Alamat'] || '',
            city: row['Kota'] || 'Yogyakarta',
            province: row['Provinsi'] || 'D.I. Yogyakarta',
            postalCode: String(row['Kode Pos'] || ''),
            npwp: String(row['NPWP'] || ''),
            phone: String(row['Telepon'] || row['No Telp'] || row['Phone'] || ''),
            email: row['Email'] || '',
            contactPerson: row['Kontak Person'] || '',
            notes: row['Catatan'] || '',
            isActive: true,
          }));

          resolve(parsed.filter((p) => p.name || p.companyName));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Parse Product Excel file
   */
  parseProductExcel(file: File): Promise<Partial<Product>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsed: Partial<Product>[] = rawRows.map((row, i) => ({
            code: row['Kode Barang'] || row['Kode'] || `PRD-${String(i + 10).padStart(3, '0')}`,
            sku: row['SKU'] || '',
            name: row['Nama Barang'] || row['Nama'] || '',
            categoryName: row['Kategori'] || 'Umum',
            unit: row['Satuan'] || 'unit',
            costPrice: Number(row['Harga Beli']) || 0,
            sellingPrice: Number(row['Harga Jual'] || row['Harga']) || 0,
            description: row['Deskripsi'] || '',
            isActive: true,
          }));

          resolve(parsed.filter((p) => p.name));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  // --- PDF REPORT EXPORTS ---

  /**
   * Generate Sales Report PDF
   */
  exportSalesReportToPdf(params: {
    invoices: Invoice[];
    companyName: string;
    dateRangeText: string;
    fileName?: string;
  }) {
    const { invoices, companyName, dateRangeText, fileName = 'Laporan_Penjualan.pdf' } = params;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title & Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 14, 15);
    doc.setFontSize(11);
    doc.text('LAPORAN PENJUALAN & STATUS INVOICE', 14, 21);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${dateRangeText} | Dicetak pada: ${formatIndonesianDate(new Date())}`, 14, 27);

    // Summary numbers
    const totalGrand = invoices.reduce((a, b) => a + b.grandTotal, 0);
    const totalPaid = invoices.reduce((a, b) => a + b.amountPaid, 0);
    const totalDebt = invoices.reduce((a, b) => a + b.remainingBalance, 0);

    const tableRows = invoices.map((inv, idx) => [
      idx + 1,
      inv.invoiceNumber,
      formatShortDate(inv.invoiceDate),
      inv.customerSnapshot?.companyName || inv.customerSnapshot?.name || '-',
      inv.salesSnapshot?.name || '-',
      formatRupiah(inv.subtotal, false),
      formatRupiah(inv.invoiceDiscountAmount, false),
      formatRupiah(inv.ppnAmount, false),
      formatRupiah(inv.grandTotal, false),
      formatRupiah(inv.amountPaid, false),
      formatRupiah(inv.remainingBalance, false),
      inv.status.toUpperCase(),
    ]);

    (doc as any).autoTable({
      head: [
        [
          'No',
          'No. Invoice',
          'Tgl',
          'Pelanggan',
          'Sales',
          'Subtotal',
          'Diskon',
          'PPN',
          'Grand Total',
          'Dibayar',
          'Sisa',
          'Status',
        ],
      ],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [27, 38, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 30 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' },
        9: { halign: 'right' },
        10: { halign: 'right', textColor: [180, 0, 0] },
        11: { halign: 'center', fontStyle: 'bold' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ringkasan: Total Penjualan: ${formatRupiah(totalGrand)} | Total Pembayaran: ${formatRupiah(totalPaid)} | Total Piutang Belum Lunas: ${formatRupiah(totalDebt)}`, 14, finalY);

    doc.save(fileName);
  },

  /**
   * Generate Receivables Aging PDF
   */
  exportReceivablesReportToPdf(params: {
    items: Array<{
      invoiceNumber: string;
      customerName: string;
      invoiceDate: string;
      dueDate: string;
      grandTotal: number;
      amountPaid: number;
      remainingBalance: number;
      ageDays: number;
      ageCategory: string;
      status: string;
    }>;
    companyName: string;
    fileName?: string;
  }) {
    const { items, companyName, fileName = 'Laporan_Umur_Piutang.pdf' } = params;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), 14, 15);
    doc.setFontSize(11);
    doc.text('LAPORAN DAFTAR & UMUR PIUTANG (AGING RECEIVABLES)', 14, 21);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Per Tanggal: ${formatIndonesianDate(new Date())}`, 14, 27);

    const totalOutstanding = items.reduce((a, b) => a + b.remainingBalance, 0);

    const tableRows = items.map((item, idx) => [
      idx + 1,
      item.invoiceNumber,
      item.customerName,
      formatShortDate(item.invoiceDate),
      formatShortDate(item.dueDate),
      formatRupiah(item.grandTotal, false),
      formatRupiah(item.amountPaid, false),
      formatRupiah(item.remainingBalance, false),
      `${item.ageDays} Hari`,
      item.ageCategory,
      item.status.toUpperCase(),
    ]);

    (doc as any).autoTable({
      head: [
        [
          'No',
          'No. Invoice',
          'Pelanggan',
          'Tgl Inv',
          'Jatuh Tempo',
          'Total Nilai',
          'Dibayar',
          'Sisa Piutang',
          'Umur',
          'Kategori Umur',
          'Status',
        ],
      ],
      body: tableRows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [180, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 55 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold', textColor: [180, 0, 0] },
        8: { halign: 'center' },
        9: { halign: 'center' },
        10: { halign: 'center' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Keseluruhan Piutang Beredar: ${formatRupiah(totalOutstanding)}`, 14, finalY);

    doc.save(fileName);
  },

  /**
   * Export Services to Excel
   */
  exportServicesToExcel(services: any[], fileName = 'Master_Data_Jasa.xlsx') {
    const data = services.map((s, idx) => ({
      No: idx + 1,
      'Kode Layanan': s.code,
      'Nama Jasa': s.name,
      Kategori: s.category || '',
      Satuan: s.unit || 'Layanan',
      Tarif: s.price,
      Keterangan: s.description || '',
      Status: s.isActive ? 'Aktif' : 'Non-Aktif',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jasa Layanan');
    XLSX.writeFile(workbook, fileName);
  },

  /**
   * Aliases for imports
   */
  importCustomersFromExcel(file: File) {
    return this.parseCustomerExcel(file);
  },

  importProductsFromExcel(file: File) {
    return this.parseProductExcel(file);
  },
};


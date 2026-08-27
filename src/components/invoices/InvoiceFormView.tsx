import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Printer,
  Eye,
  ArrowLeft,
  Search,
  Building,
  UserCheck,
  Calendar,
  DollarSign,
  Percent,
  CreditCard,
  Check,
  AlertCircle,
  HelpCircle,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  Customer,
  Product,
  ServiceItem,
  SalesPerson,
  CompanySetting,
  InvoiceSetting,
  User,
  BankAccount,
} from '../../types';
import {
  calculateLineItem,
  calculateInvoiceSummary,
  formatRupiah,
} from '../../services/calculation';
import { StorageService } from '../../services/storage';

interface InvoiceFormViewProps {
  editInvoice?: Invoice | null;
  company: CompanySetting;
  invoiceSetting: InvoiceSetting;
  currentUser: User;
  customers: Customer[];
  products: Product[];
  services: ServiceItem[];
  salesList: SalesPerson[];
  onSaveInvoice: (invoice: Invoice, action: 'save' | 'save_and_print' | 'preview') => void;
  onCancel: () => void;
  onOpenNewCustomerModal: () => void;
}

export const InvoiceFormView: React.FC<InvoiceFormViewProps> = ({
  editInvoice,
  company,
  invoiceSetting,
  currentUser,
  customers,
  products,
  services,
  salesList,
  onSaveInvoice,
  onCancel,
  onOpenNewCustomerModal,
}) => {
  const isEditing = !!editInvoice;

  // Defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + (invoiceSetting.defaultDueDays || 14));
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  // --- FORM STATE ---
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    editInvoice?.invoiceNumber || StorageService.generateNextInvoiceNumber(todayStr)
  );
  const [poNumber, setPoNumber] = useState<string>(editInvoice?.poNumber || '');
  const [invoiceDate, setInvoiceDate] = useState<string>(editInvoice?.invoiceDate || todayStr);
  const [deliveryDate, setDeliveryDate] = useState<string>(editInvoice?.deliveryDate || '');
  const [dueDate, setDueDate] = useState<string>(editInvoice?.dueDate || defaultDueStr);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    editInvoice?.customerId || (customers.length > 0 ? customers[0].id : '')
  );
  const [selectedSalesId, setSelectedSalesId] = useState<string>(
    editInvoice?.salesId || (salesList.length > 0 ? salesList[0].id : '')
  );
  const [salesChannel, setSalesChannel] = useState<string>(
    editInvoice?.salesChannel || 'Direct B2B'
  );

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (editInvoice?.items && editInvoice.items.length > 0) {
      return editInvoice.items;
    }
    // Default initial row
    return [
      {
        id: `item-${Date.now()}`,
        itemType: 'product',
        itemId: products[0]?.id || '',
        code: products[0]?.code || 'PRD-01',
        name: products[0]?.name || '',
        description: products[0]?.description || '',
        quantity: 1,
        unit: products[0]?.unit || 'unit',
        unitPrice: products[0]?.sellingPrice || 0,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        isTaxable: true,
        totalPrice: products[0]?.sellingPrice || 0,
      },
    ];
  });

  // Invoice level discounts & taxes
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'percentage' | 'nominal'>(
    editInvoice?.invoiceDiscountType || 'nominal'
  );
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(
    editInvoice?.invoiceDiscountValue || 0
  );

  const [isPpnActive, setIsPpnActive] = useState<boolean>(
    editInvoice != null ? editInvoice.isPpnActive : (invoiceSetting?.isPpnActive ?? true)
  );
  const [ppnRate, setPpnRate] = useState<number>(
    editInvoice?.ppnRate !== undefined ? editInvoice.ppnRate : (invoiceSetting?.ppnRate ?? 11)
  );

  const [isMateraiActive, setIsMateraiActive] = useState<boolean>(
    editInvoice != null ? editInvoice.isMateraiActive : (invoiceSetting?.isMateraiActive ?? false)
  );
  const [materaiAmount, setMateraiAmount] = useState<number>(
    editInvoice?.materaiAmount !== undefined
      ? editInvoice.materaiAmount
      : (invoiceSetting?.materaiAmount ?? 10000)
  );

  // Additional metadata & Bank info
  const [notes, setNotes] = useState<string>(
    editInvoice?.notes || invoiceSetting.defaultNotes || ''
  );
  const [terms, setTerms] = useState<string>(
    editInvoice?.terms || invoiceSetting.defaultTerms || ''
  );
  const [bankAccountId, setBankAccountId] = useState<string>(
    editInvoice?.bankAccountId ||
      (company.bankAccounts.find((b) => b.isDefault)?.id || company.bankAccounts[0]?.id || '')
  );

  const [signatoryCustomerName, setSignatoryCustomerName] = useState<string>(
    editInvoice?.signatoryCustomerName || ''
  );
  const [signatorySalesName, setSignatorySalesName] = useState<string>(
    editInvoice?.signatorySalesName || invoiceSetting.defaultSignatorySalesName || ''
  );
  const [signatoryFinanceName, setSignatoryFinanceName] = useState<string>(
    editInvoice?.signatoryFinanceName || invoiceSetting.defaultSignatoryFinanceName || ''
  );

  // Error validation states
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Selected customer snapshot
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || editInvoice?.customerSnapshot;
  }, [customers, selectedCustomerId, editInvoice]);

  // Selected sales snapshot
  const currentSales = useMemo(() => {
    return salesList.find((s) => s.id === selectedSalesId) || editInvoice?.salesSnapshot;
  }, [salesList, selectedSalesId, editInvoice]);

  // Selected bank snapshot
  const currentBank = useMemo(() => {
    return company.bankAccounts.find((b) => b.id === bankAccountId);
  }, [company.bankAccounts, bankAccountId]);

  // Auto-fill signatory customer name when customer changes
  useEffect(() => {
    if (currentCustomer && !signatoryCustomerName) {
      setSignatoryCustomerName(currentCustomer.name || currentCustomer.companyName);
    }
  }, [currentCustomer]);

  // Regenerate number if date changes and not editing
  const handleDateChange = (newDate: string) => {
    setInvoiceDate(newDate);
    if (!isEditing) {
      const generated = StorageService.generateNextInvoiceNumber(newDate);
      setInvoiceNumber(generated);
    }
    // Also auto adjust due date if not manually changed
    const newDueDate = new Date(newDate);
    newDueDate.setDate(newDueDate.getDate() + (invoiceSetting.defaultDueDays || 14));
    setDueDate(newDueDate.toISOString().split('T')[0]);
  };

  // --- ITEM ACTIONS ---
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemType: 'product',
      itemId: '',
      code: '',
      name: '',
      description: '',
      quantity: 1,
      unit: 'unit',
      unitPrice: 0,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      isTaxable: true,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Invoice harus memiliki minimal 1 item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Auto-calculate line total
    const calc = calculateLineItem(item);
    item.discountAmount = calc.discountAmount;
    item.totalPrice = calc.totalPrice;

    updated[index] = item;
    setItems(updated);
  };

  const handleSelectCatalogItem = (index: number, type: 'product' | 'service', id: string) => {
    const updated = [...items];
    if (type === 'product') {
      const p = products.find((prod) => prod.id === id);
      if (p) {
        const item: InvoiceItem = {
          ...updated[index],
          itemType: 'product',
          itemId: p.id,
          code: p.code,
          name: p.name,
          description: p.description || '',
          unit: p.unit || 'unit',
          unitPrice: p.sellingPrice || 0,
          quantity: updated[index].quantity > 0 ? updated[index].quantity : 1,
        };
        const calc = calculateLineItem(item);
        item.discountAmount = calc.discountAmount;
        item.totalPrice = calc.totalPrice;
        updated[index] = item;
      }
    } else {
      const s = services.find((srv) => srv.id === id);
      if (s) {
        const item: InvoiceItem = {
          ...updated[index],
          itemType: 'service',
          itemId: s.id,
          code: s.code,
          name: s.name,
          description: s.description || '',
          unit: s.unit || 'paket',
          unitPrice: s.price || 0,
          quantity: updated[index].quantity > 0 ? updated[index].quantity : 1,
        };
        const calc = calculateLineItem(item);
        item.discountAmount = calc.discountAmount;
        item.totalPrice = calc.totalPrice;
        updated[index] = item;
      }
    }
    setItems(updated);
  };

  // --- SUMMARY CALCULATION ---
  const summary = useMemo(() => {
    return calculateInvoiceSummary({
      items,
      invoiceDiscountType,
      invoiceDiscountValue,
      isPpnActive,
      ppnRate,
      isMateraiActive,
      materaiAmount,
      materaiThreshold: invoiceSetting.materaiThreshold || 5000000,
      amountPaid: editInvoice?.amountPaid || 0,
    });
  }, [
    items,
    invoiceDiscountType,
    invoiceDiscountValue,
    isPpnActive,
    ppnRate,
    isMateraiActive,
    materaiAmount,
    invoiceSetting.materaiThreshold,
    editInvoice?.amountPaid,
  ]);

  // Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!invoiceNumber.trim()) errors.push('Nomor Invoice wajib diisi.');
    if (!selectedCustomerId || !currentCustomer) errors.push('Pelanggan (Customer) wajib dipilih.');
    if (!invoiceDate) errors.push('Tanggal Invoice wajib diisi.');
    if (!dueDate) errors.push('Tanggal Jatuh Tempo wajib diisi.');
    if (items.length === 0) errors.push('Invoice harus memiliki minimal 1 item.');

    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      if (!itm.name.trim()) {
        errors.push(`Item baris ke-${i + 1} belum memiliki nama barang/jasa.`);
      }
      if (itm.quantity <= 0) {
        errors.push(`Kuantitas baris ke-${i + 1} harus lebih besar dari 0.`);
      }
      if (itm.unitPrice < 0) {
        errors.push(`Harga satuan baris ke-${i + 1} tidak boleh negatif.`);
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSave = (statusTarget: 'draft' | 'sent', action: 'save' | 'save_and_print' | 'preview') => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!currentCustomer) return;

    const payload: Invoice = {
      id: editInvoice?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      poNumber: poNumber.trim(),
      invoiceDate,
      deliveryDate,
      dueDate,
      customerId: currentCustomer.id,
      customerSnapshot: currentCustomer,
      salesId: currentSales?.id,
      salesSnapshot: currentSales,
      salesChannel,
      items,
      subtotal: summary.subtotal,
      invoiceDiscountType,
      invoiceDiscountValue,
      invoiceDiscountAmount: summary.invoiceDiscountAmount,
      taxableBase: summary.taxableBase,
      isPpnActive,
      ppnRate,
      ppnAmount: summary.ppnAmount,
      isMateraiActive,
      materaiAmount: summary.materaiAmount,
      grandTotal: summary.grandTotal,
      amountPaid: summary.amountPaid,
      remainingBalance: summary.remainingBalance,
      terbilang: summary.terbilang,
      notes,
      terms,
      bankAccountId,
      bankAccountSnapshot: currentBank,
      signatoryCustomerName: signatoryCustomerName || currentCustomer.name,
      signatorySalesName: signatorySalesName || currentSales?.name,
      signatoryFinanceName: signatoryFinanceName || 'Pimpinan Keuangan',
      status: editInvoice?.status === 'paid' || editInvoice?.status === 'partial' ? editInvoice.status : statusTarget,
      createdAt: editInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
    };

    onSaveInvoice(payload, action);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Kembali ke Daftar Invoice"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing && editInvoice ? `Edit Invoice: ${editInvoice.invoiceNumber}` : 'Buat Invoice Baru'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Formulir penerbitan tagihan profesional resmi CV. MIZA MEDIATAMA
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSave('draft', 'save')}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('sent', 'preview')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview & Cetak</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave('sent', 'save')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Terbitkan</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Notice */}
      {formErrors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-700">
            <AlertCircle className="w-4 h-4" />
            <span>Harap lengkapi isian berikut sebelum menyimpan:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-rose-800">
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 1: HEADER & CUSTOMER INFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Metadata (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Informasi Tagihan (Invoice Header)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Invoice Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Invoice <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="INV/YYYY/MM/0001"
              />
              <span className="text-[10px] text-slate-400">Nomor otomatis terisi</span>
            </div>

            {/* PO Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. PO Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="PO-2026-..."
              />
            </div>

            {/* Sales Channel */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jalur Penjualan (Sales Channel)
              </label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Direct B2B">Direct B2B</option>
                <option value="Tender Instansi / SIPLah">Tender Instansi / SIPLah</option>
                <option value="Proyek Swasta">Proyek Swasta</option>
                <option value="Retail / Toko">Retail / Toko</option>
                <option value="Online / Marketplace">Online / Marketplace</option>
              </select>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Invoice <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pengiriman / Selesai
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jatuh Tempo (Due Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Customer Selector & Live Snapshot (Right 1 col) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Ditagihkan Kepada (Customer)</span>
              </div>
              <button
                type="button"
                onClick={onOpenNewCustomerModal}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                + Pelanggan Baru
              </button>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Pelanggan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="">-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details Snapshot Box */}
            {currentCustomer && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  {currentCustomer.companyName || currentCustomer.name}
                </div>
                {currentCustomer.companyName && (
                  <div className="text-slate-600 text-[11px]">Attn: {currentCustomer.name}</div>
                )}
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  {currentCustomer.address}, {currentCustomer.city} {currentCustomer.postalCode}
                </div>
                <div className="text-slate-500 text-[11px] pt-1 flex flex-wrap gap-x-3">
                  <span>Telp: {currentCustomer.phone || '-'}</span>
                  <span>NPWP: {currentCustomer.npwp || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sales Representative Picker */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sales / Marketing Penanggung Jawab
            </label>
            <select
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
            >
              <option value="">-- Tanpa Sales Khusus --</option>
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: DYNAMIC LINE ITEMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Rincian Barang & Jasa (Invoice Items)
            </h3>
            <p className="text-xs text-slate-500">
              Pilih produk/jasa dari katalog atau ketik langsung custom item
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baris Item</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[260px]">Barang / Jasa & Deskripsi Spesifikasi</th>
                <th className="py-3 px-3 w-20 text-center">Qty</th>
                <th className="py-3 px-3 w-24 text-center">Satuan</th>
                <th className="py-3 px-3 w-36 text-right">Harga Satuan</th>
                <th className="py-3 px-3 w-32 text-right">Diskon Item</th>
                <th className="py-3 px-3 w-36 text-right">Total</th>
                <th className="py-3 px-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="align-top hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-center text-slate-400 font-semibold pt-4">
                    {idx + 1}
                  </td>

                  {/* Item Selection & Description */}
                  <td className="py-3 px-3 space-y-2">
                    {/* Catalog Quick Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const [type, id] = val.split(':');
                          handleSelectCatalogItem(idx, type as any, id);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                        defaultValue=""
                      >
                        <option value="">⚡ Pilih Dari Master Data Katalog...</option>
                        <optgroup label="-- BARANG (PRODUCTS) --">
                          {products.map((p) => (
                            <option key={p.id} value={`product:${p.id}`}>
                              {p.code} - {p.name} ({formatRupiah(p.sellingPrice)})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="-- JASA (SERVICES) --">
                          {services.map((s) => (
                            <option key={s.id} value={`service:${s.id}`}>
                              {s.code} - {s.name} ({formatRupiah(s.price)})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Item Name Input */}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                      placeholder="Nama Barang / Jasa..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />

                    {/* Multi-line Description Input */}
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                      placeholder="Deskripsi rincian spesifikasi teknis, garansi, S/N (opsional)..."
                      className="w-full px-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-600 resize-y"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemFieldChange(idx, 'quantity', Math.max(1, Number(e.target.value)))
                      }
                      className="w-full text-center px-2 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                      placeholder="unit/pcs"
                      className="w-full text-center px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemFieldChange(idx, 'unitPrice', Math.max(0, Number(e.target.value)))
                      }
                      className="w-full text-right px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="text-[10px] text-right text-slate-400 mt-0.5">
                      {formatRupiah(item.unitPrice)}
                    </div>
                  </td>

                  {/* Item Discount */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={item.discountValue}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            'discountValue',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                      />
                      <select
                        value={item.discountType}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'discountType', e.target.value as any)
                        }
                        className="px-1.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold"
                      >
                        <option value="percentage">%</option>
                        <option value="nominal">Rp</option>
                      </select>
                    </div>
                    {item.discountAmount > 0 && (
                      <div className="text-[10px] text-right text-rose-600 mt-0.5">
                        - {formatRupiah(item.discountAmount)}
                      </div>
                    )}
                  </td>

                  {/* Line Total */}
                  <td className="py-3 px-3 text-right pt-4">
                    <div className="font-bold text-slate-900">{formatRupiah(item.totalPrice)}</div>
                  </td>

                  {/* Delete Item */}
                  <td className="py-3 px-3 text-center pt-3.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus baris item ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: SUMMARY, DISCOUNTS, TAX, MATERAI & SIGNATURES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Notes, Terms, Bank Account, Signatures */}
        <div className="lg:col-span-7 space-y-4">
          {/* Bank Payment Account Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Instruksi Rekening Pembayaran Resmi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilih Rekening Tujuan Transfer
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs font-medium"
                >
                  {company.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} (a.n. {b.accountHolder})
                    </option>
                  ))}
                </select>
              </div>

              {currentBank && (
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px]">
                  <div className="font-bold text-blue-900">{currentBank.bankName}</div>
                  <div className="font-mono text-sm font-bold text-blue-800 tracking-wide mt-0.5">
                    {currentBank.accountNumber}
                  </div>
                  <div className="text-blue-700">a.n. {currentBank.accountHolder}</div>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Catatan / Keterangan Khusus (Invoice Notes)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                placeholder="Misal: Nomor resi pengiriman, PO referensi, atau instruksi serah terima..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Syarat & Ketentuan (Terms & Conditions)
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-600"
              />
            </div>
          </div>

          {/* Signatures Setup Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="font-bold text-slate-900 text-xs sm:text-sm pb-2 border-b border-slate-100">
              Nama Pejabat Penandatangan Dokumen Invoice
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  1. {invoiceSetting.signatoryCustomerTitle || 'Penerima / Pelanggan'}
                </label>
                <input
                  type="text"
                  value={signatoryCustomerName}
                  onChange={(e) => setSignatoryCustomerName(e.target.value)}
                  placeholder="Nama Penerima..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  2. {invoiceSetting.signatorySalesTitle || 'Hormat Kami (Sales)'}
                </label>
                <input
                  type="text"
                  value={signatorySalesName}
                  onChange={(e) => setSignatorySalesName(e.target.value)}
                  placeholder="Nama Sales..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  3. {invoiceSetting.signatoryFinanceTitle || 'Mengetahui (Pimpinan)'}
                </label>
                <input
                  type="text"
                  value={signatoryFinanceName}
                  onChange={(e) => setSignatoryFinanceName(e.target.value)}
                  placeholder="Nama Pimpinan/Direktur..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Calculation Box & Grand Total */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Perhitungan Total Tagihan</span>
              <span className="text-xs text-blue-600 font-semibold">{items.length} Item</span>
            </div>

            {/* 1. Subtotal */}
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal Rincian Item:</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatRupiah(summary.subtotal)}
              </span>
            </div>

            {/* 2. Additional Invoice Discount */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Diskon Tambahan Invoice:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={invoiceDiscountValue}
                    onChange={(e) => setInvoiceDiscountValue(Math.max(0, Number(e.target.value)))}
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-medium text-xs focus:outline-none"
                  />
                  <select
                    value={invoiceDiscountType}
                    onChange={(e) => setInvoiceDiscountType(e.target.value as any)}
                    className="px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="percentage">%</option>
                    <option value="nominal">Rp</option>
                  </select>
                </div>
              </div>
              {summary.invoiceDiscountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium text-[11px]">
                  <span>Potongan Diskon:</span>
                  <span>- {formatRupiah(summary.invoiceDiscountAmount)}</span>
                </div>
              )}
            </div>

            {/* 3. Taxable Base (DPP) */}
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-semibold text-slate-800">
                {formatRupiah(summary.taxableBase)}
              </span>
            </div>

            {/* 4. PPN Section */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPpnActive}
                    onChange={(e) => setIsPpnActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span>Kenakan PPN</span>
                </label>

                {isPpnActive && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ppnRate}
                      onChange={(e) => setPpnRate(Math.max(0, Number(e.target.value)))}
                      className="w-14 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-right font-medium text-xs focus:outline-none"
                    />
                    <span className="font-semibold text-slate-600">%</span>
                  </div>
                )}
              </div>

              {isPpnActive && (
                <div className="flex justify-between text-slate-800 text-[11px] font-medium pt-1 border-t border-slate-200/50">
                  <span>Nilai PPN ({ppnRate}%):</span>
                  <span className="font-bold text-slate-900">{formatRupiah(summary.ppnAmount)}</span>
                </div>
              )}
            </div>

            {/* 5. Materai Section */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isMateraiActive}
                    onChange={(e) => setIsMateraiActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
                  />
                  <span>Bea Materai</span>
                </label>

                {isMateraiActive && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[11px]">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={materaiAmount}
                      onChange={(e) => setMateraiAmount(Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-right font-medium text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {isMateraiActive && (
                <div className="flex justify-between text-slate-800 text-[11px] font-medium pt-1 border-t border-slate-200/50">
                  <span>Nominal Materai:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(summary.materaiAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* 6. Grand Total Highlight Box */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-300">
                  GRAND TOTAL
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {formatRupiah(summary.grandTotal)}
                </span>
              </div>

              {/* Terbilang Box */}
              <div className="pt-2 border-t border-blue-800/80">
                <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                  Terbilang:
                </div>
                <div className="text-xs italic text-blue-100 font-medium leading-relaxed mt-0.5">
                  "{summary.terbilang}"
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating-style Action Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSave('sent', 'save')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terbitkan Tagihan</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSave('sent', 'preview')}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview & Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave('draft', 'save')}
                className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Simpan Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

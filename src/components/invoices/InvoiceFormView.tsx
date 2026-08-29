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
  X,
  Tag,
  Filter,
  Layers,
  TrendingUp,
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
  resolveItemCostPrice,
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
      return editInvoice.items.map((it) => {
        const cost = resolveItemCostPrice(it, products, services);
        const qty = Number(it.quantity) || 1;
        return {
          ...it,
          costPrice: cost,
          totalCost: qty * cost,
        };
      });
    }
    const defaultProd = products[0];
    const defaultCost = defaultProd ? (defaultProd.costPrice ?? defaultProd.purchasePrice ?? 0) : 0;
    // Default initial row
    return [
      {
        id: `item-${Date.now()}`,
        itemType: 'product',
        itemId: defaultProd?.id || '',
        code: defaultProd?.code || 'PRD-01',
        name: defaultProd?.name || '',
        description: defaultProd?.description || '',
        quantity: 1,
        unit: defaultProd?.unit || 'unit',
        costPrice: defaultCost,
        totalCost: defaultCost,
        unitPrice: defaultProd?.sellingPrice || 0,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        isTaxable: true,
        totalPrice: defaultProd?.sellingPrice || 0,
      },
    ];
  });

  // Catalog Picker Modal State
  const [catalogModalTargetIndex, setCatalogModalTargetIndex] = useState<number | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');

  // Grouped products by category for fast navigation
  const categorizedProducts = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const cat = (p.category && p.category.trim()) || 'Umum / Lainnya';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  const categorizedServices = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    services.forEach((s) => {
      const cat = (s.category && s.category.trim()) || 'Jasa & Layanan';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  const allCategoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

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
  const [taxCalculationType, setTaxCalculationType] = useState<'exclusive' | 'inclusive'>(
    editInvoice?.taxCalculationType || invoiceSetting?.defaultTaxCalculationType || 'exclusive'
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
  const [showPaymentInfo, setShowPaymentInfo] = useState<boolean>(
    editInvoice?.showPaymentInfo !== undefined
      ? editInvoice.showPaymentInfo
      : (invoiceSetting?.showPaymentInfo ?? true)
  );

  const [signatoryCustomerName, setSignatoryCustomerName] = useState<string>(
    editInvoice?.signatoryCustomerName || ''
  );
  const [signatorySalesName, setSignatorySalesName] = useState<string>(
    editInvoice?.signatorySalesName || invoiceSetting.defaultSignatorySalesName || salesList[0]?.name || currentUser?.name || ''
  );
  const [signatoryWarehouseName, setSignatoryWarehouseName] = useState<string>(
    editInvoice?.signatoryWarehouseName || 'Bagian Logistik / Gudang'
  );
  const [signatoryFinanceName, setSignatoryFinanceName] = useState<string>(
    editInvoice?.signatoryFinanceName || invoiceSetting.defaultSignatoryFinanceName || 'Bagian Keuangan'
  );
  const [signatoryAdminName, setSignatoryAdminName] = useState<string>(
    editInvoice?.signatoryAdminName || company.directorName || 'Ahmad Miza, S.T.'
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

  // Auto-fill signatory customer name when customer changes (auto-fill from school Contact Person)
  useEffect(() => {
    if (currentCustomer && (!signatoryCustomerName || !isEditing)) {
      setSignatoryCustomerName(
        currentCustomer.contactPerson || currentCustomer.name || currentCustomer.companyName || ''
      );
    }
  }, [currentCustomer, isEditing]);

  // Auto-fill signatory marketing/operator name when sales changes (for new invoice)
  useEffect(() => {
    if (currentSales && !isEditing && (!signatorySalesName || signatorySalesName === invoiceSetting.defaultSignatorySalesName)) {
      setSignatorySalesName(currentSales.name);
    }
  }, [currentSales]);

  // Set Quick Invoice Date Presets
  const setQuickInvoiceDate = (type: 'today' | 'yesterday' | 'month_start') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    } else if (type === 'month_start') {
      d.setDate(1);
    }
    const dateStr = d.toISOString().split('T')[0];
    handleDateChange(dateStr);
  };

  // Set Quick Term / Due Date Presets
  const setQuickDueDays = (days: number) => {
    const base = invoiceDate ? new Date(invoiceDate) : new Date();
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
  };

  // Calculate day difference between invoice date and due date
  const dueDayDiff = useMemo(() => {
    if (!invoiceDate || !dueDate) return null;
    const d1 = new Date(invoiceDate);
    const d2 = new Date(dueDate);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  }, [invoiceDate, dueDate]);

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
    const defaultProd = products[0];
    const defaultCost = defaultProd ? (defaultProd.costPrice ?? defaultProd.purchasePrice ?? 0) : 0;
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemType: 'product',
      itemId: '',
      code: '',
      name: '',
      description: '',
      quantity: 1,
      unit: 'unit',
      costPrice: defaultCost,
      totalCost: defaultCost,
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

    // Auto-calculate line total and modal
    const calc = calculateLineItem(item);
    item.discountAmount = calc.discountAmount;
    item.totalPrice = calc.totalPrice;
    item.totalCost = (item.quantity || 0) * (item.costPrice || 0);

    updated[index] = item;
    setItems(updated);
  };

  const handleSelectCatalogItem = (index: number, type: 'product' | 'service', id: string) => {
    const updated = [...items];
    if (type === 'product') {
      const p = products.find((prod) => prod.id === id);
      if (p) {
        const costPrice = p.costPrice ?? p.purchasePrice ?? 0;
        const qty = updated[index].quantity > 0 ? updated[index].quantity : 1;
        const item: InvoiceItem = {
          ...updated[index],
          itemType: 'product',
          itemId: p.id,
          code: p.code,
          name: p.name,
          description: p.description || '',
          unit: p.unit || 'unit',
          costPrice: costPrice,
          totalCost: qty * costPrice,
          unitPrice: p.sellingPrice || 0,
          quantity: qty,
        };
        const calc = calculateLineItem(item);
        item.discountAmount = calc.discountAmount;
        item.totalPrice = calc.totalPrice;
        updated[index] = item;
      }
    } else {
      const s = services.find((srv) => srv.id === id);
      if (s) {
        const costPrice = s.costPrice ?? 0;
        const qty = updated[index].quantity > 0 ? updated[index].quantity : 1;
        const item: InvoiceItem = {
          ...updated[index],
          itemType: 'service',
          itemId: s.id,
          code: s.code,
          name: s.name,
          description: s.description || '',
          unit: s.unit || 'paket',
          costPrice: costPrice,
          totalCost: qty * costPrice,
          unitPrice: s.price || 0,
          quantity: qty,
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
      taxCalculationType,
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
    taxCalculationType,
    isMateraiActive,
    materaiAmount,
    invoiceSetting.materaiThreshold,
    editInvoice?.amountPaid,
  ]);

  // Filtered items for Catalog Browser Modal
  const liveTotalHpp = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * resolveItemCostPrice(it, products, services),
      0
    );
  }, [items, products, services]);

  const liveGrossProfit = useMemo(() => {
    return summary.taxableBase - liveTotalHpp;
  }, [summary.taxableBase, liveTotalHpp]);

  const liveProfitMargin = useMemo(() => {
    return summary.taxableBase > 0 ? (liveGrossProfit / summary.taxableBase) * 100 : 0;
  }, [summary.taxableBase, liveGrossProfit]);

  const modalCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        catalogCategoryFilter === 'all' ||
        (p.category && p.category.trim().toLowerCase() === catalogCategoryFilter.toLowerCase());
      const query = catalogSearchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });
  }, [products, catalogCategoryFilter, catalogSearchQuery]);

  const modalCatalogServices = useMemo(() => {
    if (catalogCategoryFilter !== 'all' && !catalogCategoryFilter.toLowerCase().includes('jasa')) {
      return [];
    }
    return services.filter((s) => {
      const query = catalogSearchQuery.trim().toLowerCase();
      return (
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    });
  }, [services, catalogCategoryFilter, catalogSearchQuery]);

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

    const totalHpp = liveTotalHpp;
    const grossProfit = liveGrossProfit;

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
      taxCalculationType,
      ppnAmount: summary.ppnAmount,
      isMateraiActive,
      materaiAmount: summary.materaiAmount,
      grandTotal: summary.grandTotal,
      amountPaid: summary.amountPaid,
      remainingBalance: summary.remainingBalance,
      totalHpp,
      grossProfit,
      terbilang: summary.terbilang,
      notes,
      terms,
      bankAccountId,
      bankAccountSnapshot: currentBank,
      showPaymentInfo,
      signatoryCustomerName:
        signatoryCustomerName.trim() ||
        currentCustomer.contactPerson ||
        currentCustomer.name ||
        currentCustomer.companyName ||
        '-',
      signatorySalesName: signatorySalesName || currentSales?.name || currentUser.name || 'Marketing',
      signatoryWarehouseName: signatoryWarehouseName || 'Bagian Logistik / Gudang',
      signatoryFinanceName: signatoryFinanceName || 'Bagian Keuangan',
      signatoryAdminName: signatoryAdminName || company.directorName || 'Ahmad Miza, S.T.',
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Tanggal Invoice <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickInvoiceDate('today')}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Hari Ini
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setQuickInvoiceDate('yesterday')}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400">Tanggal faktur diterbitkan</span>
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
              <span className="text-[10px] text-slate-400">Opsional jika ada serah terima</span>
            </div>

            {/* Due Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Jatuh Tempo (Due Date) <span className="text-rose-500">*</span>
                </label>
                {dueDayDiff !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      dueDayDiff < 0
                        ? 'bg-rose-100 text-rose-700'
                        : dueDayDiff === 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {dueDayDiff === 0 ? 'Cash / Hari Ini' : `${dueDayDiff} Hari`}
                  </span>
                )}
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {/* Quick Due Date Presets */}
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 mr-0.5">Tempo:</span>
                {[
                  { label: '0h', days: 0 },
                  { label: '7h', days: 7 },
                  { label: '14h', days: 14 },
                  { label: '30h', days: 30 },
                  { label: '60h', days: 60 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setQuickDueDays(preset.days)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[10px] font-medium rounded-md transition-colors cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
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
                onChange={(e) => {
                  const custId = e.target.value;
                  setSelectedCustomerId(custId);
                  const found = customers.find((c) => c.id === custId);
                  if (found) {
                    setSignatoryCustomerName(
                      found.name || found.contactPerson || found.companyName || ''
                    );
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="">-- Pilih Pelanggan (Nama Sekolah / Instansi & Kontak Person) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} — ${c.name || c.contactPerson}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details Snapshot Box */}
            {currentCustomer && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Nama Sekolah / Instansi</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {currentCustomer.companyName || currentCustomer.name}
                  </div>
                </div>
                {(currentCustomer.name || currentCustomer.contactPerson) && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Nama Kontak Person</div>
                    <div className="text-blue-700 font-bold text-xs">
                      {currentCustomer.name || currentCustomer.contactPerson}
                    </div>
                  </div>
                )}
                <div className="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-slate-200/60">
                  {currentCustomer.address}, {currentCustomer.city} {currentCustomer.postalCode}
                </div>
                <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-3">
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
                <th className="py-3 px-3 min-w-[280px]">Barang / Jasa & Deskripsi Spesifikasi</th>
                <th className="py-3 px-2 w-20 text-center">Qty</th>
                <th className="py-3 px-3 w-36 text-right">
                  <span>Harga Jual</span>
                  <span className="block text-[10px] font-normal text-slate-400">Otomatis Master</span>
                </th>
                <th className="py-3 px-2 w-28 text-right">Diskon</th>
                <th className="py-3 px-3 w-36 text-right">Total Jual</th>
                <th className="py-3 px-2 w-10 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                return (
                  <tr key={item.id} className="align-top hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-400 font-semibold pt-4">
                      {idx + 1}
                    </td>

                    {/* Item Selection & Description */}
                    <td className="py-3 px-3 space-y-2">
                      {/* Catalog Quick Selector & Modal Trigger */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const [type, id] = val.split(':');
                            handleSelectCatalogItem(idx, type as any, id);
                          }}
                          className="flex-1 min-w-[200px] px-2.5 py-1.5 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          defaultValue=""
                        >
                          <option value="">⚡ Pilih Dari Master Data Katalog...</option>
                          {categorizedProducts.map(([categoryName, prodList]) => (
                            <optgroup key={categoryName} label={`📦 KATEGORI: ${categoryName.toUpperCase()}`}>
                              {prodList.map((p) => (
                                <option key={p.id} value={`product:${p.id}`}>
                                  {p.code} - {p.name} ({formatRupiah(p.sellingPrice || 0)})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          {categorizedServices.length > 0 && (
                            categorizedServices.map(([categoryName, srvList]) => (
                              <optgroup key={categoryName} label={`🛠️ KATEGORI: ${categoryName.toUpperCase()}`}>
                                {srvList.map((s) => (
                                  <option key={s.id} value={`service:${s.id}`}>
                                    {s.code} - {s.name} ({formatRupiah(s.price || 0)})
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setCatalogModalTargetIndex(idx);
                            setCatalogSearchQuery('');
                            setCatalogCategoryFilter('all');
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Buka katalog barang dengan pencarian dan filter kategori lengkap"
                        >
                          <Search className="w-3 h-3" />
                          <span>Cari Katalog</span>
                        </button>
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

                      {/* HPP / Modal Entry & Item Profit Breakdown */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-slate-50/70 p-2 rounded-xl text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <span>HPP / Modal Satuan:</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.costPrice || 0}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  idx,
                                  'costPrice',
                                  Math.max(0, Number(e.target.value))
                                )
                              }
                              placeholder="0"
                              className="w-28 px-2 py-1 bg-white border border-amber-200/80 rounded-lg text-right font-bold text-amber-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            (Total Modal: {formatRupiah((item.quantity || 0) * (item.costPrice || 0))})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-slate-500 font-medium">Est. Laba Item:</span>
                          <span
                            className={`font-mono font-bold ${
                              (item.totalPrice || 0) - (item.quantity || 0) * (item.costPrice || 0) >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {formatRupiah(
                              (item.totalPrice || 0) - (item.quantity || 0) * (item.costPrice || 0)
                            )}
                          </span>
                          {item.totalPrice > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                              {(
                                (((item.totalPrice || 0) -
                                  (item.quantity || 0) * (item.costPrice || 0)) /
                                  item.totalPrice) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-2">
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

                    {/* Unit Price (Selling Price - Otomatis terisi dari master) */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'unitPrice', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full text-right px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="text-[10px] text-right text-slate-400 mt-0.5">
                        {formatRupiah(item.unitPrice)}
                      </div>
                    </td>

                    {/* Item Discount */}
                    <td className="py-3 px-2">
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
                          className="w-full text-right px-1.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        />
                        <select
                          value={item.discountType}
                          onChange={(e) =>
                            handleItemFieldChange(idx, 'discountType', e.target.value as any)
                          }
                          className="px-1 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-semibold"
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
                    <td className="py-3 px-3 text-right pt-3.5">
                      <div className="font-bold text-slate-900 text-sm">{formatRupiah(item.totalPrice)}</div>
                    </td>

                    {/* Delete Item */}
                    <td className="py-3 px-2 text-center pt-3.5">
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
                );
              })}
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
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Instruksi Rekening Pembayaran Resmi</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={showPaymentInfo}
                  onChange={(e) => setShowPaymentInfo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Tampilkan di Invoice Cetak</span>
              </label>
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
                {!showPaymentInfo && (
                  <p className="text-[10.5px] text-amber-600 mt-1 font-medium">
                    ⚠️ Info transfer rekening ini disembunyikan pada cetakan invoice.
                  </p>
                )}
              </div>

              {currentBank && (
                <div className={`p-3 rounded-xl border text-[11px] transition-all ${
                  showPaymentInfo ? 'bg-blue-50/60 border-blue-100' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-blue-900">{currentBank.bankName}</div>
                    {!showPaymentInfo && (
                      <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        Disembunyikan
                      </span>
                    )}
                  </div>
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
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <label className="block font-semibold text-slate-800">
                  Syarat &amp; Ketentuan (Terms &amp; Conditions)
                </label>
                <div className="flex items-center gap-2 text-[10.5px]">
                  {invoiceSetting?.defaultTerms && (
                    <button
                      type="button"
                      onClick={() => setTerms(invoiceSetting.defaultTerms)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
                      title="Kembalikan ke isi Default Pengaturan"
                    >
                      ↺ Muat Default Pengaturan
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Tuliskan syarat & ketentuan pembayaran untuk faktur ini..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-700 leading-relaxed"
              />
            </div>
          </div>

          {/* Signatures Setup Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                Nama Penandatangan Dokumen Invoice (PENERIMA & HORMAT KAMI)
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Tercetak rapi di bawah Syarat & Ketentuan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    1. PENERIMA / Pelanggan
                  </label>
                  {currentCustomer && (currentCustomer.contactPerson || currentCustomer.name) && (
                    <button
                      type="button"
                      onClick={() =>
                        setSignatoryCustomerName(
                          currentCustomer.contactPerson || currentCustomer.name || currentCustomer.companyName || ''
                        )
                      }
                      className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      title="Gunakan Kontak Person Sekolah"
                    >
                      Kontak: {currentCustomer.contactPerson || currentCustomer.name}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={signatoryCustomerName}
                  onChange={(e) => setSignatoryCustomerName(e.target.value)}
                  placeholder="Nama Penerima (Otomatis dari Kontak Person Sekolah)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Otomatis terisi dari nama Kontak Person Sekolah / Instansi
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    2. HORMAT KAMI (Nama Sales / Pengirim)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {currentSales && (
                      <button
                        type="button"
                        onClick={() => setSignatorySalesName(currentSales.name)}
                        className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                        title="Gunakan nama Sales yang bertugas"
                      >
                        Sales: {currentSales.name}
                      </button>
                    )}
                    {currentUser?.name && (
                      <button
                        type="button"
                        onClick={() => setSignatorySalesName(currentUser.name)}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                        title="Gunakan nama Operator yang sedang login"
                      >
                        Operator: {currentUser.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={signatorySalesName}
                  onChange={(e) => setSignatorySalesName(e.target.value)}
                  placeholder={`Nama Penandatangan Hormat Kami (contoh: ${currentSales?.name || 'Budi Prasetyo'})...`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
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

            {/* 3. PPN & Tax Scheme Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isPpnActive}
                    onChange={(e) => setIsPpnActive(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
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
                      className="w-14 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs focus:outline-none focus:border-indigo-600"
                    />
                    <span className="font-bold text-slate-600">%</span>
                  </div>
                )}
              </div>

              {isPpnActive && (
                <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">
                    Skema Input Harga Barang:
                  </div>

                  {/* Radio / Toggle for Inclusive vs Exclusive */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTaxCalculationType('exclusive')}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        taxCalculationType === 'exclusive'
                          ? 'bg-white border-indigo-600 ring-1 ring-indigo-500 font-bold text-indigo-900 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${taxCalculationType === 'exclusive' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                        <span>Harga Belum Termasuk PPN</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 pl-3.5">
                        PPN {ppnRate}% ditambahkan
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaxCalculationType('inclusive')}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        taxCalculationType === 'inclusive'
                          ? 'bg-white border-emerald-600 ring-1 ring-emerald-500 font-bold text-emerald-900 shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${taxCalculationType === 'inclusive' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span>Harga Termasuk PPN</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-normal mt-0.5 pl-3.5">
                        DPP & PPN otomatis terpisah
                      </div>
                    </button>
                  </div>

                  {/* Dynamic Calculation Info Box */}
                  {taxCalculationType === 'inclusive' ? (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <span>✓ Harga Termasuk Pajak (Include PPN)</span>
                      </div>
                      <div className="text-emerald-800 text-[10px] leading-relaxed">
                        Nilai yang diinputkan adalah harga final. Sistem secara otomatis menghitung DPP dan PPN:
                      </div>
                      <div className="pt-1 flex justify-between border-t border-emerald-200/60 font-medium text-emerald-900">
                        <span>Dasar Pengenaan Pajak (DPP):</span>
                        <span className="font-mono font-bold">{formatRupiah(summary.taxableBase)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-900 font-medium">
                        <span>Nilai PPN ({ppnRate}%):</span>
                        <span className="font-mono font-bold">{formatRupiah(summary.ppnAmount)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span>Dasar Pengenaan Pajak (DPP):</span>
                        <span className="font-mono font-semibold text-slate-900">{formatRupiah(summary.taxableBase)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-900 font-medium">
                        <span>Nilai PPN ({ppnRate}%):</span>
                        <span className="font-mono font-bold text-indigo-950">+ {formatRupiah(summary.ppnAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* If PPN is NOT active, still show simple DPP */}
            {!isPpnActive && (
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                <span>Dasar Pengenaan Pajak (DPP):</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(summary.taxableBase)}
                </span>
              </div>
            )}

            {/* 4. Materai Section */}
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
                      step="any"
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

            {/* 5. Real-time Laba & HPP Live Analysis Card */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-slate-100 rounded-xl border border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kalkulasi Otomatis Laba & HPP</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-normal">
                  Real-Time
                </span>
              </div>
              <div className="space-y-1.5 text-xs pt-1.5 border-t border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>Total Biaya Pokok (HPP):</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatRupiah(liveTotalHpp)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200 font-bold pt-1.5 border-t border-slate-800/80">
                  <span>Estimasi Laba Kotor:</span>
                  <div className="text-right flex items-center gap-1.5">
                    <span
                      className={`font-mono text-sm ${
                        liveGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {liveGrossProfit >= 0 ? '+' : ''}
                      {formatRupiah(liveGrossProfit)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                      {liveProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
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

      {/* CATALOG BROWSER & SEARCH MODAL (GROUPED BY CATEGORY) */}
      {catalogModalTargetIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Pilih Item Katalog Master (Dikelompokkan per Kategori)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Memilih item untuk Baris #{catalogModalTargetIndex + 1} — Harga Jual otomatis terisi dari Master Data
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModalTargetIndex(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Category Filter Pills */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  placeholder="Cari kode barang, nama item, atau spesifikasi teknis..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs font-medium"
                  autoFocus
                />
                {catalogSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3 h-3" /> Kategori:
                </span>
                <button
                  type="button"
                  onClick={() => setCatalogCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    catalogCategoryFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({products.length + services.length})
                </button>
                {allCategoriesList.map((cat) => {
                  const count = products.filter((p) => (p.category || '').trim() === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        catalogCategoryFilter === cat
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📦 {cat} ({count})
                    </button>
                  );
                })}
                {services.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCatalogCategoryFilter('Jasa & Layanan')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      catalogCategoryFilter === 'Jasa & Layanan'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🛠️ Jasa & Layanan ({services.length})
                  </button>
                )}
              </div>
            </div>

            {/* Modal Catalog Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
              {modalCatalogProducts.length === 0 && modalCatalogServices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Tidak ada item yang sesuai filter pencarian</p>
                  <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau pilih kategori lain</p>
                </div>
              ) : (
                <>
                  {modalCatalogProducts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>Katalog Barang ({modalCatalogProducts.length} item)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {modalCatalogProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex flex-col justify-between group shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-md">
                                  {prod.code}
                                </span>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md">
                                  {prod.category || 'Umum'}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 transition-colors">
                                {prod.name}
                              </div>
                              {prod.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {prod.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Harga Jual:</div>
                                <div className="text-sm font-bold text-blue-600 font-mono">
                                  {formatRupiah(prod.sellingPrice || 0)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectCatalogItem(catalogModalTargetIndex, 'product', prod.id);
                                  setCatalogModalTargetIndex(null);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Pilih Item</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalCatalogServices.length > 0 && (
                    <div className="space-y-2 pt-4">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Katalog Jasa & Layanan ({modalCatalogServices.length} item)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {modalCatalogServices.map((srv) => (
                          <div
                            key={srv.id}
                            className="p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all flex flex-col justify-between group shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-md">
                                  {srv.code}
                                </span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md">
                                  {srv.category || 'Jasa & Layanan'}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-700 transition-colors">
                                {srv.name}
                              </div>
                              {srv.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {srv.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Harga Jual:</div>
                                <div className="text-sm font-bold text-indigo-600 font-mono">
                                  {formatRupiah(srv.price || 0)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectCatalogItem(catalogModalTargetIndex, 'service', srv.id);
                                  setCatalogModalTargetIndex(null);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Pilih Jasa</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCatalogModalTargetIndex(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

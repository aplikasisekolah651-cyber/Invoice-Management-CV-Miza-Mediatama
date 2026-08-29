export type RoleType = 'admin' | 'operator' | 'manager';

export interface UserPermissions {
  // Faktur / Invoices
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canCancelInvoice: boolean;
  // Pembayaran / Payments
  canRecordPayment: boolean;
  canDeletePayment: boolean;
  // Master Data & Katalog
  canManageCustomers: boolean;
  canManageProducts: boolean;
  canManageServices: boolean;
  canManageSales: boolean;
  // Laporan / Reports
  canViewReports: boolean;
  canExportReports: boolean;
  // Pengaturan & Administrasi
  canManageCompanySettings: boolean;
  canManageInvoiceSettings: boolean;
  canManageUsers: boolean;
  canBackupRestore: boolean;
}

export function getDefaultPermissions(role: RoleType): UserPermissions {
  if (role === 'admin') {
    return {
      canCreateInvoice: true,
      canEditInvoice: true,
      canDeleteInvoice: true,
      canCancelInvoice: true,
      canRecordPayment: true,
      canDeletePayment: true,
      canManageCustomers: true,
      canManageProducts: true,
      canManageServices: true,
      canManageSales: true,
      canViewReports: true,
      canExportReports: true,
      canManageCompanySettings: true,
      canManageInvoiceSettings: true,
      canManageUsers: true,
      canBackupRestore: true,
    };
  }
  if (role === 'manager') {
    return {
      canCreateInvoice: false,
      canEditInvoice: false,
      canDeleteInvoice: false,
      canCancelInvoice: false,
      canRecordPayment: false,
      canDeletePayment: false,
      canManageCustomers: false,
      canManageProducts: false,
      canManageServices: false,
      canManageSales: false,
      canViewReports: true,
      canExportReports: true,
      canManageCompanySettings: false,
      canManageInvoiceSettings: false,
      canManageUsers: false,
      canBackupRestore: false,
    };
  }
  // operator
  return {
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canCancelInvoice: false,
    canRecordPayment: true,
    canDeletePayment: false,
    canManageCustomers: true,
    canManageProducts: true,
    canManageServices: true,
    canManageSales: true,
    canViewReports: false,
    canExportReports: false,
    canManageCompanySettings: false,
    canManageInvoiceSettings: false,
    canManageUsers: false,
    canBackupRestore: false,
  };
}

export interface User {
  id: string;
  username: string; // Username untuk login (bukan email)
  name: string; // Nama lengkap
  email: string;
  password?: string;
  role: RoleType;
  permissions?: UserPermissions;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface CompanySetting {
  name: string;
  tagline?: string;
  logoUrl?: string;
  directorName?: string; // Nama Direktur / Pimpinan yang menandatangani di setiap laporan
  directorTitle?: string; // Jabatan resmi (e.g., Direktur, Pimpinan CV, Direktur Utama)
  address: string;
  rtRw: string;
  village: string; // Desa/Kelurahan
  district: string; // Kecamatan
  city: string; // Kabupaten/Kota
  province: string;
  postalCode: string;
  npwp: string;
  phone: string;
  email: string;
  website: string;
  bankAccounts: BankAccount[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault: boolean;
}

export interface InvoiceSetting {
  numberFormat: string; // e.g. "INV/{YEAR}/{MONTH}/{SEQ}"
  prefix: string; // e.g. "INV"
  seqPadding: number; // e.g. 4 -> 0001
  resetFrequency: 'monthly' | 'yearly' | 'never';
  defaultDueDays: number; // e.g. 14
  isPpnActive: boolean;
  ppnRate: number; // e.g. 11 or 12 (%)
  defaultTaxCalculationType?: 'exclusive' | 'inclusive'; // exclusive = belum termasuk pajak, inclusive = sudah termasuk pajak
  isMateraiActive: boolean;
  materaiAmount: number; // e.g. 10000
  materaiThreshold: number; // e.g. 5000000 (auto apply if grand subtotal >= 5jt)
  defaultNotes: string;
  defaultTerms: string;
  signatoryCustomerTitle: string;
  signatorySalesTitle: string;
  signatoryFinanceTitle: string;
  defaultSignatorySalesName: string;
  defaultSignatoryFinanceName: string;
  showPaymentInfo?: boolean; // Tampilkan informasi rekening bank / transfer pembayaran
}

export interface Customer {
  id: string;
  code: string; // e.g. CUST-001
  name: string;
  companyName: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  npwp?: string;
  nik?: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  type?: 'product' | 'service' | 'both';
  description?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  code: string;
  name: string; // e.g. "Pcs", "Unit", "Box", "Set", "Paket", "Jam", "Hari"
  symbol?: string;
}

export interface Product {
  id: string;
  code: string;
  sku?: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  category?: string;
  unit: string;
  costPrice: number; // Harga beli / Modal (HPP)
  purchasePrice?: number; // Alias for costPrice
  sellingPrice: number; // Harga jual
  stock?: number;
  minStock?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number; // Harga modal / HPP operasional jasa
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface SalesPerson {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  commissionRate: number; // e.g. 5%
  isActive: boolean;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  itemType: 'product' | 'service' | 'custom';
  itemId?: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  costPrice?: number; // Harga modal / HPP per unit
  totalCost?: number; // Total modal = quantity * costPrice
  unitPrice: number; // Harga jual per unit
  discountType: 'percentage' | 'nominal';
  discountValue: number;
  discountAmount: number;
  isTaxable: boolean;
  totalPrice: number; // (quantity * unitPrice) - discountAmount
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poNumber?: string;
  invoiceDate: string; // YYYY-MM-DD
  deliveryDate?: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  customerId: string;
  customerSnapshot: Customer; // Stored snapshot at invoice time
  salesId?: string;
  salesSnapshot?: SalesPerson;
  salesChannel?: string; // e.g. "Direct", "Tender", "Project B2B", "Online"
  items: InvoiceItem[];
  
  // Financial calculation breakdown
  subtotal: number;
  invoiceDiscountType: 'percentage' | 'nominal';
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number;
  
  taxableBase: number;
  isPpnActive: boolean;
  ppnRate: number;
  ppnAmount: number;
  taxCalculationType?: 'exclusive' | 'inclusive';
  
  isMateraiActive: boolean;
  materaiAmount: number;
  
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;

  // Laba Rugi & HPP metadata
  totalHpp?: number; // Total harga pokok / modal
  grossProfit?: number; // Laba kotor = taxableBase - totalHpp
  
  terbilang: string; // Indonesian words
  
  notes?: string;
  terms?: string;
  bankAccountId?: string;
  bankAccountSnapshot?: BankAccount;
  showPaymentInfo?: boolean; // Tampilkan rekening / transfer info pada cetak
  
  signatoryCustomerName?: string;
  signatorySalesName?: string;
  signatoryWarehouseName?: string;
  signatoryAdminName?: string;
  signatoryFinanceName?: string;
  
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PAY/2026/08/0001
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: 'Transfer Bank' | 'Cash' | 'QRIS' | 'Giro/Cek' | 'E-Wallet' | 'Lainnya';
  bankAccountId?: string;
  bankAccountInfo?: string;
  referenceNumber?: string; // No referensi transaksi
  notes?: string;
  proofUrl?: string;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: RoleType;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_INVOICE' | 'UPDATE_INVOICE' | 'DELETE_INVOICE' | 'RECORD_PAYMENT' | 'CANCEL_INVOICE' | 'UPDATE_SETTINGS' | 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER' | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'BACKUP_DB' | 'RESTORE_DB';
  module: 'AUTH' | 'INVOICE' | 'PAYMENT' | 'CUSTOMER' | 'PRODUCT' | 'SERVICE' | 'SETTINGS' | 'SYSTEM';
  recordId?: string;
  recordIdentifier?: string; // e.g. "INV/2026/08/0001"
  details: string;
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  timestamp: number;
}

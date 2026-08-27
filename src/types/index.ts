export type RoleType = 'admin' | 'operator' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
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
  categoryId: string;
  categoryName?: string;
  unit: string;
  costPrice: number; // Harga beli
  sellingPrice: number; // Harga jual
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
  unitPrice: number;
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
  
  isMateraiActive: boolean;
  materaiAmount: number;
  
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  
  terbilang: string; // Indonesian words
  
  notes?: string;
  terms?: string;
  bankAccountId?: string;
  bankAccountSnapshot?: BankAccount;
  
  signatoryCustomerName?: string;
  signatorySalesName?: string;
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

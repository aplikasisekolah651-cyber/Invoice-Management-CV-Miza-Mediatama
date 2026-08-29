import {
  CompanySetting,
  InvoiceSetting,
  User,
  Customer,
  Product,
  ServiceItem,
  Category,
  Unit,
  SalesPerson,
  Invoice,
  Payment,
  AuditLog,
  InvoiceStatus,
  BankAccount,
  RoleType,
  getDefaultPermissions,
} from '../types';
import {
  initialCompany,
  initialInvoiceSetting,
  initialUsers,
  initialCategories,
  initialUnits,
  initialSales,
  initialCustomers,
  initialProducts,
  initialServices,
  generateInitialInvoices,
  initialAuditLogs,
} from './initialData';
import { determineInvoiceStatus, resolveItemCostPrice } from './calculation';
import { FirebaseSyncService } from './firebaseSync';

const STORAGE_KEYS = {
  COMPANY: 'miza_company_v1',
  INVOICE_SETTING: 'miza_invoice_setting_v1',
  USERS: 'miza_users_v1',
  CURRENT_USER: 'miza_current_user_v1',
  CUSTOMERS: 'miza_customers_v1',
  PRODUCTS: 'miza_products_v1',
  SERVICES: 'miza_services_v1',
  CATEGORIES: 'miza_categories_v1',
  UNITS: 'miza_units_v1',
  SALES: 'miza_sales_v1',
  INVOICES: 'miza_invoices_v1',
  PAYMENTS: 'miza_payments_v1',
  AUDIT_LOGS: 'miza_audit_logs_v1',
};

// Event emitter / listener pattern for React state syncing
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Listener callback error', e);
    }
  });
}

export const subscribeStorage = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Generic read with fallback
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Failed to read from localStorage key "${key}":`, err);
    return defaultValue;
  }
}

// Generic write
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyChange();
  } catch (err) {
    console.error(`Failed to save to localStorage key "${key}":`, err);
  }
}

export const StorageService = {
  // --- INITIALIZATION ---
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
      saveToStorage(STORAGE_KEYS.COMPANY, initialCompany);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICE_SETTING)) {
      saveToStorage(STORAGE_KEYS.INVOICE_SETTING, initialInvoiceSetting);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      saveToStorage(STORAGE_KEYS.USERS, initialUsers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      saveToStorage(STORAGE_KEYS.CATEGORIES, initialCategories);
    }
    if (!localStorage.getItem(STORAGE_KEYS.UNITS)) {
      saveToStorage(STORAGE_KEYS.UNITS, initialUnits);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      saveToStorage(STORAGE_KEYS.SALES, initialSales);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      saveToStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      saveToStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      saveToStorage(STORAGE_KEYS.SERVICES, initialServices);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      const generated = generateInitialInvoices();
      saveToStorage(STORAGE_KEYS.INVOICES, generated.invoices);
      saveToStorage(STORAGE_KEYS.PAYMENTS, generated.payments);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    }
  },

  // --- COMPANY & SETTINGS ---
  getCompany(): CompanySetting {
    return loadFromStorage(STORAGE_KEYS.COMPANY, initialCompany);
  },
  saveCompany(company: CompanySetting, syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.COMPANY, company);
    if (syncToFirestore) {
      FirebaseSyncService.saveCompany(company);
      this.addAuditLog('UPDATE_SETTINGS', 'SETTINGS', 'company-settings', 'Memperbarui profil dan identitas perusahaan');
    }
  },

  getInvoiceSetting(): InvoiceSetting {
    return loadFromStorage(STORAGE_KEYS.INVOICE_SETTING, initialInvoiceSetting);
  },
  saveInvoiceSetting(settings: InvoiceSetting, syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.INVOICE_SETTING, settings);
    if (syncToFirestore) {
      FirebaseSyncService.saveInvoiceSetting(settings);
      this.addAuditLog('UPDATE_SETTINGS', 'SETTINGS', 'invoice-settings', 'Memperbarui konfigurasi nomor, PPN, dan materai invoice');
    }
  },

  // --- AUTH & USERS ---
  getUsers(): User[] {
    const raw = loadFromStorage(STORAGE_KEYS.USERS, initialUsers);
    return raw.map((u) => {
      let username = u.username;
      if (!username) {
        if (u.id === 'user-admin') username = 'admin';
        else if (u.id === 'user-operator') username = 'operator';
        else if (u.id === 'user-manager') username = 'manager';
        else if (u.email) username = u.email.split('@')[0];
        else username = u.role || 'user';
      }
      return {
        ...u,
        username: username.toLowerCase().trim(),
        permissions: u.permissions || getDefaultPermissions(u.role),
        password: u.password || (u.role === 'admin' ? 'admin' : u.role === 'operator' ? 'operator' : 'manager'),
      };
    });
  },
  saveUsers(users: User[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.USERS, users);
    if (syncToFirestore) {
      users.forEach((u) => FirebaseSyncService.saveUser(u));
    }
  },
  getCurrentUser(): User {
    const raw = loadFromStorage(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
    let username = raw.username;
    if (!username) {
      if (raw.id === 'user-admin') username = 'admin';
      else if (raw.id === 'user-operator') username = 'operator';
      else if (raw.id === 'user-manager') username = 'manager';
      else if (raw.email) username = raw.email.split('@')[0];
      else username = raw.role || 'user';
    }
    return {
      ...raw,
      username: username.toLowerCase().trim(),
      permissions: raw.permissions || getDefaultPermissions(raw.role),
      password: raw.password || (raw.role === 'admin' ? 'admin' : raw.role === 'operator' ? 'operator' : 'manager'),
    };
  },
  setCurrentUser(user: User): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog('LOGIN', 'AUTH', user.id, `User ${user.name} (@${user.username}) aktif`);
  },
  addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      username: (userData.username || userData.email.split('@')[0] || `user_${Date.now()}`).toLowerCase().trim(),
      permissions: userData.permissions || getDefaultPermissions(userData.role),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    FirebaseSyncService.saveUser(newUser);
    this.addAuditLog('UPDATE_SETTINGS', 'SETTINGS', newUser.id, `Menambahkan user baru: ${newUser.name} (@${newUser.username}, ${newUser.role})`);
    return newUser;
  },
  updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u));
    this.saveUsers(users);
    const targetUser = users.find((u) => u.id === id);
    if (targetUser) {
      FirebaseSyncService.saveUser(targetUser);
    }
    const curr = this.getCurrentUser();
    if (curr.id === id) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, { ...curr, ...updates });
    }
    this.addAuditLog('UPDATE_SETTINGS', 'SETTINGS', id, `Mengubah data akun user ID: ${id}`);
  },
  deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    this.saveUsers(users);
    FirebaseSyncService.deleteUser(id);
  },

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    return loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  },
  saveCustomers(customers: Customer[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    if (syncToFirestore) {
      customers.forEach((c) => FirebaseSyncService.saveCustomer(c));
    }
  },
  addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    customers.unshift(newCustomer);
    this.saveCustomers(customers);
    FirebaseSyncService.saveCustomer(newCustomer);
    this.addAuditLog('CREATE_CUSTOMER', 'CUSTOMER', newCustomer.id, `Menambahkan pelanggan: ${newCustomer.companyName || newCustomer.name}`);
    return newCustomer;
  },
  updateCustomer(id: string, updates: Partial<Customer>): void {
    let updatedCustomer: Customer | undefined;
    const customers = this.getCustomers().map((c) => {
      if (c.id === id) {
        updatedCustomer = { ...c, ...updates };
        return updatedCustomer;
      }
      return c;
    });
    this.saveCustomers(customers);
    if (updatedCustomer) {
      FirebaseSyncService.saveCustomer(updatedCustomer);
    }
    this.addAuditLog('UPDATE_CUSTOMER', 'CUSTOMER', id, `Memperbarui data pelanggan ID: ${id}`);
  },
  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.saveCustomers(customers);
    FirebaseSyncService.deleteCustomer(id);
  },

  // --- PRODUCTS ---
  getProducts(): Product[] {
    return loadFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
  },
  saveProducts(products: Product[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    if (syncToFirestore) {
      products.forEach((p) => FirebaseSyncService.saveProduct(p));
    }
  },
  addProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProd: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    products.unshift(newProd);
    this.saveProducts(products);
    FirebaseSyncService.saveProduct(newProd);
    this.addAuditLog('CREATE_PRODUCT', 'PRODUCT', newProd.id, `Menambahkan produk baru: ${newProd.name}`);
    return newProd;
  },
  updateProduct(id: string, updates: Partial<Product>): void {
    let updatedProduct: Product | undefined;
    const products = this.getProducts().map((p) => {
      if (p.id === id) {
        updatedProduct = { ...p, ...updates };
        return updatedProduct;
      }
      return p;
    });
    this.saveProducts(products);
    if (updatedProduct) {
      FirebaseSyncService.saveProduct(updatedProduct);
    }
    this.addAuditLog('UPDATE_PRODUCT', 'PRODUCT', id, `Memperbarui data barang ID: ${id}`);
  },
  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
    FirebaseSyncService.deleteProduct(id);
  },

  // --- SERVICES ---
  getServices(): ServiceItem[] {
    return loadFromStorage(STORAGE_KEYS.SERVICES, initialServices);
  },
  saveServices(services: ServiceItem[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.SERVICES, services);
    if (syncToFirestore) {
      services.forEach((s) => FirebaseSyncService.saveService(s));
    }
  },
  addService(data: Omit<ServiceItem, 'id' | 'createdAt'>): ServiceItem {
    const services = this.getServices();
    const newService: ServiceItem = {
      ...data,
      id: `srv-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    services.unshift(newService);
    this.saveServices(services);
    FirebaseSyncService.saveService(newService);
    return newService;
  },
  updateService(id: string, updates: Partial<ServiceItem>): void {
    let updatedService: ServiceItem | undefined;
    const services = this.getServices().map((s) => {
      if (s.id === id) {
        updatedService = { ...s, ...updates };
        return updatedService;
      }
      return s;
    });
    this.saveServices(services);
    if (updatedService) {
      FirebaseSyncService.saveService(updatedService);
    }
  },
  deleteService(id: string): void {
    const services = this.getServices().filter((s) => s.id !== id);
    this.saveServices(services);
    FirebaseSyncService.deleteService(id);
  },

  // --- CATEGORIES, UNITS, SALES ---
  getCategories(): Category[] {
    return loadFromStorage(STORAGE_KEYS.CATEGORIES, initialCategories);
  },
  saveCategories(cats: Category[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.CATEGORIES, cats);
    if (syncToFirestore) {
      cats.forEach((c) => FirebaseSyncService.saveCategory(c));
    }
  },
  getUnits(): Unit[] {
    return loadFromStorage(STORAGE_KEYS.UNITS, initialUnits);
  },
  saveUnits(units: Unit[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.UNITS, units);
    if (syncToFirestore) {
      units.forEach((u) => FirebaseSyncService.saveUnit(u));
    }
  },
  getSales(): SalesPerson[] {
    return loadFromStorage(STORAGE_KEYS.SALES, initialSales);
  },
  saveSalesList(sales: SalesPerson[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.SALES, sales);
    if (syncToFirestore) {
      sales.forEach((s) => FirebaseSyncService.saveSales(s));
    }
  },
  addSales(data: Omit<SalesPerson, 'id' | 'createdAt'>): SalesPerson {
    const sales = this.getSales();
    const newSales: SalesPerson = {
      ...data,
      id: `sales-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    sales.push(newSales);
    this.saveSalesList(sales);
    FirebaseSyncService.saveSales(newSales);
    return newSales;
  },
  updateSales(id: string, updates: Partial<SalesPerson>): void {
    let updatedSales: SalesPerson | undefined;
    const sales = this.getSales().map((s) => {
      if (s.id === id) {
        updatedSales = { ...s, ...updates };
        return updatedSales;
      }
      return s;
    });
    this.saveSalesList(sales);
    if (updatedSales) {
      FirebaseSyncService.saveSales(updatedSales);
    }
  },

  // --- INVOICES ---
  getInvoices(): Invoice[] {
    const invoices = loadFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const products = loadFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const services = loadFromStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, []);

    // Check dynamic overdue status and recalculate HPP / profit if HPP is entered/updated
    const updated = invoices.map((inv) => {
      const dynamicStatus = determineInvoiceStatus(inv.status, inv.grandTotal, inv.amountPaid, inv.dueDate);
      
      let computedHpp = 0;
      let hasItemChanges = false;
      const resolvedItems = (inv.items || []).map((item) => {
        const cost = resolveItemCostPrice(item, products, services);
        const qty = Number(item.quantity) || 0;
        const totalCost = qty * cost;
        computedHpp += totalCost;

        if (cost !== item.costPrice || totalCost !== item.totalCost) {
          hasItemChanges = true;
        }

        return {
          ...item,
          costPrice: cost,
          totalCost,
        };
      });

      const dpp = Number(inv.taxableBase) || Number(inv.subtotal) || 0;
      const computedGrossProfit = dpp - computedHpp;

      return {
        ...inv,
        status:
          dynamicStatus !== inv.status && inv.status !== 'cancelled' && inv.status !== 'draft'
            ? dynamicStatus
            : inv.status,
        items: hasItemChanges ? resolvedItems : inv.items,
        totalHpp: computedHpp,
        grossProfit: computedGrossProfit,
      };
    });
    return updated;
  },

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  },

  saveInvoices(invoices: Invoice[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    if (syncToFirestore) {
      invoices.forEach((inv) => FirebaseSyncService.saveInvoice(inv));
    }
  },

  createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = this.getInvoices();
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    FirebaseSyncService.saveInvoice(newInvoice);

    this.addAuditLog(
      'CREATE_INVOICE',
      'INVOICE',
      newInvoice.id,
      `Membuat invoice ${newInvoice.invoiceNumber} untuk ${newInvoice.customerSnapshot?.companyName || newInvoice.customerSnapshot?.name} senilai ${newInvoice.grandTotal}`
    );
    return newInvoice;
  },

  updateInvoice(id: string, updates: Partial<Invoice>): void {
    let updatedInv: Invoice | undefined;
    const invoices = this.getInvoices().map((inv) => {
      if (inv.id === id) {
        updatedInv = { ...inv, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate status if payment or due date changes
        updatedInv.status = determineInvoiceStatus(
          updatedInv.status,
          updatedInv.grandTotal,
          updatedInv.amountPaid,
          updatedInv.dueDate
        );
        return updatedInv;
      }
      return inv;
    });
    this.saveInvoices(invoices);
    if (updatedInv) {
      FirebaseSyncService.saveInvoice(updatedInv);
    }
    this.addAuditLog('UPDATE_INVOICE', 'INVOICE', id, `Memperbarui invoice ID: ${id}`);
  },

  cancelInvoice(id: string, reason?: string): void {
    const inv = this.getInvoiceById(id);
    if (!inv) return;
    this.updateInvoice(id, { status: 'cancelled' });
    this.addAuditLog('CANCEL_INVOICE', 'INVOICE', id, `Membatalkan invoice ${inv.invoiceNumber}. Alasan: ${reason || '-'}`);
  },

  deleteInvoice(id: string): void {
    const inv = this.getInvoiceById(id);
    const invoices = this.getInvoices().filter((i) => i.id !== id);
    this.saveInvoices(invoices);
    FirebaseSyncService.deleteInvoice(id);
    if (inv) {
      this.addAuditLog('DELETE_INVOICE', 'INVOICE', id, `Menghapus invoice ${inv.invoiceNumber}`);
    }
  },

  // --- AUTOMATIC INVOICE NUMBER GENERATOR ---
  generateNextInvoiceNumber(targetDate?: string): string {
    const setting = this.getInvoiceSetting();
    const invoices = this.getInvoices();
    
    const date = targetDate ? new Date(targetDate) : new Date();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Filter invoices according to reset frequency
    let count = 0;
    if (setting.resetFrequency === 'monthly') {
      const matchPrefix = `${setting.prefix}/${year}/${month}/`;
      const monthlyInvoices = invoices.filter((inv) => inv.invoiceNumber && inv.invoiceNumber.startsWith(matchPrefix));
      count = monthlyInvoices.length;
    } else if (setting.resetFrequency === 'yearly') {
      const matchPrefix = `${setting.prefix}/${year}/`;
      const yearlyInvoices = invoices.filter((inv) => inv.invoiceNumber && inv.invoiceNumber.startsWith(matchPrefix));
      count = yearlyInvoices.length;
    } else {
      count = invoices.length;
    }

    const nextSeq = String(count + 1).padStart(setting.seqPadding || 4, '0');
    
    // Replace tokens: {YEAR}, {MONTH}, {SEQ}, {PREFIX}
    let formatted = setting.numberFormat || 'INV/{YEAR}/{MONTH}/{SEQ}';
    formatted = formatted
      .replace('{YEAR}', year)
      .replace('{MONTH}', month)
      .replace('{SEQ}', nextSeq)
      .replace('{PREFIX}', setting.prefix || 'INV');

    // Ensure uniqueness
    let attempt = count + 1;
    while (invoices.some((i) => i.invoiceNumber === formatted)) {
      attempt++;
      const candidateSeq = String(attempt).padStart(setting.seqPadding || 4, '0');
      formatted = (setting.numberFormat || 'INV/{YEAR}/{MONTH}/{SEQ}')
        .replace('{YEAR}', year)
        .replace('{MONTH}', month)
        .replace('{SEQ}', candidateSeq)
        .replace('{PREFIX}', setting.prefix || 'INV');
    }

    return formatted;
  },

  // --- PAYMENTS ---
  getPayments(): Payment[] {
    return loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
  },

  savePayments(payments: Payment[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    if (syncToFirestore) {
      payments.forEach((p) => FirebaseSyncService.savePayment(p));
    }
  },

  getPaymentsByInvoiceId(invoiceId: string): Payment[] {
    return this.getPayments().filter((p) => p.invoiceId === invoiceId);
  },

  generateNextPaymentNumber(targetDate?: string): string {
    const payments = this.getPayments();
    const date = targetDate ? new Date(targetDate) : new Date();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const seq = String(payments.length + 1).padStart(4, '0');
    return `PAY/${year}/${month}/${seq}`;
  },

  recordPayment(data: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>): Payment {
    const payments = this.getPayments();
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      paymentNumber: this.generateNextPaymentNumber(data.paymentDate),
      createdAt: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    FirebaseSyncService.savePayment(newPayment);

    // Update target invoice's amountPaid and status
    const targetInvoice = this.getInvoiceById(data.invoiceId);
    if (targetInvoice) {
      const allInvPayments = payments.filter((p) => p.invoiceId === targetInvoice.id);
      const totalPaid = allInvPayments.reduce((acc, p) => acc + p.amount, 0);
      const newRemaining = Math.max(0, targetInvoice.grandTotal - totalPaid);
      const newStatus = determineInvoiceStatus(
        targetInvoice.status,
        targetInvoice.grandTotal,
        totalPaid,
        targetInvoice.dueDate
      );

      this.updateInvoice(targetInvoice.id, {
        amountPaid: totalPaid,
        remainingBalance: newRemaining,
        status: newStatus,
      });
    }

    this.addAuditLog(
      'RECORD_PAYMENT',
      'PAYMENT',
      newPayment.id,
      `Mencatat pembayaran ${newPayment.paymentNumber} sebesar ${newPayment.amount} untuk invoice ${newPayment.invoiceNumber}`
    );

    return newPayment;
  },

  deletePayment(id: string): void {
    const payment = this.getPayments().find((p) => p.id === id);
    if (!payment) return;

    const payments = this.getPayments().filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    FirebaseSyncService.deletePayment(id);

    // Recalculate invoice balance
    const targetInvoice = this.getInvoiceById(payment.invoiceId);
    if (targetInvoice) {
      const allInvPayments = payments.filter((p) => p.invoiceId === targetInvoice.id);
      const totalPaid = allInvPayments.reduce((acc, p) => acc + p.amount, 0);
      const newRemaining = Math.max(0, targetInvoice.grandTotal - totalPaid);
      const newStatus = determineInvoiceStatus(
        targetInvoice.status,
        targetInvoice.grandTotal,
        totalPaid,
        targetInvoice.dueDate
      );

      this.updateInvoice(targetInvoice.id, {
        amountPaid: totalPaid,
        remainingBalance: newRemaining,
        status: newStatus,
      });
    }

    this.addAuditLog(
      'UPDATE_SETTINGS',
      'PAYMENT',
      id,
      `Menghapus catatan pembayaran ${payment.paymentNumber} senilai ${payment.amount}`
    );
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  },

  saveAuditLogs(logs: AuditLog[], syncToFirestore = true): void {
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
    if (syncToFirestore) {
      logs.forEach((l) => FirebaseSyncService.saveAuditLog(l));
    }
  },

  addAuditLog(
    action: AuditLog['action'],
    module: AuditLog['module'],
    recordId?: string,
    details?: string
  ): void {
    try {
      const logs = this.getAuditLogs();
      const currentUser = this.getCurrentUser();
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        module,
        recordId,
        details: details || '',
        ipAddress: '127.0.0.1 (Web Session)',
      };
      logs.unshift(newLog);
      // Keep max 500 audit logs
      if (logs.length > 500) logs.length = 500;
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
      FirebaseSyncService.saveAuditLog(newLog);
    } catch (e) {
      console.error('Failed to write audit log', e);
    }
  },

  // --- BACKUP & RESTORE ---
  exportFullDatabaseSnapshot(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      company: this.getCompany(),
      invoiceSetting: this.getInvoiceSetting(),
      users: this.getUsers(),
      customers: this.getCustomers(),
      products: this.getProducts(),
      services: this.getServices(),
      categories: this.getCategories(),
      units: this.getUnits(),
      sales: this.getSales(),
      invoices: this.getInvoices(),
      payments: this.getPayments(),
      auditLogs: this.getAuditLogs(),
    };
    this.addAuditLog('BACKUP_DB', 'SYSTEM', undefined, 'Membuat file cadangan database sistem (JSON Snapshot)');
    return JSON.stringify(data, null, 2);
  },

  importDatabaseSnapshot(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.company) this.saveCompany(parsed.company);
      if (parsed.invoiceSetting) this.saveInvoiceSetting(parsed.invoiceSetting);
      if (parsed.users) this.saveUsers(parsed.users);
      if (parsed.customers) this.saveCustomers(parsed.customers);
      if (parsed.products) this.saveProducts(parsed.products);
      if (parsed.services) this.saveServices(parsed.services);
      if (parsed.categories) this.saveCategories(parsed.categories);
      if (parsed.units) this.saveUnits(parsed.units);
      if (parsed.sales) this.saveSalesList(parsed.sales);
      if (parsed.invoices) this.saveInvoices(parsed.invoices);
      if (parsed.payments) this.savePayments(parsed.payments);
      if (parsed.auditLogs) this.saveAuditLogs(parsed.auditLogs);

      this.addAuditLog('RESTORE_DB', 'SYSTEM', undefined, 'Memulihkan data sistem dari file backup');
      return true;
    } catch (err) {
      console.error('Import database failed:', err);
      return false;
    }
  },

  resetToInitialSeed(): void {
    localStorage.clear();
    this.init();
    notifyChange();
    FirebaseSyncService.pushLocalToFirestore();
  },

  // --- COMPATIBILITY & UNIFIED ALIASES ---
  initInitialData(): void {
    this.init();
  },
  getCompanySetting(): CompanySetting {
    return this.getCompany();
  },
  saveCompanySetting(comp: CompanySetting): void {
    this.saveCompany(comp);
  },
  saveInvoice(invoice: Invoice): void {
    const existing = this.getInvoiceById(invoice.id);
    if (existing) {
      this.updateInvoice(invoice.id, invoice);
    } else {
      const invoices = this.getInvoices();
      invoices.unshift(invoice);
      this.saveInvoices(invoices);
      FirebaseSyncService.saveInvoice(invoice);
      this.addAuditLog('CREATE_INVOICE', 'INVOICE', invoice.id, `Menyimpan invoice: ${invoice.invoiceNumber}`);
    }
  },
  updateInvoiceStatus(id: string, status: InvoiceStatus): void {
    this.updateInvoice(id, { status });
  },
  savePayment(data: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>): Payment {
    return this.recordPayment(data);
  },
  saveCustomer(cust: Customer): void {
    const existing = this.getCustomers().find((c) => c.id === cust.id);
    if (existing) {
      this.updateCustomer(cust.id, cust);
    } else {
      const customers = this.getCustomers();
      customers.unshift(cust);
      this.saveCustomers(customers);
      FirebaseSyncService.saveCustomer(cust);
      this.addAuditLog('CREATE_CUSTOMER', 'CUSTOMER', cust.id, `Menambahkan pelanggan: ${cust.companyName || cust.name}`);
    }
  },
  saveProduct(prod: Product): void {
    const existing = this.getProducts().find((p) => p.id === prod.id);
    if (existing) {
      this.updateProduct(prod.id, prod);
    } else {
      const products = this.getProducts();
      products.unshift(prod);
      this.saveProducts(products);
      FirebaseSyncService.saveProduct(prod);
      this.addAuditLog('CREATE_PRODUCT', 'PRODUCT', prod.id, `Menambahkan barang: ${prod.name}`);
    }
  },
  saveService(srv: ServiceItem): void {
    const existing = this.getServices().find((s) => s.id === srv.id);
    if (existing) {
      this.updateService(srv.id, srv);
    } else {
      const services = this.getServices();
      services.unshift(srv);
      this.saveServices(services);
      FirebaseSyncService.saveService(srv);
      this.addAuditLog('CREATE_PRODUCT', 'PRODUCT', srv.id, `Menambahkan layanan jasa: ${srv.name}`);
    }
  },
  saveCategory(cat: Category): void {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      cats[idx] = cat;
    } else {
      cats.push(cat);
    }
    this.saveCategories(cats);
    FirebaseSyncService.saveCategory(cat);
  },
  deleteCategory(id: string): void {
    const cats = this.getCategories().filter((c) => c.id !== id);
    this.saveCategories(cats);
    FirebaseSyncService.deleteCategory(id);
  },
  saveUnit(unit: Unit): void {
    const units = this.getUnits();
    const idx = units.findIndex((u) => u.id === unit.id);
    if (idx >= 0) {
      units[idx] = unit;
    } else {
      units.push(unit);
    }
    this.saveUnits(units);
    FirebaseSyncService.saveUnit(unit);
  },
  deleteUnit(id: string): void {
    const units = this.getUnits().filter((u) => u.id !== id);
    this.saveUnits(units);
    FirebaseSyncService.deleteUnit(id);
  },
  saveSales(sales: SalesPerson): void {
    const list = this.getSales();
    const idx = list.findIndex((s) => s.id === sales.id);
    if (idx >= 0) {
      list[idx] = sales;
    } else {
      list.push(sales);
    }
    this.saveSalesList(list);
    FirebaseSyncService.saveSales(sales);
  },
  deleteSales(id: string): void {
    const list = this.getSales().filter((s) => s.id !== id);
    this.saveSalesList(list);
    FirebaseSyncService.deleteSales(id);
  },
  subscribeStorage(listener: Listener) {
    return subscribeStorage(listener);
  },
  saveBankAccount(acc: BankAccount): void {
    const company = this.getCompany();
    const accounts = [...company.bankAccounts];
    const idx = accounts.findIndex((a) => a.id === acc.id);
    if (idx >= 0) {
      accounts[idx] = acc;
    } else {
      accounts.push(acc);
    }
    if (acc.isDefault) {
      accounts.forEach((a) => {
        if (a.id !== acc.id) a.isDefault = false;
      });
    }
    this.saveCompany({ ...company, bankAccounts: accounts });
  },
  deleteBankAccount(id: string): void {
    const company = this.getCompany();
    const accounts = company.bankAccounts.filter((a) => a.id !== id);
    this.saveCompany({ ...company, bankAccounts: accounts });
  },
  saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    FirebaseSyncService.saveUser(user);
  },
  switchRole(role: RoleType): void {
    const user = this.getCurrentUser();
    const updated = { ...user, role };
    saveToStorage(STORAGE_KEYS.CURRENT_USER, updated);
    this.addAuditLog('UPDATE_SETTINGS', 'AUTH', user.id, `Mengubah hak akses menjadi: ${role.toUpperCase()}`);
  },
  exportFullBackupJSON(): string {
    return this.exportFullDatabaseSnapshot();
  },
  importFullBackupJSON(jsonString: string): boolean {
    return this.importDatabaseSnapshot(jsonString);
  },
  resetToInitialDemo(): void {
    this.resetToInitialSeed();
  },
};

// Auto init on import
StorageService.init();

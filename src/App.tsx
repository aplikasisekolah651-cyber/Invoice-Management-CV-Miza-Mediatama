import React, { useState, useEffect, useCallback } from 'react';
import {
  Invoice,
  Payment,
  Customer,
  Product,
  ServiceItem,
  Category,
  Unit,
  SalesPerson,
  BankAccount,
  CompanySetting,
  InvoiceSetting,
  User,
  AuditLog,
  RoleType,
} from './types';
import { StorageService } from './services/storage';

// Auth Components
import { LoginView } from './components/auth/LoginView';
import { UserProfileModal } from './components/auth/UserProfileModal';

// Layout components
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer, ToastMessage, ConfirmModal } from './components/common/Feedback';

// View components
import { DashboardView } from './components/dashboard/DashboardView';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { InvoiceFormView } from './components/invoices/InvoiceFormView';
import { InvoiceDetailView } from './components/invoices/InvoiceDetailView';
import { InvoicePrintTemplate } from './components/invoices/InvoicePrintTemplate';
import { PaymentListView } from './components/payments/PaymentListView';
import { PaymentFormModal } from './components/payments/PaymentFormModal';
import { CustomerListView } from './components/customers/CustomerListView';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { ProductListView } from './components/products/ProductListView';
import { ProductFormModal } from './components/products/ProductFormModal';
import { ServiceListView } from './components/services/ServiceListView';
import { ServiceFormModal } from './components/services/ServiceFormModal';
import { MasterDataView } from './components/masters/MasterDataView';
import { CatalogMasterView } from './components/catalog/CatalogMasterView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { FirebaseSyncService } from './services/firebaseSync';

const AUTH_SESSION_KEY = 'miza_auth_session_active';

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });

  // --- APPLICATION STATE ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [salesList, setSalesList] = useState<SalesPerson[]>([]);
  const [company, setCompany] = useState<CompanySetting>(StorageService.getCompanySetting());
  const [invoiceSetting, setInvoiceSetting] = useState<InvoiceSetting>(
    StorageService.getInvoiceSetting()
  );
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected item targets
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Modals visibility state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'profile' | 'password'>('profile');

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reload all state from StorageService
  const loadState = useCallback(() => {
    setInvoices(StorageService.getInvoices());
    setPayments(StorageService.getPayments());
    setCustomers(StorageService.getCustomers());
    setProducts(StorageService.getProducts());
    setServices(StorageService.getServices());
    setCategories(StorageService.getCategories());
    setUnits(StorageService.getUnits());
    setSalesList(StorageService.getSales());
    setCompany(StorageService.getCompanySetting());
    setInvoiceSetting(StorageService.getInvoiceSetting());
    setUsers(StorageService.getUsers());
    setCurrentUser(StorageService.getCurrentUser());
    setAuditLogs(StorageService.getAuditLogs());
  }, []);

  // Initial load and storage event subscription
  useEffect(() => {
    StorageService.initInitialData();
    loadState();
    FirebaseSyncService.initSync();
    const unsubscribe = StorageService.subscribeStorage(loadState);
    return () => unsubscribe();
  }, [loadState]);

  // Keep selectedInvoice updated if storage changed
  useEffect(() => {
    if (selectedInvoice) {
      const fresh = invoices.find((i) => i.id === selectedInvoice.id);
      if (fresh) setSelectedInvoice(fresh);
    }
  }, [invoices]);

  // --- LOGIN & LOGOUT HANDLERS ---
  const handleLogin = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
    addToast(
      'Login Berhasil',
      `Selamat datang, ${user.name}! Anda masuk dengan role ${user.role.toUpperCase()}`,
      'success'
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_SESSION_KEY);
    addToast('Sesi Berakhir', 'Anda telah keluar dari aplikasi.', 'info');
  };

  // Role switch handler
  const handleRoleChange = (role: RoleType) => {
    StorageService.switchRole(role);
    setCurrentUser(StorageService.getCurrentUser());
    addToast(
      'Role Berhasil Diubah',
      `Sekarang Anda beroperasi dengan hak akses: ${role.toUpperCase()}`,
      'info'
    );
  };

  // --- INVOICE ACTIONS ---
  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setCurrentView('invoice_create');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('invoice_edit');
  };

  const handleViewInvoiceDetail = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setCurrentView('invoice_detail');
    }
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('invoice_print');
  };

  const handleSaveInvoice = (
    invoice: Invoice,
    action: 'save' | 'save_and_print' | 'preview'
  ) => {
    StorageService.saveInvoice(invoice);
    FirebaseSyncService.saveInvoice(invoice);
    addToast(
      'Invoice Tersimpan',
      `Faktur ${invoice.invoiceNumber} berhasil disimpan.`,
      'success'
    );

    if (action === 'preview' || action === 'save_and_print') {
      setSelectedInvoice(invoice);
      setCurrentView('invoice_print');
    } else {
      setSelectedInvoice(invoice);
      setCurrentView('invoice_detail');
    }
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Faktur Invoice?',
      message: `Apakah Anda yakin ingin menghapus invoice "${invoice.invoiceNumber}"? Seluruh data pembayaran terkait juga akan dibatalkan.`,
      confirmText: 'Hapus Permanen',
      variant: 'danger',
      onConfirm: () => {
        StorageService.deleteInvoice(invoice.id);
        FirebaseSyncService.deleteInvoice(invoice.id);
        addToast('Invoice Dihapus', `Faktur ${invoice.invoiceNumber} telah dihapus.`, 'info');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        if (selectedInvoice?.id === invoice.id) {
          setCurrentView('invoices');
          setSelectedInvoice(null);
        }
      },
    });
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const newNumber = StorageService.generateNextInvoiceNumber();
    const duplicated: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: newNumber,
      invoiceDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      amountPaid: 0,
      remainingBalance: invoice.grandTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveInvoice(duplicated);
    FirebaseSyncService.saveInvoice(duplicated);
    addToast('Invoice Diduplikasi', `Draf baru berhasil dibuat: ${newNumber}`, 'success');
    setSelectedInvoice(duplicated);
    setCurrentView('invoice_edit');
  };

  const handleCancelInvoice = (invoice: Invoice) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Batalkan Invoice?',
      message: `Tandai faktur ${invoice.invoiceNumber} sebagai Dibatalkan (Void)?`,
      confirmText: 'Batalkan Faktur',
      variant: 'warning',
      onConfirm: () => {
        StorageService.updateInvoiceStatus(invoice.id, 'cancelled');
        const updated = StorageService.getInvoiceById(invoice.id);
        if (updated) FirebaseSyncService.saveInvoice(updated);
        addToast('Status Diperbarui', `Invoice ${invoice.invoiceNumber} telah dibatalkan.`, 'warning');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- PAYMENT ACTIONS ---
  const handleOpenPaymentModal = (invoice?: Invoice) => {
    setPaymentTargetInvoice(invoice || null);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (
    paymentData: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>
  ) => {
    const newPayment = StorageService.savePayment(paymentData);
    FirebaseSyncService.savePayment(newPayment);
    const updatedInv = StorageService.getInvoiceById(newPayment.invoiceId);
    if (updatedInv) FirebaseSyncService.saveInvoice(updatedInv);
    addToast(
      'Pembayaran Berhasil Dicatat',
      `Bukti ${newPayment.paymentNumber} sebesar ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(newPayment.amount)} berhasil disimpan.`,
      'success'
    );
  };

  const handleDeletePayment = (payment: Payment) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Bukti Pembayaran?',
      message: `Hapus pembayaran ${payment.paymentNumber}? Sisa piutang pada invoice ${payment.invoiceNumber} akan disesuaikan kembali.`,
      confirmText: 'Hapus Pembayaran',
      variant: 'danger',
      onConfirm: () => {
        StorageService.deletePayment(payment.id);
        FirebaseSyncService.deletePayment(payment.id);
        const updatedInv = StorageService.getInvoiceById(payment.invoiceId);
        if (updatedInv) FirebaseSyncService.saveInvoice(updatedInv);
        addToast('Pembayaran Dihapus', `Bukti bayar ${payment.paymentNumber} telah dihapus.`, 'info');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- CUSTOMER ACTIONS ---
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (
    data: Omit<Customer, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const cust: Customer = {
      ...data,
      id: id || `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveCustomer(cust);
    FirebaseSyncService.saveCustomer(cust);
    addToast('Data Pelanggan Disimpan', `${cust.companyName || cust.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Pelanggan?',
      message: `Hapus ${customer.companyName || customer.name}? Data transaksi terdahulu akan tetap tersimpan.`,
      confirmText: 'Hapus Pelanggan',
      variant: 'danger',
      onConfirm: () => {
        StorageService.deleteCustomer(customer.id);
        FirebaseSyncService.deleteCustomer(customer.id);
        addToast('Pelanggan Dihapus', `${customer.name} telah dihapus.`, 'info');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleImportCustomers = (imported: Omit<Customer, 'id' | 'createdAt'>[]) => {
    let count = 0;
    imported.forEach((c) => {
      const cust = {
        ...c,
        id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveCustomer(cust);
      FirebaseSyncService.saveCustomer(cust);
      count++;
    });
    addToast('Import Berhasil', `${count} data pelanggan baru berhasil ditambahkan.`, 'success');
  };

  // --- PRODUCT ACTIONS ---
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (
    data: Omit<Product, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const prod: Product = {
      ...data,
      id: id || `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveProduct(prod);
    FirebaseSyncService.saveProduct(prod);
    addToast('Barang Disimpan', `${prod.name} berhasil diperbarui.`, 'success');
  };

  const handleDeleteProduct = (product: Product) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Barang dari Katalog?',
      message: `Hapus ${product.name} (${product.code}) dari katalog master?`,
      confirmText: 'Hapus',
      variant: 'danger',
      onConfirm: () => {
        StorageService.deleteProduct(product.id);
        FirebaseSyncService.deleteProduct(product.id);
        addToast('Barang Dihapus', `${product.name} telah dihapus.`, 'info');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleImportProducts = (imported: Omit<Product, 'id' | 'createdAt'>[]) => {
    let count = 0;
    imported.forEach((p) => {
      const prod = {
        ...p,
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveProduct(prod);
      FirebaseSyncService.saveProduct(prod);
      count++;
    });
    addToast('Import Berhasil', `${count} barang baru berhasil ditambahkan ke katalog.`, 'success');
  };

  // --- SERVICE ACTIONS ---
  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: ServiceItem) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (
    data: Omit<ServiceItem, 'id' | 'createdAt'>,
    id?: string
  ) => {
    const srv: ServiceItem = {
      ...data,
      id: id || `srv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveService(srv);
    FirebaseSyncService.saveService(srv);
    addToast('Layanan Jasa Disimpan', `${srv.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteService = (service: ServiceItem) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Layanan Jasa?',
      message: `Hapus ${service.name}?`,
      confirmText: 'Hapus Jasa',
      variant: 'danger',
      onConfirm: () => {
        StorageService.deleteService(service.id);
        FirebaseSyncService.deleteService(service.id);
        addToast('Layanan Jasa Dihapus', `${service.name} telah dihapus.`, 'info');
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- MASTER DATA ACTIONS ---
  const handleSaveCategory = (cat: Category) => {
    StorageService.saveCategory(cat);
    addToast('Kategori Disimpan', `Kategori ${cat.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteCategory = (id: string) => {
    StorageService.deleteCategory(id);
    addToast('Kategori Dihapus', 'Kategori telah dihapus.', 'info');
  };

  const handleSaveUnit = (unit: Unit) => {
    StorageService.saveUnit(unit);
    addToast('Satuan Disimpan', `Satuan ${unit.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteUnit = (id: string) => {
    StorageService.deleteUnit(id);
    addToast('Satuan Dihapus', 'Satuan telah dihapus.', 'info');
  };

  const handleSaveSales = (sales: SalesPerson) => {
    StorageService.saveSales(sales);
    addToast('Sales Disimpan', `Data ${sales.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteSales = (id: string) => {
    StorageService.deleteSales(id);
    addToast('Sales Dihapus', 'Data sales telah dihapus.', 'info');
  };

  const handleSaveBankAccount = (acc: BankAccount) => {
    StorageService.saveBankAccount(acc);
    addToast('Rekening Bank Disimpan', `Bank ${acc.bankName} (${acc.accountNumber}) berhasil disimpan.`, 'success');
  };

  const handleDeleteBankAccount = (id: string) => {
    StorageService.deleteBankAccount(id);
    addToast('Rekening Dihapus', 'Rekening bank telah dihapus.', 'info');
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveCompanySetting = (comp: CompanySetting) => {
    StorageService.saveCompanySetting(comp);
    setCompany(comp);
    addToast('Profil & Logo Perusahaan Disimpan', 'Identitas resmi CV. Miza Mediatama berhasil diperbarui.', 'success');
  };

  const handleSaveInvoiceSetting = (invSet: InvoiceSetting) => {
    StorageService.saveInvoiceSetting(invSet);
    setInvoiceSetting(invSet);
    addToast('Format Invoice Disimpan', 'Konfigurasi default invoice berhasil disimpan.', 'success');
  };

  const handleSaveUser = (user: User) => {
    StorageService.saveUser(user);
    addToast('Pengguna Disimpan', `User ${user.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    StorageService.deleteUser(userId);
    addToast('Pengguna Dihapus', 'User telah dihapus dari sistem.', 'info');
  };

  const handleResetDatabase = () => {
    StorageService.resetToInitialDemo();
    addToast('Database Direset', 'Semua data telah dikembalikan ke kondisi demo awal.', 'warning');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // If user is not authenticated, display login screen gate
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        <LoginView
          company={company}
          users={users}
          onLogin={handleLogin}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast notifications portal */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        mode={profileModalMode}
        onSaveProfile={(updated) => {
          StorageService.saveUser(updated);
          setCurrentUser(updated);
          addToast('Profil Disimpan', 'Data profil akun Anda telah diperbarui.', 'success');
        }}
      />

      {/* Payment Recording Modal */}
      <PaymentFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetInvoice(null);
        }}
        targetInvoice={paymentTargetInvoice}
        allInvoices={invoices}
        company={company}
        currentUser={currentUser}
        onPaymentSaved={handleSavePayment}
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        categories={categories}
        units={units}
        onSave={handleSaveProduct}
      />

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
        categories={categories}
        units={units}
        onSave={handleSaveService}
      />

      {/* SIDEBAR NAVIGATION (Hidden in print mode) */}
      <div className="print:hidden">
        <Sidebar
          currentView={currentView as any}
          onNavigate={(view) => {
            // Map sidebar keys to currentView
            let target = view as string;
            if (view === 'invoice-form') target = 'invoice_create';
            if (view === 'invoice-detail') target = 'invoice_detail';
            if (view === 'invoice-preview') target = 'invoice_print';
            if (view === 'categories' || view === 'units' || view === 'sales' || view === 'products' || view === 'services' || view === 'masters') target = 'catalog';
            if (view === 'users' || view === 'backup' || view === 'audit-log') target = 'settings';
            if (view === 'reports' || view.startsWith('reports-')) target = view;

            setCurrentView(target);
            setIsMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          userRole={currentUser.role}
          company={company}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 print:ml-0">
        {/* TOP NAVBAR (Hidden in print mode) */}
        <div className="print:hidden">
          <Navbar
            currentUser={currentUser}
            allUsers={users}
            onSwitchUser={(user) => {
              StorageService.setCurrentUser(user);
              setCurrentUser(user);
              addToast(
                'Pengguna Aktif Dialihkan',
                `Beralih ke pengguna: ${user.name} (${user.role.toUpperCase()})`,
                'info'
              );
            }}
            onRoleChange={handleRoleChange}
            onToggleMobileSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onQuickCreateInvoice={handleCreateInvoice}
            onOpenProfile={() => {
              setProfileModalMode('profile');
              setIsProfileModalOpen(true);
            }}
            onOpenChangePassword={() => {
              setProfileModalMode('password');
              setIsProfileModalOpen(true);
            }}
            onLogout={handleLogout}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>

        {/* VIEW ROUTER CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* 1. DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              payments={payments}
              customers={customers}
              products={products}
              services={services}
              userRole={currentUser.role}
              onNavigate={(view, data) => {
                if (view === 'invoice-form' || view === 'invoice_create') {
                  if (data) handleEditInvoice(data);
                  else handleCreateInvoice();
                } else if (view === 'invoice-detail' || view === 'invoice_detail') {
                  if (data) handleViewInvoiceDetail(data);
                  else setCurrentView('invoices');
                } else if (view === 'invoice-preview' || view === 'invoice_print') {
                  if (data) handlePreviewInvoice(data);
                  else setCurrentView('invoices');
                } else {
                  setCurrentView(view);
                }
              }}
              onCreateInvoice={handleCreateInvoice}
              onViewAllInvoices={() => setCurrentView('invoices')}
              onViewInvoice={handleViewInvoiceDetail}
              onRecordPayment={handleOpenPaymentModal}
            />
          )}

          {/* 2. INVOICE LIST VIEW */}
          {currentView === 'invoices' && (
            <InvoiceListView
              invoices={invoices}
              customers={customers}
              salesList={salesList}
              userRole={currentUser.role}
              onNavigate={(view, data) => {
                if (view === 'invoice-form' || view === 'invoice_create') {
                  if (data) handleEditInvoice(data);
                  else handleCreateInvoice();
                } else if (view === 'invoice-detail' || view === 'invoice_detail') {
                  if (data) handleViewInvoiceDetail(data);
                  else setCurrentView('invoices');
                } else if (view === 'invoice-preview' || view === 'invoice_print') {
                  if (data) handlePreviewInvoice(data);
                  else setCurrentView('invoices');
                } else {
                  setCurrentView(view);
                }
              }}
              onCreateInvoice={handleCreateInvoice}
              onViewInvoice={handleViewInvoiceDetail}
              onEditInvoice={handleEditInvoice}
              onPreviewInvoice={handlePreviewInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onCancelInvoice={handleCancelInvoice}
              onRecordPayment={handleOpenPaymentModal}
            />
          )}

          {/* 3. INVOICE CREATE / EDIT FORM VIEW */}
          {(currentView === 'invoice_create' || currentView === 'invoice_edit') && (
            <InvoiceFormView
              editInvoice={currentView === 'invoice_edit' ? selectedInvoice : null}
              company={company}
              invoiceSetting={invoiceSetting}
              currentUser={currentUser}
              customers={customers}
              products={products}
              services={services}
              salesList={salesList}
              onSaveInvoice={handleSaveInvoice}
              onCancel={() => setCurrentView('invoices')}
              onOpenNewCustomerModal={() => setIsCustomerModalOpen(true)}
            />
          )}

          {/* 4. INVOICE DETAIL VIEW */}
          {currentView === 'invoice_detail' && selectedInvoice && (
            <InvoiceDetailView
              invoice={selectedInvoice}
              payments={payments}
              userRole={currentUser.role}
              company={company}
              onBack={() => setCurrentView('invoices')}
              onPreviewPrint={() => setCurrentView('invoice_print')}
              onRecordPayment={() => handleOpenPaymentModal(selectedInvoice)}
            />
          )}

          {/* 5. INVOICE PRINT & PDF PREVIEW */}
          {currentView === 'invoice_print' && selectedInvoice && (
            <InvoicePrintTemplate
              invoice={selectedInvoice}
              company={company}
              onBack={() => setCurrentView('invoice_detail')}
              onEdit={handleEditInvoice}
            />
          )}

          {/* 6. PAYMENTS LIST VIEW */}
          {currentView === 'payments' && (
            <PaymentListView
              payments={payments}
              invoices={invoices}
              userRole={currentUser.role}
              onOpenRecordPayment={handleOpenPaymentModal}
              onDeletePayment={handleDeletePayment}
              onViewInvoice={handleViewInvoiceDetail}
            />
          )}

          {/* 7. CUSTOMERS LIST VIEW */}
          {currentView === 'customers' && (
            <CustomerListView
              customers={customers}
              invoices={invoices}
              payments={payments}
              userRole={currentUser.role}
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onImportCustomers={handleImportCustomers}
              onViewInvoice={handleViewInvoiceDetail}
            />
          )}

          {/* 8. CATALOG & MASTER DATA UNIFIED VIEW */}
          {(currentView === 'catalog' || currentView === 'products' || currentView === 'services' || currentView === 'masters') && (
            <CatalogMasterView
              products={products}
              services={services}
              categories={categories}
              units={units}
              salesList={salesList}
              bankAccounts={company.bankAccounts}
              userRole={currentUser.role}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onImportProducts={handleImportProducts}
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onSaveUnit={handleSaveUnit}
              onDeleteUnit={handleDeleteUnit}
              onSaveSales={handleSaveSales}
              onDeleteSales={handleDeleteSales}
              onSaveBankAccount={handleSaveBankAccount}
              onDeleteBankAccount={handleDeleteBankAccount}
            />
          )}

          {/* 11. FINANCIAL & AGING REPORTS VIEW */}
          {(currentView === 'reports' || currentView.startsWith('reports-')) && (
            <ReportsView
              invoices={invoices}
              payments={payments}
              customers={customers}
              products={products}
              services={services}
              salesList={salesList}
              auditLogs={auditLogs}
              userRole={currentUser.role}
              initialTab={currentView}
              onViewInvoice={handleViewInvoiceDetail}
            />
          )}

          {/* 12. SETTINGS & BACKUP VIEW */}
          {currentView === 'settings' && (
            <SettingsView
              company={company}
              invoiceSetting={invoiceSetting}
              users={users}
              currentUser={currentUser}
              onSaveCompany={handleSaveCompanySetting}
              onSaveInvoiceSetting={handleSaveInvoiceSetting}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onResetDatabase={handleResetDatabase}
            />
          )}
        </main>
      </div>
    </div>
  );
}

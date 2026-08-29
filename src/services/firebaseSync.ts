import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  limit,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { StorageService } from './storage';
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
} from '../types';

export type SyncStatus = 'connecting' | 'connected' | 'syncing' | 'error';

let isFirebaseSyncActive = false;
let syncStatus: SyncStatus = 'connecting';
const syncStatusListeners = new Set<(status: SyncStatus) => void>();
const activeUnsubscribes: Unsubscribe[] = [];

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  syncStatusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.error('Error in sync status listener:', e);
    }
  });
}

export const FirebaseSyncService = {
  getStatus(): SyncStatus {
    return syncStatus;
  },

  subscribeStatus(listener: (status: SyncStatus) => void) {
    syncStatusListeners.add(listener);
    listener(syncStatus);
    return () => {
      syncStatusListeners.delete(listener);
    };
  },

  async initSync() {
    if (isFirebaseSyncActive) return;
    isFirebaseSyncActive = true;
    setSyncStatus('connecting');

    try {
      // 1. Check if Firestore has existing data
      const invoicesSnap = await getDocs(query(collection(db, 'invoices'), limit(1)));

      if (invoicesSnap.empty) {
        // Firestore is empty: push initial local dataset to Firestore
        setSyncStatus('syncing');
        await this.pushLocalToFirestore();
      } else {
        // Firestore has data: initial pull from Firestore to hydrate local cache
        setSyncStatus('syncing');
        await this.pullFirestoreToLocal();
      }

      // 2. Attach realtime listeners for all collections and settings
      this.attachRealtimeListeners();
      setSyncStatus('connected');
    } catch (err) {
      console.warn('Firebase Firestore sync initialization warning (running in hybrid/local mode):', err);
      setSyncStatus('connected');
      this.attachRealtimeListeners();
    }
  },

  async pushLocalToFirestore() {
    try {
      const company = StorageService.getCompany();
      const invoiceSetting = StorageService.getInvoiceSetting();
      const customers = StorageService.getCustomers();
      const products = StorageService.getProducts();
      const services = StorageService.getServices();
      const categories = StorageService.getCategories();
      const units = StorageService.getUnits();
      const sales = StorageService.getSales();
      const invoices = StorageService.getInvoices();
      const payments = StorageService.getPayments();
      const users = StorageService.getUsers();
      const auditLogs = StorageService.getAuditLogs();

      // Save Company Setting
      await setDoc(doc(db, 'settings', 'company'), company);
      // Save Invoice Setting
      await setDoc(doc(db, 'settings', 'invoiceSetting'), invoiceSetting);

      // Write in batches (max 500 per batch)
      const allOps: Array<{ col: string; id: string; data: any }> = [];

      customers.forEach((c) => allOps.push({ col: 'customers', id: c.id, data: c }));
      products.forEach((p) => allOps.push({ col: 'products', id: p.id, data: p }));
      services.forEach((s) => allOps.push({ col: 'services', id: s.id, data: s }));
      categories.forEach((cat) => allOps.push({ col: 'categories', id: cat.id, data: cat }));
      units.forEach((u) => allOps.push({ col: 'units', id: u.id, data: u }));
      sales.forEach((s) => allOps.push({ col: 'sales', id: s.id, data: s }));
      invoices.forEach((inv) => allOps.push({ col: 'invoices', id: inv.id, data: inv }));
      payments.forEach((pay) => allOps.push({ col: 'payments', id: pay.id, data: pay }));
      users.forEach((u) => allOps.push({ col: 'users', id: u.id, data: u }));
      auditLogs.slice(0, 100).forEach((l) => allOps.push({ col: 'audit_logs', id: l.id, data: l }));

      const chunkSize = 400;
      for (let i = 0; i < allOps.length; i += chunkSize) {
        const chunk = allOps.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((op) => {
          batch.set(doc(db, op.col, op.id), op.data);
        });
        await batch.commit();
      }

      console.log('Successfully initialized Firestore with full local dataset');
    } catch (err) {
      console.warn('Error pushing local data to Firestore:', err);
    }
  },

  async pullFirestoreToLocal() {
    try {
      const [
        customersSnap,
        productsSnap,
        servicesSnap,
        categoriesSnap,
        unitsSnap,
        salesSnap,
        invoicesSnap,
        paymentsSnap,
        usersSnap,
        auditLogsSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'units')),
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200))),
      ]);

      if (!customersSnap.empty) {
        const custs = customersSnap.docs.map((d) => d.data() as Customer);
        StorageService.saveCustomers(custs, false);
      }
      if (!productsSnap.empty) {
        const prods = productsSnap.docs.map((d) => d.data() as Product);
        StorageService.saveProducts(prods, false);
      }
      if (!servicesSnap.empty) {
        const servs = servicesSnap.docs.map((d) => d.data() as ServiceItem);
        StorageService.saveServices(servs, false);
      }
      if (!categoriesSnap.empty) {
        const cats = categoriesSnap.docs.map((d) => d.data() as Category);
        StorageService.saveCategories(cats, false);
      }
      if (!unitsSnap.empty) {
        const un = unitsSnap.docs.map((d) => d.data() as Unit);
        StorageService.saveUnits(un, false);
      }
      if (!salesSnap.empty) {
        const sl = salesSnap.docs.map((d) => d.data() as SalesPerson);
        StorageService.saveSalesList(sl, false);
      }
      if (!invoicesSnap.empty) {
        const invs = invoicesSnap.docs.map((d) => d.data() as Invoice);
        StorageService.saveInvoices(invs, false);
      }
      if (!paymentsSnap.empty) {
        const pays = paymentsSnap.docs.map((d) => d.data() as Payment);
        StorageService.savePayments(pays, false);
      }
      if (!usersSnap.empty) {
        const usrs = usersSnap.docs.map((d) => d.data() as User);
        StorageService.saveUsers(usrs, false);
      }
      if (!auditLogsSnap.empty) {
        const logs = auditLogsSnap.docs.map((d) => d.data() as AuditLog);
        StorageService.saveAuditLogs(logs, false);
      }
    } catch (err) {
      console.warn('Error pulling Firestore data to local storage:', err);
    }
  },

  attachRealtimeListeners() {
    // Clear old listeners if any
    activeUnsubscribes.forEach((unsub) => unsub());
    activeUnsubscribes.length = 0;

    // 1. Invoices Realtime Listener
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const invs = snapshot.docs.map((d) => d.data() as Invoice);
          const current = StorageService.getInvoices();
          if (JSON.stringify(current) !== JSON.stringify(invs)) {
            StorageService.saveInvoices(invs, false);
          }
        }
      },
      (err) => console.warn('Invoices realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubInvoices);

    // 2. Customers Realtime Listener
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const custs = snapshot.docs.map((d) => d.data() as Customer);
          const current = StorageService.getCustomers();
          if (JSON.stringify(current) !== JSON.stringify(custs)) {
            StorageService.saveCustomers(custs, false);
          }
        }
      },
      (err) => console.warn('Customers realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubCustomers);

    // 3. Products Realtime Listener
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const prods = snapshot.docs.map((d) => d.data() as Product);
          const current = StorageService.getProducts();
          if (JSON.stringify(current) !== JSON.stringify(prods)) {
            StorageService.saveProducts(prods, false);
          }
        }
      },
      (err) => console.warn('Products realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubProducts);

    // 4. Services Realtime Listener
    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snapshot) => {
        if (!snapshot.empty) {
          const servs = snapshot.docs.map((d) => d.data() as ServiceItem);
          const current = StorageService.getServices();
          if (JSON.stringify(current) !== JSON.stringify(servs)) {
            StorageService.saveServices(servs, false);
          }
        }
      },
      (err) => console.warn('Services realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubServices);

    // 5. Payments Realtime Listener
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        if (!snapshot.empty) {
          const pays = snapshot.docs.map((d) => d.data() as Payment);
          const current = StorageService.getPayments();
          if (JSON.stringify(current) !== JSON.stringify(pays)) {
            StorageService.savePayments(pays, false);
          }
        }
      },
      (err) => console.warn('Payments realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubPayments);

    // 6. Categories Realtime Listener
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cats = snapshot.docs.map((d) => d.data() as Category);
          const current = StorageService.getCategories();
          if (JSON.stringify(current) !== JSON.stringify(cats)) {
            StorageService.saveCategories(cats, false);
          }
        }
      },
      (err) => console.warn('Categories realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubCategories);

    // 7. Units Realtime Listener
    const unsubUnits = onSnapshot(
      collection(db, 'units'),
      (snapshot) => {
        if (!snapshot.empty) {
          const un = snapshot.docs.map((d) => d.data() as Unit);
          const current = StorageService.getUnits();
          if (JSON.stringify(current) !== JSON.stringify(un)) {
            StorageService.saveUnits(un, false);
          }
        }
      },
      (err) => console.warn('Units realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubUnits);

    // 8. Sales Realtime Listener
    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        if (!snapshot.empty) {
          const sl = snapshot.docs.map((d) => d.data() as SalesPerson);
          const current = StorageService.getSales();
          if (JSON.stringify(current) !== JSON.stringify(sl)) {
            StorageService.saveSalesList(sl, false);
          }
        }
      },
      (err) => console.warn('Sales realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubSales);

    // 9. Users Realtime Listener
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const usrs = snapshot.docs.map((d) => d.data() as User);
          const current = StorageService.getUsers();
          if (JSON.stringify(current) !== JSON.stringify(usrs)) {
            StorageService.saveUsers(usrs, false);
          }
        }
      },
      (err) => console.warn('Users realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubUsers);

    // 10. Audit Logs Realtime Listener
    const unsubAudit = onSnapshot(
      query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200)),
      (snapshot) => {
        if (!snapshot.empty) {
          const logs = snapshot.docs.map((d) => d.data() as AuditLog);
          const current = StorageService.getAuditLogs();
          if (JSON.stringify(current) !== JSON.stringify(logs)) {
            StorageService.saveAuditLogs(logs, false);
          }
        }
      },
      (err) => console.warn('Audit logs realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubAudit);

    // 11. Company Setting Realtime Listener
    const unsubCompany = onSnapshot(
      doc(db, 'settings', 'company'),
      (snapshot) => {
        if (snapshot.exists()) {
          const comp = snapshot.data() as CompanySetting;
          const current = StorageService.getCompany();
          if (JSON.stringify(current) !== JSON.stringify(comp)) {
            StorageService.saveCompany(comp, false);
          }
        }
      },
      (err) => console.warn('Company settings realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubCompany);

    // 12. Invoice Setting Realtime Listener
    const unsubInvoiceSetting = onSnapshot(
      doc(db, 'settings', 'invoiceSetting'),
      (snapshot) => {
        if (snapshot.exists()) {
          const invSet = snapshot.data() as InvoiceSetting;
          const current = StorageService.getInvoiceSetting();
          if (JSON.stringify(current) !== JSON.stringify(invSet)) {
            StorageService.saveInvoiceSetting(invSet, false);
          }
        }
      },
      (err) => console.warn('Invoice settings realtime listener warning:', err)
    );
    activeUnsubscribes.push(unsubInvoiceSetting);
  },

  // Direct mutations to Firestore (Called instantly on user operations)
  async saveCompany(company: CompanySetting) {
    try {
      await setDoc(doc(db, 'settings', 'company'), company);
    } catch (e) {
      console.warn('Failed to sync company setting to Firestore:', e);
    }
  },

  async saveInvoiceSetting(setting: InvoiceSetting) {
    try {
      await setDoc(doc(db, 'settings', 'invoiceSetting'), setting);
    } catch (e) {
      console.warn('Failed to sync invoice setting to Firestore:', e);
    }
  },

  async saveInvoice(invoice: Invoice) {
    try {
      await setDoc(doc(db, 'invoices', invoice.id), invoice);
    } catch (e) {
      console.warn('Failed to sync invoice to Firestore:', e);
    }
  },

  async deleteInvoice(id: string) {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (e) {
      console.warn('Failed to delete invoice from Firestore:', e);
    }
  },

  async savePayment(payment: Payment) {
    try {
      await setDoc(doc(db, 'payments', payment.id), payment);
    } catch (e) {
      console.warn('Failed to sync payment to Firestore:', e);
    }
  },

  async deletePayment(id: string) {
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (e) {
      console.warn('Failed to delete payment from Firestore:', e);
    }
  },

  async saveCustomer(customer: Customer) {
    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
    } catch (e) {
      console.warn('Failed to sync customer to Firestore:', e);
    }
  },

  async deleteCustomer(id: string) {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (e) {
      console.warn('Failed to delete customer from Firestore:', e);
    }
  },

  async saveProduct(product: Product) {
    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      console.warn('Failed to sync product to Firestore:', e);
    }
  },

  async deleteProduct(id: string) {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.warn('Failed to delete product from Firestore:', e);
    }
  },

  async saveService(service: ServiceItem) {
    try {
      await setDoc(doc(db, 'services', service.id), service);
    } catch (e) {
      console.warn('Failed to sync service to Firestore:', e);
    }
  },

  async deleteService(id: string) {
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (e) {
      console.warn('Failed to delete service from Firestore:', e);
    }
  },

  async saveCategory(cat: Category) {
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
    } catch (e) {
      console.warn('Failed to sync category to Firestore:', e);
    }
  },

  async deleteCategory(id: string) {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.warn('Failed to delete category from Firestore:', e);
    }
  },

  async saveUnit(unit: Unit) {
    try {
      await setDoc(doc(db, 'units', unit.id), unit);
    } catch (e) {
      console.warn('Failed to sync unit to Firestore:', e);
    }
  },

  async deleteUnit(id: string) {
    try {
      await deleteDoc(doc(db, 'units', id));
    } catch (e) {
      console.warn('Failed to delete unit from Firestore:', e);
    }
  },

  async saveSales(sales: SalesPerson) {
    try {
      await setDoc(doc(db, 'sales', sales.id), sales);
    } catch (e) {
      console.warn('Failed to sync sales to Firestore:', e);
    }
  },

  async deleteSales(id: string) {
    try {
      await deleteDoc(doc(db, 'sales', id));
    } catch (e) {
      console.warn('Failed to delete sales from Firestore:', e);
    }
  },

  async saveUser(user: User) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (e) {
      console.warn('Failed to sync user to Firestore:', e);
    }
  },

  async deleteUser(id: string) {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.warn('Failed to delete user from Firestore:', e);
    }
  },

  async saveAuditLog(log: AuditLog) {
    try {
      await setDoc(doc(db, 'audit_logs', log.id), log);
    } catch (e) {
      console.warn('Failed to sync audit log to Firestore:', e);
    }
  },
};

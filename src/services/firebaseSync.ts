import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
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

let isFirebaseSyncActive = false;

export const FirebaseSyncService = {
  async initSync() {
    if (isFirebaseSyncActive) return;
    isFirebaseSyncActive = true;

    try {
      // 1. Check if Firestore has invoices
      const invoicesSnap = await getDocs(collection(db, 'invoices'));

      if (invoicesSnap.empty) {
        // First time cloud bootstrap: push local storage initial data to Firestore
        await this.pushLocalToFirestore();
      } else {
        // Firestore already has data: load from Firestore into local storage
        await this.pullFirestoreToLocal();
      }

      // 2. Set up realtime listeners for key collections
      this.attachRealtimeListeners();
    } catch (err) {
      console.warn('Firebase sync initialization warning (using local fallback):', err);
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

      // Save Company
      await setDoc(doc(db, 'settings', 'company'), company);
      // Save Invoice Settings
      await setDoc(doc(db, 'settings', 'invoiceSetting'), invoiceSetting);

      // Batch write entities
      const batch = writeBatch(db);

      customers.forEach((c) => batch.set(doc(db, 'customers', c.id), c));
      products.forEach((p) => batch.set(doc(db, 'products', p.id), p));
      services.forEach((s) => batch.set(doc(db, 'services', s.id), s));
      categories.forEach((cat) => batch.set(doc(db, 'categories', cat.id), cat));
      units.forEach((u) => batch.set(doc(db, 'units', u.id), u));
      sales.forEach((s) => batch.set(doc(db, 'sales', s.id), s));
      invoices.forEach((inv) => batch.set(doc(db, 'invoices', inv.id), inv));
      payments.forEach((pay) => batch.set(doc(db, 'payments', pay.id), pay));

      await batch.commit();
      console.log('Successfully synced local data to Firebase Firestore');
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
      ] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'units')),
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'payments')),
      ]);

      if (!customersSnap.empty) {
        const custs = customersSnap.docs.map((d) => d.data() as Customer);
        StorageService.saveCustomers(custs);
      }
      if (!productsSnap.empty) {
        const prods = productsSnap.docs.map((d) => d.data() as Product);
        StorageService.saveProducts(prods);
      }
      if (!servicesSnap.empty) {
        const servs = servicesSnap.docs.map((d) => d.data() as ServiceItem);
        StorageService.saveServices(servs);
      }
      if (!categoriesSnap.empty) {
        const cats = categoriesSnap.docs.map((d) => d.data() as Category);
        StorageService.saveCategories(cats);
      }
      if (!unitsSnap.empty) {
        const un = unitsSnap.docs.map((d) => d.data() as Unit);
        StorageService.saveUnits(un);
      }
      if (!salesSnap.empty) {
        const sl = salesSnap.docs.map((d) => d.data() as SalesPerson);
        StorageService.saveSalesList(sl);
      }
      if (!invoicesSnap.empty) {
        const invs = invoicesSnap.docs.map((d) => d.data() as Invoice);
        StorageService.saveInvoices(invs);
      }
      if (!paymentsSnap.empty) {
        const pays = paymentsSnap.docs.map((d) => d.data() as Payment);
        StorageService.savePayments(pays);
      }
    } catch (err) {
      console.warn('Error pulling Firestore data to local storage:', err);
    }
  },

  attachRealtimeListeners() {
    // Invoices Realtime
    onSnapshot(collection(db, 'invoices'), (snapshot) => {
      if (!snapshot.empty) {
        const invs = snapshot.docs.map((d) => d.data() as Invoice);
        // Only update if different
        const current = StorageService.getInvoices();
        if (JSON.stringify(current) !== JSON.stringify(invs)) {
          StorageService.saveInvoices(invs);
        }
      }
    }, (err) => console.warn('Invoices realtime listener warning:', err));

    // Customers Realtime
    onSnapshot(collection(db, 'customers'), (snapshot) => {
      if (!snapshot.empty) {
        const custs = snapshot.docs.map((d) => d.data() as Customer);
        const current = StorageService.getCustomers();
        if (JSON.stringify(current) !== JSON.stringify(custs)) {
          StorageService.saveCustomers(custs);
        }
      }
    }, (err) => console.warn('Customers realtime listener warning:', err));

    // Payments Realtime
    onSnapshot(collection(db, 'payments'), (snapshot) => {
      if (!snapshot.empty) {
        const pays = snapshot.docs.map((d) => d.data() as Payment);
        const current = StorageService.getPayments();
        if (JSON.stringify(current) !== JSON.stringify(pays)) {
          StorageService.savePayments(pays);
        }
      }
    }, (err) => console.warn('Payments realtime listener warning:', err));
  },

  // Direct mutations to Firestore
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
};

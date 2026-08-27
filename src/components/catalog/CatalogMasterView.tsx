import React, { useState } from 'react';
import {
  Package,
  Wrench,
  Tags,
  Ruler,
  UserCheck,
  CreditCard,
  Plus,
  Layers,
} from 'lucide-react';
import {
  Product,
  ServiceItem,
  Category,
  Unit,
  SalesPerson,
  BankAccount,
  RoleType,
} from '../../types';
import { ProductListView } from '../products/ProductListView';
import { ServiceListView } from '../services/ServiceListView';
import { MasterDataView } from '../masters/MasterDataView';

interface CatalogMasterViewProps {
  products: Product[];
  services: ServiceItem[];
  categories: Category[];
  units: Unit[];
  salesList: SalesPerson[];
  bankAccounts: BankAccount[];
  userRole: RoleType;

  // Product actions
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onImportProducts: (products: Omit<Product, 'id' | 'createdAt'>[]) => void;

  // Service actions
  onAddService: () => void;
  onEditService: (service: ServiceItem) => void;
  onDeleteService: (service: ServiceItem) => void;

  // Master actions
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onSaveSales: (sales: SalesPerson) => void;
  onDeleteSales: (id: string) => void;
  onSaveBankAccount: (acc: BankAccount) => void;
  onDeleteBankAccount: (id: string) => void;
}

export const CatalogMasterView: React.FC<CatalogMasterViewProps> = ({
  products,
  services,
  categories,
  units,
  salesList,
  bankAccounts,
  userRole,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onImportProducts,
  onAddService,
  onEditService,
  onDeleteService,
  onSaveCategory,
  onDeleteCategory,
  onSaveUnit,
  onDeleteUnit,
  onSaveSales,
  onDeleteSales,
  onSaveBankAccount,
  onDeleteBankAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'masters'>('products');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Katalog & Master Data
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat pengelolaan katalog barang, jasa layanan, kategori, satuan ukuran, tim sales, dan rekening bank
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Barang / Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Layanan Jasa ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('masters')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'masters'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kategori, Satuan, Sales & Bank</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'products' && (
        <ProductListView
          products={products}
          categories={categories}
          userRole={userRole}
          onAddProduct={onAddProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onImportProducts={onImportProducts}
        />
      )}

      {activeTab === 'services' && (
        <ServiceListView
          services={services}
          categories={categories}
          userRole={userRole}
          onAddService={onAddService}
          onEditService={onEditService}
          onDeleteService={onDeleteService}
        />
      )}

      {activeTab === 'masters' && (
        <MasterDataView
          categories={categories}
          units={units}
          salesList={salesList}
          bankAccounts={bankAccounts}
          userRole={userRole}
          onSaveCategory={onSaveCategory}
          onDeleteCategory={onDeleteCategory}
          onSaveUnit={onSaveUnit}
          onDeleteUnit={onDeleteUnit}
          onSaveSales={onSaveSales}
          onDeleteSales={onDeleteSales}
          onSaveBankAccount={onSaveBankAccount}
          onDeleteBankAccount={onDeleteBankAccount}
        />
      )}
    </div>
  );
};

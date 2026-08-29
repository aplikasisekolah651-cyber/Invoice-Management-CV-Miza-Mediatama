import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import { Customer, Invoice, Payment, RoleType } from '../../types';
import { ExportService } from '../../services/exportService';
import { ImportModal } from '../common/ImportModal';
import { Pagination } from '../common/Pagination';
import { CustomerDetailModal } from './CustomerDetailModal';

interface CustomerListViewProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  userRole: RoleType;
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onImportCustomers: (customers: Omit<Customer, 'id' | 'createdAt'>[]) => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  invoices,
  payments,
  userRole,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onImportCustomers,
  onViewInvoice,
}) => {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.npwp && c.npwp.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handleExportExcel = () => {
    ExportService.exportCustomersToExcel(
      filteredCustomers,
      `Master_Pelanggan_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Data Pelanggan (Customer)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data instansi pemerintah, sekolah, perusahaan swasta, dan perorangan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {!isManager && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Import Data Pelanggan dengan Format Template"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import Pelanggan</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {!isManager && (
            <button
              onClick={onAddCustomer}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pelanggan</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari instansi, nama, kota, telepon, NPWP..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Total: <span className="font-bold text-slate-900">{filteredCustomers.length}</span>{' '}
          Pelanggan Terdaftar
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Instansi / Perusahaan</th>
                <th className="py-3.5 px-4">Kontak Person</th>
                <th className="py-3.5 px-4">Telepon & Email</th>
                <th className="py-3.5 px-4">NPWP</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data pelanggan ditemukan</p>
                    <p className="text-xs text-slate-400">
                      Klik "+ Tambah Pelanggan" untuk mendaftarkan mitra bisnis baru.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {c.companyName || c.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{c.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      {c.contactPerson && (
                        <div className="text-[11px] text-slate-500">{c.contactPerson}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-medium text-slate-900">{c.phone}</div>
                      {c.email && <div className="text-[11px] text-slate-500">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {c.npwp || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedDetailCustomer(c)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail & Riwayat Transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isManager && (
                          <button
                            onClick={() => onEditCustomer(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pelanggan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteCustomer(c)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[10, 20, 50, 100]}
          itemLabel="pelanggan"
        />
      </div>

      {/* Modal Detail Pelanggan & Riwayat Transaksi */}
      <CustomerDetailModal
        customer={selectedDetailCustomer}
        invoices={invoices}
        payments={payments}
        isOpen={!!selectedDetailCustomer}
        onClose={() => setSelectedDetailCustomer(null)}
        onViewInvoice={(invoiceId) => {
          setSelectedDetailCustomer(null);
          onViewInvoice(invoiceId);
        }}
      />

      {/* Modal Import Pelanggan */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Pelanggan (Customer)"
        type="customers"
        onConfirmImport={(importedData) => {
          onImportCustomers(importedData);
        }}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ServiceItem, Category, RoleType } from '../../types';
import { formatRupiah } from '../../services/calculation';
import { ExportService } from '../../services/exportService';

interface ServiceListViewProps {
  services: ServiceItem[];
  categories: Category[];
  userRole: RoleType;
  onAddService: () => void;
  onEditService: (service: ServiceItem) => void;
  onDeleteService: (service: ServiceItem) => void;
}

export const ServiceListView: React.FC<ServiceListViewProps> = ({
  services,
  categories,
  userRole,
  onAddService,
  onEditService,
  onDeleteService,
}) => {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [services, categoryFilter, searchQuery]);

  const handleExportExcel = () => {
    ExportService.exportServicesToExcel(
      filteredServices,
      `Master_Jasa_CV_Miza_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Data Layanan & Jasa (Services)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar layanan instalasi, maintenance jaringan, software, servis, dan konsultasi IT
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {!isManager && (
            <button
              onClick={onAddService}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Jasa</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode, nama layanan jasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
          >
            <option value="all">Semua Kategori Jasa</option>
            <option value="Jasa IT & Jaringan">Jasa IT & Jaringan</option>
            <option value="Maintenance & Servis">Maintenance & Servis</option>
            <option value="Pengembangan Software">Pengembangan Software</option>
            <option value="Percetakan & Desain Grafis">Percetakan & Desain Grafis</option>
            <option value="Pelatihan & Workshop">Pelatihan & Workshop</option>
          </select>

          <span className="text-slate-400">
            Total: <strong className="text-slate-800">{filteredServices.length}</strong> Layanan
          </span>
        </div>
      </div>

      {/* Main Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode & Nama Layanan Jasa</th>
                <th className="py-3.5 px-4">Kategori Jasa</th>
                <th className="py-3.5 px-4 text-center">Satuan Tarif</th>
                <th className="py-3.5 px-4 text-right">Tarif Standar (Rp)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada layanan jasa</p>
                    <p className="text-xs text-slate-400">
                      Tambahkan jasa instalasi atau maintenance ke daftar katalog.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{s.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-purple-700 font-bold">{s.code}</span>
                        {s.description && <span>• {s.description}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-800 font-medium rounded-md text-[11px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                      Per {s.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-purple-900 text-sm">
                      {formatRupiah(s.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isManager && (
                          <button
                            onClick={() => onEditService(s)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Jasa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteService(s)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Jasa"
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
      </div>
    </div>
  );
};

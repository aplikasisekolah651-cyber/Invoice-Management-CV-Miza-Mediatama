import React, { useState } from 'react';
import { X, Wrench, DollarSign, Check } from 'lucide-react';
import { ServiceItem, Category, Unit } from '../../types';
import { formatRupiah } from '../../services/calculation';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceItem | null;
  categories: Category[];
  units: Unit[];
  onSave: (serviceData: Omit<ServiceItem, 'id' | 'createdAt'>, id?: string) => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  service,
  categories,
  units,
  onSave,
}) => {
  const isEditing = !!service;

  const [code, setCode] = useState(service?.code || '');
  const [name, setName] = useState(service?.name || '');
  const [category, setCategory] = useState(
    service?.category || (categories[0]?.name || 'Jasa IT & Jaringan')
  );
  const [unit, setUnit] = useState(service?.unit || 'paket');
  const [costPrice, setCostPrice] = useState(service?.costPrice || 0);
  const [price, setPrice] = useState(service?.price || 0);
  const [description, setDescription] = useState(service?.description || '');
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCode(service?.code || '');
      setName(service?.name || '');
      setCategory(service?.category || (categories[0]?.name || 'Jasa IT & Jaringan'));
      setUnit(service?.unit || 'paket');
      setCostPrice(service?.costPrice || 0);
      setPrice(service?.price || 0);
      setDescription(service?.description || '');
      setIsActive(service?.isActive ?? true);
      setErrorMsg('');
    }
  }, [isOpen, service, categories, units]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama layanan / jasa wajib diisi.');
      return;
    }
    if (price < 0) {
      setErrorMsg('Tarif harga tidak boleh negatif.');
      return;
    }

    onSave(
      {
        code: code.trim() || `SRV-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        category,
        unit,
        costPrice,
        price,
        description: description.trim(),
        isActive,
      },
      service?.id
    );
    onClose();
  };

  const margin = price - costPrice;
  const marginPercent = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(1) : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Layanan Jasa' : 'Tambah Layanan Jasa Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Katalog jasa profesional CV. Miza Mediatama
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Jasa</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SRV-001..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Jasa</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
              >
                <option value="Jasa IT & Jaringan">Jasa IT & Jaringan</option>
                <option value="Maintenance & Servis">Maintenance & Servis</option>
                <option value="Pengembangan Software">Pengembangan Software</option>
                <option value="Percetakan & Desain Grafis">Percetakan & Desain Grafis</option>
                <option value="Pelatihan & Workshop">Pelatihan & Workshop</option>
                <option value="Sewa & Rental Perangkat">Sewa & Rental Perangkat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Layanan / Jasa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Instalasi Jaringan LAN & Konfigurasi Router Mikrotik..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Satuan Tarif</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="paket / titik / sesi / bulan / lisensi..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          {/* Pricing & Cost Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biaya Modal / HPP (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(costPrice)}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Tarif Harga Jual (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-purple-700 font-mono text-sm focus:outline-none"
                />
                <div className="text-[10px] text-purple-600 font-medium mt-0.5">{formatRupiah(price)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 text-slate-600">
              <span>Estimasi Margin Keuntungan Jasa:</span>
              <span className="font-bold text-emerald-700">
                {formatRupiah(margin)} ({marginPercent}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Ruang Lingkup & SLA Layanan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian cakupan pekerjaan, garansi pengerjaan, SLA..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="srv-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
            />
            <label htmlFor="srv-active" className="font-semibold text-slate-700 cursor-pointer">
              Status Layanan Aktif
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Layanan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

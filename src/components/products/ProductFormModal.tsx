import React, { useState } from 'react';
import { X, Package, DollarSign, Check, AlertCircle } from 'lucide-react';
import { Product, Category, Unit } from '../../types';
import { formatRupiah } from '../../services/calculation';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Category[];
  units: Unit[];
  onSave: (productData: Omit<Product, 'id' | 'createdAt'>, id?: string) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  units,
  onSave,
}) => {
  const isEditing = !!product;

  const [code, setCode] = useState(product?.code || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(
    product?.category || (categories[0]?.name || 'Komputer & IT')
  );
  const [unit, setUnit] = useState(product?.unit || (units[0]?.name || 'unit'));
  const [purchasePrice, setPurchasePrice] = useState(product?.purchasePrice || 0);
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice || 0);
  const [stock, setStock] = useState(product?.stock || 10);
  const [minStock, setMinStock] = useState(product?.minStock || 2);
  const [description, setDescription] = useState(product?.description || '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCode(product?.code || '');
      setName(product?.name || '');
      setCategory(product?.category || (categories[0]?.name || 'Komputer & IT'));
      setUnit(product?.unit || (units[0]?.name || 'unit'));
      setPurchasePrice(product?.purchasePrice || 0);
      setSellingPrice(product?.sellingPrice || 0);
      setStock(product?.stock || 10);
      setMinStock(product?.minStock || 2);
      setDescription(product?.description || '');
      setIsActive(product?.isActive ?? true);
      setErrorMsg('');
    }
  }, [isOpen, product, categories, units]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }
    if (sellingPrice < 0) {
      setErrorMsg('Harga jual tidak boleh negatif.');
      return;
    }

    onSave(
      {
        code: code.trim() || `PRD-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        category,
        unit,
        purchasePrice,
        sellingPrice,
        stock,
        minStock,
        description: description.trim(),
        isActive,
      },
      product?.id
    );
    onClose();
  };

  const margin = sellingPrice - purchasePrice;
  const marginPercent = purchasePrice > 0 ? ((margin / purchasePrice) * 100).toFixed(1) : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Master katalog produk & perlengkapan CV. Miza Mediatama
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
              <label className="block font-semibold text-slate-700 mb-1">Kode Barang</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PRD-001..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Barang / Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop Lenovo ThinkBook 14 Gen 4..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga Beli / HPP (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(purchasePrice)}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Harga Jual / Invoice (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-blue-700 font-mono focus:outline-none"
                />
                <div className="text-[10px] text-blue-600 font-medium mt-0.5">{formatRupiah(sellingPrice)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 text-slate-600">
              <span>Estimasi Margin Keuntungan:</span>
              <span className="font-bold text-emerald-700">
                {formatRupiah(margin)} ({marginPercent}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Spesifikasi Teknis & Keterangan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian prosesor, RAM, SSD, garansi, S/N..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prod-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
            />
            <label htmlFor="prod-active" className="font-semibold text-slate-700 cursor-pointer">
              Status Barang Aktif Dijual
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Barang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

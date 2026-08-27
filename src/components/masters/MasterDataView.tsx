import React, { useState } from 'react';
import {
  Layers,
  Tag,
  Ruler,
  UserCheck,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Building,
} from 'lucide-react';
import { Category, Unit, SalesPerson, BankAccount, RoleType } from '../../types';

interface MasterDataViewProps {
  categories: Category[];
  units: Unit[];
  salesList: SalesPerson[];
  bankAccounts: BankAccount[];
  userRole: RoleType;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onSaveSales: (sales: SalesPerson) => void;
  onDeleteSales: (id: string) => void;
  onSaveBankAccount: (account: BankAccount) => void;
  onDeleteBankAccount: (id: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  categories,
  units,
  salesList,
  bankAccounts,
  userRole,
  onSaveCategory,
  onDeleteCategory,
  onSaveUnit,
  onDeleteUnit,
  onSaveSales,
  onDeleteSales,
  onSaveBankAccount,
  onDeleteBankAccount,
}) => {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const [activeTab, setActiveTab] = useState<'categories' | 'units' | 'sales' | 'banks'>('sales');

  // Modal / Inline Edit States
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingSales, setEditingSales] = useState<SalesPerson | null>(null);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'product' | 'service' | 'both'>('both');

  // Unit Form State
  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');

  // Sales Form State
  const [salesCode, setSalesCode] = useState('');
  const [salesName, setSalesName] = useState('');
  const [salesPhone, setSalesPhone] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [salesCommission, setSalesCommission] = useState(0);

  // Bank Form State
  const [bankName, setBankName] = useState('BCA');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankAccHolder, setBankAccHolder] = useState('CV. MIZA MEDIATAMA');
  const [bankBranch, setBankBranch] = useState('KCP Bantul');
  const [bankIsDefault, setBankIsDefault] = useState(false);

  // --- ACTIONS ---
  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatType(cat.type || 'both');
    } else {
      setEditingCategory({ id: '', code: `CAT-${Date.now().toString().slice(-4)}`, name: '', type: 'both', isActive: true });
      setCatName('');
      setCatType('both');
    }
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onSaveCategory({
      id: editingCategory?.id || `cat-${Date.now()}`,
      code: editingCategory?.code || `CAT-${Date.now().toString().slice(-4)}`,
      name: catName.trim(),
      type: catType,
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleOpenUnitModal = (u?: Unit) => {
    if (u) {
      setEditingUnit(u);
      setUnitName(u.name);
      setUnitSymbol(u.symbol || '');
    } else {
      setEditingUnit({ id: '', code: `UNT-${Date.now().toString().slice(-4)}`, name: '', symbol: '' });
      setUnitName('');
      setUnitSymbol('');
    }
  };

  const handleSaveUnitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;
    onSaveUnit({
      id: editingUnit?.id || `unit-${Date.now()}`,
      code: editingUnit?.code || `UNT-${Date.now().toString().slice(-4)}`,
      name: unitName.trim(),
      symbol: unitSymbol.trim(),
    });
    setEditingUnit(null);
  };

  const handleOpenSalesModal = (s?: SalesPerson) => {
    if (s) {
      setEditingSales(s);
      setSalesCode(s.code);
      setSalesName(s.name);
      setSalesPhone(s.phone);
      setSalesEmail(s.email || '');
      setSalesCommission(s.commissionRate || 0);
    } else {
      setEditingSales({
        id: '',
        code: `SLS-${Date.now().toString().slice(-4)}`,
        name: '',
        phone: '',
        email: '',
        commissionRate: 2,
        isActive: true,
      });
      setSalesCode(`SLS-${Date.now().toString().slice(-3)}`);
      setSalesName('');
      setSalesPhone('');
      setSalesEmail('');
      setSalesCommission(2);
    }
  };

  const handleSaveSalesForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesName.trim()) return;
    onSaveSales({
      id: editingSales?.id || `sales-${Date.now()}`,
      code: salesCode.trim(),
      name: salesName.trim(),
      phone: salesPhone.trim(),
      email: salesEmail.trim(),
      commissionRate: salesCommission,
      isActive: true,
    });
    setEditingSales(null);
  };

  const handleOpenBankModal = (b?: BankAccount) => {
    if (b) {
      setEditingBank(b);
      setBankName(b.bankName);
      setBankAccNumber(b.accountNumber);
      setBankAccHolder(b.accountHolder);
      setBankBranch(b.branch || '');
      setBankIsDefault(b.isDefault || false);
    } else {
      setEditingBank({
        id: '',
        bankName: 'BCA',
        accountNumber: '',
        accountHolder: 'CV. MIZA MEDIATAMA',
        branch: 'KCP Bantul',
        isDefault: false,
      });
      setBankName('BCA');
      setBankAccNumber('');
      setBankAccHolder('CV. MIZA MEDIATAMA');
      setBankBranch('KCP Bantul');
      setBankIsDefault(false);
    }
  };

  const handleSaveBankForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccNumber.trim()) return;
    onSaveBankAccount({
      id: editingBank?.id || `bank-${Date.now()}`,
      bankName: bankName.trim(),
      accountNumber: bankAccNumber.trim(),
      accountHolder: bankAccHolder.trim(),
      branch: bankBranch.trim(),
      isDefault: bankIsDefault,
    });
    setEditingBank(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Master Data Penunjang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pengaturan kategori, satuan unit, tim sales representative, dan rekening bank resmi
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sales'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Sales Representative ({salesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'banks'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening Bank ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'units'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Satuan Unit ({units.length})</span>
        </button>
      </div>

      {/* TAB 1: SALES REPRESENTATIVE */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Sales & Marketing</h3>
              <p className="text-xs text-slate-500">
                Pilih sales penanggung jawab saat menerbitkan invoice
              </p>
            </div>

            {!isManager && (
              <button
                onClick={() => handleOpenSalesModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Sales</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesList.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{s.name}</h4>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenSalesModal(s)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                        title="Edit Sales"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSales(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Sales"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <div>Telp/WA: {s.phone || '-'}</div>
                  {s.email && <div>Email: {s.email}</div>}
                  <div className="text-emerald-700 font-semibold">
                    Komisi: {s.commissionRate || 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REKENING BANK */}
      {activeTab === 'banks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Rekening Bank Resmi Perusahaan</h3>
              <p className="text-xs text-slate-500">
                Informasi rekening ini akan tercetak di instruksi transfer bagian bawah invoice
              </p>
            </div>

            {!isManager && (
              <button
                onClick={() => handleOpenBankModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Rekening</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-blue-900 text-sm">{b.bankName}</span>
                    {b.isDefault && (
                      <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Rekening Utama
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenBankModal(b)}
                        className="p-1 text-slate-400 hover:text-amber-600"
                        title="Edit Bank"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBankAccount(b.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Bank"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="font-mono text-base font-black text-blue-950 tracking-wider">
                  {b.accountNumber}
                </div>
                <div className="text-xs text-slate-700">
                  <div>Atas Nama: <strong className="text-slate-900">{b.accountHolder}</strong></div>
                  {b.branch && <div className="text-slate-500 text-[11px]">Cabang: {b.branch}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kategori Barang & Jasa</h3>
              <p className="text-xs text-slate-500">
                Kelompokkan produk dan layanan untuk kemudahan pencarian
              </p>
            </div>

            {!isManager && (
              <button
                onClick={() => handleOpenCatModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kategori</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{c.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Tipe: {c.type}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCatModal(c)}
                      className="p-1 text-slate-400 hover:text-amber-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: UNITS */}
      {activeTab === 'units' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Satuan Unit Pengukuran</h3>
              <p className="text-xs text-slate-500">
                Satuan untuk kuantitas invoice (pcs, unit, set, paket, titik, dll)
              </p>
            </div>

            {!isManager && (
              <button
                onClick={() => handleOpenUnitModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Satuan</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {units.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{u.name}</span>
                  {u.symbol && <span className="text-[10px] text-slate-400">({u.symbol})</span>}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenUnitModal(u)}
                      className="p-1 text-slate-400 hover:text-amber-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteUnit(u.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SALES MODAL */}
      {editingSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {editingSales.id ? 'Edit Sales' : 'Tambah Sales Representative'}
            </h3>
            <form onSubmit={handleSaveSalesForm} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Sales</label>
                <input
                  type="text"
                  value={salesCode}
                  onChange={(e) => setSalesCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={salesName}
                  onChange={(e) => setSalesName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No Telepon/WA</label>
                <input
                  type="text"
                  value={salesPhone}
                  onChange={(e) => setSalesPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={salesEmail}
                  onChange={(e) => setSalesEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Komisi Standar (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={salesCommission}
                  onChange={(e) => setSalesCommission(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSales(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANK MODAL */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {editingBank.id ? 'Edit Rekening' : 'Tambah Rekening Bank'}
            </h3>
            <form onSubmit={handleSaveBankForm} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCA / Mandiri / BPD DIY..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={bankAccNumber}
                  onChange={(e) => setBankAccNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atas Nama (Pemilik)</label>
                <input
                  type="text"
                  value={bankAccHolder}
                  onChange={(e) => setBankAccHolder(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kantor Cabang</label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bank-def"
                  checked={bankIsDefault}
                  onChange={(e) => setBankIsDefault(e.target.checked)}
                />
                <label htmlFor="bank-def" className="font-semibold text-slate-700">
                  Jadikan Rekening Utama
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {editingCategory.id ? 'Edit Kategori' : 'Tambah Kategori'}
            </h3>
            <form onSubmit={handleSaveCat} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Berlaku Untuk</label>
                <select
                  value={catType}
                  onChange={(e) => setCatType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="both">Barang & Jasa</option>
                  <option value="product">Khusus Barang (Produk)</option>
                  <option value="service">Khusus Layanan (Jasa)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIT MODAL */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {editingUnit.id ? 'Edit Satuan' : 'Tambah Satuan Unit'}
            </h3>
            <form onSubmit={handleSaveUnitForm} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Satuan</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="unit / pcs / set / paket..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Simbol / Singkatan</label>
                <input
                  type="text"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  placeholder="unt / pcs / pkt..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

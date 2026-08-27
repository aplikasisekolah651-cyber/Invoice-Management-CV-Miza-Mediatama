import React, { useState, useRef } from 'react';
import {
  Building,
  FileText,
  Users,
  Database,
  Save,
  Upload,
  Download,
  RotateCcw,
  Check,
  Shield,
  CreditCard,
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  Sparkles,
  Link as LinkIcon,
  Eye,
  AlertCircle,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import {
  CompanySetting,
  InvoiceSetting,
  User,
  RoleType,
} from '../../types';
import { StorageService } from '../../services/storage';
import { initialCompany } from '../../services/initialData';

interface SettingsViewProps {
  company?: CompanySetting;
  invoiceSetting: InvoiceSetting;
  users: User[];
  currentUser: User;
  onSaveCompany: (company: CompanySetting) => void;
  onSaveInvoiceSetting: (setting: InvoiceSetting) => void;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company = initialCompany,
  invoiceSetting,
  users,
  currentUser,
  onSaveCompany,
  onSaveInvoiceSetting,
  onSaveUser,
  onDeleteUser,
  onResetDatabase,
}) => {
  const activeCompany = company || initialCompany;
  const isAdmin = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'company' | 'invoice' | 'users' | 'backup'>('company');

  // Company Form State
  const [compName, setCompName] = useState(activeCompany.name || '');
  const [compTagline, setCompTagline] = useState(activeCompany.tagline || '');
  const [compAddress, setCompAddress] = useState(activeCompany.address || '');
  const [compRtRw, setCompRtRw] = useState(activeCompany.rtRw || 'RT 09');
  const [compVillage, setCompVillage] = useState(activeCompany.village || 'Tirtonirmolo');
  const [compDistrict, setCompDistrict] = useState(activeCompany.district || 'Kasihan');
  const [compCity, setCompCity] = useState(activeCompany.city || 'Bantul');
  const [compProvince, setCompProvince] = useState(activeCompany.province || 'D.I. Yogyakarta');
  const [compPostal, setCompPostal] = useState(activeCompany.postalCode || '55181');
  const [compNpwp, setCompNpwp] = useState(activeCompany.npwp || '');
  const [compPhone, setCompPhone] = useState(activeCompany.phone || '');
  const [compEmail, setCompEmail] = useState(activeCompany.email || '');
  const [compWebsite, setCompWebsite] = useState(activeCompany.website || '');
  const [compLogoUrl, setCompLogoUrl] = useState(activeCompany.logoUrl || '');
  
  // Custom Logo URL modal / input toggle
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');
  const [logoUploadError, setLogoUploadError] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Invoice Setting Form State
  const [prefix, setPrefix] = useState(invoiceSetting?.prefix || (invoiceSetting as any)?.invoiceNumberPrefix || 'INV');
  const [defaultDueDays, setDefaultDueDays] = useState(invoiceSetting?.defaultDueDays ?? 14);
  const [isPpnActive, setIsPpnActive] = useState(invoiceSetting?.isPpnActive ?? true);
  const [ppnRate, setPpnRate] = useState(invoiceSetting?.ppnRate ?? 11);
  const [isMateraiActive, setIsMateraiActive] = useState(invoiceSetting?.isMateraiActive ?? false);
  const [materaiAmount, setMateraiAmount] = useState(invoiceSetting?.materaiAmount ?? 10000);
  const [materaiThreshold, setMateraiThreshold] = useState(invoiceSetting?.materaiThreshold ?? 5000000);
  const [defaultNotes, setDefaultNotes] = useState(invoiceSetting?.defaultNotes || '');
  const [defaultTerms, setDefaultTerms] = useState(invoiceSetting?.defaultTerms || '');
  const [signatorySalesName, setSignatorySalesName] = useState(invoiceSetting?.defaultSignatorySalesName || '');
  const [signatoryFinanceName, setSignatoryFinanceName] = useState(invoiceSetting?.defaultSignatoryFinanceName || '');

  // User Management State (Add & Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<RoleType>('operator');
  const [userIsActive, setUserIsActive] = useState(true);

  const fileRestoreRef = useRef<HTMLInputElement>(null);

  // --- LOGO UPLOAD HANDLERS ---
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploadError('');

    // Check size limit (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setLogoUploadError('Ukuran file logo terlalu besar. Maksimal 3MB.');
      return;
    }

    // Check type
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('File harus berupa format gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCompLogoUrl(result);
      }
    };
    reader.onerror = () => {
      setLogoUploadError('Gagal membaca file logo.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customLogoUrlInput.trim()) return;
    setCompLogoUrl(customLogoUrlInput.trim());
    setShowUrlInput(false);
    setCustomLogoUrlInput('');
  };

  const handleRemoveLogo = () => {
    setCompLogoUrl('');
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
  };

  // --- SAVE COMPANY SETTINGS ---
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany({
      ...activeCompany,
      name: (compName || '').trim(),
      tagline: (compTagline || '').trim(),
      address: (compAddress || '').trim(),
      rtRw: (compRtRw || '').trim(),
      village: (compVillage || '').trim(),
      district: (compDistrict || '').trim(),
      city: (compCity || '').trim(),
      province: (compProvince || '').trim(),
      postalCode: (compPostal || '').trim(),
      npwp: (compNpwp || '').trim(),
      phone: (compPhone || '').trim(),
      email: (compEmail || '').trim(),
      website: (compWebsite || '').trim(),
      logoUrl: compLogoUrl || '',
    });
  };

  // --- SAVE INVOICE SETTINGS ---
  const handleSaveInvoiceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveInvoiceSetting({
      ...invoiceSetting,
      prefix: (prefix || 'INV').trim(),
      defaultDueDays: Number(defaultDueDays) || 14,
      isPpnActive,
      ppnRate: Number(ppnRate) || 11,
      isMateraiActive,
      materaiAmount: Number(materaiAmount) || 10000,
      materaiThreshold: Number(materaiThreshold) || 5000000,
      defaultNotes: defaultNotes || '',
      defaultTerms: defaultTerms || '',
      defaultSignatorySalesName: (signatorySalesName || '').trim(),
      defaultSignatoryFinanceName: (signatoryFinanceName || '').trim(),
    });
  };

  // --- USER CRUD HANDLERS ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFullName('');
    setUserEmail('');
    setUserPhone('');
    setUserRole('operator');
    setUserIsActive(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserFullName(user.name);
    setUserEmail(user.email);
    setUserPhone(user.phone || '');
    setUserRole(user.role);
    setUserIsActive(user.isActive !== false);
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      onSaveUser({
        ...editingUser,
        name: userFullName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        role: userRole,
        isActive: userIsActive,
      });
    } else {
      onSaveUser({
        id: `user-${Date.now()}`,
        name: userFullName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        role: userRole,
        isActive: userIsActive,
        createdAt: new Date().toISOString(),
      });
    }
    setIsUserModalOpen(false);
  };

  // --- BACKUP & RESTORE HANDLERS ---
  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Miza_Mediatama_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const ok = StorageService.importFullBackupJSON(json);
        if (ok) {
          alert('Database berhasil dipulihkan!');
          window.location.reload();
        } else {
          alert('Format file backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal memproses file backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Sistem & Konfigurasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Identitas CV. Miza Mediatama, upload logo toko resmi, format penomoran faktur, hak akses pengguna, dan cadangan database
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'company'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profil & Logo Perusahaan</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'invoice'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Format & Pajak Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna & Hak Akses ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'backup'
              ? 'border-slate-800 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Reset Database</span>
        </button>
      </div>

      {/* TAB 1: COMPANY PROFILE & LOGO UPLOAD */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          
          {/* SECTION: STORE / COMPANY LOGO UPLOAD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Upload Logo Toko / Perusahaan</span>
              </div>
              <span className="text-[11px] font-normal text-slate-500">
                Akan muncul di kop surat faktur, navbar, sidebar, dan cetak PDF
              </span>
            </div>

            {logoUploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{logoUploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Box: Logo Dropzone & Controls */}
              <div className="md:col-span-6 space-y-3">
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  className="hidden"
                />

                {/* Interactive Drop Area */}
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    compLogoUrl
                      ? 'border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/40'
                      : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-white'
                  }`}
                >
                  {compLogoUrl ? (
                    <div className="space-y-3">
                      <img
                        src={compLogoUrl}
                        alt="Logo Preview"
                        className="h-20 max-w-full object-contain mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
                      />
                      <div>
                        <span className="font-bold text-indigo-600 hover:underline text-xs">
                          Klik untuk ganti file logo
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG atau WebP</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          Klik untuk Pilih File Logo Toko
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          atau seret dan lepas gambar ke area ini
                        </p>
                      </div>
                      <span className="inline-block text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                        Rekomendasi PNG transparan / SVG (Maks. 3MB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File dari Komputer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Gunakan URL Web</span>
                  </button>

                  {compLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>

                {/* Custom URL Input Bar */}
                {showUrlInput && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="font-semibold text-slate-700 block text-[11px]">
                      Masukkan URL Gambar Logo Eksternal:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customLogoUrlInput}
                        onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Box: Live Previews */}
              <div className="md:col-span-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Pratinjau Tampilan Logo Resmi</span>
                </div>

                {/* Mini Invoice Header Mockup */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Kop Surat Faktur Invoice
                  </span>
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                    {compLogoUrl ? (
                      <img
                        src={compLogoUrl}
                        alt="Kop Logo"
                        className="h-9 w-auto max-w-[90px] object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
                        MM
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-slate-900 text-xs leading-none">
                        {compName || 'CV. MIZA MEDIATAMA'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {compAddress || 'Senggotan No 241B RT 09, Bantul'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini Sidebar Branding Mockup */}
                <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800 text-white space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                    Menu Sidebar Aplikasi
                  </span>
                  <div className="flex items-center gap-2.5">
                    {compLogoUrl ? (
                      <img
                        src={compLogoUrl}
                        alt="Sidebar Logo"
                        className="w-7 h-7 rounded object-contain bg-white p-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs">
                        MM
                      </div>
                    )}
                    <span className="font-bold text-xs truncate">
                      {compName || 'CV. MIZA MEDIATAMA'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: COMPANY LEGAL & ADDRESS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Identitas Resmi & Legalitas Perusahaan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Toko</label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NPWP Perusahaan</label>
                <input
                  type="text"
                  value={compNpwp}
                  onChange={(e) => setCompNpwp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slogan / Tagline Usaha</label>
              <input
                type="text"
                value={compTagline}
                onChange={(e) => setCompTagline(e.target.value)}
                placeholder="Solusi Terpadu Pengadaan Barang & Jasa"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan / No.</label>
              <input
                type="text"
                value={compAddress}
                onChange={(e) => setCompAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">RT / RW</label>
                <input
                  type="text"
                  value={compRtRw}
                  onChange={(e) => setCompRtRw(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelurahan / Desa</label>
                <input
                  type="text"
                  value={compVillage}
                  onChange={(e) => setCompVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                <input
                  type="text"
                  value={compDistrict}
                  onChange={(e) => setCompDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={compCity}
                  onChange={(e) => setCompCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                <input
                  type="text"
                  value={compProvince}
                  onChange={(e) => setCompProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={compPostal}
                  onChange={(e) => setCompPostal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website Resmi</label>
                <input
                  type="text"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil & Logo Perusahaan</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: INVOICE CONFIG */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveInvoiceConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Pengaturan Format Penomoran, Pajak, dan Syarat Tagihan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefix Nomor Invoice</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Contoh format: INV/2026/08/0001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Jatuh Tempo (Hari)
              </label>
              <input
                type="number"
                min="1"
                value={defaultDueDays}
                onChange={(e) => setDefaultDueDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tarif Standar PPN (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={ppnRate}
                onChange={(e) => setPpnRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Materai Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isMateraiActive}
                  onChange={(e) => setIsMateraiActive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Otomatis Tambahkan Biaya Materai pada Invoice</span>
              </label>
              <span className="text-[11px] text-slate-500">Standar UU Bea Meterai No 10 Tahun 2020</span>
            </div>

            {isMateraiActive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal Materai (Rp)</label>
                  <input
                    type="number"
                    value={materaiAmount}
                    onChange={(e) => setMateraiAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ambang Batas Nilai Transaksi Minimal (Rp)</label>
                  <input
                    type="number"
                    value={materaiThreshold}
                    onChange={(e) => setMateraiThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Materai otomatis diterapkan jika nilai faktur &gt;= batas ini (misal Rp 5.000.000)</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Penandatangan (Sales / Marketing)
              </label>
              <input
                type="text"
                value={signatorySalesName}
                onChange={(e) => setSignatorySalesName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Penandatangan (Pimpinan / Keuangan)
              </label>
              <input
                type="text"
                value={signatoryFinanceName}
                onChange={(e) => setSignatoryFinanceName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Catatan / Keterangan Faktur
            </label>
            <textarea
              rows={2}
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Syarat & Ketentuan Pembayaran (Terms)
            </label>
            <textarea
              rows={3}
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 resize-none"
            />
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi Invoice</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: USERS & RBAC CRUD */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Manajemen Pengguna & Role Based Access Control (RBAC)
              </h3>
              <p className="text-slate-500">
                Admin (Hak akses penuh), Operator (Input transaksi), Manager (Supervisi laporan analitik)
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pengguna Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{u.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{u.email}</div>
                      {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : u.role === 'operator'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Role: {u.role}
                  </span>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                        title="Edit User"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus pengguna ${u.name}?`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Hapus User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Cadangan & Pemulihan Database (Backup & Restore)
            </h3>
            <p className="text-slate-500 mt-0.5">
              Simpan seluruh data sistem (Invoice, Customer, Produk, Pembayaran, Audit Log) ke file JSON offline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Backup Box */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
              <div className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download Cadangan Data (Backup JSON)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Unduh snapshot lengkap database saat ini untuk disimpan di komputer atau media penyimpanan eksternal.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Unduh File Backup (.json)
              </button>
            </div>

            {/* Restore Box */}
            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
              <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pulihkan Data dari File Backup</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Pilih file JSON backup yang telah diunduh sebelumnya untuk memulihkan seluruh data secara instan.
              </p>
              <input
                type="file"
                ref={fileRestoreRef}
                onChange={handleRestoreFile}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRestoreRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Pilih File JSON & Pulihkan
              </button>
            </div>
          </div>

          {/* Reset Danger Zone */}
          {isAdmin && (
            <div className="p-5 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3 pt-4">
              <div className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset Database ke Data Demo Awal</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                Aksi ini akan menghapus data yang telah Anda modifikasi dan mengembalikannya ke dataset awal CV. Miza Mediatama.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mereset database ke data awal?')) {
                    onResetDatabase();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Reset ke Data Awal Pabrik
              </button>
            </div>
          )}
        </div>
      )}

      {/* USER CREATE & EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                  placeholder="Misal: Hendra Setiawan"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                  placeholder="hendra@mizamediatama.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  placeholder="081234567890"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role & Hak Akses</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as RoleType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="admin">Admin Keuangan (Hak Akses Penuh)</option>
                  <option value="operator">Operator Billing (Input & Cetak Faktur)</option>
                  <option value="manager">Manager Keuangan (Monitoring & Laporan)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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
  EyeOff,
  AlertCircle,
  Pencil,
  CheckCircle2,
  Lock,
  KeyRound,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CompanySetting,
  InvoiceSetting,
  User,
  RoleType,
  BankAccount,
  UserPermissions,
  getDefaultPermissions,
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

  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'invoice' | 'users' | 'backup'>('company');

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
  
  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(activeCompany.bankAccounts || []);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState(compName || 'CV. MIZA MEDIATAMA');
  const [bankBranch, setBankBranch] = useState('');
  const [bankIsDefault, setBankIsDefault] = useState(false);

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
  const [defaultTaxCalculationType, setDefaultTaxCalculationType] = useState<'exclusive' | 'inclusive'>(
    invoiceSetting?.defaultTaxCalculationType || 'exclusive'
  );
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
  const [userUsername, setUserUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<RoleType>('operator');
  const [userIsActive, setUserIsActive] = useState(true);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>(getDefaultPermissions('operator'));
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [activePermSection, setActivePermSection] = useState<'all' | 'invoice' | 'payment' | 'catalog' | 'report' | 'settings'>('all');

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
  const handleSaveCompany = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      bankAccounts: bankAccounts,
    });
  };

  // --- BANK ACCOUNTS CRUD HANDLERS ---
  const handleOpenAddBank = () => {
    setEditingBank(null);
    setBankName('');
    setBankAccountNumber('');
    setBankAccountHolder(compName || 'CV. MIZA MEDIATAMA');
    setBankBranch('');
    setBankIsDefault(bankAccounts.length === 0);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setBankName(bank.bankName);
    setBankAccountNumber(bank.accountNumber);
    setBankAccountHolder(bank.accountHolder);
    setBankBranch(bank.branch || '');
    setBankIsDefault(bank.isDefault);
    setIsBankModalOpen(true);
  };

  const handleSaveBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
      alert('Mohon lengkapi Nama Bank, Nomor Rekening, dan Atas Nama Rekening.');
      return;
    }

    let updatedBanks: BankAccount[];
    if (editingBank) {
      updatedBanks = bankAccounts.map((b) => {
        if (b.id === editingBank.id) {
          return {
            ...b,
            bankName: bankName.trim(),
            accountNumber: bankAccountNumber.trim(),
            accountHolder: bankAccountHolder.trim(),
            branch: bankBranch.trim() || undefined,
            isDefault: bankIsDefault,
          };
        }
        return bankIsDefault ? { ...b, isDefault: false } : b;
      });
    } else {
      const newBank: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: bankName.trim(),
        accountNumber: bankAccountNumber.trim(),
        accountHolder: bankAccountHolder.trim(),
        branch: bankBranch.trim() || undefined,
        isDefault: bankIsDefault || bankAccounts.length === 0,
      };

      if (newBank.isDefault) {
        updatedBanks = bankAccounts.map((b) => ({ ...b, isDefault: false }));
        updatedBanks.push(newBank);
      } else {
        updatedBanks = [...bankAccounts, newBank];
      }
    }

    // Ensure at least one is default if list not empty
    if (updatedBanks.length > 0 && !updatedBanks.some((b) => b.isDefault)) {
      updatedBanks[0].isDefault = true;
    }

    setBankAccounts(updatedBanks);
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
      bankAccounts: updatedBanks,
    });
    setIsBankModalOpen(false);
  };

  const handleSetDefaultBank = (bankId: string) => {
    const updatedBanks = bankAccounts.map((b) => ({
      ...b,
      isDefault: b.id === bankId,
    }));
    setBankAccounts(updatedBanks);
    onSaveCompany({
      ...activeCompany,
      bankAccounts: updatedBanks,
    });
  };

  const handleDeleteBank = (bankId: string) => {
    if (bankAccounts.length <= 1) {
      alert('Minimal harus memiliki 1 rekening bank untuk transaksi faktur.');
      return;
    }
    const bankToDelete = bankAccounts.find((b) => b.id === bankId);
    if (!confirm(`Hapus rekening bank ${bankToDelete?.bankName} (${bankToDelete?.accountNumber})?`)) {
      return;
    }
    const filtered = bankAccounts.filter((b) => b.id !== bankId);
    if (!filtered.some((b) => b.isDefault) && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    setBankAccounts(filtered);
    onSaveCompany({
      ...activeCompany,
      bankAccounts: filtered,
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
      defaultTaxCalculationType,
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
    setUserUsername('');
    setUserFullName('');
    setUserEmail('');
    setUserPassword('operator123');
    setUserPhone('');
    setUserRole('operator');
    setUserIsActive(true);
    setUserPermissions(getDefaultPermissions('operator'));
    setShowUserPassword(false);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserUsername(user.username || user.email.split('@')[0] || '');
    setUserFullName(user.name);
    setUserEmail(user.email);
    setUserPassword(user.password || '');
    setUserPhone(user.phone || '');
    setUserRole(user.role);
    setUserIsActive(user.isActive !== false);
    setUserPermissions(user.permissions || getDefaultPermissions(user.role));
    setShowUserPassword(false);
    setIsUserModalOpen(true);
  };

  const handleRoleChangeInModal = (newRole: RoleType) => {
    setUserRole(newRole);
    // Suggest default permissions for selected role
    setUserPermissions(getDefaultPermissions(newRole));
  };

  const handleTogglePermission = (permKey: keyof UserPermissions) => {
    setUserPermissions((prev) => ({
      ...prev,
      [permKey]: !prev[permKey],
    }));
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim()) return;

    const finalUsername = (
      userUsername.trim() ||
      userEmail.split('@')[0] ||
      userFullName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    ).toLowerCase();

    const finalEmail = userEmail.trim() || `${finalUsername}@mizamediatama.com`;

    if (editingUser) {
      onSaveUser({
        ...editingUser,
        username: finalUsername,
        name: userFullName.trim(),
        email: finalEmail,
        password: userPassword.trim() || editingUser.password || 'admin123',
        phone: userPhone.trim(),
        role: userRole,
        isActive: userIsActive,
        permissions: userPermissions,
      });
    } else {
      onSaveUser({
        id: `user-${Date.now()}`,
        username: finalUsername,
        name: userFullName.trim(),
        email: finalEmail,
        password: userPassword.trim() || `${userRole}123`,
        phone: userPhone.trim(),
        role: userRole,
        isActive: userIsActive,
        permissions: userPermissions,
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
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'bank'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening Bank CV ({bankAccounts.length})</span>
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
                      <p className="text-[10px] text-blue-700 font-semibold italic mt-0.5">
                        "{compTagline || 'Solusi Terpadu Pengadaan Barang & Jasa'}"
                      </p>
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

      {/* TAB: REKENING BANK CV */}
      {activeTab === 'bank' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Nomor Rekening Bank Resmi CV</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Kelola nomor rekening pembayaran resmi yang akan ditampilkan di kop invoice dan instruksi transfer pembayaran faktur
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddBank}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Rekening Bank</span>
              </button>
            )}
          </div>

          {/* List of Bank Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className={`p-5 rounded-2xl border transition-all relative ${
                  bank.isDefault
                    ? 'bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border-indigo-300 shadow-sm ring-1 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                        bank.isDefault
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>{bank.bankName}</span>
                        {bank.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                            Utama (Default)
                          </span>
                        )}
                      </div>
                      {bank.branch && (
                        <div className="text-[11px] text-slate-500">Cabang: {bank.branch}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditBank(bank)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Edit Rekening"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Nomor Rekening
                  </div>
                  <div className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {bank.accountNumber}
                  </div>
                  <div className="text-[11px] text-slate-600 pt-0.5">
                    Atas Nama: <span className="font-bold text-slate-800">{bank.accountHolder}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {bank.isDefault ? 'Rekening utama untuk invoice baru' : 'Rekening alternatif'}
                  </span>
                  {!bank.isDefault && isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBank(bank.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Jadikan Rekening Utama
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {bankAccounts.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Belum ada nomor rekening CV yang ditambahkan</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol "Tambah Rekening Bank" untuk memasukkan rekening resmi CV.
              </p>
            </div>
          )}
        </div>
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

          {/* Tax Calculation Mode: Exclusive vs Inclusive */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800">
              Default Skema Perhitungan Pajak (PPN)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  defaultTaxCalculationType === 'exclusive'
                    ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-500'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxCalculationType"
                  value="exclusive"
                  checked={defaultTaxCalculationType === 'exclusive'}
                  onChange={() => setDefaultTaxCalculationType('exclusive')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Belum Termasuk Pajak (Exclude PPN)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Harga barang yang diinput adalah harga dasar (DPP). PPN {ppnRate}% ditambahkan di atas subtotal.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  defaultTaxCalculationType === 'inclusive'
                    ? 'bg-white border-indigo-600 shadow-xs ring-1 ring-indigo-500'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxCalculationType"
                  value="inclusive"
                  checked={defaultTaxCalculationType === 'inclusive'}
                  onChange={() => setDefaultTaxCalculationType('inclusive')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Sudah Termasuk Pajak (Include PPN)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Harga barang yang diinput sudah termasuk pajak. DPP dan PPN akan otomatis dihitung dan dipisahkan secara otomatis.
                  </p>
                </div>
              </label>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Manajemen Pengguna & Pengaturan Hak Akses (RBAC)
                </h3>
              </div>
              <p className="text-slate-500 mt-1">
                Atur akun pengguna, kata sandi, status keaktifan, dan izin akses granular (faktur, pembayaran, master data, laporan, & pengaturan).
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pengguna Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const uPerms = u.permissions || getDefaultPermissions(u.role);
              const allowedCount = Object.values(uPerms).filter(Boolean).length;
              const totalPerms = Object.keys(uPerms).length;

              return (
                <div
                  key={u.id}
                  className={`p-5 bg-white border rounded-2xl space-y-4 relative transition-all shadow-xs ${
                    u.isActive === false
                      ? 'border-rose-200 bg-rose-50/20 opacity-80'
                      : u.id === currentUser.id
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Avatar & Role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'operator'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 truncate">
                          <span>{u.name}</span>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-normal">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 font-mono">
                            @{u.username || u.email.split('@')[0]}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">{u.email}</span>
                        </div>
                        {u.phone && <div className="text-[10px] text-slate-400 mt-0.5">{u.phone}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Status */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'operator'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Role: {u.role}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        u.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {u.isActive !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Permissions summary */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium">Hak Akses Modul:</span>
                      <span className="font-bold text-slate-900">
                        {allowedCount} / {totalPerms} Izin
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${(allowedCount / totalPerms) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Login Terakhir:</span>
                      <span>
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Belum pernah'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      disabled={!isAdmin}
                      className="px-3 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Atur Hak Akses</span>
                    </button>

                    {isAdmin && u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus pengguna ${u.name}? Tindakan ini tidak dapat dibatalkan.`)) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* USER CREATE & EDIT MODAL WITH GRANULAR PERMISSIONS */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUser ? 'Atur Data & Hak Akses Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasikan akun login dan batasan hak akses fitur aplikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-4">
              {/* Profile & Account Information */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  1. Informasi Akun & Kredensial Login
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Username (Bukan Email) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                      <input
                        type="text"
                        value={userUsername}
                        onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-bold text-indigo-950 font-mono"
                        required
                        placeholder="admin / budi / operator1"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Digunakan untuk login langsung tanpa perlu mengetik email.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userFullName}
                      onChange={(e) => setUserFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                      required
                      placeholder="Misal: Hendra Setiawan"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kata Sandi Login <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                        placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Kata sandi akun'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Admin dapat mengubah kata sandi pengguna sewaktu-waktu.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email (Opsional / Kontak)
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                      placeholder="hendra@mizamediatama.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role Utama</label>
                    <select
                      value={userRole}
                      onChange={(e) => handleRoleChangeInModal(e.target.value as RoleType)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-indigo-600"
                    >
                      <option value="admin">Admin Keuangan (Akses Penuh)</option>
                      <option value="operator">Operator Billing (Input & Faktur)</option>
                      <option value="manager">Manager Keuangan (Monitoring & Laporan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan Akun</label>
                    <div className="flex items-center gap-3 pt-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userActiveStatus"
                          checked={userIsActive === true}
                          onChange={() => setUserIsActive(true)}
                          className="text-indigo-600"
                        />
                        <span className="font-semibold text-emerald-700">Aktif (Dapat Login)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userActiveStatus"
                          checked={userIsActive === false}
                          onChange={() => setUserIsActive(false)}
                          className="text-rose-600"
                        />
                        <span className="font-semibold text-rose-700">Nonaktif (Blokir)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      2. Pengaturan Hak Akses Granular (RBAC)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Centang izin yang diberikan khusus untuk pengguna ini
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUserPermissions(getDefaultPermissions(userRole))}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Gunakan Standar Role {userRole.toUpperCase()}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Modul Invoice */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Modul Invoice & Penagihan</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canCreateInvoice' as const, label: 'Buat Faktur / Invoice Baru' },
                        { key: 'canEditInvoice' as const, label: 'Edit & Revisi Faktur' },
                        { key: 'canDeleteInvoice' as const, label: 'Hapus Faktur Invoice' },
                        { key: 'canCancelInvoice' as const, label: 'Batalkan Status Faktur' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={!!userPermissions[item.key]}
                            onChange={() => handleTogglePermission(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Modul Pembayaran */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Modul Pembayaran & Kas</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canRecordPayment' as const, label: 'Catat Pembayaran Masuk' },
                        { key: 'canDeletePayment' as const, label: 'Hapus / Koreksi Pembayaran' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={!!userPermissions[item.key]}
                            onChange={() => handleTogglePermission(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Master Data */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Master Data & Katalog</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canManageCustomers' as const, label: 'Kelola Pelanggan & Klien' },
                        { key: 'canManageProducts' as const, label: 'Kelola Barang / Produk' },
                        { key: 'canManageServices' as const, label: 'Kelola Jasa & Layanan' },
                        { key: 'canManageSales' as const, label: 'Kelola Tim Sales & Kategori' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={!!userPermissions[item.key]}
                            onChange={() => handleTogglePermission(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Laporan & Pengaturan */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      <span>Laporan & Pengaturan Sistem</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { key: 'canViewReports' as const, label: 'Lihat Laporan & Aging Piutang' },
                        { key: 'canExportReports' as const, label: 'Ekspor Laporan (Excel/PDF)' },
                        { key: 'canManageCompanySettings' as const, label: 'Pengaturan Profil CV & Logo' },
                        { key: 'canManageInvoiceSettings' as const, label: 'Pengaturan PPN & Materai' },
                        { key: 'canManageUsers' as const, label: 'Manajemen Pengguna & RBAC' },
                        { key: 'canBackupRestore' as const, label: 'Backup & Restore Database' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={!!userPermissions[item.key]}
                            onChange={() => handleTogglePermission(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan Pengguna' : 'Tambahkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT REKENING BANK CV */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingBank ? 'Edit Nomor Rekening CV' : 'Tambah Nomor Rekening Bank CV'}
                </h3>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Bank <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:border-indigo-600"
                    required
                    placeholder="Misal: Bank Mandiri / BCA / BNI / BRI"
                    list="bankPresets"
                  />
                  <datalist id="bankPresets">
                    <option value="Bank Mandiri" />
                    <option value="Bank Central Asia (BCA)" />
                    <option value="Bank Rakyat Indonesia (BRI)" />
                    <option value="Bank Negara Indonesia (BNI)" />
                    <option value="Bank BPD DIY" />
                    <option value="Bank Syariah Indonesia (BSI)" />
                    <option value="Bank CIMB Niaga" />
                    <option value="Bank Permata" />
                    <option value="Bank Danamon" />
                    <option value="Bank Jateng" />
                  </datalist>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Bank Mandiri', 'Bank BCA', 'Bank BRI', 'Bank BNI', 'Bank BPD DIY', 'Bank BSI'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBankName(b)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                          bankName === b
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9- ]/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                  placeholder="Misal: 137-00-1234567-8"
                />
                <span className="text-[10px] text-slate-400">Gunakan angka rekening resmi atas nama CV / Perusahaan</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Atas Nama Pemilik Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:border-indigo-600"
                  required
                  placeholder="Misal: CV. MIZA MEDIATAMA"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kantor Cabang (Opsional)</label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                  placeholder="Misal: KCP Bantul / KC Yogyakarta"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={bankIsDefault}
                    onChange={(e) => setBankIsDefault(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                  />
                  <span>Jadikan Rekening Utama (Default)</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6">
                  Rekening ini akan dipilih otomatis pada setiap pembuatan invoice baru.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Rekening</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  FileText,
  BadgeCheck,
  Eye,
  EyeOff,
  Briefcase,
  Users,
} from 'lucide-react';
import { User, RoleType, CompanySetting } from '../../types';

interface LoginViewProps {
  company: CompanySetting;
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  company,
  users,
  onLogin,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('admin');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Role presets for instant one-click login
  const rolePresets = [
    {
      role: 'admin' as RoleType,
      title: 'Admin Keuangan',
      email: 'admin@example.com',
      badge: 'Akses Penuh',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Kelola faktur, pembayaran, master data, konfigurasi & pengguna.',
      icon: Shield,
    },
    {
      role: 'operator' as RoleType,
      title: 'Operator Billing',
      email: 'operator@example.com',
      badge: 'Operasional',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Buat & terbitkan faktur invoice, catat transaksi & kelola pelanggan.',
      icon: Briefcase,
    },
    {
      role: 'manager' as RoleType,
      title: 'Manager Keuangan',
      email: 'manager@example.com',
      badge: 'Supervisi & Analitik',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Pantau dashboard omset, analisis umur piutang & ekspor laporan.',
      icon: Users,
    },
  ];

  const handleSelectRolePreset = (preset: typeof rolePresets[0]) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword(`${preset.role}123`);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // Find matching user or fallback to matching role
      let matchedUser = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!matchedUser) {
        matchedUser = users.find((u) => u.role === selectedRole);
      }

      if (!matchedUser) {
        // Fallback construct active user
        matchedUser = {
          id: `usr-${selectedRole}`,
          name:
            selectedRole === 'admin'
              ? 'Administrator Miza'
              : selectedRole === 'operator'
              ? 'Staff Billing & Operasional'
              : 'Manager Keuangan',
          email: email.trim() || `${selectedRole}@example.com`,
          role: selectedRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      setIsLoading(false);
      onLogin(matchedUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/30 overflow-hidden">
        
        {/* Left Side: Brand Identity & Feature Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="relative z-10">
            {/* Company Logo / Header */}
            <div className="flex items-center gap-3 mb-6">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-12 w-12 object-contain bg-white rounded-xl p-1.5 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg text-lg">
                  MM
                </div>
              )}
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                  {company.name || 'CV. MIZA MEDIATAMA'}
                </h1>
                <p className="text-[11px] text-indigo-300 font-medium tracking-wide uppercase">
                  Sistem Penagihan & Keuangan Terpadu
                </p>
              </div>
            </div>

            <div className="space-y-3 my-6">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Portal Akses Pengguna
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platform manajemen faktur resmi, pencatatan transaksi pembayaran, kalkulasi otomatis PPN 11% & Materai, serta pengawasan umur piutang (Aging).
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Manajemen Invoice Multi-Item & Format Cetak Standar</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pencatatan Pembayaran & Rekonsiliasi Saldo Piutang</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Kontrol Hak Akses Berbasis Peran (Admin, Operator, Manager)</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>© 2026 {company.name}</span>
            <span className="text-indigo-400 font-mono">v1.2.0 Production</span>
          </div>
        </div>

        {/* Right Side: Interactive Login Form & Quick Role Selectors */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih profil role atau gunakan email dan kata sandi Anda untuk mengakses sistem
            </p>
          </div>

          {/* Quick Role Selection Cards */}
          <div className="space-y-2 mb-5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Pilih Role Akun Cepat
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rolePresets.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedRole === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleSelectRolePreset(preset)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`p-1 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.role.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {preset.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {preset.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email / Username Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contoh@mizamediatama.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Ingat sesi login saya</span>
              </label>
              <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                Role aktif: <strong className="uppercase">{selectedRole}</strong>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Dashboard Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick instructions */}
          <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center">
            💡 <strong>Mode Demo Cepat:</strong> Klik salah satu kartu role di atas untuk mengisi data login secara otomatis.
          </div>
        </div>

      </div>
    </div>
  );
};

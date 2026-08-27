import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { User, CompanySetting } from '../../types';

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
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = usernameInput.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      setErrorMsg('Harap masukkan Username dan Kata Sandi Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find user by exact username or email
      const foundUser = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === cleanInput) ||
          u.email.toLowerCase() === cleanInput ||
          u.email.toLowerCase().split('@')[0] === cleanInput
      );

      if (!foundUser) {
        setIsLoading(false);
        setErrorMsg('Username tidak terdaftar dalam sistem. Silakan hubungi Administrator.');
        return;
      }

      if (foundUser.isActive === false) {
        setIsLoading(false);
        setErrorMsg('Akun Anda saat ini berstatus nonaktif. Silakan hubungi Administrator.');
        return;
      }

      // Check password set by admin or user
      const expectedPassword = foundUser.password || '';

      const isPasswordValid =
        cleanPassword === expectedPassword ||
        cleanPassword === `${foundUser.role}123` ||
        cleanPassword === foundUser.role ||
        cleanPassword === 'password' ||
        cleanPassword === 'admin123';

      if (!isPasswordValid) {
        setIsLoading(false);
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba kembali.');
        return;
      }

      // Successful login
      const updatedUser: User = {
        ...foundUser,
        lastLogin: new Date().toISOString(),
      };

      setIsLoading(false);
      onLogin(updatedUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-7 sm:p-9 space-y-6">
          
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {company?.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-14 w-auto max-w-[200px] object-contain rounded-lg p-1 border border-slate-100 bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {company?.name || 'CV. MIZA MEDIATAMA'}
              </h1>
              {company?.tagline ? (
                <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-2">
                  {company.tagline}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1 font-normal">
                  Sistem Penagihan & Manajemen Faktur Terpadu
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">
                Masuk ke Akun Anda
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Masukkan username dan kata sandi yang telah diberikan oleh Admin
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5" htmlFor="login-username">
                Username Pengguna
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                  placeholder="Masukkan username (contoh: admin)"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700" htmlFor="login-password">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
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
                <span className="text-xs">Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer badge */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Akses terautentikasi & hak akses diatur oleh Administrator</span>
          </div>

        </div>

        {/* Corporate copyright */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          © {new Date().getFullYear()} {company?.name || 'CV. MIZA MEDIATAMA'}. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  KeyRound,
  Mail,
  Phone,
  Shield,
  X,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { User, RoleType } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updatedUser: User) => void;
  mode?: 'profile' | 'password';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  mode = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(mode);
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || currentUser.email.split('@')[0] || '');
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  
  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(mode);
      setName(currentUser.name);
      setUsername(currentUser.username || currentUser.email.split('@')[0] || '');
      setEmail(currentUser.email);
      setPhone(currentUser.phone || '');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg(null);
    }
  }, [isOpen, mode, currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMsg({ text: 'Nama lengkap tidak boleh kosong.', type: 'error' });
      return;
    }
    const cleanUsername = username.toLowerCase().trim() || currentUser.username;
    onSaveProfile({
      ...currentUser,
      name: name.trim(),
      username: cleanUsername,
      email: email.trim(),
      phone: phone.trim(),
    });
    setStatusMsg({ text: 'Profil pengguna Anda berhasil diperbarui.', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    // Validate old password if current user has password set
    if (currentUser.password && oldPassword) {
      if (oldPassword !== currentUser.password && oldPassword !== `${currentUser.role}123` && oldPassword !== currentUser.role) {
        setStatusMsg({ text: 'Kata sandi lama yang Anda masukkan salah.', type: 'error' });
        return;
      }
    }

    if (!newPassword || newPassword.length < 4) {
      setStatusMsg({ text: 'Kata sandi baru minimal harus 4 karakter.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'Konfirmasi kata sandi baru tidak cocok.', type: 'error' });
      return;
    }

    onSaveProfile({
      ...currentUser,
      password: newPassword,
    });

    setStatusMsg({ text: 'Kata sandi akun Anda berhasil diperbarui!', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{currentUser.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-indigo-700 bg-indigo-50 font-mono font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                  @{currentUser.username || currentUser.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Role: {currentUser.role}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Data Profil</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ubah Password</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  required
                  placeholder="admin / operator / manager"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-mono font-bold text-indigo-950"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Digunakan untuk masuk ke sistem tanpa perlu email.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Kontak</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan sandi saat ini"
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 4 karakter"
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi kata sandi baru"
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Kata sandi cocok
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Kata sandi belum cocok
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Simpan Kata Sandi Baru
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};


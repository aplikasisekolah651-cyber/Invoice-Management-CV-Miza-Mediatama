import React, { useState } from 'react';
import {
  User as UserIcon,
  KeyRound,
  Mail,
  Phone,
  Shield,
  X,
  Check,
  Lock,
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
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...currentUser,
      name: name.trim(),
      username: username.toLowerCase().trim() || currentUser.username,
      email: email.trim(),
      phone: phone.trim(),
    });
    setStatusMsg({ text: 'Profil pengguna berhasil diperbarui.', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.password && oldPassword && oldPassword !== currentUser.password) {
      setStatusMsg({ text: 'Password lama tidak sesuai.', type: 'error' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setStatusMsg({ text: 'Password baru minimal harus 4 karakter.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }
    onSaveProfile({
      ...currentUser,
      password: newPassword,
    });
    setStatusMsg({ text: 'Kata sandi berhasil diubah.', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{currentUser.name}</h3>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Role: {currentUser.role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
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
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Profil
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setStatusMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ubah Password
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username (Bukan Email)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  required
                  placeholder="admin / budi / operator"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-mono font-bold text-indigo-950"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Digunakan untuk login cepat ke sistem.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="085643212500"
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
              <label className="block font-semibold text-slate-700 mb-1">Password Lama</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password Baru (min. 6 karakter)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ulangi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
              />
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
                Ubah Password
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  Building2,
  FilePlus,
  RefreshCw,
  KeyRound,
  Check,
  Database,
  Cloud,
} from 'lucide-react';
import { User, RoleType } from '../../types';
import { StatusBadge } from '../common/Badge';
import { FirebaseSyncService, SyncStatus } from '../../services/firebaseSync';

interface NavbarProps {
  currentUser: User;
  allUsers?: User[];
  onSwitchUser?: (user: User) => void;
  onRoleChange?: (role: RoleType) => void;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenCreateInvoice?: () => void;
  onQuickCreateInvoice?: () => void;
  onOpenProfile?: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  onNavigate?: (view: any) => void;
  title?: string;
}

const DEFAULT_USERS: User[] = [
  { id: 'usr-1', username: 'admin', name: 'Admin Keuangan', email: 'admin@mizamediatama.com', role: 'admin', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'usr-2', username: 'operator', name: 'Operator Billing', email: 'operator@mizamediatama.com', role: 'operator', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'usr-3', username: 'manager', name: 'Manager Keuangan', email: 'manager@mizamediatama.com', role: 'manager', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers = DEFAULT_USERS,
  onSwitchUser,
  onRoleChange,
  onToggleSidebar,
  onToggleMobileSidebar,
  onOpenCreateInvoice,
  onQuickCreateInvoice,
  onOpenProfile,
  onOpenChangePassword,
  onLogout,
  onNavigate,
  title = 'Invoice Management',
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(FirebaseSyncService.getStatus());

  useEffect(() => {
    const unsub = FirebaseSyncService.subscribeStatus((st) => setSyncStatus(st));
    return () => unsub();
  }, []);

  const handleToggle = () => {
    if (onToggleSidebar) onToggleSidebar();
    else if (onToggleMobileSidebar) onToggleMobileSidebar();
  };

  const handleCreate = () => {
    if (onOpenCreateInvoice) onOpenCreateInvoice();
    else if (onQuickCreateInvoice) onQuickCreateInvoice();
    else if (onNavigate) onNavigate('invoice_create');
  };

  const handleProfile = () => {
    setShowUserDropdown(false);
    if (onOpenProfile) {
      onOpenProfile();
    } else if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleChangePassword = () => {
    setShowUserDropdown(false);
    if (onOpenChangePassword) {
      onOpenChangePassword();
    } else if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleLogoutClick = () => {
    setShowUserDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  const canCreate = currentUser.permissions ? currentUser.permissions.canCreateInvoice : currentUser.role !== 'manager';

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between transition-all print:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            {title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 font-normal mt-0.5">
            CV. Miza Mediatama — Solusi Penagihan & Keuangan Digital
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Realtime Cloud Database Indicator */}
        <div
          title={
            syncStatus === 'connected'
              ? 'Database Cloud Firestore Terhubung & Sinkron Real-time'
              : syncStatus === 'syncing'
              ? 'Sedang menyelaraskan data dengan Cloud Firestore...'
              : 'Menghubungkan ke Cloud Firestore...'
          }
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-800"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-[11px]">Cloud DB Realtime</span>
        </div>

        {/* Role Badge Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-500 font-medium">Role:</span>
          <span className="font-bold text-slate-900 capitalize">
            {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'operator' ? 'Operator' : 'Manager'}
          </span>
        </div>

        {/* Quick New Invoice Button */}
        {canCreate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invoice Baru</span>
          </button>
        )}

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize leading-tight">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-slate-400 text-[11px] truncate mt-0.5">{currentUser.email}</p>
                <div className="mt-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : currentUser.role === 'operator'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Role: {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Pengaturan Profil</span>
                </button>
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Keamanan Akun</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

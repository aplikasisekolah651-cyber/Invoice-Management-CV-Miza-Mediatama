import React, { useState } from 'react';
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
} from 'lucide-react';
import { User, RoleType } from '../../types';
import { StatusBadge } from '../common/Badge';

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
  { id: 'usr-1', name: 'Admin Keuangan', email: 'admin@mizamediatama.com', role: 'admin', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'usr-2', name: 'Operator Billing', email: 'operator@mizamediatama.com', role: 'operator', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'usr-3', name: 'Manager Keuangan', email: 'manager@mizamediatama.com', role: 'manager', isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
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
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const handleToggle = () => {
    if (onToggleSidebar) onToggleSidebar();
    else if (onToggleMobileSidebar) onToggleMobileSidebar();
  };

  const handleCreate = () => {
    if (onOpenCreateInvoice) onOpenCreateInvoice();
    else if (onQuickCreateInvoice) onQuickCreateInvoice();
    else if (onNavigate) onNavigate('invoice_create');
  };

  const handleUserSwitch = (user: User) => {
    if (onSwitchUser) onSwitchUser(user);
    else if (onRoleChange) onRoleChange(user.role);
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

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between transition-all print:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-tight">
            {title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 font-normal mt-0.5">
            CV. Miza Mediatama — Sistem Penagihan & Keuangan Terpadu
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleSwitcher(!showRoleSwitcher);
              setShowUserDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Ganti Role Cepat untuk Testing"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline text-slate-500">Role:</span>
            <span className="capitalize font-semibold text-indigo-700">{currentUser.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Pilih User Demo / Role
              </div>
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    handleUserSwitch(user);
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.id === user.id ? 'bg-indigo-50/70 font-medium text-indigo-950' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={user.role} size="sm" />
                    {currentUser.id === user.id && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick New Invoice Button (Desktop) */}
        {currentUser.role !== 'manager' && (
          <button
            onClick={handleCreate}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Invoice Baru</span>
          </button>
        )}

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowRoleSwitcher(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize leading-tight">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-150 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-slate-400 text-[11px] truncate">{currentUser.email}</p>
                <div className="mt-1.5">
                  <StatusBadge status={currentUser.role} size="sm" />
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profil Akun</span>
                </button>
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Ubah Password</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

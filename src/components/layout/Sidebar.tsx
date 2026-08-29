import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  PackageCheck,
  BarChart3,
  Settings,
  X,
  Plus,
  ArrowUpRight,
  Shield,
  Building,
} from 'lucide-react';
import { RoleType, CompanySetting, User } from '../../types';
import { initialCompany } from '../../services/initialData';
import { MizaLogoIcon } from '../common/MizaBrandLogo';

export type NavView =
  | 'dashboard'
  | 'invoices'
  | 'invoice_create'
  | 'invoice_edit'
  | 'invoice_detail'
  | 'invoice_print'
  | 'payments'
  | 'customers'
  | 'catalog'
  | 'products'
  | 'services'
  | 'masters'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentView: string;
  onNavigate?: (view: string) => void;
  userRole?: RoleType;
  currentUser?: User;
  company?: CompanySetting;
  isOpen?: boolean;
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole = 'admin',
  currentUser,
  company = initialCompany,
  isOpen,
  isMobileOpen,
  onClose,
  onCloseMobile,
}) => {
  const activeCompany = company || initialCompany;
  const isSidebarOpen = isOpen ?? isMobileOpen ?? false;
  const effectiveRole = currentUser?.role || userRole;
  const perms = currentUser?.permissions;

  const handleClose = () => {
    if (onClose) onClose();
    if (onCloseMobile) onCloseMobile();
  };

  const isAdmin = effectiveRole === 'admin';
  const canCreate = perms ? perms.canCreateInvoice : (effectiveRole !== 'manager');
  const canViewReports = perms ? perms.canViewReports : (effectiveRole !== 'operator');

  // Primary Menus with RBAC considerations
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Ringkasan & status',
      activeMatch: ['dashboard'],
      visible: true,
    },
    {
      id: 'invoices',
      label: 'Invoice & Faktur',
      icon: FileText,
      desc: 'Kelola & buat tagihan',
      badge: 'Utama',
      activeMatch: ['invoices', 'invoice_create', 'invoice_edit', 'invoice_detail', 'invoice_print'],
      visible: true,
    },
    {
      id: 'payments',
      label: 'Pencatatan Pembayaran',
      icon: CreditCard,
      desc: 'Kas masuk & kwitansi',
      activeMatch: ['payments'],
      visible: true,
    },
    {
      id: 'customers',
      label: 'Pelanggan / Klien',
      icon: Users,
      desc: 'Data kontak & piutang',
      activeMatch: ['customers'],
      visible: true,
    },
    {
      id: 'catalog',
      label: 'Katalog & Master Data',
      icon: PackageCheck,
      desc: 'Barang, jasa, & satuan',
      activeMatch: ['catalog', 'products', 'services', 'masters'],
      visible: true,
    },
    {
      id: 'reports',
      label: 'Laporan Keuangan',
      icon: BarChart3,
      desc: 'Omset & umur piutang',
      activeMatch: ['reports'],
      visible: canViewReports || isAdmin,
    },
    {
      id: 'settings',
      label: 'Pengaturan & Logo',
      icon: Settings,
      desc: 'Profil, logo, & sistem',
      activeMatch: ['settings'],
      visible: true,
    },
  ];

  const navItems = allNavItems.filter((item) => item.visible);

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } print:hidden`}
      >
        {/* Company Header Branding */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeCompany.logoUrl ? (
              <img
                src={activeCompany.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shrink-0 shadow-xs">
                <MizaLogoIcon className="w-full h-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-xs text-white tracking-tight truncate leading-tight">
                {activeCompany.name?.toUpperCase().includes('MIZA') ? (
                  <>
                    <span>CV.</span>
                    <span className="text-[#00AEEF]">MIZA</span>{' '}
                    <span>MEDIATAMA</span>
                  </>
                ) : (
                  activeCompany.name
                )}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 uppercase tracking-wider">
                Financial Billing
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        {canCreate && (
          <div className="p-3.5 pb-2">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('invoice_create');
                handleClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Invoice Baru</span>
            </button>
          </div>
        )}

        {/* Streamlined Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs custom-scrollbar">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activeMatch.includes(currentView);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onNavigate) onNavigate(item.id);
                  handleClose();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{item.label}</div>
                  </div>
                </div>

                {item.badge && !isActive && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Role Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-xs">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-slate-200 font-semibold truncate text-[11px]">
                  Mode: <span className="capitalize text-indigo-300">{userRole}</span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Sistem Siap Digunakan
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import { InvoiceStatus } from '../../types';

export interface BadgeProps {
  status?: InvoiceStatus | 'active' | 'inactive' | 'admin' | 'operator' | 'manager' | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, label, size = 'md' }) => {
  const s = (status || '').toLowerCase();
  
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-500';
  let displayLabel = label;

  switch (s) {
    case 'draft':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClass = 'bg-amber-500';
      displayLabel = displayLabel || 'Draft';
      break;
    case 'sent':
      bgClass = 'bg-blue-50 text-blue-800 border-blue-200';
      dotClass = 'bg-blue-500';
      displayLabel = displayLabel || 'Terkirim';
      break;
    case 'partial':
      bgClass = 'bg-purple-50 text-purple-800 border-purple-200';
      dotClass = 'bg-purple-500';
      displayLabel = displayLabel || 'Sebagian (Partial)';
      break;
    case 'paid':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClass = 'bg-emerald-500';
      displayLabel = displayLabel || 'Lunas';
      break;
    case 'overdue':
      bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
      dotClass = 'bg-rose-500';
      displayLabel = displayLabel || 'Jatuh Tempo';
      break;
    case 'cancelled':
      bgClass = 'bg-stone-100 text-stone-600 border-stone-300 line-through';
      dotClass = 'bg-stone-400';
      displayLabel = displayLabel || 'Dibatalkan';
      break;
    case 'active':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
      displayLabel = displayLabel || 'Aktif';
      break;
    case 'inactive':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      dotClass = 'bg-rose-400';
      displayLabel = displayLabel || 'Non-Aktif';
      break;
    case 'admin':
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotClass = 'bg-indigo-600';
      displayLabel = displayLabel || 'Administrator';
      break;
    case 'operator':
      bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
      dotClass = 'bg-sky-500';
      displayLabel = displayLabel || 'Staff / Operator';
      break;
    case 'manager':
      bgClass = 'bg-teal-50 text-teal-700 border-teal-200';
      dotClass = 'bg-teal-600';
      displayLabel = displayLabel || 'Manager';
      break;
    default:
      displayLabel = displayLabel || status || '-';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bgClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
};

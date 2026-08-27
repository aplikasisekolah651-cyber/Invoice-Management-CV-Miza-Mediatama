import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AppNotification } from '../../types';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps {
  notifications?: AppNotification[];
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
  onRemoveToast?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({
  notifications,
  toasts,
  onDismiss,
  onRemoveToast,
}) => {
  const items = toasts || notifications || [];
  if (items.length === 0) return null;

  const handleClose = (id: string) => {
    if (onRemoveToast) onRemoveToast(id);
    if (onDismiss) onDismiss(id);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {items.map((n) => {
        let borderClass = 'border-blue-200 bg-white text-slate-800';
        let Icon = Info;
        let iconColor = 'text-blue-600';

        if (n.type === 'success') {
          borderClass = 'border-emerald-200 bg-emerald-50 text-emerald-950';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (n.type === 'error') {
          borderClass = 'border-rose-200 bg-rose-50 text-rose-950';
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
        } else if (n.type === 'warning') {
          borderClass = 'border-amber-200 bg-amber-50 text-amber-950';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        }

        return (
          <div
            key={n.id}
            id={`toast-${n.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${borderClass} transition-all transform duration-200 translate-y-0`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {n.title && <div className="font-semibold text-xs uppercase tracking-wider mb-0.5">{n.title}</div>}
              {n.message}
            </div>
            <button
              onClick={() => handleClose(n.id)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  let btnColor = 'bg-rose-600 hover:bg-rose-700 text-white';
  if (variant === 'warning') btnColor = 'bg-amber-600 hover:bg-amber-700 text-white';
  if (variant === 'primary') btnColor = 'bg-slate-900 hover:bg-slate-800 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

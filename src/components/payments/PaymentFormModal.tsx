import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Calendar, AlertCircle, Check } from 'lucide-react';
import { Invoice, Payment, CompanySetting, User } from '../../types';
import { formatRupiah, formatShortDate } from '../../services/calculation';
import { StorageService } from '../../services/storage';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice?: Invoice | null;
  allInvoices: Invoice[];
  company: CompanySetting;
  currentUser: User;
  onPaymentSaved: (paymentData: Omit<Payment, 'id' | 'createdAt' | 'paymentNumber'>) => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  targetInvoice,
  allInvoices,
  company,
  currentUser,
  onPaymentSaved,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Invoices eligible for payment (unpaid or partial or overdue)
  const payableInvoices = allInvoices.filter(
    (inv) => inv.remainingBalance > 0 && inv.status !== 'cancelled'
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    targetInvoice?.id || (payableInvoices.length > 0 ? payableInvoices[0].id : '')
  );

  const activeInvoice =
    allInvoices.find((i) => i.id === selectedInvoiceId) || targetInvoice;

  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [amount, setAmount] = useState<number>(activeInvoice?.remainingBalance || 0);
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Transfer Bank');
  const [bankAccountId, setBankAccountId] = useState<string>(
    company.bankAccounts.find((b) => b.isDefault)?.id || company.bankAccounts[0]?.id || ''
  );
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Update amount when active invoice changes
  useEffect(() => {
    if (activeInvoice) {
      setAmount(activeInvoice.remainingBalance);
    }
  }, [selectedInvoiceId, activeInvoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeInvoice) {
      setErrorMsg('Pilih invoice tagihan yang akan dibayar.');
      return;
    }

    if (amount <= 0) {
      setErrorMsg('Jumlah pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (amount > activeInvoice.remainingBalance) {
      setErrorMsg(
        `Pembayaran tidak boleh melebihi sisa piutang (${formatRupiah(
          activeInvoice.remainingBalance
        )}).`
      );
      return;
    }

    const selectedBank = company.bankAccounts.find((b) => b.id === bankAccountId);
    const bankInfo = selectedBank
      ? `${selectedBank.bankName} - ${selectedBank.accountNumber}`
      : undefined;

    onPaymentSaved({
      invoiceId: activeInvoice.id,
      invoiceNumber: activeInvoice.invoiceNumber,
      customerId: activeInvoice.customerId,
      customerName:
        activeInvoice.customerSnapshot?.companyName ||
        activeInvoice.customerSnapshot?.name ||
        'Pelanggan',
      paymentDate,
      amount,
      paymentMethod,
      bankAccountId: paymentMethod === 'Transfer Bank' ? bankAccountId : undefined,
      bankAccountInfo: paymentMethod === 'Transfer Bank' ? bankInfo : undefined,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
    });

    onClose();
  };

  const handleQuickPayFull = () => {
    if (activeInvoice) {
      setAmount(activeInvoice.remainingBalance);
    }
  };

  const handleQuickPayHalf = () => {
    if (activeInvoice) {
      setAmount(Math.round(activeInvoice.remainingBalance / 2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Catat Pembayaran Masuk</h3>
              <p className="text-xs text-slate-500">
                Penerimaan pembayaran kas / transfer bank dari pelanggan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Invoice Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Invoice Tagihan <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
            >
              {payableInvoices.length === 0 && !targetInvoice ? (
                <option value="">Tidak ada invoice yang memiliki sisa tagihan</option>
              ) : (
                payableInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} -{' '}
                    {inv.customerSnapshot?.companyName || inv.customerSnapshot?.name} (Sisa:{' '}
                    {formatRupiah(inv.remainingBalance)})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Active Invoice Info Card */}
          {activeInvoice && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-bold text-slate-900">
                  {activeInvoice.customerSnapshot?.companyName ||
                    activeInvoice.customerSnapshot?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tagihan:</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(activeInvoice.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Telah Dibayar:</span>
                <span className="font-semibold">{formatRupiah(activeInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                <span>Sisa Piutang:</span>
                <span className="text-sm">{formatRupiah(activeInvoice.remainingBalance)}</span>
              </div>
            </div>
          )}

          {/* Payment Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">
                  Jumlah Bayar (Rp) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleQuickPayFull}
                  className="text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  Lunasi Penuh
                </button>
              </div>
              <input
                type="number"
                min="1"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 text-sm focus:bg-white focus:outline-none"
              />
              <div className="text-[10px] text-slate-400 mt-0.5">{formatRupiah(amount)}</div>
            </div>
          </div>

          {/* Payment Method & Bank Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Cash">Tunai / Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="Giro/Cek">Bilyet Giro / Cek</option>
                <option value="E-Wallet">E-Wallet (Gopay/OVO/Dana)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {paymentMethod === 'Transfer Bank' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rekening Bank Tujuan
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-[11px]"
                >
                  {company.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. Referensi / Bukti Slip (Opsional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="TRF-BCA-12345 / SP2D..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Keterangan Pembayaran
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Pelunasan tahap 1 DP 50%..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pembayaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { ExportService } from '../../services/exportService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'customers' | 'products';
  onConfirmImport: (data: any[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  onConfirmImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    if (type === 'customers') {
      ExportService.downloadCustomerTemplate(format);
    } else {
      ExportService.downloadProductTemplate(format);
    }
  };

  const processFile = async (selectedFile: File) => {
    setErrorMsg('');
    setIsLoading(true);
    setFile(selectedFile);

    try {
      if (type === 'customers') {
        const rows = await ExportService.parseCustomerExcel(selectedFile);
        if (rows.length === 0) {
          setErrorMsg('Tidak ditemukan baris data pelanggan yang valid dalam file.');
        }
        setParsedRows(rows);
      } else {
        const rows = await ExportService.parseProductExcel(selectedFile);
        if (rows.length === 0) {
          setErrorMsg('Tidak ditemukan baris data barang yang valid dalam file.');
        }
        setParsedRows(rows);
      }
    } catch (err: any) {
      setErrorMsg(`Gagal membaca file: ${err.message || 'Format data tidak sesuai'}`);
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    onConfirmImport(parsedRows);
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">{title}</h3>
              <p className="text-xs text-slate-300">
                Impor massal dari format template resmi Microsoft Excel (.xlsx) atau CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Langkah 1: Unduh Format Template Standar</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Gunakan template yang telah disediakan untuk memastikan struktur kolom sesuai dan
                dapat diproses dengan akurat.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Format Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Format CSV</span>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Area */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 text-xs">
              Langkah 2: Unggah Berkas yang Telah Diisi
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm mb-1">
                  Klik untuk memilih file atau seret file ke sini
                </div>
                <p className="text-slate-500 text-[11px]">
                  Mendukung format file <strong>.xlsx, .xls</strong>, dan <strong>.csv</strong> (Maks. 10MB)
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{file.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} baris data terdeteksi
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Ganti File
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 3: Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Preview Data Siap Diimpor ({parsedRows.length} Baris)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Menampilkan maks. 5 data teratas sebagai pratinjau
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto max-h-48">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    {type === 'customers' ? (
                      <tr>
                        <th className="p-2">Kode</th>
                        <th className="p-2">Perusahaan / Instansi</th>
                        <th className="p-2">Nama Kontak</th>
                        <th className="p-2">Telepon</th>
                        <th className="p-2">Kota</th>
                        <th className="p-2">NPWP</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2">Kode</th>
                        <th className="p-2">Nama Barang</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2">Satuan</th>
                        <th className="p-2 text-right">Harga Beli</th>
                        <th className="p-2 text-right">Harga Jual</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {type === 'customers' ? (
                          <>
                            <td className="p-2 font-mono font-semibold text-indigo-700">
                              {row.code || '-'}
                            </td>
                            <td className="p-2 font-bold text-slate-900">
                              {row.companyName || '-'}
                            </td>
                            <td className="p-2 text-slate-700">{row.name || '-'}</td>
                            <td className="p-2 text-slate-600">{row.phone || '-'}</td>
                            <td className="p-2 text-slate-600">{row.city || '-'}</td>
                            <td className="p-2 font-mono text-slate-600">{row.npwp || '-'}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-mono font-semibold text-indigo-700">
                              {row.code || '-'}
                            </td>
                            <td className="p-2 font-bold text-slate-900">{row.name}</td>
                            <td className="p-2 text-slate-600">{row.categoryName || '-'}</td>
                            <td className="p-2 text-slate-600">{row.unit || 'unit'}</td>
                            <td className="p-2 text-right font-mono">
                              {new Intl.NumberFormat('id-ID').format(row.costPrice || 0)}
                            </td>
                            <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                              {new Intl.NumberFormat('id-ID').format(row.sellingPrice || 0)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || isLoading}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              parsedRows.length > 0 && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor {parsedRows.length > 0 ? `${parsedRows.length} Data` : 'Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, Upload, Edit3, Archive, Trash2, Download, 
  FileText, Check, X, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { formatFileSize, formatDateArabic } from '../utils/helpers';
import { getVaultFiles, uploadToVault, renameVaultFile, compressVaultFile, deleteVaultFile } from '../utils/storageService';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function VaultBar({ currentUser, onOpenAuth }) {
  const [vaultFiles, setVaultFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState(null);

  const fileInputRef = useRef(null);

  const loadVaultFiles = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const files = await getVaultFiles(currentUser.id);
      setVaultFiles(files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVaultFiles();
  }, [currentUser]);

  // Handle Upload to Vault (Instant multi-GB without freezing)
  const handleUploadVault = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      await uploadToVault(files, currentUser.id);
      setSuccessMsg('تم حفظ الملفات في مستودعك الخاص بنجاح وبسرعة فائقة');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadVaultFiles();
    } catch (err) {
      setError('حدث خطأ أثناء حفظ الملف للمستودع');
    } finally {
      setUploading(false);
    }
  };

  // Rename
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;

    try {
      await renameVaultFile(renameTarget.id, newName.trim(), currentUser.id);
      setSuccessMsg('تمت إعادة تسمية الملف بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
      setRenameTarget(null);
      setNewName('');
      loadVaultFiles();
    } catch (err) {
      setError('حدث خطأ أثناء تعديل الاسم');
    }
  };

  // Compress
  const handleCompress = async (file) => {
    try {
      setSuccessMsg(`جاري ضغط الملف "${file.originalName}"...`);
      await compressVaultFile(file.id, currentUser.id);
      setSuccessMsg('تم ضغط الملف إلى أرشيف ZIP بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadVaultFiles();
    } catch (err) {
      setError('حدث خطأ أثناء ضغط الملف');
    }
  };

  // In-app Delete Confirmation
  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await deleteVaultFile(fileToDelete.id, currentUser.id);
      setSuccessMsg('تم حذف الملف من المستودع بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
      setFileToDelete(null);
      loadVaultFiles();
    } catch (err) {
      setError('حدث خطأ أثناء حذف الملف');
    }
  };

  // Download
  const handleDownloadVault = (file) => {
    if (file.fileBlob) {
      const url = URL.createObjectURL(file.fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (file.fileData) {
      const a = document.createElement('a');
      a.href = file.fileData;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
        <div className="w-14 h-14 bg-neutral-100 text-neutral-800 rounded-2xl flex items-center justify-center mx-auto border border-neutral-200">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="font-black text-neutral-900 text-lg">المستودع السحابي المشفر</h3>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          هذا القسم مخصص للاحتفاظ الشخصي والآمن بملفاتك. يرجى تسجيل الدخول للوصول إلى مستودعك الخاص.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          تسجيل الدخول الآن
        </button>
      </div>
    );
  }

  const totalVaultSize = vaultFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-5">
      
      {/* Vault Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-neutral-900 text-lg">المستودع الشخصي</h2>
              <span className="text-[10px] bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 rounded-md border border-neutral-200">
                تخزين مشفر خاص
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              مساحتك الخاصة لحفظ الملفات مع إمكانية التسمية والضغط والحذف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUploadVault}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'جاري الحفظ...' : 'إضافة ملف للمستودع'}</span>
          </button>

          <button
            onClick={loadVaultFiles}
            className="p-2.5 text-neutral-600 hover:text-black border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-black shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between text-xs text-neutral-600">
        <span className="font-bold text-neutral-900">
          إجمالي الملفات: <strong className="text-black">{vaultFiles.length}</strong>
        </span>
        <span className="font-bold text-neutral-900">
          المساحة المستخدمة: <strong className="text-black">{formatFileSize(totalVaultSize)}</strong>
        </span>
      </div>

      {/* Files List */}
      {vaultFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-700 rounded-xl flex items-center justify-center mx-auto border border-neutral-200">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-neutral-800 text-sm sm:text-base">المستودع فارغ حالياً</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            قم بالضغط على "إضافة ملف للمستودع" لحفظ ملفاتك الشخصية بسرعة وبشكل مشفر.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
          {vaultFiles.map((file) => (
            <div 
              key={file.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center shrink-0">
                  {file.isCompressed ? (
                    <Archive className="w-5 h-5 text-neutral-800" />
                  ) : (
                    <FileText className="w-5 h-5 text-neutral-800" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-neutral-900 text-xs sm:text-sm truncate">
                      {file.originalName}
                    </h3>
                    {file.isCompressed && (
                      <span className="text-[10px] bg-neutral-100 text-neutral-800 font-bold px-1.5 py-0.2 rounded border border-neutral-200">
                        مضغوط ZIP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatDateArabic(file.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Rename, Compress, Delete, Download */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleDownloadVault(file)}
                  className="p-2 text-neutral-700 hover:text-black border border-neutral-200 hover:bg-white rounded-lg transition-colors"
                  title="تحميل الملف"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setRenameTarget(file);
                    setNewName(file.originalName);
                  }}
                  className="p-2 text-neutral-700 hover:text-black border border-neutral-200 hover:bg-white rounded-lg transition-colors"
                  title="إعادة التسمية"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {!file.isCompressed && (
                  <button
                    onClick={() => handleCompress(file)}
                    className="p-2 text-neutral-700 hover:text-black border border-neutral-200 hover:bg-white rounded-lg transition-colors"
                    title="ضغط الملف (ZIP)"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setFileToDelete(file)}
                  className="p-2 text-neutral-500 hover:text-red-600 border border-neutral-200 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف الملف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-neutral-300 relative text-right">
            <button
              onClick={() => setRenameTarget(null)}
              className="absolute top-4 left-4 w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-black text-neutral-900 text-sm sm:text-base">إعادة تسمية الملف</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">الاسم الجديد:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black text-neutral-900 text-xs sm:text-sm font-bold"
                  placeholder="اكتب الاسم الجديد..."
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2 rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
        fileName={fileToDelete?.originalName}
      />

    </div>
  );
}

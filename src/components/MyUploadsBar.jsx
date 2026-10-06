import React, { useState, useEffect } from 'react';
import { 
  FolderUp, Key, Eye, EyeOff, Clock, Trash2, Copy, Check, 
  RefreshCw, ShieldCheck, DownloadCloud, FileText 
} from 'lucide-react';
import { formatFileSize, formatTimeRemaining, formatDateArabic, getOrCreateClientId } from '../utils/helpers';
import { getMyUploads, deleteSharedFile } from '../utils/storageService';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function MyUploadsBar({ currentUser, onOpenAuth, onFileDeleted }) {
  const [myFiles, setMyFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealedPins, setRevealedPins] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [msg, setMsg] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);

  const clientId = getOrCreateClientId();

  const loadMyFiles = async () => {
    setLoading(true);
    try {
      const files = await getMyUploads(currentUser?.id, clientId);
      setMyFiles(files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyFiles();
  }, [currentUser]);

  const togglePinReveal = (id) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySecurityDetails = (file) => {
    const text = `بيانات استلام الملف (${file.originalName}):\n- الرقم السري (PIN): ${file.security.pin}${file.security.account ? `\n- الحساب: ${file.security.account}` : ''}${file.security.name ? `\n- الاسم: ${file.security.name}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await deleteSharedFile(fileToDelete.id, currentUser?.id || 'guest');
      setMsg('تم حذف الملف بنجاح وإلغاء إتاحته');
      setTimeout(() => setMsg(''), 3000);
      setFileToDelete(null);
      loadMyFiles();
      if (onFileDeleted) onFileDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
            <FolderUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-neutral-900 text-lg">الملفات التي رفعتها</h2>
              <span className="text-[10px] bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 rounded-md border border-neutral-200">
                سجل المرفوعات
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              متابعة الرموز السرية ومشاركتها مع الطرف المستلم وإدارة الملفات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!currentUser && (
            <button
              onClick={onOpenAuth}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
            >
              تسجيل حساب لمزامنة أجهزتك
            </button>
          )}

          <button
            onClick={loadMyFiles}
            className="p-2.5 text-neutral-600 hover:text-black border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-black shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Files List */}
      {myFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-700 rounded-xl flex items-center justify-center mx-auto border border-neutral-200">
            <FolderUp className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-neutral-800 text-sm sm:text-base">لم تقم برفع أي ملفات حتى الآن</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            عند رفع أي ملف من البار الأول، سيظهر هنا مباشرة لمراجعة بيانات أمانه أو حذفه.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myFiles.map((file) => (
            <div 
              key={file.id}
              className="bg-white border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* File Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5 text-neutral-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-neutral-900 text-sm sm:text-base truncate">
                      {file.originalName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>رُفع: {formatDateArabic(file.uploadedAt)}</span>
                      {file.expiresAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-neutral-700">
                            <Clock className="w-3.5 h-3.5" />
                            متبقي: {formatTimeRemaining(file.expiresAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleCopySecurityDetails(file)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-colors"
                  >
                    {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === file.id ? 'تم النسخ' : 'نسخ البيانات للطرف الآخر'}</span>
                  </button>

                  <button
                    onClick={() => setFileToDelete(file)}
                    className="p-2 text-neutral-400 hover:text-red-600 border border-neutral-200 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف الملف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Security parameters strip */}
              {file.security && (
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
                    <Key className="w-3.5 h-3.5 text-neutral-600" />
                    <span className="text-neutral-500">الرقم السري:</span>
                    <strong className="font-mono text-black font-bold text-sm tracking-wider">
                      {revealedPins[file.id] ? file.security.pin : '•••••'}
                    </strong>
                    <button
                      onClick={() => togglePinReveal(file.id)}
                      className="text-neutral-400 hover:text-neutral-700 p-0.5"
                    >
                      {revealedPins[file.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {file.security.account && (
                    <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
                      <span className="text-neutral-500">الحساب: </span>
                      <strong className="text-black font-bold">{file.security.account}</strong>
                    </div>
                  )}

                  {file.security.name && (
                    <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
                      <span className="text-neutral-500">الاسم: </span>
                      <strong className="text-black font-bold">{file.security.name}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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

import React, { useState } from 'react';
import { 
  X, Lock, Unlock, ShieldAlert, KeyRound, Download, 
  CheckCircle, FileText, AlertCircle, ShieldCheck
} from 'lucide-react';
import { formatFileSize, formatDateArabic } from '../utils/helpers';
import { unlockFile } from '../utils/storageService';
import confetti from 'canvas-confetti';

export default function UnlockModal({ isOpen, onClose, file, clientId, currentUserId, onFileUnlocked }) {
  const [pin, setPin] = useState('');
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(file?.isPermanentlyBlocked || false);
  const [unlockedResult, setUnlockedResult] = useState(null);

  if (!isOpen || !file) return null;

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('يرجى إدخال الرقم السري');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await unlockFile(file.id, {
        pin: pin.trim(),
        account: account.trim(),
        name: name.trim(),
        clientId,
        currentUserId
      });

      setIsLoading(false);

      if (!result.success) {
        if (result.isBlocked) {
          setIsBlocked(true);
        }
        setError(result.error || 'بيانات الأمان غير مطابقة، يرجى التأكد وإعادة المحاولة.');
        return;
      }

      // Success
      setUnlockedResult(result);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (onFileUnlocked) onFileUnlocked(file.id);
    } catch (err) {
      setIsLoading(false);
      setError('تعذر التحقق من الخادم، يرجى إعادة المحاولة.');
    }
  };

  const handlePinInput = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setPin(val);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Professional Palette */}
        <div className={`p-6 text-center ${
          isBlocked 
            ? 'bg-red-700 text-white' 
            : unlockedResult 
              ? 'bg-emerald-700 text-white' 
              : 'bg-slate-900 text-white'
        }`}>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/15">
            {isBlocked ? (
              <ShieldAlert className="w-6 h-6 text-white" />
            ) : unlockedResult ? (
              <Unlock className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>

          <h3 className="text-lg font-bold">
            {isBlocked 
              ? 'تم حظر الوصول نهائياً' 
              : unlockedResult 
                ? 'تم فك القفل بنجاح' 
                : 'التحقق من أدوات الأمان'
            }
          </h3>

          <p className="text-xs text-white/80 mt-1 truncate max-w-xs mx-auto">
            {file.originalName} ({formatFileSize(file.size)})
          </p>
        </div>

        <div className="p-6">
          {/* CASE 1: PERMANENTLY BLOCKED */}
          {isBlocked ? (
            <div className="text-center space-y-4 py-2">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1.5">
                <p className="font-bold text-xs sm:text-sm">
                  تم حظر هذا الجهاز نهائياً من الوصول إلى هذا الملف
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  لحماية أمان وخصوصية الملف، تم إيقاف إمكانية إدخال الرموز من هذا الجهاز نهائياً.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          ) : unlockedResult ? (
            /* CASE 2: UNLOCKED WITH INDICATIVE THUMBNAIL & FILE TYPE PREVIEW */
            <div className="space-y-4 py-1 text-right">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
                <p className="font-bold text-xs sm:text-sm text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  تم التحقق من أدوات الأمان وفك التشفير بنجاح
                </p>
                <p className="text-[11px] text-emerald-700">
                  الملف متاح الآن للمعاينة والتحميل الآمن
                </p>
              </div>

              {/* Indicative Thumbnail / Media Preview */}
              {(() => {
                const fileName = unlockedResult.file.originalName || file.originalName || '';
                const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
                const mime = unlockedResult.file.mimetype || file.mimetype || '';
                const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                const isVideo = mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext);
                const isAudio = mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
                const isPdf = mime === 'application/pdf' || ext === 'pdf';
                const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed');
                const isDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext);

                const dataUrl = unlockedResult.downloadUrl || unlockedResult.file.fileData;

                let typeLabel = `ملف (${ext.toUpperCase() || 'بيانات'})`;
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

                if (isImage) {
                  typeLabel = `صورة رقمية (${ext.toUpperCase()})`;
                  badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                } else if (isPdf) {
                  typeLabel = 'مستند أكروبات PDF';
                  badgeClass = 'bg-red-50 text-red-700 border-red-200';
                } else if (isVideo) {
                  typeLabel = `ملف مرئي / فيديو (${ext.toUpperCase()})`;
                  badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                } else if (isAudio) {
                  typeLabel = `ملف صوتي (${ext.toUpperCase()})`;
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (isArchive) {
                  typeLabel = `أرشيف مضغوط (${ext.toUpperCase()})`;
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                } else if (isDoc) {
                  typeLabel = `مستند مكتبي (${ext.toUpperCase()})`;
                  badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                }

                return (
                  <div className="space-y-3">
                    {/* Visual Preview / Thumbnail */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col items-center justify-center min-h-[140px] text-center overflow-hidden">
                      {isImage && dataUrl ? (
                        <div className="relative group max-h-56 w-full flex items-center justify-center">
                          <img
                            src={dataUrl}
                            alt={fileName}
                            className="max-h-52 max-w-full rounded-xl object-contain shadow-xs border border-slate-200 bg-white"
                          />
                        </div>
                      ) : isVideo && dataUrl ? (
                        <div className="w-full">
                          <video
                            src={dataUrl}
                            controls
                            className="max-h-52 w-full rounded-xl bg-black"
                          />
                        </div>
                      ) : isAudio && dataUrl ? (
                        <div className="w-full py-2 space-y-2">
                          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                            <span className="text-2xl">🎵</span>
                          </div>
                          <audio src={dataUrl} controls className="w-full mt-2" />
                        </div>
                      ) : isPdf ? (
                        <div className="py-4 space-y-2">
                          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto border border-red-200 shadow-xs">
                            <span className="text-2xl font-black">PDF</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">معاينة مستند أكروبات</p>
                          <p className="text-[11px] text-slate-400">جاهز للعرض والتحميل بأمان</p>
                        </div>
                      ) : isArchive ? (
                        <div className="py-4 space-y-2">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                            <span className="text-2xl">📦</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">حزمة ملفات مضغوطة</p>
                          <p className="text-[11px] text-slate-400">جاهزة للاستخراج بعد التنزيل</p>
                        </div>
                      ) : isDoc ? (
                        <div className="py-4 space-y-2">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-200 shadow-xs">
                            <FileText className="w-8 h-8 text-indigo-600" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">مستند نصي / مكتبي</p>
                          <p className="text-[11px] text-slate-400">{fileName}</p>
                        </div>
                      ) : (
                        <div className="py-4 space-y-2">
                          <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto border border-slate-300">
                            <FileText className="w-8 h-8 text-slate-600" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">ملف رقمي مؤمن</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata Card: Name, Type, Size */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                        <span className="text-slate-500 font-bold">اسم الملف:</span>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]" title={fileName}>
                          {fileName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                        <span className="text-slate-500 font-bold">نوع الملف الدلالي:</span>
                        <span className={`px-2 py-0.5 rounded-md border font-bold text-[11px] ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-bold">حجم الملف:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatFileSize(unlockedResult.file.size || file.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Download Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <a
                  href={unlockedResult.downloadUrl}
                  download={unlockedResult.file.originalName || file.originalName}
                  className="w-full flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all text-center shadow-md active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف الآن</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            /* CASE 3: INPUT SECURITY TOOLS (NO ATTEMPT COUNTER DISPLAYED) */
            <form onSubmit={handleUnlockSubmit} className="space-y-3.5">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center shake flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tool 1: PIN (Mandatory - numbers only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرقم السري (PIN) <span className="text-red-500">* إجباري (أرقام فقط)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="أدخل الرقم السري"
                    value={pin}
                    onChange={handlePinInput}
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2.5 text-center font-mono font-bold tracking-widest text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    autoFocus
                  />
                </div>
              </div>

              {/* Tool 2: Account (Only if required) */}
              {file.requiredTools?.account && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الحساب المطلوب لهذا الملف <span className="text-slate-900">* مطلوب</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل الحساب المحدد من قِبل الرافع"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-left"
                  />
                </div>
              )}

              {/* Tool 3: Name (Only if required) */}
              {file.requiredTools?.name && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم المطلوب لهذا الملف <span className="text-slate-900">* مطلوب</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل الاسم المحدد للملف"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>فتح الملف</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>محمي بنظام التحقق المشفر</span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

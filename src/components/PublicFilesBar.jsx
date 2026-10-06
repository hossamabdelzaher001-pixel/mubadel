import React, { useState } from 'react';
import { 
  FileText, Clock, Search, RefreshCw, Lock, Unlock, 
  ShieldAlert, BadgeCheck, FileCheck
} from 'lucide-react';
import { formatFileSize, formatTimeRemaining, formatDateArabic } from '../utils/helpers';
import UnlockModal from './UnlockModal';

export default function PublicFilesBar({ files, currentUser, clientId, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForUnlock, setSelectedFileForUnlock] = useState(null);

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesName = f.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRecipient = f.recipientNumber && f.recipientNumber.includes(searchQuery);
    return matchesName || matchesRecipient;
  });

  return (
    <div className="space-y-5">
      
      {/* Top Banner - Executive Navy/Slate Style */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold mb-2 border border-slate-700">
            <span>المنصة التشاركية</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">الملفات المتاحة للتبادل</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            الملفات المتاحة مؤقتاً للاستلام. يتطلب فتح أي ملف إدخال أدوات الأمان المحددة من قِبل صاحبه.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <span>الملفات النشطة:</span>
          <span className="font-bold text-white">{filteredFiles.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث باسم الملف أو رقم المستلم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2.5 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">لا توجد ملفات متاحة حالياً</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'لم يتم العثور على نتائج تطابق البحث' 
              : 'يمكنك التوجه إلى قسم "رفع الملفات" لإضافة أول ملف للتبادل.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const isMyFile = file.isUploadedByMe;
            const isBlocked = file.isPermanentlyBlocked;

            return (
              <div
                key={file.id}
                onClick={() => setSelectedFileForUnlock(file)}
                className={`bg-white rounded-2xl border p-4.5 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group ${
                  isBlocked
                    ? 'border-red-200 bg-red-50/20'
                    : isMyFile
                      ? 'border-emerald-300 ring-1 ring-emerald-200/60 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Badges row */}
                <div className="flex items-center justify-between mb-3 min-h-[24px]">
                  {/* Badge: "تم رفع الملف من قبلك" */}
                  {isMyFile ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم رفع الملف من قبلك</span>
                    </span>
                  ) : isBlocked ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-red-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      <span>محظور الوصول</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">ملف جاهز للاستلام</span>
                  )}

                  {/* Expiration badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatTimeRemaining(file.expiresAt)}</span>
                  </span>
                </div>

                {/* File Details */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isBlocked 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : isMyFile
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-slate-700 transition-colors" title={file.originalName}>
                        {file.originalName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatFileSize(file.size)} • {formatDateArabic(file.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {file.recipientNumber && (
                    <div className="text-[11px] bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 inline-block font-mono">
                      مخصص للمستلم: {file.recipientNumber}
                    </div>
                  )}
                </div>

                {/* Card Footer: Required tools indicators */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                      PIN
                    </span>
                    {file.requiredTools?.account && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                        حساب
                      </span>
                    )}
                    {file.requiredTools?.name && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                        اسم
                      </span>
                    )}
                  </div>

                  <span className={`font-bold flex items-center gap-1 text-xs ${
                    isBlocked ? 'text-red-600' : 'text-slate-900 group-hover:underline'
                  }`}>
                    {isBlocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>محظور</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-slate-700" />
                        <span>فتح الملف</span>
                      </>
                    )}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Unlock Modal */}
      {selectedFileForUnlock && (
        <UnlockModal
          isOpen={!!selectedFileForUnlock}
          onClose={() => setSelectedFileForUnlock(null)}
          file={selectedFileForUnlock}
          clientId={clientId}
          currentUserId={currentUser?.id}
          onFileUnlocked={() => onRefresh()}
        />
      )}

    </div>
  );
}

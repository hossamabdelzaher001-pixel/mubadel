import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function SecurityWarningModal({ isOpen, onClose, violationAction }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black flex items-center justify-center transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimalist Header */}
        <div className="bg-black text-white p-6 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold tracking-tight">تنبيه أمني مشدد</h3>
          <p className="text-xs text-slate-300 mt-0.5">تم رصد إجراء غير مصرح به</p>
        </div>

        {/* Content - Strictly No Personal Email Displayed */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-bold leading-relaxed space-y-2">
            <p className="text-slate-950 font-black">
              عذراً، لا يمكن عمل ذلك لأغراض الأمان والحماية ولحماية حقوق الملكية الفكرية.
            </p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              تم رصد محاولة الوصول البرمجي وتسجيل بصمة جهازك وتوقيت المحاولة وإرسال تقرير فوري إلى إدارة حماية الملكية الفكرية.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>• الإجراء المرصود: <strong className="text-slate-900">{violationAction || 'أدوات المطورين أو زر الفأرة'}</strong></p>
            <p>• الحماية: <strong>كافة حقوق الملكية الفكرية وأكواد التطبيق مسجلة ومحمية قانونياً.</strong></p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
          >
            فهمت ذلك، والعودة للتطبيق
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SuccessModal({ isOpen, onClose, uploadedData, onGoToPublic }) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySecurity = () => {
    if (!uploadedData?.pin) return;
    const text = `رمز فك تشفير الملف:\nالرقم السري: ${uploadedData.pin}${uploadedData.account ? `\nالحساب: ${uploadedData.account}` : ''}${uploadedData.name ? `\nالاسم: ${uploadedData.name}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative">
        
        {/* Top X close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-500 text-white p-6 pt-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black mb-1">تم رفع الملف بنجاح!</h3>
          <p className="text-emerald-100 text-xs">
            أصبح الملف متاحاً الآن في قسم الملفات العامة ومحمياً بأدوات الأمان المحددة
          </p>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-4">
          {uploadedData && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">الرقم السري للملف (PIN):</span>
                <span className="font-mono font-bold text-indigo-700 text-base bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                  {uploadedData.pin}
                </span>
              </div>

              {uploadedData.account && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">الحساب المطلوب:</span>
                  <span className="font-bold text-slate-700">{uploadedData.account}</span>
                </div>
              )}

              {uploadedData.name && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">الاسم المطلوب:</span>
                  <span className="font-bold text-slate-700">{uploadedData.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">مدة البقاء:</span>
                <span className="font-semibold text-emerald-600">
                  {uploadedData.expiryHours > 0 ? `${uploadedData.expiryHours} ساعة` : 'دائم (لا يختفي)'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleCopySecurity}
            className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">تم نسخ بيانات الأمان للحافظة!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-600" />
                <span>نسخ الرمز والأدوات لإرسالها للشخص المستلم</span>
              </>
            )}
          </button>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onGoToPublic) onGoToPublic();
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
            >
              عرض الملف في قائمة الملفات العامة
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

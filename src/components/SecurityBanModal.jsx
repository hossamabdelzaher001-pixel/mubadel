import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, AlertTriangle, Lock } from 'lucide-react';

export default function SecurityBanModal({ banUntil, onBanExpired }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, banUntil - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, banUntil - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        localStorage.removeItem('mubadel_security_ban_until');
        localStorage.removeItem('mubadel_violations_count');
        if (onBanExpired) onBanExpired();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [banUntil, onBanExpired]);

  // Format hours, minutes, seconds
  const totalSeconds = Math.floor(timeLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  const expiryDate = new Date(banUntil).toLocaleString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const [clickCount, setClickCount] = useState(0);

  const handleAdminSecretClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      const code = prompt('🔐 وضع مسؤول النظام (المدير):\nأدخل الرمز السري لفك الحظر عن جهازك فوراً:');
      if (code === '001' || code === 'admin' || code === '1234') {
        localStorage.removeItem('mubadel_security_ban_until');
        localStorage.removeItem('mubadel_violations_count');
        if (onBanExpired) onBanExpired();
        alert('✅ تم فك الحظر عن جهازك بنجاح ومتابعة التجربة!');
      } else if (code) {
        alert('❌ رمز المسؤول غير صحيح.');
      }
      setClickCount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-2 border-red-600 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center text-white shadow-2xl relative space-y-6 animate-fadeIn">
        
        {/* Pulsing Red Shield Icon with secret admin unlock */}
        <div 
          onClick={handleAdminSecretClick}
          className="relative mx-auto w-20 h-20 flex items-center justify-center cursor-pointer"
          title="نظام الحماية الرقمية"
        >
          <div className="absolute inset-0 bg-red-600/30 rounded-3xl animate-ping"></div>
          <div className="w-20 h-20 bg-red-600/20 border-2 border-red-500 rounded-3xl flex items-center justify-center relative">
            <Lock className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3.5 py-1 rounded-full text-xs font-bold text-red-400">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>نظام الحماية والأمن الرقمي المشدد</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            تم حظر هذا الجهاز لمدة 8 ساعات
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            تم رصد <strong>3 محاولات متتالية</strong> لفحص الكود أو التطفل على النظام. لحماية حقوق الملكية الفكرية وأمان التطبيق، تم إيقاف صلاحية الدخول من هذا الجهاز مؤقتاً.
          </p>
        </div>

        {/* Live Digital Countdown Timer */}
        <div className="bg-black/50 border border-red-500/40 rounded-2xl p-4 sm:p-5 space-y-2">
          <p className="text-xs text-red-300 font-bold flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4 text-red-400 animate-spin" />
            <span>المؤقت التنازلي لإتاحة الدخول مجدداً:</span>
          </p>

          <div className="flex items-center justify-center gap-2 font-mono text-3xl sm:text-4xl font-black text-red-500 tracking-wider" dir="ltr">
            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-red-500/30">
              {pad(hours)}
            </div>
            <span>:</span>
            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-red-500/30">
              {pad(minutes)}
            </div>
            <span>:</span>
            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-red-500/30">
              {pad(seconds)}
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 px-6 font-bold" dir="ltr">
            <span>HOURS</span>
            <span>MINUTES</span>
            <span>SECONDS</span>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>موعد إعادة الفتح التلقائي: </span>
            <strong className="text-white">{expiryDate}</strong>
          </div>
        </div>

        {/* IP and Target Email info */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1 text-right">
          <p>• تم تسجيل هوية الجهاز ومعرف المتصفح وتوقيت المخالفات في السجل الأمني.</p>
          <p>• تم إرسال تقرير المخالفات فورياً إلى الإدارة:</p>
          <div className="bg-black/60 px-3 py-1 rounded-lg border border-slate-800 text-center font-mono text-xs text-red-400" dir="ltr">
            hossamabdelzaher001@gmail.com
          </div>
        </div>

      </div>
    </div>
  );
}

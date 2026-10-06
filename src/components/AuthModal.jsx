import React, { useState } from 'react';
import { User, LogIn, Lock, ArrowRight, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import GooglePickerModal from './GooglePickerModal';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAccount, setManualAccount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setError('يرجى كتابة اسم المستخدم');
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: manualName.trim(),
      email: manualAccount.trim() || `${manualName.trim().replace(/\s+/g, '').toLowerCase()}@local`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualName.trim())}&background=0f172a&color=ffffff&bold=true`,
      provider: 'custom'
    };

    onLogin(newUser);
    onClose();
  };

  const handleGoogleSelect = (account) => {
    setShowGooglePicker(false);
    onLogin(account);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
          
          {/* Header Banner - Sophisticated Slate / Dark Zinc Palette */}
          <div className="bg-slate-900 text-white p-7 text-center relative border-b border-slate-800">
            <div className="w-12 h-12 bg-slate-800/90 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-700 shadow-inner">
              <Lock className="w-5 h-5 text-slate-200" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mb-1">تسجيل الدخول</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              منصة التبادل الآمن للمستندات والملفات في وقت لاحق
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Google Login Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowGooglePicker(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all font-bold text-slate-800 text-xs sm:text-sm shadow-xs group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:scale-105 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>تسجيل الدخول بحساب Google</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">أو التسجيل المباشر</span>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-200 text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسمك الشخصي"
                    value={manualName}
                    onChange={(e) => {
                      setManualName(e.target.value);
                      setError('');
                    }}
                    className="w-full pr-9 pl-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحساب أو البريد (اختياري)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="معرّف الحساب أو بريدك الإلكتروني"
                    value={manualAccount}
                    onChange={(e) => setManualAccount(e.target.value)}
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-slate-50/50 focus:bg-white text-left transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 group"
                >
                  <span>دخول إلى التطبيق</span>
                  <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </form>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>نظام حماية وتشفير متكامل</span>
            </div>
          </div>
        </div>
      </div>

      <GooglePickerModal
        isOpen={showGooglePicker}
        onClose={() => setShowGooglePicker(false)}
        onSelectAccount={handleGoogleSelect}
      />
    </>
  );
}

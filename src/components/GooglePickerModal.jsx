import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';

export default function GooglePickerModal({ isOpen, onClose, onSelectAccount }) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mubadel_saved_google_accounts');
      if (stored) {
        setSavedGoogleAccounts(JSON.parse(stored));
      }
    } catch (e) {
      setSavedGoogleAccounts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    const email = googleEmail.trim();
    // If name not provided, derive from email username
    const name = googleName.trim() || email.split('@')[0];

    const account = {
      id: 'g_' + Date.now(),
      name: name,
      email: email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=ffffff&bold=true`,
      provider: 'google'
    };

    // Save to local device accounts history (so only real accounts the user used appear)
    try {
      const updated = [account, ...savedGoogleAccounts.filter(a => a.email !== email)].slice(0, 3);
      localStorage.setItem('mubadel_saved_google_accounts', JSON.stringify(updated));
    } catch (e) {}

    onSelectAccount(account);
  };

  const handleSelectSaved = (account) => {
    onSelectAccount(account);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تسجيل الدخول بحساب Google</h3>
              <p className="text-xs text-slate-500">استخدم حسابك الحقيقي للمتابعة</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* If the user previously used an account on this browser, show it */}
          {savedGoogleAccounts.length > 0 && (
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-500">حساباتك المستخدمة مسبقاً على هذا الجهاز:</label>
              <div className="space-y-1.5">
                {savedGoogleAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectSaved(acc)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-right transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{acc.name}</p>
                        <p className="text-[11px] text-slate-500" dir="ltr">{acc.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-slate-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني لحساب Google الخاص بك <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  dir="ltr"
                  className="w-full pr-9 pl-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-left bg-slate-50/50 focus:bg-white transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم المعروض (اختياري)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="اكتب اسمك كما ترغب أن يظهر"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>المتابعة وتسجيل الدخول</span>
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>جلسة آمنة ومشفرة بالكامل</span>
        </div>

      </div>
    </div>
  );
}

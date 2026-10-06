import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, Hash, Check, X, AlertCircle, 
  HelpCircle, RefreshCw 
} from 'lucide-react';
import { formatDateArabic, getOrCreateClientId } from '../utils/helpers';
import { getAgreedNumbersList, saveAgreedNumber, removeAgreedNumber } from '../utils/storageService';

export default function RecipientsBar({ currentUser, onOpenAuth, onRefreshRecipients }) {
  const [agreedList, setAgreedList] = useState([]);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [recipientLabel, setRecipientLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const clientId = getOrCreateClientId();

  const loadAgreedNumbers = async () => {
    setIsLoading(true);
    try {
      const list = await getAgreedNumbersList(clientId);
      setAgreedList(list || []);
      if (onRefreshRecipients) onRefreshRecipients();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgreedNumbers();
    // Poll every 5 seconds to auto-update 🔴 to 🟢 when the other party enters the number
    const interval = setInterval(loadAgreedNumbers, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!recipientNumber.trim()) {
      setError('يرجى كتابة الرقم المتفق عليه');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await saveAgreedNumber(recipientNumber.trim(), recipientLabel.trim(), clientId);
      setIsSubmitting(false);

      if (!res.success) {
        setError(res.error || 'حدث خطأ أثناء الحفظ');
        return;
      }

      setSuccess('تم تسجيل الرقم المتفق عليه بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      setRecipientNumber('');
      setRecipientLabel('');
      loadAgreedNumbers();
    } catch (err) {
      setIsSubmitting(false);
      setError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (item) => {
    try {
      await removeAgreedNumber(item.id, item.number, clientId);
      setSuccess('تم حذف الرقم المتفق عليه');
      setTimeout(() => setSuccess(''), 3000);
      loadAgreedNumbers();
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
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-neutral-900 text-lg">المستلمون المميزون</h2>
              <span className="text-[10px] bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 rounded-md border border-neutral-200">
                مطابقة رقم الاتفاق
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              أدخل الرقم المتفق عليه بينك وبين الطرف الآخر للمزامنة والربط المباشر
            </p>
          </div>
        </div>

        <button
          onClick={loadAgreedNumbers}
          className="p-2.5 text-neutral-600 hover:text-black border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors self-end sm:self-center"
          title="تحديث الحالة"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <h3 className="font-black text-neutral-900 text-sm sm:text-base">
          تسجيل رقم متفق عليه جديد
        </h3>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                الرقم المتفق عليه مع الطرف الآخر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={recipientNumber}
                onChange={(e) => {
                  setRecipientNumber(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="مثال: 99881"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black text-neutral-900 font-mono text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                تسمية المستلم أو الغرض (اختياري)
              </label>
              <input
                type="text"
                value={recipientLabel}
                onChange={(e) => setRecipientLabel(e.target.value)}
                placeholder="مثال: صديقي أحمد / ملفات العمل"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-black text-neutral-900 text-xs sm:text-sm font-bold"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-black" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري التسجيل...' : 'تسجيل الرقم المتفق عليه'}</span>
          </button>
        </form>

        {/* Explain Indicator Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-xs text-neutral-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-neutral-800">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shrink-0 shadow-xs"></span>
            <span>دائرة حمراء: أنت مسجل للرقم وبانتظار إدخال الطرف الثاني لنفس الرقم</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-neutral-800">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0 shadow-xs animate-pulse"></span>
            <span>دائرة خضراء: الطرف الثاني أدخل نفس الرقم وتطابقت البيانات بنجاح</span>
          </div>
        </div>
      </div>

      {/* Agreed Numbers List */}
      {agreedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-700 rounded-xl flex items-center justify-center mx-auto border border-neutral-200">
            <Hash className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-neutral-800 text-sm sm:text-base">لا توجد أرقام مسجلة حتى الآن</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            قم بإدخال الرقم المتفق عليه أعلاه وسيقوم التطبيق بالتحقق فور إدخال الطرف الآخر لنفس الرقم.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agreedList.map((item) => (
            <div 
              key={item.id}
              className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* 🔴 / 🟢 Indicator Circle */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div 
                    className={`w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${
                      item.isMatched 
                        ? 'bg-emerald-500 ring-4 ring-emerald-100' 
                        : 'bg-red-500 ring-4 ring-red-100'
                    }`}
                    title={item.isMatched ? 'الطرفان متطابقان ومستعدان للتبادل' : 'في انتظار الطرف الآخر'}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-neutral-900 tracking-wider">
                      {item.number}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold truncate">
                      {item.label || 'مستلم'}
                    </span>
                  </div>

                  <p className="text-xs mt-0.5">
                    {item.isMatched ? (
                      <span className="text-emerald-700 font-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        الطرف الثاني متصل ومستعد للتبادل (متطابق)
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold">
                        في الانتظار (لم يدخل الطرف الثاني الرقم بعد)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item)}
                className="p-2 text-neutral-400 hover:text-red-600 border border-neutral-200 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="إزالة الرقم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

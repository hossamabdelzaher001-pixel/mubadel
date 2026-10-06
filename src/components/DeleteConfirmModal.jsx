import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, fileName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-neutral-300 relative text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition-colors"
          title="إلغاء"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimalist Header */}
        <div className="p-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-3 text-neutral-900">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-neutral-900">
            تأكيد الحذف
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-4">
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center space-y-1">
            <p className="text-sm font-bold text-neutral-900">
              هل أنت متأكد من حذف هذا الملف؟
            </p>
            {fileName && (
              <p className="text-xs text-neutral-600 font-semibold truncate px-2">
                "{fileName}"
              </p>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
            لن تتمكن من استرجاع هذا الملف بعد حذفه نهائياً.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-xs"
            >
              نعم، احذف الملف
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

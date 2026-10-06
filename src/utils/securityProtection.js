// Anti-tamper & Security Shield for Mubadel Application
// Intercepts inspect shortcuts, context menu, sends detailed Arabic email report to admin with one-click ban button.

export function setupSecurityProtection(onSecurityViolation, currentUser, clientId) {
  const TARGET_EMAIL = 'hossamabdelzaher001@gmail.com';

  const reportViolation = (actionType) => {
    // Trigger visual warning modal (without exposing admin email)
    if (onSecurityViolation) {
      onSecurityViolation(actionType);
    }

    const clientIdent = clientId || localStorage.getItem('mubadel_client_id') || 'client_unknown';
    const nowArabic = new Date().toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const userAccountDisplay = currentUser 
      ? `${currentUser.name} (${currentUser.email || 'بدون بريد'}) - المعرف: ${currentUser.id}`
      : `زائر بدون تسجيل دخول (بصمة جهازه: ${clientIdent})`;

    const banActionUrl = `https://mubadel-pro.vercel.app/?admin_action=ban&target_client=${clientIdent}&admin_key=001`;

    // Send complete Arabic security alert via FormSubmit directly to hossamabdelzaher001@gmail.com
    try {
      fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🚨 تنبيه أمني عاجل: محاولة فحص أو اختراق تطبيق مُبادِل (${actionType})`,
          _captcha: 'false',
          _template: 'table',
          '🚨 نوع المخالفة المرصودة': actionType,
          '⏰ التوقيت الدقيق للمحاولة': nowArabic,
          '👤 حساب المتطفل': userAccountDisplay,
          '💻 نظام وجهاز المتطفل': navigator.userAgent,
          '🌐 رابط الصفحة': window.location.href,
          '🆔 بصمة جهاز المتطفل': clientIdent,
          '⛔ رابط حظر هذا الشخص نهائياً بضغطة زر': banActionUrl,
          'ملاحظة للإدارة': 'بالضغط على رابط الحظر أعلاه، سيتم حرمان هذا المتطفل من فتح التطبيق وتوجيهه لمراسلتك عبر بريدك لطلب إعادته.'
        })
      }).catch(() => {});
    } catch (e) {}
  };

  // 1. Prevent Right-Click Context Menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    reportViolation('الضغط بزر الفأرة الأيمن (Right-Click Context Menu)');
    return false;
  };

  // 2. Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
  const handleKeyDown = (e) => {
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation('الضغط على مفتاح F12 (فحص العنصر / أدوات المطورين)');
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation(`اختصار المطورين (Ctrl+Shift+${String.fromCharCode(e.keyCode)})`);
      return false;
    }

    // Cmd+Option+I on macOS
    if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation('اختصار المطورين على ماك (Cmd+Option+Inspect)');
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 117)) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation('محاولة عرض السورس كود (Ctrl+U)');
      return false;
    }

    // Ctrl+S (Save Page)
    if (e.ctrlKey && (e.keyCode === 83 || e.keyCode === 115)) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation('محاولة حفظ الصفحة محلياً (Ctrl+S)');
      return false;
    }
  };

  // Attach global event listeners
  document.addEventListener('contextmenu', handleContextMenu, { capture: true });
  document.addEventListener('keydown', handleKeyDown, { capture: true });

  return () => {
    document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
  };
}

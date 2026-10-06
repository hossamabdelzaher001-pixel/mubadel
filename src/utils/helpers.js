export function formatFileSize(bytes) {
  if (bytes === 0 || !bytes) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimeRemaining(expiresAt) {
  if (!expiresAt) return 'دائم (لا يختفي)';
  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end - now;

  if (diffMs <= 0) return 'منتهي الصلاحية';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    return `باقي ${days} يوم و ${remHours} ساعة`;
  }
  if (diffHours > 0) {
    return `باقي ${diffHours} ساعة و ${diffMinutes} دقيقة`;
  }
  return `باقي ${diffMinutes} دقيقة`;
}

export function formatDateArabic(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Generate persistent unique client ID for tracking unlock attempts on this device/browser
export function getOrCreateClientId() {
  let clientId = localStorage.getItem('mubadel_client_id');
  if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2, 12) + Date.now();
    localStorage.setItem('mubadel_client_id', clientId);
  }
  return clientId;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  let isMobile = false;

  if (/android/i.test(ua)) {
    os = 'Android';
    isMobile = true;
  } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'iOS (Apple)';
    isMobile = true;
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Also verify screen width
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    isMobile = true;
  }

  return {
    os,
    isMobile,
    isAndroid: os === 'Android',
    isApple: os.includes('iOS') || os === 'macOS',
    isWindows: os === 'Windows'
  };
}

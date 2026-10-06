import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import SuccessModal from './components/SuccessModal';
import SecurityWarningModal from './components/SecurityWarningModal';
import UploadBar from './components/UploadBar';
import PublicFilesBar from './components/PublicFilesBar';
import VaultBar from './components/VaultBar';
import MyUploadsBar from './components/MyUploadsBar';
import RecipientsBar from './components/RecipientsBar';
import { getOrCreateClientId } from './utils/helpers';
import { getPublicFiles, getAgreedNumbersList } from './utils/storageService';
import { setupSecurityProtection } from './utils/securityProtection';
import { addFirestoreGlobalBan, isFirestoreGlobalBanned } from './utils/firestoreRest';
import { 
  UploadCloud, Globe, Layers, FolderUp, Users, 
  ShieldAlert, Mail
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mubadel_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [securityViolation, setSecurityViolation] = useState(null);
  const [isPermanentlyBanned, setIsPermanentlyBanned] = useState(false);

  const [publicFiles, setPublicFiles] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [clientId] = useState(() => getOrCreateClientId());

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('mubadel_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mubadel_user');
  };

  const fetchPublicFiles = async () => {
    try {
      const files = await getPublicFiles(currentUser?.id, clientId);
      setPublicFiles(files || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipients = async () => {
    try {
      const list = await getAgreedNumbersList(clientId);
      setRecipients(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Check for Admin 1-Click Ban URL Action & Global Ban Check
  useEffect(() => {
    const checkBanStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const adminAction = urlParams.get('admin_action');
      const targetClient = urlParams.get('target_client');
      const adminKey = urlParams.get('admin_key');

      // Admin triggered 1-click ban from their email
      if (adminAction === 'ban' && targetClient && adminKey === '001') {
        await addFirestoreGlobalBan(targetClient);
        alert(`تم حظر هذا الجهاز (${targetClient}) نهائياً من دخول تطبيق مُبادِل بنجاح.`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check if current device is permanently banned by admin
      const localBan = localStorage.getItem('mubadel_permanently_banned');
      if (localBan) {
        setIsPermanentlyBanned(true);
        return;
      }

      const bannedInCloud = await isFirestoreGlobalBanned(clientId);
      if (bannedInCloud) {
        localStorage.setItem('mubadel_permanently_banned', 'true');
        setIsPermanentlyBanned(true);
      }
    };

    checkBanStatus();
  }, [clientId]);

  // 2. Setup Security Shield (No automatic 8-hour ban)
  useEffect(() => {
    const cleanup = setupSecurityProtection(
      (violationAction) => {
        setSecurityViolation(violationAction);
      },
      currentUser,
      clientId
    );
    return () => {
      if (cleanup) cleanup();
    };
  }, [currentUser, clientId]);

  useEffect(() => {
    fetchPublicFiles();
  }, [currentUser, clientId]);

  useEffect(() => {
    fetchRecipients();
  }, [currentUser, clientId]);

  const handleUploadSuccess = (data) => {
    setSuccessModalData(data);
    fetchPublicFiles();
    setActiveTab(4); // Immediately show Bar 4 ("الملفات التي رفعتها") after successful upload!
  };

  // 5 Main Navigation Bars
  const tabs = [
    {
      id: 1,
      title: 'رفع الملفات',
      shortTitle: 'رفع الملفات',
      desc: 'إرفاق وتعيين الأمان',
      icon: UploadCloud,
      badge: null
    },
    {
      id: 2,
      title: 'الملفات العامة',
      shortTitle: 'الملفات العامة',
      desc: 'الاستلام وفك التشفير',
      icon: Globe,
      badge: publicFiles.length > 0 ? publicFiles.length : null
    },
    {
      id: 3,
      title: 'المستودع',
      shortTitle: 'المستودع',
      desc: 'تخزين شخصي مشفر',
      icon: Layers,
      badge: null
    },
    {
      id: 4,
      title: 'الملفات التي رفعتها',
      shortTitle: 'مرفوعاتي',
      desc: 'متابعة الرموز والاستلام',
      icon: FolderUp,
      badge: null
    },
    {
      id: 5,
      title: 'المستلمون المميزون',
      shortTitle: 'المميزون',
      desc: 'الأرقام المتفق عليها',
      icon: Users,
      badge: recipients.length > 0 ? recipients.length : null
    }
  ];

  // Permanent Admin Ban Screen (Instructs intruder to contact admin email)
  if (isPermanentlyBanned) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4 font-cairo">
        <div className="max-w-md w-full bg-white border border-neutral-300 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-black text-black">
            تم حظر حسابك / جهازك نهائياً
          </h2>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-800 leading-relaxed text-right space-y-2">
            <p className="font-bold">
              لقد تم حظر وصولك إلى تطبيق "مُبادِل" بقرار مباشر من إدارة الحماية والأمان نتيجة ارتكاب مخالفات أمنية.
            </p>
            <p className="text-neutral-600">
              إذا كنت ترى أن هذا الإجراء تم بالخطأ وترغب بطلب إعادة إدخالك للتطبيق، يرجى مراسلة مدير التطبيق مباشرة عبر البريد الإلكتروني التالي وتقديم اعتذارك وتفاصيل طلبك:
            </p>
          </div>

          <div className="bg-neutral-100 p-3.5 rounded-xl border border-neutral-300 flex items-center justify-center gap-2 font-mono text-xs font-black text-black select-all">
            <Mail className="w-4 h-4 text-neutral-700" />
            <span>hossamabdelzaher001@gmail.com</span>
          </div>

          <a
            href="mailto:hossamabdelzaher001@gmail.com?subject=طلب%20إلغاء%20الحظر%20عن%20تطبيق%20مبادل"
            className="block w-full bg-black hover:bg-neutral-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-colors"
          >
            مراسلة الإدارة لطلب إلغاء الحظر
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-cairo text-neutral-900 w-full max-w-full overflow-x-hidden">
      
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5 overflow-x-hidden">
        
        {/* Navigation Tabs - Responsive Layout with all 5 bar names clearly visible */}
        <div className="bg-white rounded-2xl p-1.5 border border-neutral-200 shadow-xs w-full max-w-full">
          
          {/* Mobile Display: 5-Column compact bar showing icon and title cleanly */}
          <div className="grid grid-cols-5 gap-1 sm:hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-white' : 'text-neutral-800'}`} />
                    {tab.badge !== null && (
                      <span className="absolute -top-1.5 -right-2 text-[9px] font-black px-1 rounded-full bg-red-500 text-white">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight line-clamp-1">
                    {tab.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tablet & Desktop Display: Full bar cards with title and description */}
          <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl transition-all text-right group ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    isActive ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-800 group-hover:bg-neutral-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-xs sm:text-sm truncate">
                        {tab.title}
                      </p>
                      {tab.badge !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-800'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Tab Views Content */}
        <div className="w-full max-w-full overflow-x-hidden">
          {activeTab === 1 && (
            <UploadBar
              currentUser={currentUser}
              recipients={recipients}
              onUploadSuccess={handleUploadSuccess}
            />
          )}

          {activeTab === 2 && (
            <PublicFilesBar
              files={publicFiles}
              currentUser={currentUser}
              clientId={clientId}
              onRefresh={fetchPublicFiles}
            />
          )}

          {activeTab === 3 && (
            <VaultBar
              currentUser={currentUser}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 4 && (
            <MyUploadsBar
              currentUser={currentUser}
              onOpenAuth={() => setShowAuthModal(true)}
              onFileDeleted={fetchPublicFiles}
            />
          )}

          {activeTab === 5 && (
            <RecipientsBar
              recipients={recipients}
              currentUser={currentUser}
              onOpenAuth={() => setShowAuthModal(true)}
              onRefreshRecipients={fetchRecipients}
            />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 مُبادِل - التبادل الآمن للملفات</p>
          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
            <span>حماية مشفرة</span>
            <span>•</span>
            <span>تأمين متقدم ضد التخمين</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      <SuccessModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        uploadedData={successModalData}
        onGoToPublic={() => setActiveTab(2)}
      />

      <SecurityWarningModal
        isOpen={!!securityViolation}
        onClose={() => setSecurityViolation(null)}
        violationAction={securityViolation}
      />

    </div>
  );
}

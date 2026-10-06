import JSZip from 'jszip';
import { 
  getFirestorePublicFiles, 
  saveFirestorePublicFile, 
  deleteFirestorePublicFile, 
  incrementFirestoreDownloadCount, 
  addFirestoreBlockedClient,
  getFirestoreAgreedNumbers,
  registerFirestoreAgreedNumber,
  deleteFirestoreAgreedNumber
} from './firestoreRest';
import { 
  idbSavePublicFile, 
  idbGetAllPublicFiles, 
  idbGetPublicFile, 
  idbDeletePublicFile,
  idbSaveVaultFile,
  idbGetAllVaultFiles,
  idbDeleteVaultFile
} from './indexedDBService';
import { getOrCreateClientId } from './helpers';

// Local storage keys
const PUBLIC_FILES_KEY = 'mubadel_public_files_v2';
const VAULT_FILES_KEY = 'mubadel_vault_files_v2';
const AGREED_NUMBERS_KEY = 'mubadel_agreed_numbers_v2';

// Helper to check expiry
export function isFileExpired(file) {
  if (!file.expiresAt) return false;
  return new Date() > new Date(file.expiresAt);
}

// 1. Get Public Files (Merges Firestore Cloud + Local IndexedDB)
export async function getPublicFiles(currentUserId, clientId) {
  const activeClientId = clientId || getOrCreateClientId();
  let mergedFilesMap = new Map();

  // A. Local IndexedDB files
  try {
    const idbFiles = await idbGetAllPublicFiles();
    if (Array.isArray(idbFiles)) {
      idbFiles.forEach(f => {
        if (!isFileExpired(f)) {
          mergedFilesMap.set(f.id, f);
        }
      });
    }
  } catch (e) {}

  // B. Fallback LocalStorage files
  try {
    const saved = localStorage.getItem(PUBLIC_FILES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach(f => {
          if (!isFileExpired(f) && !mergedFilesMap.has(f.id)) {
            mergedFilesMap.set(f.id, f);
          }
        });
      }
    }
  } catch (e) {}

  // C. Cloud Firestore Files (Guarantees persistence across restarts)
  try {
    const firestoreFiles = await getFirestorePublicFiles();
    if (firestoreFiles && Array.isArray(firestoreFiles)) {
      firestoreFiles.forEach(f => {
        if (!isFileExpired(f)) {
          const existing = mergedFilesMap.get(f.id);
          mergedFilesMap.set(f.id, {
            ...f,
            fileBlob: existing?.fileBlob || null,
            fileData: f.fileData || existing?.fileData || null
          });
        }
      });
    }
  } catch (e) {}

  const allActive = Array.from(mergedFilesMap.values());

  return allActive.map(f => {
    const isMine = (currentUserId && f.uploader?.id === currentUserId) ||
                   (f.uploaderClientId && f.uploaderClientId === activeClientId);

    return {
      id: f.id,
      originalName: f.originalName,
      size: f.size,
      mimetype: f.mimetype,
      uploadedAt: f.uploadedAt,
      expiresAt: f.expiresAt,
      expiryHours: f.expiryHours,
      uploaderClientId: f.uploaderClientId,
      isUploadedByMe: !!isMine,
      recipientNumber: f.recipientNumber,
      requiredTools: {
        pin: true,
        account: !!f.security?.account,
        name: !!f.security?.name
      },
      isPermanentlyBlocked: (f.blockedClients || []).includes(activeClientId),
      fileData: f.fileData,
      hasBlob: !!f.fileBlob
    };
  });
}

// 2. Suggest Unique PIN
export async function suggestUniquePin() {
  const currentFiles = await getPublicFiles();
  const activePins = new Set(currentFiles.map(f => f.security?.pin).filter(Boolean));

  let pin = '';
  do {
    pin = Math.floor(10000 + Math.random() * 90000).toString();
  } while (activePins.has(pin));

  return pin;
}

// 3. Upload Public Files (Instant Multi-Gigabyte Ingestion)
export async function uploadSharedFiles(files, { pin, account, name, expiryHours, recipientNumber, currentUser, customFileName }) {
  const activeClientId = getOrCreateClientId();
  const cleanPin = (pin || '').trim();
  const cleanAccount = account ? account.trim().toLowerCase() : '';
  const cleanName = name ? name.trim().toLowerCase() : '';

  // Collision check against active files
  const existingFiles = await getPublicFiles(currentUser?.id, activeClientId);
  const collision = existingFiles.find(f => {
    if (f.security?.pin === cleanPin) return true;
    if (cleanAccount && f.security?.account && f.security.account.toLowerCase() === cleanAccount) return true;
    if (cleanName && f.security?.name && f.security.name.toLowerCase() === cleanName) return true;
    return false;
  });

  if (collision) {
    return {
      success: false,
      error: 'أحد أدوات الأمان المدخلة (الرقم السري أو الاسم أو الحساب) مستخدم بالفعل في ملف نشط آخر. يرجى اختيار رمز مختلف أو الضغط على اقتراح رمز.'
    };
  }

  const hours = parseInt(expiryHours, 10);
  const expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let finalName = file.name;
    if (customFileName && files.length === 1) {
      const origExt = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      finalName = customFileName.trim();
      if (origExt && !finalName.endsWith(origExt)) {
        finalName += origExt;
      }
    }

    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    // If file is very small (< 250KB), create dataURL for cloud sync; otherwise keep in IDB for zero-lag
    let smallFileData = null;
    if (file.size < 250 * 1024) {
      try {
        const reader = new FileReader();
        smallFileData = await new Promise((res) => {
          reader.onload = () => res(reader.result);
          reader.onerror = () => res(null);
          reader.readAsDataURL(file);
        });
      } catch (e) {}
    }

    const newEntry = {
      id: fileId,
      originalName: finalName,
      size: file.size,
      mimetype: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      expiresAt,
      expiryHours: hours,
      recipientNumber: recipientNumber || null,
      uploaderClientId: activeClientId,
      uploader: {
        id: currentUser?.id || 'guest',
        name: currentUser?.name || 'مستخدم مُبادِل',
        email: currentUser?.email || ''
      },
      security: {
        pin: cleanPin,
        account: account ? account.trim() : '',
        name: name ? name.trim() : ''
      },
      failedAttempts: {},
      blockedClients: [],
      downloadsCount: 0,
      fileData: smallFileData
    };

    // A. Save to high-speed IndexedDB (Takes milliseconds for even 8GB!)
    await idbSavePublicFile(newEntry, file);

    // B. Save metadata to Firestore Cloud (Never wiped by Vercel cold restarts)
    saveFirestorePublicFile(newEntry);

    // C. Save summary to localStorage index
    try {
      const saved = localStorage.getItem(PUBLIC_FILES_KEY);
      const list = saved ? JSON.parse(saved) : [];
      list.push({ ...newEntry, fileData: null });
      localStorage.setItem(PUBLIC_FILES_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  return { success: true };
}

// 4. Unlock Public File (Supports IndexedDB Blobs, ObjectURLs, and Data URLs)
export async function unlockFile(fileId, { pin, account, name, clientId, currentUserId }) {
  const activeClientId = clientId || getOrCreateClientId();

  // Retrieve file record from IndexedDB or Local
  let file = await idbGetPublicFile(fileId);

  if (!file) {
    const saved = localStorage.getItem(PUBLIC_FILES_KEY);
    const files = saved ? JSON.parse(saved) : [];
    file = files.find(f => f.id === fileId);
  }

  if (!file) {
    // Check Firestore
    try {
      const cloudFiles = await getFirestorePublicFiles();
      file = cloudFiles?.find(f => f.id === fileId);
    } catch (e) {}
  }

  if (!file) {
    return { success: false, error: 'الملف غير موجود أو انتهت صلاحيته' };
  }

  file.blockedClients = file.blockedClients || [];
  file.failedAttempts = file.failedAttempts || {};

  if (file.blockedClients.includes(activeClientId)) {
    return { success: false, isBlocked: true, error: 'تم حظر هذا الجهاز نهائياً من فتح هذا الملف لأسباب أمنية.' };
  }

  const pinMatch = (file.security?.pin || '') === (pin || '').trim();
  const accountMatch = !file.security?.account || (file.security.account.toLowerCase() === (account || '').trim().toLowerCase());
  const nameMatch = !file.security?.name || (file.security.name.toLowerCase() === (name || '').trim().toLowerCase());

  if (pinMatch && accountMatch && nameMatch) {
    file.downloadsCount = (file.downloadsCount || 0) + 1;
    delete file.failedAttempts[activeClientId];
    
    // Create download URL
    let downloadUrl = file.fileData;
    if (file.fileBlob) {
      downloadUrl = URL.createObjectURL(file.fileBlob);
    }

    incrementFirestoreDownloadCount(file.id, file.downloadsCount);

    return {
      success: true,
      downloadUrl,
      file: {
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype || 'application/octet-stream',
        downloadUrl
      }
    };
  } else {
    file.failedAttempts[activeClientId] = (file.failedAttempts[activeClientId] || 0) + 1;
    const attempts = file.failedAttempts[activeClientId];

    if (attempts >= 7) {
      if (!file.blockedClients.includes(activeClientId)) {
        file.blockedClients.push(activeClientId);
      }
      addFirestoreBlockedClient(file.id, file.blockedClients, activeClientId);
      return { success: false, isBlocked: true, error: 'تم حظر هذا الجهاز نهائياً من فتح هذا الملف بعد 7 محاولات غير صحيحة.' };
    }

    return { success: false, isBlocked: false, error: 'بيانات الأمان غير مطابقة، يرجى التأكد وإعادة المحاولة.' };
  }
}

// 5. My Uploads (Retrieves files uploaded by current user ID OR current device client ID)
export async function getMyUploads(currentUserId, clientId) {
  const activeClientId = clientId || getOrCreateClientId();
  const allFiles = await getPublicFiles(currentUserId, activeClientId);

  return allFiles.filter(f => {
    if (currentUserId && f.uploader?.id === currentUserId) return true;
    if (f.uploaderClientId && f.uploaderClientId === activeClientId) return true;
    if (f.isUploadedByMe) return true;
    return false;
  });
}

// 6. Delete Shared File
export async function deleteSharedFile(fileId, userId) {
  await idbDeletePublicFile(fileId);
  deleteFirestorePublicFile(fileId);

  try {
    const saved = localStorage.getItem(PUBLIC_FILES_KEY);
    if (saved) {
      const files = JSON.parse(saved).filter(f => f.id !== fileId);
      localStorage.setItem(PUBLIC_FILES_KEY, JSON.stringify(files));
    }
  } catch (e) {}

  return true;
}

// 7. Vault Files (Instant Multi-Gigabyte Ingestion using IndexedDB)
export async function getVaultFiles(userId) {
  if (!userId) return [];
  try {
    const idbFiles = await idbGetAllVaultFiles();
    return idbFiles.filter(f => f.ownerId === userId);
  } catch (e) {
    const saved = localStorage.getItem(VAULT_FILES_KEY);
    const files = saved ? JSON.parse(saved) : [];
    return files.filter(f => f.ownerId === userId);
  }
}

export async function uploadToVault(files, userId) {
  for (const file of files) {
    const fileId = 'vault_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const entry = {
      id: fileId,
      ownerId: userId,
      originalName: file.name,
      size: file.size,
      mimetype: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      isCompressed: false
    };

    await idbSaveVaultFile(entry, file);
  }
  return true;
}

export async function renameVaultFile(fileId, newName, userId) {
  const files = await idbGetAllVaultFiles();
  const file = files.find(f => f.id === fileId && f.ownerId === userId);
  if (file) {
    file.originalName = newName;
    await idbSaveVaultFile(file, file.fileBlob);
    return true;
  }
  return false;
}

export async function compressVaultFile(fileId, userId) {
  const file = (await idbGetAllVaultFiles()).find(f => f.id === fileId && f.ownerId === userId);
  if (!file || !file.fileBlob) return false;

  const zip = new JSZip();
  zip.file(file.originalName, file.fileBlob);
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const zipName = file.originalName.replace(/\.[^/.]+$/, "") + '.zip';
  const newEntry = {
    id: 'vault_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    ownerId: userId,
    originalName: zipName,
    size: zipBlob.size,
    mimetype: 'application/zip',
    uploadedAt: new Date().toISOString(),
    isCompressed: true
  };

  await idbSaveVaultFile(newEntry, zipBlob);
  return true;
}

export async function deleteVaultFile(fileId) {
  await idbDeleteVaultFile(fileId);
  return true;
}

// 8. Agreed Numbers (المستلمون المميزون مع دائرة الحالة 🔴 / 🟢)
export async function getAgreedNumbersList(clientId) {
  const activeClientId = clientId || getOrCreateClientId();

  // A. Fetch from Firestore Cloud
  const cloudNumbers = await getFirestoreAgreedNumbers();

  // Count participants per agreed number
  const countsByNumber = {};
  cloudNumbers.forEach(item => {
    if (item.number) {
      countsByNumber[item.number] = (countsByNumber[item.number] || new Set()).add(item.clientId);
    }
  });

  // B. Get user's local registered list
  const saved = localStorage.getItem(AGREED_NUMBERS_KEY);
  const localList = saved ? JSON.parse(saved) : [];

  // Combine and determine status:
  // 🟢 Green = 2 or more distinct parties entered the exact same number
  // 🔴 Red = 1 party waiting for the other
  return localList.map(item => {
    const participants = countsByNumber[item.number];
    const isMatched = participants && participants.size >= 2;
    return {
      ...item,
      isMatched: !!isMatched,
      status: isMatched ? 'connected' : 'waiting'
    };
  });
}

export async function saveAgreedNumber(number, label, clientId) {
  const activeClientId = clientId || getOrCreateClientId();
  const cleanNum = number.trim();

  const saved = localStorage.getItem(AGREED_NUMBERS_KEY);
  const list = saved ? JSON.parse(saved) : [];

  if (list.some(r => r.number === cleanNum)) {
    return { success: false, error: 'هذا الرقم مسجل بالفعل لديك' };
  }

  const newEntry = {
    id: 'num_' + Date.now(),
    number: cleanNum,
    label: label?.trim() || `مستلم (${cleanNum})`,
    registeredAt: new Date().toISOString(),
    clientId: activeClientId
  };

  list.push(newEntry);
  localStorage.setItem(AGREED_NUMBERS_KEY, JSON.stringify(list));

  // Sync with Firestore Cloud
  await registerFirestoreAgreedNumber(cleanNum, activeClientId, label);

  return { success: true, item: newEntry };
}

export async function removeAgreedNumber(id, number, clientId) {
  const activeClientId = clientId || getOrCreateClientId();
  const saved = localStorage.getItem(AGREED_NUMBERS_KEY);
  if (saved) {
    const list = JSON.parse(saved).filter(r => r.id !== id);
    localStorage.setItem(AGREED_NUMBERS_KEY, JSON.stringify(list));
  }

  if (number) {
    await deleteFirestoreAgreedNumber(`num_${number}_${activeClientId}`);
  }
  return true;
}

// Compatibility aliases
export const getRecipients = (userId) => getAgreedNumbersList();
export const addRecipient = (userId, num, lbl) => saveAgreedNumber(num, lbl);
export const deleteRecipient = (id) => removeAgreedNumber(id);

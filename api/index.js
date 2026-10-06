import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

const app = express();
app.use(cors());
app.use(express.json());

// In Vercel serverless, /tmp is writable
const tmpDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(tmpDir, 'db.json');

// In-memory fallback
let memoryDB = {
  files: [],
  vaultFiles: [],
  recipients: [],
  users: []
};

function getDB() {
  if (fs.existsSync(dbPath)) {
    try {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      return memoryDB;
    }
  }
  return memoryDB;
}

function saveDB(data) {
  memoryDB = data;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (e) {}
}

function isFileExpired(file) {
  if (!file.expiresAt) return false;
  return new Date() > new Date(file.expiresAt);
}

// Multer memory/tmp storage for serverless
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\u0600-\u06FF_-]/g, '_'))
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Suggest PIN
app.get('/api/files/suggest-pin', (req, res) => {
  const db = getDB();
  const activePins = new Set(db.files.filter(f => !isFileExpired(f)).map(f => f.security.pin));
  let pin = '';
  do {
    pin = Math.floor(10000 + Math.random() * 90000).toString();
  } while (activePins.has(pin));
  res.json({ suggestedPin: pin });
});

// Upload shared file
app.post('/api/files/upload', upload.array('files'), (req, res) => {
  try {
    const files = req.files || [];
    const { pin, account, name, customFileName, expiryHours, recipientNumber, userId, userName, userEmail } = req.body;

    if (!pin || !/^\d+$/.test(pin.trim())) {
      return res.status(400).json({ error: 'الرقم السري إجباري ويجب أن يحتوي على أرقام فقط' });
    }

    const cleanPin = pin.trim();
    const cleanAccount = account ? account.trim() : '';
    const cleanName = name ? name.trim() : '';
    const db = getDB();

    const duplicate = db.files.find(f => {
      if (isFileExpired(f)) return false;
      if (f.security.pin === cleanPin) return true;
      if (cleanAccount && f.security.account && f.security.account.toLowerCase() === cleanAccount.toLowerCase()) return true;
      if (cleanName && f.security.name && f.security.name.toLowerCase() === cleanName.toLowerCase()) return true;
      return false;
    });

    if (duplicate) {
      return res.status(400).json({
        error: 'أحد أدوات الأمان المدخلة مستخدم بالفعل في ملف نشط آخر. يرجى اختيار رمز مختلف.'
      });
    }

    const hours = parseInt(expiryHours, 10);
    let expiresAt = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;

    const uploaded = [];
    for (const f of files) {
      let orig = Buffer.from(f.originalname, 'latin1').toString('utf8');
      if (customFileName && customFileName.trim() && files.length === 1) {
        const ext = orig.includes('.') ? orig.substring(orig.lastIndexOf('.')) : '';
        orig = customFileName.trim();
        if (ext && !orig.endsWith(ext)) orig += ext;
      }

      const entry = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        originalName: orig,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype,
        path: f.path,
        uploadedAt: new Date().toISOString(),
        expiresAt,
        expiryHours: hours,
        recipientNumber: recipientNumber ? recipientNumber.trim() : null,
        uploader: {
          id: userId || 'anonymous',
          name: userName || 'مستخدم',
          email: userEmail || ''
        },
        security: { pin: cleanPin, account: cleanAccount, name: cleanName },
        failedAttempts: {},
        blockedClients: [],
        downloadsCount: 0
      };
      db.files.push(entry);
      uploaded.push(entry);
    }

    saveDB(db);
    res.json({ success: true, message: 'تم رفع الملف بنجاح', files: uploaded });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء رفع الملف' });
  }
});

// Public files
app.get('/api/files/public', (req, res) => {
  const { currentUserId, clientId } = req.query;
  const db = getDB();
  const activeFiles = db.files.filter(f => !isFileExpired(f));

  const safeList = activeFiles.map(f => ({
    id: f.id,
    originalName: f.originalName,
    size: f.size,
    mimetype: f.mimetype,
    uploadedAt: f.uploadedAt,
    expiresAt: f.expiresAt,
    expiryHours: f.expiryHours,
    isUploadedByMe: !!(currentUserId && f.uploader.id === currentUserId),
    recipientNumber: f.recipientNumber,
    requiredTools: {
      pin: true,
      account: !!f.security.account,
      name: !!f.security.name
    },
    isPermanentlyBlocked: !!(clientId && f.blockedClients?.includes(clientId))
  }));

  res.json({ files: safeList });
});

// Unlock
app.post('/api/files/unlock/:id', (req, res) => {
  const { id } = req.params;
  const { pin, account, name, clientId } = req.body;
  const db = getDB();
  const file = db.files.find(f => f.id === id);

  if (!file) return res.status(404).json({ error: 'الملف غير موجود أو انتهت صلاحيته' });

  const effectiveClientId = clientId || 'unknown_client';
  file.blockedClients = file.blockedClients || [];
  file.failedAttempts = file.failedAttempts || {};

  if (file.blockedClients.includes(effectiveClientId)) {
    return res.status(403).json({ error: 'تم حظر هذا الجهاز نهائياً من فتح هذا الملف', isBlocked: true });
  }

  const pinMatch = file.security.pin === (pin || '').trim();
  const accountMatch = !file.security.account || (file.security.account.toLowerCase() === (account || '').trim().toLowerCase());
  const nameMatch = !file.security.name || (file.security.name.toLowerCase() === (name || '').trim().toLowerCase());

  if (pinMatch && accountMatch && nameMatch) {
    file.downloadsCount = (file.downloadsCount || 0) + 1;
    delete file.failedAttempts[effectiveClientId];
    saveDB(db);

    return res.json({
      success: true,
      downloadUrl: `/api/files/download/${file.id}?token=${Buffer.from(file.id + ':' + file.security.pin).toString('base64')}`,
      file: { id: file.id, originalName: file.originalName, size: file.size }
    });
  } else {
    file.failedAttempts[effectiveClientId] = (file.failedAttempts[effectiveClientId] || 0) + 1;
    if (file.failedAttempts[effectiveClientId] >= 7) {
      if (!file.blockedClients.includes(effectiveClientId)) file.blockedClients.push(effectiveClientId);
      saveDB(db);
      return res.status(403).json({ error: 'تم حظر هذا الجهاز نهائياً من فتح هذا الملف', isBlocked: true });
    }
    saveDB(db);
    return res.status(401).json({ error: 'بيانات الأمان غير مطابقة', isBlocked: false });
  }
});

// Download
app.get('/api/files/download/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const file = db.files.find(f => f.id === id);
  if (!file || !fs.existsSync(file.path)) return res.status(404).send('الملف غير موجود');
  res.download(file.path, file.originalName);
});

// User Uploads
app.get('/api/files/my-uploads', (req, res) => {
  const { userId } = req.query;
  const db = getDB();
  const myFiles = db.files.filter(f => f.uploader.id === userId);
  res.json({ files: myFiles });
});

// Delete Shared
app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.files.findIndex(f => f.id === id);
  if (idx !== -1) {
    if (fs.existsSync(db.files[idx].path)) fs.unlinkSync(db.files[idx].path);
    db.files.splice(idx, 1);
    saveDB(db);
  }
  res.json({ success: true });
});

// Vault
app.get('/api/vault', (req, res) => {
  const { userId } = req.query;
  const db = getDB();
  res.json({ files: db.vaultFiles.filter(f => f.ownerId === userId) });
});

// Recipients
app.get('/api/recipients', (req, res) => {
  const { userId } = req.query;
  const db = getDB();
  res.json({ recipients: db.recipients.filter(r => r.ownerId === userId) });
});

app.post('/api/recipients', (req, res) => {
  const { userId, recipientNumber, name } = req.body;
  if (!recipientNumber) return res.status(400).json({ error: 'رقم المستلم مطلوب' });
  const db = getDB();
  const newRecip = {
    id: 'recip_' + Date.now(),
    ownerId: userId,
    recipientNumber: recipientNumber.trim(),
    name: name?.trim() || `مستلم (${recipientNumber.trim()})`,
    createdAt: new Date().toISOString()
  };
  db.recipients.push(newRecip);
  saveDB(db);
  res.json({ success: true, recipient: newRecip });
});

app.delete('/api/recipients/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.recipients.findIndex(r => r.id === id);
  if (idx !== -1) {
    db.recipients.splice(idx, 1);
    saveDB(db);
  }
  res.json({ success: true });
});

export default app;

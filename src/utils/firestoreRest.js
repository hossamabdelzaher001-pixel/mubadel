// Native Direct Firestore REST Client for Mubadel App
// Connects to Firebase Project: lkkkk-19b6a without external dependencies.

const PROJECT_ID = 'lkkkk-19b6a';
const API_KEY = 'AIzaSyCaHLUq2DZzc2euPGSIyiuzB2CmhZz9WdE';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Convert JS object to Firestore fields format
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => (typeof v === 'string' ? { stringValue: v } : { stringValue: JSON.stringify(v) }))
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

// Helper: Convert Firestore fields format back to plain JS object
function fromFirestoreDocument(doc) {
  if (!doc || !doc.fields) return null;
  const result = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    if ('stringValue' in val) {
      try {
        if (val.stringValue.startsWith('{') || val.stringValue.startsWith('[')) {
          result[key] = JSON.parse(val.stringValue);
        } else {
          result[key] = val.stringValue;
        }
      } catch (e) {
        result[key] = val.stringValue;
      }
    } else if ('integerValue' in val) {
      result[key] = parseInt(val.integerValue, 10);
    } else if ('doubleValue' in val) {
      result[key] = val.doubleValue;
    } else if ('booleanValue' in val) {
      result[key] = val.booleanValue;
    } else if ('nullValue' in val) {
      result[key] = null;
    } else if ('arrayValue' in val) {
      result[key] = (val.arrayValue.values || []).map(v => v.stringValue || v);
    }
  }
  if (doc.name) {
    const parts = doc.name.split('/');
    result.id = parts[parts.length - 1];
  }
  return result;
}

// 1. Get all public files from Firestore
export async function getFirestorePublicFiles() {
  try {
    const res = await fetch(`${BASE_URL}/public_files?key=${API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map(fromFirestoreDocument).filter(Boolean);
  } catch (err) {
    console.warn('Firestore fetch error:', err);
    return null;
  }
}

// 2. Save public file to Firestore
export async function saveFirestorePublicFile(fileData) {
  try {
    const docId = fileData.id || `file_${Date.now()}`;
    const fields = toFirestoreFields({
      ...fileData,
      id: docId
    });

    const res = await fetch(`${BASE_URL}/public_files/${docId}?key=${API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (err) {
    console.warn('Firestore save error:', err);
    return false;
  }
}

// 3. Delete file from Firestore
export async function deleteFirestorePublicFile(docId) {
  try {
    const res = await fetch(`${BASE_URL}/public_files/${docId}?key=${API_KEY}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// 4. Update download count in Firestore
export async function incrementFirestoreDownloadCount(docId, currentCount) {
  try {
    const newCount = (currentCount || 0) + 1;
    await fetch(`${BASE_URL}/public_files/${docId}?updateMask.fieldPaths=downloadsCount&key=${API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          downloadsCount: { integerValue: String(newCount) }
        }
      })
    });
  } catch (e) {}
}

// 5. Save permanent blocked client for a specific file
export async function addFirestoreBlockedClient(docId, currentBlockedList, clientId) {
  try {
    const updated = [...new Set([...(currentBlockedList || []), clientId])];
    await fetch(`${BASE_URL}/public_files/${docId}?updateMask.fieldPaths=blockedClients&key=${API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          blockedClients: {
            arrayValue: {
              values: updated.map(c => ({ stringValue: c }))
            }
          }
        }
      })
    });
  } catch (e) {}
}

// 6. Registered Agreed Numbers for Recipients Matching (🔴 / 🟢 Status)
export async function getFirestoreAgreedNumbers() {
  try {
    const res = await fetch(`${BASE_URL}/agreed_numbers?key=${API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map(fromFirestoreDocument).filter(Boolean);
  } catch (err) {
    return [];
  }
}

export async function registerFirestoreAgreedNumber(number, clientId, label = '') {
  try {
    const docId = `num_${number.trim()}_${clientId}`;
    const fields = toFirestoreFields({
      id: docId,
      number: number.trim(),
      clientId: clientId,
      label: label.trim(),
      createdAt: new Date().toISOString()
    });
    const res = await fetch(`${BASE_URL}/agreed_numbers/${docId}?key=${API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteFirestoreAgreedNumber(docId) {
  try {
    await fetch(`${BASE_URL}/agreed_numbers/${docId}?key=${API_KEY}`, {
      method: 'DELETE'
    });
    return true;
  } catch (e) {
    return false;
  }
}

// 7. Global Ban for Admins (One-Click Permanent Ban)
export async function addFirestoreGlobalBan(clientId) {
  try {
    const docId = `ban_${clientId}`;
    const fields = toFirestoreFields({
      id: docId,
      clientId: clientId,
      bannedAt: new Date().toISOString(),
      adminEmail: 'hossamabdelzaher001@gmail.com'
    });
    await fetch(`${BASE_URL}/global_bans/${docId}?key=${API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function isFirestoreGlobalBanned(clientId) {
  try {
    const docId = `ban_${clientId}`;
    const res = await fetch(`${BASE_URL}/global_bans/${docId}?key=${API_KEY}`);
    return res.ok;
  } catch (e) {
    return false;
  }
}

// --- IndexedDB helper for ImageTrans image collections ---
// Stores translated image collections (manga chapters / image sets).
// Used by the background service worker (via importScripts) and by
// extension pages (collections.html) so both share the extension origin.
//
// Schema:
//   collections  { keyPath: 'name' }
//     { name, title, url, createdAt, imageCount, status }  status: translating | done | stopped | failed
//   images       { keyPath: ['name', 'index'] } + index 'by_name'
//     { name, index, src, original(Blob), translated(Blob), imgMap, width, height, savedAt }

const IT_DB_NAME = 'ImageTransCollections';
const IT_DB_VERSION = 1;
const IT_STORE_COLLECTIONS = 'collections';
const IT_STORE_IMAGES = 'images';

function itOpenDB() {
  return new Promise(function(resolve, reject) {
    const req = indexedDB.open(IT_DB_NAME, IT_DB_VERSION);
    req.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IT_STORE_COLLECTIONS)) {
        db.createObjectStore(IT_STORE_COLLECTIONS, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(IT_STORE_IMAGES)) {
        const store = db.createObjectStore(IT_STORE_IMAGES, { keyPath: ['name', 'index'] });
        store.createIndex('by_name', 'name', { unique: false });
      }
    };
    req.onsuccess = function() { resolve(req.result); };
    req.onerror = function() { reject(req.error); };
  });
}

// Convert a data: URL into a Blob for compact IndexedDB storage.
function itDataURLToBlob(dataURL) {
  if (!dataURL || typeof dataURL !== 'string' || !dataURL.startsWith('data:')) return null;
  const comma = dataURL.indexOf(',');
  if (comma < 0) return null;
  const meta = dataURL.slice(5, comma);
  const mime = meta.match(/^([^;]+)/);
  const b64 = dataURL.slice(comma + 1);
  let bin;
  try { bin = atob(b64); } catch (e) { return null; }
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime ? mime[1] : 'image/webp' });
}

// Upsert a collection record. If a collection with the same name already
// exists, its previous images are removed first (a fresh run replaces the old one).
async function itCreateCollection(collection) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction([IT_STORE_COLLECTIONS, IT_STORE_IMAGES], 'readwrite');
    tx.objectStore(IT_STORE_COLLECTIONS).put(collection);
    const index = tx.objectStore(IT_STORE_IMAGES).index('by_name');
    const req = index.openCursor(IDBKeyRange.only(collection.name));
    req.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

async function itAddCollectionImage(image) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction(IT_STORE_IMAGES, 'readwrite');
    tx.objectStore(IT_STORE_IMAGES).put(image);
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

async function itUpdateCollection(name, patch) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction(IT_STORE_COLLECTIONS, 'readwrite');
    const store = tx.objectStore(IT_STORE_COLLECTIONS);
    const req = store.get(name);
    req.onsuccess = function() {
      const rec = req.result || { name: name };
      for (const k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k)) rec[k] = patch[k];
      }
      store.put(rec);
    };
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

async function itGetCollection(name) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction(IT_STORE_COLLECTIONS, 'readonly');
    const req = tx.objectStore(IT_STORE_COLLECTIONS).get(name);
    req.onsuccess = function() { resolve(req.result || null); };
    req.onerror = function() { reject(req.error); };
  });
}

async function itListCollections() {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction(IT_STORE_COLLECTIONS, 'readonly');
    const req = tx.objectStore(IT_STORE_COLLECTIONS).getAll();
    req.onsuccess = function() {
      const list = req.result || [];
      list.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      resolve(list);
    };
    req.onerror = function() { reject(req.error); };
  });
}

async function itGetCollectionImages(name) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction(IT_STORE_IMAGES, 'readonly');
    const req = tx.objectStore(IT_STORE_IMAGES).index('by_name').getAll(IDBKeyRange.only(name));
    req.onsuccess = function() {
      const list = req.result || [];
      list.sort(function(a, b) { return (a.index || 0) - (b.index || 0); });
      resolve(list);
    };
    req.onerror = function() { reject(req.error); };
  });
}

async function itDeleteCollection(name) {
  const db = await itOpenDB();
  return new Promise(function(resolve, reject) {
    const tx = db.transaction([IT_STORE_COLLECTIONS, IT_STORE_IMAGES], 'readwrite');
    tx.objectStore(IT_STORE_COLLECTIONS).delete(name);
    const index = tx.objectStore(IT_STORE_IMAGES).index('by_name');
    const req = index.openCursor(IDBKeyRange.only(name));
    req.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = function() { resolve(); };
    tx.onerror = function() { reject(tx.error); };
  });
}

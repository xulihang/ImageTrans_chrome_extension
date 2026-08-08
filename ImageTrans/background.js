
// --- IndexedDB cache for remote OCR models ---
const MODEL_CACHE_DB_NAME = 'ImageTransModelCache';
const MODEL_CACHE_STORE = 'models';
const DB_VERSION = 1;

function openModelCacheDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MODEL_CACHE_DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MODEL_CACHE_STORE)) {
        db.createObjectStore(MODEL_CACHE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedModel(url) {
  const db = await openModelCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_CACHE_STORE, 'readonly');
    const store = tx.objectStore(MODEL_CACHE_STORE);
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function cacheModel(url, arrayBuffer) {
  const db = await openModelCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MODEL_CACHE_STORE, 'readwrite');
    const store = tx.objectStore(MODEL_CACHE_STORE);
    store.put(arrayBuffer, url);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function fetchAndCacheModel(url) {
  // Check cache first
  const cached = await getCachedModel(url);
  if (cached) {
    console.log('Model cache hit:', url);
    return cached;
  }
  console.log('Model cache miss, downloading:', url);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error('Failed to fetch model: ' + url + ' (status ' + resp.status + ')');
  }
  const arrayBuffer = await resp.arrayBuffer();
  await cacheModel(url, arrayBuffer);
  console.log('Model cached:', url, '(' + (arrayBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB)');
  return arrayBuffer;
}
// --- End IndexedDB cache ---

// --- IndexedDB for storing translation results ---
const TRANSLATION_DB_NAME = 'ImageTransResults';
const TRANSLATION_STORE = 'translations';
const TRANSLATION_DB_VERSION = 1;

function openTranslationDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TRANSLATION_DB_NAME, TRANSLATION_DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(TRANSLATION_STORE)) {
        db.createObjectStore(TRANSLATION_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function computeImageHash(dataURL) {
  const commaIdx = dataURL.indexOf(',');
  const base64Data = commaIdx >= 0 ? dataURL.substring(commaIdx + 1) : dataURL;
  const encoder = new TextEncoder();
  const data = encoder.encode(base64Data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function saveTranslationResult(originalDataURL, translatedDataURL, imgMap, sourceLang, targetLang) {
  if (!originalDataURL || !translatedDataURL || !imgMap) return;
  try {
    const db = await openTranslationDB();
    const hash = await computeImageHash(originalDataURL);
    const record = {
      originalImage: originalDataURL,
      translatedImage: translatedDataURL,
      imgMap: imgMap,
      timestamp: Date.now(),
      sourceLang: sourceLang,
      targetLang: targetLang
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSLATION_STORE, 'readwrite');
      const store = tx.objectStore(TRANSLATION_STORE);
      store.put(record, hash);
      tx.oncomplete = () => {
        console.log('Translation result saved to IndexedDB, key:', hash);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Failed to save translation result to IndexedDB:', e);
  }
}

async function getTranslationCache(originalDataURL) {
  if (!originalDataURL) return null;
  try {
    const db = await openTranslationDB();
    const hash = await computeImageHash(originalDataURL);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSLATION_STORE, 'readonly');
      const store = tx.objectStore(TRANSLATION_STORE);
      const req = store.get(hash);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to get translation cache:', e);
    return null;
  }
}

async function listTranslationCache() {
  const db = await openTranslationDB();
  return new Promise((resolve, reject) => {
    const results = [];
    const tx = db.transaction(TRANSLATION_STORE, 'readonly');
    const store = tx.objectStore(TRANSLATION_STORE);
    const req = store.openCursor();
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push({ key: cursor.primaryKey, record: cursor.value });
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteTranslationCache(key) {
  const db = await openTranslationDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = tx.objectStore(TRANSLATION_STORE);
    store.delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function clearTranslationCache() {
  const db = await openTranslationDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSLATION_STORE, 'readwrite');
    const store = tx.objectStore(TRANSLATION_STORE);
    store.clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
// --- End IndexedDB for translation results ---

// --- Custom i18n: allow user to override UI language ---
(async function() {
  const { uiLanguage } = await chrome.storage.sync.get({ uiLanguage: '' });
  if (uiLanguage) {
    try {
      const url = chrome.runtime.getURL('_locales/' + uiLanguage + '/messages.json');
      const resp = await fetch(url);
      const messages = await resp.json();
      const original = chrome.i18n.getMessage.bind(chrome.i18n);
      chrome.i18n.getMessage = function(key, subs) {
        if (messages[key]) {
          const msg = messages[key];
          let text = msg.message;
          if (subs !== undefined && subs !== null && msg.placeholders) {
            const subsArr = Array.isArray(subs) ? subs : [subs];
            for (const [name, def] of Object.entries(msg.placeholders)) {
              const m = def.content.match(/^\$(\d+)$/);
              if (m) {
                const val = subsArr[parseInt(m[1]) - 1];
                if (val !== undefined) {
                  text = text.replace(new RegExp('\\$' + name.toUpperCase() + '\\$', 'g'), function() { return val; });
                }
              }
            }
          }
          return text;
        }
        return original(key, subs);
      };
    } catch(e) { /* fall back to browser default */ }
  }
})();

// 使用declarativeNetRequest API处理跨域请求，相关规则在cors_rules.json中定义

let fetchCount = 0;
let useCORS = true;

// 初始化时加载用户的CORS设置（不主动启用，等fetch时再开）
chrome.storage.sync.get({ useCORS: true }, function(items) {
  useCORS = items.useCORS;
});

// 更新CORS规则状态的函数
function updateCORSStatus(enabled) {
  console.log(`更新CORS状态: ${enabled ? '启用' : '禁用'}`);
  if (enabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['cors_rules']
    });
  } else {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['cors_rules']
    });
  }
}

// 监听来自options页面和content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateCORSStatus") {
    useCORS = request.enabled;
    if (!useCORS) {
      updateCORSStatus(false);
    }
    sendResponse();
  } else if (request.action === "enableCORSForFetch") {
    fetchCount++;
    if (fetchCount === 1 && useCORS) {
      updateCORSStatus(true);
    }
    sendResponse();
  } else if (request.action === "disableCORSForFetch") {
    fetchCount = Math.max(0, fetchCount - 1);
    if (fetchCount === 0 && useCORS) {
      updateCORSStatus(false);
    }
    sendResponse();
  } else if (request.action === "proxyFetch") {
    (async () => {
      try {
        const resp = await fetch(request.url, request.options);
        let data;
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await resp.json();
        } else {
          data = await resp.text();
        }
        sendResponse({ ok: resp.ok, status: resp.status, data: data });
      } catch (err) {
        sendResponse({ ok: false, status: 0, data: null, error: err.message });
      }
    })();
    return true;
  } else if (request.action === "translateViaGlm4Flash") {
    (async () => {
      try {
        const resp = await fetch("http://service.basiccat.org:5000/translate/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: request.texts, target_lang: request.targetLang })
        });
        if (!resp.ok) {
          sendResponse({ error: "GLM-4-Flash API error: HTTP " + resp.status });
          return;
        }
        const data = await resp.json();
        const translations = data.results.map(function(r) { return r.translated; });
        sendResponse({ texts: translations });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // async sendResponse
  } else if (request.action === "downloadImage") {
    (async () => {
      try {
        const resp = await fetch(request.url);
        if (!resp.ok) {
          sendResponse({ error: "Download failed with status " + resp.status });
          return;
        }
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ dataURL: reader.result });
        };
        reader.onerror = () => {
          sendResponse({ error: "FileReader failed" });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // async sendResponse
  } else if (request.action === "fetchModel") {
    (async () => {
      try {
        const arrayBuffer = await fetchAndCacheModel(request.url);
        // Convert to base64 for reliable transfer through postMessage chain
        // (ArrayBuffer can be problematic across SW -> content script -> page)
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        sendResponse({ ok: true, base64: base64 });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true; // async sendResponse
  } else if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, {format: "png"}, (dataURL) => {
      if (chrome.runtime.lastError) {
        sendResponse({error: chrome.runtime.lastError.message});
      } else {
        sendResponse({dataURL: dataURL});
      }
    });
    return true; // keep sendResponse valid for async callback
  } else if (request.action === "saveTranslationResult") {
    saveTranslationResult(
      request.originalDataURL,
      request.translatedDataURL,
      request.imgMap,
      request.sourceLang,
      request.targetLang
    );
    sendResponse({ ok: true });
  } else if (request.action === "getTranslationCache") {
    (async () => {
      const cached = await getTranslationCache(request.originalDataURL);
      sendResponse({ cached: cached });
    })();
    return true; // async sendResponse
  } else if (request.action === "listTranslationCache") {
    (async () => {
      try {
        const entries = await listTranslationCache();
        sendResponse({ ok: true, entries: entries });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  } else if (request.action === "deleteTranslationCache") {
    (async () => {
      try {
        await deleteTranslationCache(request.key);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  } else if (request.action === "clearTranslationCache") {
    (async () => {
      try {
        await clearTranslationCache();
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  } else if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

// 扩展安装时输出日志
chrome.runtime.onInstalled.addListener(() => {
  console.log('ImageTrans扩展已安装或更新');
  let parent = chrome.contextMenus.create({
    "id": "imagetrans-menu",
    "title": chrome.i18n.getMessage("ctxmenu_parent"),
    "contexts": ["image"]
  });
  chrome.contextMenus.create({
    "title": chrome.i18n.getMessage("ctxmenu_translate"),
    "parentId": parent,
    "id": "translate",
    "contexts": ["image"]
  });
  chrome.contextMenus.create({
    "title": chrome.i18n.getMessage("ctxmenu_alter"),
    "parentId": parent,
    "id": "alter",
    "contexts": ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  let message = info.menuItemId+"WithMenu";
  chrome.tabs.sendMessage(tab.id, {message:message,info:info}, function(response) {

  });
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(function(command) {
  if (command === "screen-capture-ocr") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "startScreenCapture"});
      }
    });
  }
});

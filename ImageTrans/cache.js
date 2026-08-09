// --- Custom i18n: allow user to override UI language ---
const _i18nOriginal = chrome.i18n.getMessage.bind(chrome.i18n);
let getMessage = _i18nOriginal;

async function initI18n() {
  const { uiLanguage } = await chrome.storage.sync.get({ uiLanguage: '' });
  if (uiLanguage) {
    try {
      const url = chrome.runtime.getURL('_locales/' + uiLanguage + '/messages.json');
      const resp = await fetch(url);
      const messages = await resp.json();
      getMessage = function(key, subs) {
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
        return _i18nOriginal(key, subs);
      };
    } catch(e) { /* fall back to browser default */ }
  }
}

function applyI18n() {
  document.title = getMessage("cache_title");
  var elements = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var key = el.getAttribute('data-i18n');
    if (key) {
      if (el.tagName === 'TITLE') continue;
      el.textContent = getMessage(key);
    }
  }
  // handle data-i18n-placeholder attributes (e.g. input placeholders)
  var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  for (var j = 0; j < placeholders.length; j++) {
    var ph = placeholders[j];
    var phKey = ph.getAttribute('data-i18n-placeholder');
    if (phKey) {
      ph.setAttribute('placeholder', getMessage(phKey));
    }
  }
}

// Helper to send message with timeout (avoid hanging if background SW is cold).
function sendMessageTimeout(msg, timeout) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, timeout || 3000);
    chrome.runtime.sendMessage(msg, (response) => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(response); }
    });
  });
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return String(ts);
  }
}

const PAGE_SIZE = 10;
let allEntries = [];
let filterValue = '';
let currentPage = 1;

function render(entries) {
  const countEl = document.getElementById('count');
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');

  // Entries are already the background-filtered result (pageUrl/pageTitle match
  // happens server-side); render whatever subset we were given.
  const filtered = entries || [];

  countEl.textContent = getMessage('cache_count', [filtered.length]);

  if (!filtered || filtered.length === 0) {
    emptyEl.style.display = 'block';
    listEl.innerHTML = '';
    paginationEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';

  // Paginate.
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageEntries = filtered.slice(start, start + PAGE_SIZE);
  listEl.innerHTML = '';

  for (const entry of pageEntries) {
    const rec = entry.record;
    const card = document.createElement('div');
    card.className = 'card';

    const origImg = document.createElement('img');
    origImg.className = 'thumb';
    origImg.title = getMessage('cache_original');
    if (rec.originalImage) origImg.src = rec.originalImage;

    const info = document.createElement('div');
    info.className = 'info';

    const title = document.createElement('div');
    title.className = 'title';
    // Prefer the page title; fall back to the language pair when unavailable.
    const pageTitle = (rec.pageTitle || '').trim();
    const lang = (rec.sourceLang ? rec.sourceLang : '-') + ' → ' + (rec.targetLang ? rec.targetLang : '-');
    title.textContent = pageTitle ? pageTitle : lang;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const boxCount = (rec.imgMap && rec.imgMap.boxes) ? rec.imgMap.boxes.length : 0;
    meta.innerHTML =
      getMessage('cache_time') + ': ' + formatTime(rec.timestamp) + '<br>' +
      getMessage('cache_boxes') + ': ' + boxCount + '<br>' +
      getMessage('cache_page') + ': ' + ((rec.pageUrl) ? rec.pageUrl : '-') + '<br>' +
      getMessage('cache_key') + ': ' + (entry.key ? entry.key.substring(0, 16) + '…' : '-');

    const translatedImg = document.createElement('img');
    translatedImg.className = 'thumb';
    translatedImg.title = getMessage('cache_translated');
    if (rec.translatedImage) translatedImg.src = rec.translatedImage;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = getMessage('cache_delete');
    delBtn.addEventListener('click', async () => {
      const sure = confirm(getMessage('cache_confirm_delete'));
      if (!sure) return;
      await sendMessageTimeout({ action: 'deleteTranslationCache', key: entry.key });
      reload(filterValue);
    });

    info.appendChild(title);
    info.appendChild(meta);
    card.appendChild(origImg);
    card.appendChild(info);
    card.appendChild(translatedImg);
    card.appendChild(delBtn);
    listEl.appendChild(card);
  }

  // Update the pagination bar.
  const paginationEl = document.getElementById('pagination');
  const pageInfoEl = document.getElementById('pageInfo');
  if (totalPages > 1) {
    paginationEl.style.display = 'flex';
    pageInfoEl.textContent = getMessage('cache_page_of', [currentPage, totalPages]);
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
  } else {
    paginationEl.style.display = 'none';
  }
}

async function reload(filter) {
  filter = (filter || '').trim();
  const resp = await sendMessageTimeout({
    action: 'listTranslationCache',
    filter: filter
  });
  allEntries = (resp && resp.ok) ? resp.entries : [];
  render(allEntries);
}

window.onload = async function() {
  await initI18n();
  applyI18n();
  reload();

  document.getElementById('refreshButton').addEventListener('click', function() {
    reload(filterValue);
  });

  document.getElementById('readButton').addEventListener('click', async function() {
    // The background reads the matching original images from IndexedDB and sends
    // them directly to the reader page; here we just hand it the current filter.
    const resp = await sendMessageTimeout({ action: 'openReader', filter: filterValue });
    if (!resp || !resp.ok) {
      alert(getMessage('cache_read_failed'));
    } else if (!resp.count || resp.count === 0) {
      alert(getMessage('cache_read_empty'));
    }
  });

  const filterInput = document.getElementById('urlFilter');
  if (filterInput) {
    let debounceTimer = null;
    filterInput.addEventListener('input', function() {
      filterValue = filterInput.value;
      currentPage = 1;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        reload(filterValue);
      }, 300);
    });
  }

  document.getElementById('prevPage').addEventListener('click', function() {
    if (currentPage > 1) { currentPage--; render(allEntries); }
  });
  document.getElementById('nextPage').addEventListener('click', function() {
    currentPage++; render(allEntries);
  });

  document.getElementById('clearButton').addEventListener('click', async () => {
    const sure = confirm(getMessage('cache_confirm_clear'));
    if (!sure) return;
    await sendMessageTimeout({ action: 'clearTranslationCache' });
    currentPage = 1;
    reload(filterValue);
  });

  const zipBtn = document.getElementById('downloadZipButton');
  if (zipBtn) {
    zipBtn.addEventListener('click', downloadZip);
  }
};

// --- Download ZIP (ImageTrans project) ---

// Convert a data URL to a Blob.
function dataURLToBlob(dataURL) {
  const comma = dataURL.indexOf(',');
  const mime = dataURL.slice(5, comma).split(';')[0] || 'image/webp';
  const b64 = dataURL.slice(comma + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Build a minimal ImageTrans project file from the cached records.
function buildItp(records) {
  const first = records[0] || {};
  const images = {};
  records.forEach(function(rec, idx) {
    const name = (idx + 1) + '.webp';
    images[name] = rec.imgMap ? rec.imgMap : { boxes: [] };
  });
  return {
    settings: {
      targetLang: first.targetLang || 'en',
      sourceLang: first.sourceLang || 'zh',
      inferSeparation: true,
      intermediateResultFolder: 'intermediateResults',
      minimumHSpan: 10,
      minimumVSpan: 10
    },
    images: images,
    UISettings: {
      autosave: true,
      chinesePunc: false,
      dividerPosition: [0.034572733202870194, 0.6872146118721462],
      translateAfterOCR: false,
      vertical: false,
      percent: 30,
      autoClean: true,
      removeSpaces: false,
      precisionMode: true,
      OCRAfterSelection: false,
      autoCapital: false,
      pannable: true,
      textMergingOperationForPanelDetection: 0,
      opacity: 100
    },
    terms: {},
    dirPath: './',
    previousOCR: { engineName: 'rapid', lang: '0' }
  };
}

async function downloadZip() {
  // allEntries is the background-filtered set (may span multiple pages).
  const records = [];
  for (const entry of allEntries) {
    if (entry.record) records.push(entry.record);
  }
  if (records.length === 0) {
    alert(getMessage('cache_read_empty'));
    return;
  }

  const zip = new JSZip();
  const out = zip.folder('out');

  records.forEach(function(rec, idx) {
    const name = (idx + 1) + '.webp';
    if (rec.originalImage) {
      zip.file(name, dataURLToBlob(rec.originalImage));
    }
    if (rec.translatedImage) {
      out.file(name, dataURLToBlob(rec.translatedImage));
    }
  });

  zip.file('untitled.itp', JSON.stringify(buildItp(records), null, 4));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'imagetrans-cache.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
}

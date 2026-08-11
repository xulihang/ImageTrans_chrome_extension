// --- Custom i18n: allow user to override UI language (same as popup.js) ---
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
    } catch (e) { /* fall back to browser default */ }
  }
}

// --- State ---
let currentCollection = null;
let currentImages = null;
let objectUrls = [];
let autoRefreshTimer = null;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function clearObjectUrls() {
  for (const u of objectUrls) {
    try { URL.revokeObjectURL(u); } catch (e) {}
  }
  objectUrls = [];
}

function statusBadge(status) {
  const labels = {
    done: getMessage('collections_status_done'),
    translating: getMessage('collections_status_translating'),
    stopped: getMessage('collections_status_stopped'),
    failed: getMessage('collections_status_failed')
  };
  const label = labels[status] || status || '';
  return '<span class="badge ' + (status || '') + '">' + escapeHtml(label) + '</span>';
}

// --- List view ---
async function showList() {
  currentCollection = null;
  currentImages = null;
  clearObjectUrls();
  document.getElementById('title').textContent = getMessage('collections_title');
  document.getElementById('back-btn').classList.add('hidden');

  const content = document.getElementById('content');
  let collections = [];
  try {
    collections = await itListCollections();
  } catch (e) {
    content.innerHTML = '<div class="empty">' + escapeHtml(String(e && e.message || e)) + '</div>';
    return;
  }

  content.innerHTML = '';
  if (!collections.length) {
    content.innerHTML = '<div class="empty">' + escapeHtml(getMessage('collections_empty')) + '</div>';
  } else {
    const grid = document.createElement('div');
    grid.className = 'collection-list';
    for (const c of collections) {
      const card = document.createElement('div');
      card.className = 'collection-card';
      const created = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
      card.innerHTML =
        '<h3>' + escapeHtml(c.name) + '</h3>' +
        '<div class="meta">' + escapeHtml(c.title || '') + '</div>' +
        '<div class="meta">' + escapeHtml(getMessage('collections_created', [created])) + '</div>' +
        '<div class="meta">' + statusBadge(c.status) + ' ' + escapeHtml(getMessage('collections_count', [c.imageCount || 0])) + '</div>' +
        '<div class="collection-actions">' +
        '<button class="delete">' + escapeHtml(getMessage('collections_delete')) + '</button>' +
        '</div>';
      card.addEventListener('click', function(e) {
        if (e.target.closest('.delete')) return;
        showDetail(c.name);
      });
      card.querySelector('.delete').addEventListener('click', async function(e) {
        e.stopPropagation();
        if (!confirm(getMessage('collections_delete_confirm', [c.name]))) return;
        try {
          await itDeleteCollection(c.name);
        } catch (err) { console.error(err); }
        showList();
      });
      grid.appendChild(card);
    }
    content.appendChild(grid);
  }

  startAutoRefresh(collections);
}

function startAutoRefresh(collections) {
  clearTimeout(autoRefreshTimer);
  const hasTranslating = collections.some(function(c) { return c.status === 'translating'; });
  if (hasTranslating && !currentCollection) {
    autoRefreshTimer = setTimeout(function() { showList(); }, 5000);
  }
}

// --- Detail view ---
async function showDetail(name) {
  currentCollection = name;
  currentImages = null;
  clearObjectUrls();
  document.getElementById('back-btn').classList.remove('hidden');

  const content = document.getElementById('content');
  content.innerHTML = '<div class="empty">' + escapeHtml(getMessage('collections_images_loading')) + '</div>';

  let collection = null;
  let images = [];
  try {
    collection = await itGetCollection(name);
    images = await itGetCollectionImages(name);
  } catch (e) {
    content.innerHTML = '<div class="empty">' + escapeHtml(String(e && e.message || e)) + '</div>';
    return;
  }

  document.getElementById('title').textContent = (collection && collection.title) || name;
  currentImages = images;
  content.innerHTML = '';

  if (!images.length) {
    content.innerHTML = '<div class="empty">' + escapeHtml(getMessage('collections_no_images')) + '</div>';
    return;
  }

  const doc = document.createDocumentFragment();
  images.forEach(function(img, i) {
    const card = document.createElement('div');
    card.className = 'page-card';
    card.dataset.idx = String(i);
    card.innerHTML =
      '<div class="page-head">' +
        '<span class="page-num">' + (i + 1) + '</span>' +
        '<span class="page-src" title="' + escapeHtml(img.src || '') + '">' + escapeHtml(img.src || '') + '</span>' +
        '<span class="page-actions"><button class="download">' + escapeHtml(getMessage('collections_download')) + '</button></span>' +
      '</div>' +
      '<div class="imgs">' +
        '<figure class="orig"><figcaption>' + escapeHtml(getMessage('collections_original')) + '</figcaption><img></figure>' +
        '<figure class="trans"><figcaption>' + escapeHtml(getMessage('collections_translated')) + '</figcaption><img></figure>' +
      '</div>' +
      '<div class="boxes"></div>';
    card.querySelector('.download').addEventListener('click', function(e) {
      e.stopPropagation();
      downloadImage(i);
    });
    const boxesDiv = card.querySelector('.boxes');
    const boxes = img.imgMap && img.imgMap.boxes ? img.imgMap.boxes : null;
    if (boxes && boxes.length) {
      for (const box of boxes) {
        const source = box.source || box.text || '';
        const target = box.target || '';
        const row = document.createElement('div');
        row.className = 'box';
        row.innerHTML = '<span class="src">' + escapeHtml(source) + '</span>' +
                        '<span class="arrow">→</span>' +
                        '<span class="target">' + escapeHtml(target) + '</span>';
        boxesDiv.appendChild(row);
      }
    } else {
      boxesDiv.style.display = 'none';
    }
    doc.appendChild(card);
  });
  content.appendChild(doc);

  // Lazy-load image pixels when a page card approaches the viewport.
  const io = new IntersectionObserver(function(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        loadPageImages(entry.target);
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '400px' });
  const cards = content.querySelectorAll('.page-card');
  for (let k = 0; k < cards.length; k++) io.observe(cards[k]);
}

function loadPageImages(card) {
  const i = parseInt(card.dataset.idx, 10);
  const rec = currentImages[i];
  if (!rec) return;
  const origImg = card.querySelector('.orig img');
  const transImg = card.querySelector('.trans img');
  setImageSource(origImg, rec.original);
  setImageSource(transImg, rec.translated);
}

function setImageSource(imgEl, blobOrDataUrl) {
  if (!imgEl || !blobOrDataUrl) return;
  if (typeof blobOrDataUrl === 'string') {
    imgEl.src = blobOrDataUrl; // data URL stored as fallback
  } else {
    const url = URL.createObjectURL(blobOrDataUrl);
    objectUrls.push(url);
    imgEl.src = url;
  }
}

function downloadImage(i) {
  const rec = currentImages[i];
  if (!rec || !rec.translated) return;
  let url = rec.translated;
  if (typeof rec.translated !== 'string') {
    url = URL.createObjectURL(rec.translated);
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = (currentCollection || 'collection') + '_' + (i + 1) + '.webp';
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof rec.translated !== 'string') {
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }
}

// --- Init ---
(async function main() {
  await initI18n();
  document.title = getMessage('collections_title');
  document.getElementById('title').textContent = getMessage('collections_title');
  document.getElementById('back-btn').textContent = getMessage('collections_back');
  document.getElementById('refresh-btn').textContent = getMessage('collections_refresh');
  document.getElementById('back-btn').addEventListener('click', showList);
  document.getElementById('refresh-btn').addEventListener('click', function() {
    if (currentCollection) { showDetail(currentCollection); } else { showList(); }
  });
  await showList();
})();

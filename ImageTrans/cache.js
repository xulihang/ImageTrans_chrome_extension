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

function render(entries) {
  const countEl = document.getElementById('count');
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');

  if (!entries || entries.length === 0) {
    countEl.textContent = getMessage('cache_count', [0]);
    emptyEl.style.display = 'block';
    listEl.innerHTML = '';
    return;
  }

  emptyEl.style.display = 'none';
  countEl.textContent = getMessage('cache_count', [entries.length]);
  listEl.innerHTML = '';

  for (const entry of entries) {
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
    const lang = (rec.sourceLang ? rec.sourceLang : '-') + ' → ' + (rec.targetLang ? rec.targetLang : '-');
    title.textContent = lang;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const boxCount = (rec.imgMap && rec.imgMap.boxes) ? rec.imgMap.boxes.length : 0;
    meta.innerHTML =
      getMessage('cache_time') + ': ' + formatTime(rec.timestamp) + '<br>' +
      getMessage('cache_boxes') + ': ' + boxCount + '<br>' +
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
      reload();
    });

    info.appendChild(title);
    info.appendChild(meta);
    card.appendChild(origImg);
    card.appendChild(info);
    card.appendChild(translatedImg);
    card.appendChild(delBtn);
    listEl.appendChild(card);
  }
}

async function reload() {
  const resp = await sendMessageTimeout({ action: 'listTranslationCache' });
  render(resp && resp.ok ? resp.entries : []);
}

window.onload = async function() {
  await initI18n();
  applyI18n();
  reload();

  document.getElementById('refreshButton').addEventListener('click', reload);

  document.getElementById('clearButton').addEventListener('click', async () => {
    const sure = confirm(getMessage('cache_confirm_clear'));
    if (!sure) return;
    await sendMessageTimeout({ action: 'clearTranslationCache' });
    reload();
  });
};

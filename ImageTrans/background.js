
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
  } else if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(null, {format: "png"}, (dataURL) => {
      if (chrome.runtime.lastError) {
        sendResponse({error: chrome.runtime.lastError.message});
      } else {
        sendResponse({dataURL: dataURL});
      }
    });
    return true; // keep sendResponse valid for async callback
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

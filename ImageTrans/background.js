

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

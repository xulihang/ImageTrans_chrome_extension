

// 使用declarativeNetRequest API处理跨域请求，相关规则在cors_rules.json中定义

// 初始化时加载用户的CORS设置
chrome.storage.sync.get({ useCORS: true }, function(items) {
  updateCORSStatus(items.useCORS);
});

// 更新CORS规则状态的函数
function updateCORSStatus(enabled) {
  console.log(`更新CORS状态: ${enabled ? '启用' : '禁用'}`);
  if (enabled) {
    // 启用规则
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['cors_rules']
    });
  } else {
    // 禁用规则
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['cors_rules']
    });
  }
}

// 监听来自options页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateCORSStatus") {
    updateCORSStatus(request.enabled);
  } else if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

// 扩展安装时输出日志
chrome.runtime.onInstalled.addListener(() => {
  console.log('ImageTrans扩展已安装或更新');
  let parent = chrome.contextMenus.create({
    "id": "imagetrans-menu",
    "title": "ImageTrans",
    "contexts": ["image"]
  });
  chrome.contextMenus.create({
    "title": "translate this image",
    "parentId": parent,
    "id": "translate",
    "contexts": ["image"]
  });
  chrome.contextMenus.create({
    "title": "alter source/target",
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

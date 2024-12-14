chrome.runtime.onInstalled.addListener(() => {
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

chrome.runtime.onMessage.addListener((request) => {
  if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

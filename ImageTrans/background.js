chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    "id": "translate-image-menu",
    "title": "Translate this image",
    "contexts": ["image"]
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  chrome.tabs.sendMessage(tab.id, {message:"translateWithMenu",info:info}, function(response) {
		
  });
});
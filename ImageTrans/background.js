var x=0;
var y=0;

chrome.contextMenus.create({
	title: "翻译该图片",
	onclick: connect
}, function () {
    console.log('contextMenus are create.');
});

function connect() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, {message: "translate"}, function(response) {
		console.log(response.farewell);
	  });
	});
}

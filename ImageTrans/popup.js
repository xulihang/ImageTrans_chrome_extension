function applyI18n() {
	document.getElementById('translate').textContent = chrome.i18n.getMessage("popup_translate");
	document.getElementById('alterlanguage').textContent = chrome.i18n.getMessage("popup_alter_language");
	document.getElementById('translate-check').textContent = chrome.i18n.getMessage("popup_translate_check");
	document.getElementById('alterlanguage-check').textContent = chrome.i18n.getMessage("popup_alter_language_check");
	document.getElementById('getimgsrc').textContent = chrome.i18n.getMessage("popup_get_img_src");
	document.getElementById('getimgsrc-check').textContent = chrome.i18n.getMessage("popup_get_img_src_check");
	document.getElementById('screen-capture').textContent = chrome.i18n.getMessage("popup_screen_capture");
	document.getElementById('auto-translate').textContent = chrome.i18n.getMessage("popup_auto_translate_start");
	document.getElementsByClassName('help')[0].textContent = chrome.i18n.getMessage("popup_help");
	document.getElementsByClassName('options')[0].textContent = chrome.i18n.getMessage("popup_options");
	document.getElementsByClassName('local')[0].textContent = chrome.i18n.getMessage("popup_translate_local");
}
applyI18n();

let btn = document.getElementById('getimgsrc');
let btnCheck = document.getElementById('getimgsrc-check');
let btnTrans = document.getElementById('translate');
let btnTransCheck = document.getElementById('translate-check');
let btnAlter = document.getElementById('alterlanguage');
let btnAlterCheck = document.getElementById('alterlanguage-check');
let btnAutoTranslate = document.getElementById('auto-translate');
let btnScreenCapture = document.getElementById('screen-capture');
let help = document.getElementsByClassName('help')[0];
document.getElementsByClassName('options')[0].addEventListener("click",function(){
	chrome.runtime.openOptionsPage();
});
document.getElementsByClassName('local')[0].addEventListener("click",function(){
	chrome.storage.sync.get({
		serverURL: "https://local.basiccat.org:51043"
	}, async function(items) {
		var URL = "https://local.basiccat.org:51043";
		if (items.serverURL) {
			URL = items.serverURL;
		}
		if (URL === "https://service.basiccat.org:51043"){
			URL = "https://www.basiccat.org/online-image-translator";
		}else{
			try {
				await fetch(URL);
			}catch (e) {
				URL = "https://www.basiccat.org/online-image-translator";
			}
		}
		window.open(URL,"_blank");
	});
});

btn.onclick = function() {
	connect(false,"getsrconly");
};

btnCheck.onclick = function() {
	connect(true,"getsrconly");
};

btnTrans.onclick = function() {
	connect(false,"translate");
};

btnTransCheck.onclick = function() {
	connect(true,"translate");
};

btnAlter.onclick = function() {
	connect(false,"alterlanguage");
};

btnAlterCheck.onclick = function() {
	connect(true,"alterlanguage");
};

btnAutoTranslate.onclick = function() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {message: "toggleAutoTranslate"}, function(response) {
			if (response && response.active) {
				btnAutoTranslate.textContent = chrome.i18n.getMessage("popup_auto_translate_stop");
			} else {
				btnAutoTranslate.textContent = chrome.i18n.getMessage("popup_auto_translate_start");
			}
		});
		window.close();
	});
};

btnScreenCapture.onclick = function() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {message: "startScreenCapture"});
		window.close();
	});
};

help.onclick = function() {
	window.open("https://github.com/xulihang/ImageTrans_chrome_extension","_blank");
};

// Query current auto-translate state on popup open
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {message: "getAutoTranslateState"}, function(response) {
		if (response && response.active) {
			btnAutoTranslate.textContent = chrome.i18n.getMessage("popup_auto_translate_stop");
		}
	});
});


function connect(check,message) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, {message: message,check: check}, function(response) {
		console.log(response.farewell);
	  });
	});
	window.close();
}

let btn = document.getElementById('getimgsrc');
let btnCheck = document.getElementById('getimgsrc-check');
let btnTrans = document.getElementById('translate');
let btnTransCheck = document.getElementById('translate-check');
let btnAlter = document.getElementById('alterlanguage');
let btnAlterCheck = document.getElementById('alterlanguage-check');


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



function connect(check,message) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, {message: message,check: check}, function(response) {
		console.log(response.farewell);
	  });
	});
	window.close();
}

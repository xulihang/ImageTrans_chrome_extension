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
  document.getElementById('translate').textContent = getMessage("popup_translate");
  document.getElementById('alterlanguage').textContent = getMessage("popup_alter_language");
  document.getElementById('translate-check').textContent = getMessage("popup_translate_check");
  document.getElementById('alterlanguage-check').textContent = getMessage("popup_alter_language_check");
  document.getElementById('getimgsrc').textContent = getMessage("popup_get_img_src");
  document.getElementById('getimgsrc-check').textContent = getMessage("popup_get_img_src_check");
  document.getElementById('screen-capture').textContent = getMessage("popup_screen_capture");
  document.getElementById('auto-translate').textContent = getMessage("popup_auto_translate_start");
  document.getElementsByClassName('help')[0].textContent = getMessage("popup_help");
  document.getElementsByClassName('options')[0].textContent = getMessage("popup_options");
  document.getElementsByClassName('local')[0].textContent = getMessage("popup_translate_local");
}

(async function main() {
  await initI18n();
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
          btnAutoTranslate.textContent = getMessage("popup_auto_translate_stop");
        } else {
          btnAutoTranslate.textContent = getMessage("popup_auto_translate_start");
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
        btnAutoTranslate.textContent = getMessage("popup_auto_translate_stop");
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
})();

const DEFAULT_OPENAI_PROMPT = `Translate the following texts from {sourceLang} to {targetLang}. Return ONLY a JSON array of translated strings in the same order (no markdown, no code fences).
Texts: {texts}`;

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

let languageCodes;

function buildLanguageCodes() {
  languageCodes = [
    {name: getMessage("lang_arabic"), code:"ar"},
    {name: getMessage("lang_english"), code:"en"},
    {name: getMessage("lang_chinese"), code:"zh"},
    {name: getMessage("lang_japanese"), code:"ja"},
    {name: getMessage("lang_korean"), code:"ko"},
    {name: getMessage("lang_french"), code:"fr"},
    {name: getMessage("lang_italian"), code:"it"},
    {name: getMessage("lang_spanish"), code:"es"},
    {name: getMessage("lang_russian"), code:"ru"},
    {name: getMessage("lang_portuguese"), code:"pt"},
    {name: getMessage("lang_indonesian"), code:"id"},
    {name: getMessage("lang_vietnamese"), code:"vi"},
    {name: getMessage("lang_thai"), code:"th"},
    {name: getMessage("lang_auto"), code:"auto"}
  ];
}

function save() {
  const URL = document.getElementById("serverURL").value;
  const pickingWay = document.getElementById("pickingWay").selectedOptions[0].value;
  const useCanvas = document.getElementById("useCanvas").checked;
  const useCORS = document.getElementById("useCORS").checked;
  const renderTextInFrontend = document.getElementById("renderTextInFrontend").checked;
  const renderTextCSS = document.getElementById("renderTextCSS").value;
  const imagetransInstanceDisplayName = document.getElementById("imagetransInstanceInput").value;
  const password = document.getElementById("imagetransPasswordInput").value;
  const sourceLang = document.getElementById("sourceLangSelect").selectedOptions[0].value;
  const targetLang = document.getElementById("targetLangSelect").selectedOptions[0].value;
  const useOpenAI = document.getElementById("useOpenAI").checked;
  const openaiURL = document.getElementById("openaiURL").value;
  const openaiKey = document.getElementById("openaiKey").value;
  const openaiModel = document.getElementById("openaiModel").value;
  const openaiPrompt = document.getElementById("openaiPrompt").value;
  const ocrMethod = document.getElementById("ocrMethod").value;
  const translationMode = document.getElementById("translationMode").value;
  const xSpacing = parseInt(document.getElementById("xSpacing").value) || 15;
  const ySpacing = parseInt(document.getElementById("ySpacing").value) || 15;
  const uiLanguage = document.getElementById("uiLanguage").value;
  chrome.storage.sync.set({
    serverURL: URL,
    pickingWay: pickingWay,
    useCanvas: useCanvas,
    useCORS: useCORS,
    renderTextInFrontend: renderTextInFrontend,
    renderTextCSS: renderTextCSS,
    displayName: imagetransInstanceDisplayName,
    password: password,
    sourceLang: sourceLang,
    targetLang: targetLang,
    useOpenAI: useOpenAI,
    openaiURL: openaiURL,
    openaiKey: openaiKey,
    openaiModel: openaiModel,
    openaiPrompt: openaiPrompt,
    ocrMethod: ocrMethod,
    translationMode: translationMode,
    xSpacing: xSpacing,
    ySpacing: ySpacing,
    uiLanguage: uiLanguage
  }, function() {
    alert(getMessage("alert_saved"));
    chrome.runtime.sendMessage({action: "updateCORSStatus", enabled: useCORS});
  });
}

function load() {
  chrome.storage.sync.get({
    serverURL: 'https://local.basiccat.org:51043',
    pickingWay: '1',
    useCanvas: true,
    useCORS: true,
    renderTextInFrontend: false,
    renderTextCSS: 'text-align: center;\nborder-radius: 10%;',
    displayName: "",
    password:"",
    sourceLang:"auto",
    targetLang:"auto",
    useOpenAI: false,
    openaiURL: 'https://api.openai.com/v1',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    openaiPrompt: DEFAULT_OPENAI_PROMPT,
    ocrMethod: 'paddleocr',
    translationMode: 'imagetrans',
    xSpacing: 15,
    ySpacing: 15,
    uiLanguage: ''
  }, function(items) {
    if (items.serverURL) {
        document.getElementById("serverURL").value = items.serverURL;
    }else{
        document.getElementById("serverURL").value = 'https://local.basiccat.org:51043';
    }
    if (items.pickingWay) {
      if (items.pickingWay === "0") {
        document.getElementById("pickingWay").selectedIndex = 0;
      }else{
        document.getElementById("pickingWay").selectedIndex = 1;
      }
    }else{
      document.getElementById("pickingWay").selectedIndex = 1;
    }
    console.log(items);
    if (items.sourceLang) {
      let sourceSelect = document.getElementById("sourceLangSelect");
      setSelectedLang(sourceSelect, items.sourceLang);
    }
    if (items.targetLang) {
      let targetSelect = document.getElementById("targetLangSelect");
      setSelectedLang(targetSelect, items.targetLang);
    }
    document.getElementById("useCanvas").checked = items.useCanvas;
    document.getElementById("useCORS").checked = items.useCORS;
    document.getElementById("renderTextInFrontend").checked = items.renderTextInFrontend;
    document.getElementById("renderTextCSS").value = items.renderTextCSS || '';
    document.getElementById("imagetransInstanceInput").value = items.displayName;
    document.getElementById("imagetransPasswordInput").value = items.password;
    document.getElementById("useOpenAI").checked = items.useOpenAI;
    document.getElementById("openaiURL").value = items.openaiURL;
    document.getElementById("openaiKey").value = items.openaiKey;
    document.getElementById("openaiModel").value = items.openaiModel;
    document.getElementById("openaiPrompt").value = items.openaiPrompt;
    if (items.ocrMethod) {
      document.getElementById("ocrMethod").value = items.ocrMethod;
    }
    if (items.translationMode) {
      document.getElementById("translationMode").value = items.translationMode;
    }
    document.getElementById("xSpacing").value = items.xSpacing;
    document.getElementById("ySpacing").value = items.ySpacing;
    if (items.uiLanguage) {
      document.getElementById("uiLanguage").value = items.uiLanguage;
    }
    document.getElementById("ocrMethodSection").style.display = items.useOpenAI ? 'block' : 'none';
  });
}

function loadLanguageCodes(){
  let sourceSelect = document.getElementById("sourceLangSelect");
  let targetSelect = document.getElementById("targetLangSelect");
  languageCodes.forEach(lang => {
    let option1 = new Option(lang.name,lang.code);
    sourceSelect.appendChild(option1);
    let option2 = new Option(lang.name,lang.code);
    targetSelect.appendChild(option2);
  });
  setSelectedLang(sourceSelect,"auto");
  setSelectedLang(targetSelect,"auto");
}

function setSelectedLang(targetSelect,targetLang) {
  for (let index = 0; index < targetSelect.options.length; index++) {
    const option = targetSelect.options[index];
    console.log(option);
    if (option.value === targetLang) {
      targetSelect.selectedIndex = index;
      return;
    }
  }
}

function applyI18n() {
  document.title = getMessage("options_title");
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

window.onload = async function (){
  await initI18n();
  buildLanguageCodes();
  applyI18n();
  loadLanguageCodes();
  load();
  document.getElementById("saveButton").addEventListener("click",function(){
    save();
  })
  document.getElementById("publicServerButton").addEventListener("click",function(){
    document.getElementById("serverURL").value = "https://service.basiccat.org:51043";
  })
  document.getElementById("localServerButton").addEventListener("click",function(){
    document.getElementById("serverURL").value = "https://local.basiccat.org:51043";
  })
  document.getElementById("checkInstanceButton").addEventListener("click",function(){
    let serverURL = document.getElementById("serverURL").value;
    if (serverURL) {
      window.open(serverURL + "/list");
    }else{
      alert(getMessage("alert_server_url_not_set"));
      window.open("https://local.basiccat.org:51043/list");
    }
  })
  document.getElementById("useOpenAI").addEventListener("change",function(){
    if (this.checked) {
      document.getElementById("renderTextInFrontend").checked = true;
      document.getElementById("ocrMethodSection").style.display = 'block';
    } else {
      document.getElementById("ocrMethodSection").style.display = 'none';
    }
  })
  document.getElementById("cssPresetDefault").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\nborder-radius: 10%;';
  })
  document.getElementById("cssPresetCenter").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;';
  })
  document.getElementById("cssPresetCenterBold").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\nfont-weight: bold;';
  })
  document.getElementById("cssPresetRounded").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\nborder-radius: 8px;';
  })
  document.getElementById("cssPresetUppercase").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\ntext-transform: uppercase;';
  })
  document.getElementById("cssPresetRoundedUppercase").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\nborder-radius: 8px;\ntext-transform: uppercase;';
  })
}

const DEFAULT_OPENAI_PROMPT = `Translate the following texts from {sourceLang} to {targetLang}. Return ONLY a JSON array of translated strings in the same order (no markdown, no code fences).
Texts: {texts}`;

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
    translationMode: translationMode
  }, function() {
    alert("saved");
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
    renderTextCSS: '',
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
    translationMode: 'imagetrans'
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
    // Show/hide OCR method section based on useOpenAI
    document.getElementById("ocrMethodSection").style.display = items.useOpenAI ? 'block' : 'none';
  });
}

let languageCodes = [
  {name:"Arabic",code:"ar"},
  {name:"English",code:"en"},
  {name:"Chinese",code:"zh"},
  {name:"Japanese",code:"ja"},
  {name:"Korean",code:"ko"},
  {name:"French",code:"fr"},
  {name:"Italian",code:"it"},
  {name:"Spanish",code:"es"},
  {name:"Russian",code:"ru"},
  {name:"Portuguese",code:"pt"},
  {name:"Indonesian",code:"id"},
  {name:"Vietnamese",code:"vi"},
  {name:"Thai",code:"th"},
  {name:"Auto",code:"auto"}
]

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

window.onload = function (){
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
      alert("Server URL is not set. Will use go to the local address.");
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
    document.getElementById("renderTextCSS").value = '';
  })
  document.getElementById("cssPresetCenter").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;';
  })
  document.getElementById("cssPresetCenterBold").addEventListener("click",function(){
    document.getElementById("renderTextCSS").value = 'text-align: center;\nfont-weight: bold;';
  })
}

function save() {
  const URL = document.getElementById("serverURL").value;
  const pickingWay = document.getElementById("pickingWay").selectedOptions[0].value;
  const useCanvas = document.getElementById("useCanvas").checked;
  const imagetransInstanceDisplayName = document.getElementById("imagetransInstanceInput").value;
  const password = document.getElementById("imagetransPasswordInput").value;
  const sourceLang = document.getElementById("sourceLangSelect").selectedOptions[0].value;
  const targetLang = document.getElementById("targetLangSelect").selectedOptions[0].value;
  chrome.storage.sync.set({
    serverURL: URL,
    pickingWay: pickingWay,
    useCanvas: useCanvas,
    displayName: imagetransInstanceDisplayName,
    password: password,
    sourceLang: sourceLang,
    targetLang: targetLang
  }, function() {
    // Update status to let user know options were saved.
    alert("saved");
  });
}

function load() {
  chrome.storage.sync.get({
    serverURL: 'http://127.0.0.1:51042',
    pickingWay: '1',
    useCanvas: true,
    displayName: "",
    password:"",
    sourceLang:"auto",
    targetLang:"auto",
  }, function(items) {
    if (items.serverURL) {
        document.getElementById("serverURL").value = items.serverURL;
    }else{
        document.getElementById("serverURL").value = 'http://127.0.0.1:51042';
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
    document.getElementById("imagetransInstanceInput").value = items.displayName;
    document.getElementById("imagetransPasswordInput").value = items.password;
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
    document.getElementById("serverURL").value = "http://127.0.0.1:51042";
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
}

function save() {
  const URL = document.getElementById("serverURL").value;
  const pickingWay = document.getElementById("pickingWay").selectedOptions[0].value;
  const useCanvas = document.getElementById("useCanvas").checked;
  chrome.storage.sync.set({
    serverURL: URL,
    pickingWay: pickingWay,
    useCanvas: useCanvas
  }, function() {
    // Update status to let user know options were saved.
    alert("saved");
  });
}

function load() {
  chrome.storage.sync.get({
    serverURL: 'https://local.basiccat.org:51043',
    pickingWay: '1',
    useCanvas: true
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
    document.getElementById("useCanvas").checked = items.useCanvas;
  });
}

window.onload = function (){
  load();
  document.getElementById("saveButton").addEventListener("click",function(){
    save();
  })
}
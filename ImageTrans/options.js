function save() {
  const URL = document.getElementById("serverURL").value;
  const pickingWay = document.getElementById("pickingWay").selectedOptions[0].value;
  const useCanvas = document.getElementById("useCanvas").checked;
  const imagetransInstanceDisplayName = document.getElementById("imagetransInstanceInput").value;
  const password = document.getElementById("imagetransPasswordInput").value;
  chrome.storage.sync.set({
    serverURL: URL,
    pickingWay: pickingWay,
    useCanvas: useCanvas,
    displayName: imagetransInstanceDisplayName,
    password: password
  }, function() {
    // Update status to let user know options were saved.
    alert("saved");
  });
}

function load() {
  chrome.storage.sync.get({
    serverURL: 'https://local.basiccat.org:51043',
    pickingWay: '1',
    useCanvas: true,
    displayName: "",
    password:"",
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
    document.getElementById("imagetransInstanceInput").value = items.displayName;
    document.getElementById("imagetransPasswordInput").value = items.password;
  });
}

window.onload = function (){
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
}

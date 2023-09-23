function save() {
  const URL = document.getElementById("serverURL").value;
  chrome.storage.sync.set({
    serverURL: URL
  }, function() {
    // Update status to let user know options were saved.
    alert("saved");
  });
}

function load() {
  chrome.storage.sync.get({
    serverURL: 'https://local.basiccat.org:51043'
  }, function(items) {
    if (items.serverURL) {
      document.getElementById("serverURL").value = items.serverURL;
    }
  });
}

window.onload = function (){
  load();
  document.getElementById("saveButton").addEventListener("click",function(){
    save();
  })
}
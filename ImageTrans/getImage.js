var x=0;
var y=0;
var bodyClassName;
var canvas;
var dataURLMap = {};
var URL = "https://local.basiccat.org:51043";
var pickingWay = "1";

chrome.storage.sync.get({
    serverURL: URL,
    pickingWay: pickingWay  
}, async function(items) {
    if (items.serverURL) {
        URL = items.serverURL;
    }
    if (items.serverURL) {
        pickingWay = items.pickingWay;
    }
});

document.addEventListener("mousemove",function(e){
    mousemove(e);
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    var message =request.message;
    console.log(message);
    if (message == "hello"){
        sendResponse({farewell: "goodbye"});
    } else if (message=="translate"){
        if (!bodyClassName){
            bodyClassName=document.body.className;    
        }
        document.body.className=bodyClassName+" wait";
        var e;
        if (pickingWay === "0"){
            e=getImage(x,y,request.check);
        }else{
            e=getImage(window.innerWidth/2,window.innerHeight/2,request.check);
        }
        var src=getImageSrc(e);
        console.log(src);
        ajax(src,e,true);
    }else if (message == "translateWithMenu") {
        ajax(request.info.srcUrl,undefined,false);
    }else if (message == "alterWithMenu") {
        console.log("alter")
        console.log(request.info)
        var e = getImageBySrc(request.info.srcUrl)
        console.log(e)
        alterLanguage(e);
    }else if (message == "getsrconly"){
        console.log("x: "+x+" y: "+y);
        console.log("check in display: "+request.check)
        var e=getImage(x,y,request.check);
        var src=getImageSrc(e);
        console.log(src);
        alert(src + " copied to clipboard.");
        navigator.clipboard.writeText(src)
          .then(() => {
            console.log('Text copied to clipboard');
          })
          .catch(err => {
            // This can happen if the user denies clipboard permissions:
            console.error('Could not copy text: ', err);
        });
    }else if (message=="alterlanguage"){
        var e=getImage(x,y,request.check);
        alterLanguage(e);
    }
      
  }
);

console.log("loaded");

function ajax(src,img,checkData){
    let data = {src:src};
    if (src.startsWith("blob:") && img) {
        try {
            let dataURL;
            if (src in dataURLMap) {
                dataURL = dataURLMap[src];
            }else{
                dataURL = getDataURLFromImg(img);
                dataURLMap[src] = dataURL;
            }
            data = {src:dataURL,saveToFile:"true"};
        } catch (error) {
            console.log(error);
        }
    }
    console.log(data);
    $.ajax({
        url: URL+'/translate',
        type: "POST",
        data: data,
        //dataType: "jsonp", //not needed for chrome
        cache: false,
        success: function(data) {
            console.log(data);
            document.body.className=bodyClassName;
            if (!data["img"]){
                alert("Bad result. Is ImageTrans running correctly?");
            }else{
                var dataURL="data:image/jpeg;base64,"+data["img"];
                console.log(replaceImgSrc(src,dataURL,checkData));
            }
            
        },
        error: function() {
            document.body.className=bodyClassName;
            alert("Failed to connect to ImageTrans server");
        }
    });
}

function getDataURLFromImg(img) {
    if (!canvas) {
        canvas = document.createElement("canvas");
    }
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg");
};


function mousemove(event){
    var e = event || window.event;//为了兼容ie和火狐
    //console.log(e.clientX);
    //console.log(e.clientY);
    x = e.clientX;//鼠标所在的x坐标
    y = e.clientY;//鼠标所在的y坐标
};

function alterLanguage(e){
    if (!e){
        return
    }
    console.log("alter");
    var src=e.src;
    var targetSrc="";
    var originalSrc="";
    if (e.hasAttribute("original-src")==true){
        originalSrc=e.getAttribute("original-src");
    }
    if (e.hasAttribute("target-src")==true){
        targetSrc=e.getAttribute("target-src");
    }
    if (src==targetSrc){
        e.src=originalSrc;
    }else if (src==originalSrc){
        e.src=targetSrc;
    }
}

//src1: original src, src2: dataURL
function replaceImgSrc(src1,src2,checkData){
    let img = getImageBySrc(src1,checkData)
    if (img) {
        img.src=src2;
        img.setAttribute("original-src",src1)
        img.setAttribute("target-src",src2);
        return "success"
    }
    return "fail"
}

function getImageBySrc(src1,checkData) {
    var imgs = document.getElementsByTagName("img");
    for (i = 0; i <= imgs.length-1; i++){
        var imgsrc = imgs[i].src;
        if (checkData) {
            if (imgs[i].hasAttribute("original-src")==true){
                imgsrc=imgs[i].getAttribute("original-src");
                //console.log("original-src: "+imgsrc);
            }
        }
        if (imgsrc === src1){
            return imgs[i];
        }
    }
    return undefined;
}


function getAllImageSrc(){
    var imgs = document.getElementsByTagName("img");
    var srcArray=[];
    for (i = 0; i <= imgs.length-1; i++){
        srcArray.push(imgs[i].src)
    }
    return srcArray;
}

function getImageSrc(e){
    if (e==null){
        return "";
    }else
    {
        if (e.hasAttribute("original-src")==true){
            return e.getAttribute("original-src");
        }else{
            return e.src;
        }
        
    }
}

function getImage(x,y,checkInDisPlay){
    var e = document.elementFromPoint(x,y);
    if (e==null){
        return null;
    }
    if (isImg(e)==true){
        return e;
    }
    else{
        var elements = document.elementsFromPoint(x,y);
        return getImageInside(elements,checkInDisPlay);
    }
}

function getImageInside(elements,checkInDisPlay){
    //console.log(elements);
    for (i = 0; i <= elements.length-1; i++){
        var innerElement =elements[i];

        if     (isImg(innerElement)==true){
            if (checkInDisPlay==true){
                //console.log("check indisplay");
                //console.log(new Date().getTime());
                if (inDisplay(innerElement)==true){
                    //console.log("image is in display");
                    return innerElement;
                }
            }else{
                return innerElement;
            }
        } else {
            if (innerElement.getElementsByTagName("img").length>1){
                var newElement = getImageInside(innerElement.getElementsByTagName("img"),checkInDisPlay);
                if     (newElement !=null && typeof(newElement)!="undefined"){
                    if (checkInDisPlay==true){
                        //console.log("check indisplay in else");
                        //console.log(new Date().getTime());
                        if (inDisplay(newElement)==true){
                            //console.log("image is in display");
                            return newElement;
                        }
                    }else{
                        return newElement;    
                    }
                }
            }
        }
    }
    return null;
}

function isImg(e){
    if (e.tagName.toLowerCase()=="img"){
        return true;
    }
    else
    {
        return false;
    }
}

function inDisplay(img){
    var top = img.offsetTop;
    var bottom = img.offsetTop+img.offsetHeight;
    var upBound = document.documentElement.scrollTop;
    if ( upBound>top && upBound<bottom){
        return true;
    }
    else
    {
        return false;
    }
}


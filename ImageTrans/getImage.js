var x=0;
var y=0;
var bodyClassName;
document.onmousemove = mousemove; 

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
        var src=getImageSrc(x,y,request.check);
        console.log(src);
        ajax(src);
        console.log("done");
    }else if (message=="getsrconly"){
        console.log("x: "+x+" y: "+y);
        console.log("check in display: "+request.check)
        var src=getImageSrc(x,y,request.check);
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
        console.log("x: "+x+" y: "+y);
        var e=getImage(x,y,request.check);
        console.log(e);
        alterLanguage(e);
    }
      
  }
);

console.log("loaded");

function ajax(src){
    $.ajax({
        url: 'https://local.basiccat.org:51043/translate?src=' + encodeURIComponent(src),
        type: "POST",
        //dataType: "jsonp", //not needed for chrome
        cache: false,
        success: function(data) {
            console.log(data);
            document.body.className=bodyClassName;
            if (!data["img"]){
                alert("Bad result. Is ImageTrans running correctly?");
            }else{
                var base64="data:image/jpeg;base64,"+data["img"];
                console.log(replaceImgSrc(src,base64));
            }
            
        },
        error: function() {
            document.body.className=bodyClassName;
            alert("Failed to connect to ImageTrans server");
        }
    });
}

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

//src1: original src, src2: base64
function replaceImgSrc(src1,src2){
    var imgs = document.getElementsByTagName("img");
    for (i = 0; i <= imgs.length-1; i++){
        var imgsrc;
        if (imgs[i].hasAttribute("original-src")==true){
            imgsrc=imgs[i].getAttribute("original-src");
            //console.log("original-src: "+imgsrc);
        }else{
            imgsrc=imgs[i].src;
        }
        //console.log(i);
        //console.log(imgsrc);
        //console.log(src1);
        if (imgsrc==src1){
            imgs[i].src=src2;
            imgs[i].setAttribute("original-src",src1)
            imgs[i].setAttribute("target-src",src2);
            return "success"
        }
    }
    return "fail"
}


function getAllImageSrc(){
    var imgs = document.getElementsByTagName("img");
    var srcArray=[];
    for (i = 0; i <= imgs.length-1; i++){
        srcArray.push(imgs[i].src)
    }
    return srcArray;
}

function getImageSrc(x,y,checkInDisPlay){
    var e=getImage(x,y,checkInDisPlay);
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


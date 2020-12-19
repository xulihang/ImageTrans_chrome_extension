var x=0;
var y=0;
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
	}
      
  }
);

console.log("setuped");

function ajax(src){
	$.ajax({
		url: 'http://127.0.0.1:51042/translate?src=' + encodeURI(src),
		type: "GET",
		//dataType: "jsonp", //not needed for chrome
		cache: false,
		success: function(data) {
			console.log(data);
			var base64="data:image/jpeg;base64,"+data["img"]
			console.log(replaceImgSrc(src,base64,base64))
		}
	});
}

//not functional
function loadTranslated(src) {
	var url = 'http://127.0.0.1:51042/translate?src=' + encodeURI(src);
	var request;
	request = new XMLHttpRequest();
	request.open("GET", url, true);
    request.setRequestHeader('content-type', 'application/json');
	request.onreadystatechange = function() {
		if (request.readyState == 4) {
			var params=JSON.parse(request.responseText);
			console.log(params);
		}
	}
	request.send();
	
}

function mousemove(event){
var e = event || window.event;//为了兼容ie和火狐
//console.log(e.clientX);
//console.log(e.clientY);

x = e.clientX;//鼠标所在的x坐标

y = e.clientY;//鼠标所在的y坐标

};

function replaceImgSrc(src1,replacedSrc,src2){
	var imgs = document.getElementsByTagName("img");
	for (i = 0; i <= imgs.length-1; i++){
		if (imgs[i].src==src1 || imgs[i].src==replacedSrc){
			imgs[i].src=src2;
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
		return e.src;
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

		if 	(isImg(innerElement)==true){
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
				if 	(newElement !=null && typeof(newElement)!="undefined"){
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


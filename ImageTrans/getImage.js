var x=0;
var y=0;
var bodyClassName;
var canvas;
var dataURLMap = {};
var serverURL = "https://local.basiccat.org:51043";
var pickingWay = "1";
var useCanvas = true;
var renderTextInFrontend = false;
var password = "";
var displayName = "";
var sourceLang = "auto";
var targetLang = "auto";
var useOpenAI = false;
var openaiURL = "https://api.openai.com/v1";
var openaiKey = "";
var openaiModel = "gpt-4o";
var openaiPrompt = "";
chrome.storage.sync.get({
    serverURL: serverURL,
    pickingWay: pickingWay,
    password: password,
    displayName: displayName,
    useCanvas: true,
    renderTextInFrontend: false,
    sourceLang: sourceLang,
    targetLang: targetLang,
    useOpenAI: false,
    openaiURL: 'https://api.openai.com/v1',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    openaiPrompt: ''
}, async function(items) {
    if (items.serverURL) {
        serverURL = items.serverURL;
    }
    if (items.pickingWay) {
        pickingWay = items.pickingWay;
    }
    if (items.password) {
        password = items.password;
    }
    if (items.displayName) {
        displayName = items.displayName;
    }
    if (items.sourceLang) {
        sourceLang = items.sourceLang;
    }
    if (items.targetLang) {
        targetLang = items.targetLang;
    }
    if (items.useCanvas != undefined) {
        useCanvas = items.useCanvas;
    }
    if (items.renderTextInFrontend != undefined) {
        renderTextInFrontend = items.renderTextInFrontend;
    }
    if (items.useOpenAI != undefined) {
        useOpenAI = items.useOpenAI;
        if (useOpenAI) {
            renderTextInFrontend = true;
        }
    }
    if (items.openaiURL) {
        openaiURL = items.openaiURL;
    }
    if (items.openaiKey) {
        openaiKey = items.openaiKey;
    }
    if (items.openaiModel) {
        openaiModel = items.openaiModel;
    }
    if (items.openaiPrompt) {
        openaiPrompt = items.openaiPrompt;
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

    var coordinate = {x:x,y:y};
    if (pickingWay === "1"){
        coordinate.x = window.innerWidth/2;
        coordinate.y = window.innerHeight/2;
    }

    if (message == "hello"){
        sendResponse({farewell: "goodbye"});
    } else if (message=="translate"){
        if (!bodyClassName){
            bodyClassName=document.body.className;    
        }
        document.body.className=bodyClassName+" wait";
        var e=getImage(coordinate.x, coordinate.y, request.check);
        var src=getImageSrc(e);
        console.log(src);
        ajax(src,e,true);
    }else if (message == "translateWithMenu") {
        var e = getImageBySrc(request.info.srcUrl)
        ajax(request.info.srcUrl,e,true);
    }else if (message == "alterWithMenu") {
        console.log("alter")
        console.log(request.info)
        var e = getImageBySrc(request.info.srcUrl)
        console.log(e)
        alterLanguage(e);
    }else if (message == "getsrconly"){
        console.log("x: "+x+" y: "+y);
        console.log("check in display: "+request.check)
        var e=getImage(coordinate.x,coordinate.y,request.check);
        var src=getImageSrc(e);
        console.log(src);
        setTimeout(function(){
          navigator.clipboard.writeText(src)
            .then(() => {
              console.log('Text copied to clipboard');
              alert(src + " copied to clipboard.");
            })
            .catch(err => {
              // This can happen if the user denies clipboard permissions:
              console.error('Could not copy text: ', err);
              alert(err);
          });
        },500);
    }else if (message=="alterlanguage"){
        var e=getImage(coordinate.x,coordinate.y,request.check);
        alterLanguage(e);
    }
      
  }
);

console.log("loaded");

async function ajax(src,img,checkData){
    if (useOpenAI) {
        return ajaxOpenAI(src, img, checkData);
    }
    let data = {src:src};
    if ((src.startsWith("blob:") || useCanvas || renderTextInFrontend) && img) {
        try {
            let dataURL;
            if (src in dataURLMap) {
                dataURL = dataURLMap[src];
            }else{
                dataURL = await getDataURLFromImg(img);
                dataURLMap[src] = dataURL;
            }
            data = {src:dataURL,saveToFile:"true"};
        } catch (error) {
            console.log(error);
        }
    }
    if (sourceLang != "auto") {
        data["sourceLang"] = sourceLang;
    }
    if (targetLang != "auto") {
        data["targetLang"] = targetLang;
    }
    if (!displayName) {
        displayName = "default";
    }
    data["displayName"] = displayName;
    data["password"] = password;
    if (renderTextInFrontend) {
        data["withoutImage"] = "true";
    }
    console.log(data);
    try {
        const post = async (url, payload) => {
            if (url.indexOf("https://service.basiccat.org:51043") != -1) {
              if (!sourceLang || !targetLang || sourceLang === "auto" || targetLang === "auto") {
                alert("Please set the language pair in the options first (do not choose auto) and then refresh the page.");
                chrome.runtime.sendMessage("showOptions");
                document.body.className=bodyClassName;
                return;
              }
            }
            // Convert payload to application/x-www-form-urlencoded to match jQuery's default behavior
            const params = new URLSearchParams();
            for (const k in payload) {
                if (!Object.prototype.hasOwnProperty.call(payload, k)) continue;
                const v = payload[k];
                // Skip undefined/null to avoid sending "undefined" strings
                if (v === undefined || v === null) continue;
                params.append(k, v);
            }
            console.log(fetch);
            const resp = await fetch(url + '/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: params.toString(),
                cache: 'no-store'
            });
            if (!resp.ok) {
                throw new Error('Network response was not ok: ' + resp.status);
            }
            return await resp.json();
        };

        try {
            const respData = await post(serverURL, data);
            console.log(respData);
            document.body.className = bodyClassName;
            if (!respData["imgMap"]) {
                alert("Bad result. Is ImageTrans running correctly?");
            } else if (renderTextInFrontend && respData["imgMap"] && respData["imgMap"]["boxes"]) {
                renderTranslatedImage(data.src, respData["imgMap"]["boxes"]).then(translatedDataURL => {
                    console.log(replaceImgSrc(src, translatedDataURL, checkData, img));
                });
            } else {
                var dataURL = "data:image/jpeg;base64," + respData["img"];
                console.log(replaceImgSrc(src, dataURL, checkData, img));
            }
        } catch (err) {
            document.body.className = bodyClassName;
            console.log('Request failed:', err);
            if (serverURL === "https://local.basiccat.org:51043") {
                serverURL = "https://service.basiccat.org:51043";
                alert("Failed to connect to ImageTrans server. Will try to use the public server. You can configure it in the options page.");
                document.body.className = bodyClassName + " wait";
                try {
                    const respData = await post(serverURL, data);
                    console.log(respData);
                    document.body.className = bodyClassName;
                    if (!respData["img"]) {
                        alert("Bad result. Is ImageTrans running correctly?");
                    } else if (renderTextInFrontend && respData["imgMap"] && respData["imgMap"]["boxes"]) {
                        renderTranslatedImage(respData["img"], respData["imgMap"]["boxes"]).then(translatedDataURL => {
                            console.log(replaceImgSrc(src, translatedDataURL, checkData, img));
                        });
                    } else {
                        var dataURL = "data:image/jpeg;base64," + respData["img"];
                        console.log(replaceImgSrc(src, dataURL, checkData, img));
                    }
                } catch (err2) {
                    document.body.className = bodyClassName;
                    alert("Failed to connect to ImageTrans server.");
                }
            } else {
                alert("Failed to connect to ImageTrans server.");
            }
        }
    } catch (e) {
        document.body.className = bodyClassName;
        console.log(e);
    }
}

async function ajaxOpenAI(src, img, checkData) {
    console.log("Using OpenAI for translation");
    if (!openaiURL || !openaiKey) {
        alert("OpenAI API URL or Key is not configured. Please set them in the options page.");
        document.body.className = bodyClassName;
        return;
    }
    if (!bodyClassName) {
        bodyClassName = document.body.className;
    }
    document.body.className = bodyClassName + " wait";

    try {
        // Step 1: Get image dataURL
        let dataURL;
        if (src in dataURLMap) {
            dataURL = dataURLMap[src];
        } else if (img) {
            dataURL = await getDataURLFromImg(img);
            dataURLMap[src] = dataURL;
        } else {
            throw new Error("Cannot get image data for OCR");
        }

        // Step 2: Call ImageTrans server for OCR (text detection + coordinates)
        const ocrData = {
            src: dataURL,
            saveToFile: "true",
            displayName: displayName || "default",
            password: password,
            withoutImage: "true"
        };
        if (sourceLang !== "auto") ocrData["sourceLang"] = sourceLang;
        if (targetLang !== "auto") ocrData["targetLang"] = targetLang;

        const ocrParams = new URLSearchParams();
        for (const k in ocrData) {
            if (ocrData[k] !== undefined && ocrData[k] !== null) {
                ocrParams.append(k, ocrData[k]);
            }
        }

        const ocrResponse = await fetch(serverURL + '/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: ocrParams.toString(),
            cache: 'no-store'
        });

        if (!ocrResponse.ok) {
            throw new Error('ImageTrans OCR failed: HTTP ' + ocrResponse.status);
        }

        const ocrResult = await ocrResponse.json();
        if (!ocrResult["imgMap"] || !ocrResult["imgMap"]["boxes"]) {
            throw new Error('ImageTrans did not return text boxes. Is it running correctly?');
        }

        const boxes = ocrResult["imgMap"]["boxes"];

        // Step 3: Extract source texts from boxes
        const sourceTexts = [];
        for (const box of boxes) {
            const sourceText = box.source || box.text || box.target || '';
            sourceTexts.push(sourceText);
        }

        if (sourceTexts.length === 0 || sourceTexts.every(function(t) { return !t; })) {
            document.body.className = bodyClassName;
            alert("No text detected in the image.");
            return;
        }

        // Step 4: Call OpenAI API for translation
        let prompt = openaiPrompt
            .replace(/\{sourceLang\}/g, sourceLang)
            .replace(/\{targetLang\}/g, targetLang)
            .replace(/\{texts\}/g, JSON.stringify(sourceTexts));

        const apiUrl = openaiURL.replace(/\/+$/, '') + '/chat/completions';

        const openaiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + openaiKey
            },
            body: JSON.stringify({
                model: openaiModel,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        console.log(prompt);
        console.log(openaiResponse);
        if (!openaiResponse.ok) {
            const errText = await openaiResponse.text();
            throw new Error('OpenAI API error HTTP ' + openaiResponse.status + ': ' + errText);
        }

        const openaiResult = await openaiResponse.json();
        console.log(openaiResult);
        const content = openaiResult.choices[0].message.content;

        // Step 5: Parse translated texts
        let translatedTexts;
        try {
            translatedTexts = JSON.parse(content);
        } catch (e) {
            const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) {
                translatedTexts = JSON.parse(match[1]);
            } else {
                throw new Error('Failed to parse translation response as JSON. Response: ' + content.substring(0, 200));
            }
        }

        if (!Array.isArray(translatedTexts)) {
            if (translatedTexts && translatedTexts.translations) {
                translatedTexts = translatedTexts.translations;
            } else if (translatedTexts && translatedTexts.texts) {
                translatedTexts = translatedTexts.texts;
            } else {
                throw new Error('Expected a JSON array of translated texts. Got: ' + content.substring(0, 200));
            }
        }

        // Step 6: Map translations back to boxes
        for (let i = 0; i < boxes.length && i < translatedTexts.length; i++) {
            boxes[i].target = translatedTexts[i];
        }

        document.body.className = bodyClassName;

        // Step 7: Render on canvas
        const translatedDataURL = await renderTranslatedImage(dataURL, boxes);
        console.log(replaceImgSrc(src, translatedDataURL, checkData, img));

    } catch (err) {
        document.body.className = bodyClassName;
        console.error('Translation failed:', err);
        alert("Translation failed: " + err.message);
    }
}

function getDataURLFromImg(img) {
    return new Promise((resolve, reject) => {
        if (!canvas) {
            canvas = document.createElement("canvas");
        }
        img.setAttribute('crossorigin', 'anonymous');
        img.onload = function () {
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            let context = canvas.getContext('2d');
            let maxWidth = 1500;
            if (maxWidth && img.naturalWidth > maxWidth) {
                width = maxWidth;
                height = img.naturalHeight * maxWidth / img.naturalWidth;
            }
            canvas.width = width;
            canvas.height = height;
            let imageFormat = "image/webp";
            if (!isSupportWebp(canvas)) {
                imageFormat = "image/jpeg";
            }
            let quality = 0.8;
            context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(imageFormat,quality));
        }
    })
};

async function renderTranslatedImage(base64Image, boxes) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d');

            ctx.drawImage(img, 0, 0);

            for (const box of boxes) {
                const geo = box.geometry || {};
                const x = geo.X || geo.x || 0;
                const y = geo.Y || geo.y || 0;
                const w = geo.width || geo.Width || 0;
                const h = geo.height || geo.Height || 0;
                const targetText = box.target || '';

                if (w <= 0 || h <= 0 || !targetText) continue;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x, y, w, h);
            }

            for (const box of boxes) {
                const geo = box.geometry || {};
                const x = geo.X || geo.x || 0;
                const y = geo.Y || geo.y || 0;
                const w = geo.width || geo.Width || 0;
                const h = geo.height || geo.Height || 0;
                const targetText = box.target || '';
                
                if (w <= 0 || h <= 0 || !targetText) continue;

                const fontSize = calcFontSize(ctx, targetText, w, h);
                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';

                drawTextBox(ctx, targetText, x, y, w, h, fontSize);
            }

            resolve(c.toDataURL('image/png'));
        };
        img.onerror = function() {
            reject(new Error('Failed to load translated image'));
        };
        if (base64Image.startsWith("data:")) {
            img.src = base64Image;
        } else {        
            img.src = 'data:image/jpeg;base64,' + base64Image;
        }
    });
}

function calcFontSize(ctx, text, maxWidth, maxHeight) {
    const padding = 4;
    const availWidth = maxWidth - padding * 2;
    const availHeight = maxHeight - padding * 2;
    if (availWidth <= 0 || availHeight <= 0) return 6;

    const lineHeightRatio = 1.3;
    let lo = 6;
    let hi = Math.min(availHeight, 200);

    // Binary search for the largest font size that fits
    let bestSize = lo;
    for (let i = 0; i < 15; i++) {
        const mid = (lo + hi) / 2;
        ctx.font = `${mid}px sans-serif`;
        const lines = wrapLines(ctx, text, availWidth);
        const totalHeight = lines.length * mid * lineHeightRatio;
        if (totalHeight <= availHeight) {
            bestSize = mid;
            lo = mid;
        } else {
            hi = mid;
        }
        if (hi - lo < 1) break;
    }
    return Math.floor(bestSize);
}

function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    // Use word-based wrapping for space-separated languages, char-based for CJK
    const hasSpaces = /\s/.test(text);
    const tokens = hasSpaces ? text.split(/(\s+)/) : text.split('');
    let line = '';
    for (const token of tokens) {
        const testLine = line + token;
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
            lines.push(line);
            line = hasSpaces ? token.trimStart() : token;
        } else {
            line = testLine;
        }
    }
    if (line.length > 0) lines.push(line);
    return lines;
}

function drawTextBox(ctx, text, x, y, maxWidth, maxHeight, fontSize) {
    const padding = 2;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.lineWidth = Math.max(2, fontSize * 0.15);
    ctx.strokeStyle = '#FFFFFF';
    const lineHeight = fontSize * 1.3;
    const lines = wrapLines(ctx, text, maxWidth - padding * 2);
    let lineY = y + padding;
    for (const line of lines) {
        if (lineY + lineHeight > y + maxHeight) break;
        ctx.strokeText(line, x + padding, lineY);
        ctx.fillText(line, x + padding, lineY);
        lineY += lineHeight;
    }
}

function isSupportWebp(elem) {
    let _isSupportWebp = true;
  
    if (!!(elem.getContext && elem.getContext('2d'))) {
      // was able or not to get WebP representation
      _isSupportWebp = elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
    }
    else {
      // very old browser like IE 8, canvas not supported
      _isSupportWebp = false;
    }
    return _isSupportWebp;
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

//src1: original src, src2: dataURL
function replaceImgSrc(src1,src2,checkData,img){
    if (!img) {
        img = getImageBySrc(src1,checkData)
    }
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


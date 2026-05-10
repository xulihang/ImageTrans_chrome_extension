var x=0;
var y=0;
var bodyClassName;
var canvas;
var dataURLMap = {};
var serverURL = "https://local.basiccat.org:51043";

// Auto-translate state
var autoTranslating = false;
var autoObserver = null;
var autoMutationObserver = null;
var translatedSrcs = {};
var processingQueue = [];
var isProcessing = false;
var pickingWay = "1";
var useCanvas = true;
var renderTextInFrontend = false;
var renderTextCSS = 'text-align: center;\nborder-radius: 10%;';
var password = "";
var displayName = "";
var sourceLang = "auto";
var targetLang = "auto";
var useOpenAI = false;
var openaiURL = "https://api.openai.com/v1";
var openaiKey = "";
var openaiModel = "gpt-4o";
var openaiPrompt = "";
var ocrMethod = "paddleocr";
var translationMode = "imagetrans";
var xSpacing = 15;
var ySpacing = 15;
chrome.storage.sync.get({
    serverURL: serverURL,
    pickingWay: pickingWay,
    password: password,
    displayName: displayName,
    useCanvas: true,
    renderTextInFrontend: false,
    renderTextCSS: renderTextCSS,
    sourceLang: sourceLang,
    targetLang: targetLang,
    useOpenAI: false,
    openaiURL: 'https://api.openai.com/v1',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    openaiPrompt: '',
    ocrMethod: 'paddleocr',
    translationMode: 'imagetrans',
    xSpacing: 15,
    ySpacing: 15
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
    if (items.renderTextCSS != undefined) {
        renderTextCSS = items.renderTextCSS;
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
    if (items.ocrMethod) {
        ocrMethod = items.ocrMethod;
    }
    if (items.translationMode) {
        translationMode = items.translationMode;
    }
    if (items.xSpacing != undefined) {
        xSpacing = items.xSpacing;
    }
    if (items.ySpacing != undefined) {
        ySpacing = items.ySpacing;
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
    }else if (message == "getAutoTranslateState") {
        sendResponse({active: autoTranslating});
    }else if (message == "toggleAutoTranslate") {
        if (autoTranslating) {
            stopAutoTranslate();
        } else {
            startAutoTranslate();
        }
        sendResponse({active: autoTranslating});
    }

  }
);

console.log("loaded");

async function ajax(src,img,checkData){
    if (useOpenAI) {
        return ajaxOpenAI(src, img, checkData);
    }
    if (translationMode === "local") {
        return ajaxMyMemory(src, img, checkData);
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
                var usePublic = confirm("Failed to connect to local ImageTrans server.\n\nClick OK to use the public server, or Cancel to use local PaddleOCR instead.\n\nNote: PaddleOCR quality is lower than ImageTrans. You can configure which one to use in options.");
                if (usePublic) {
                    serverURL = "https://service.basiccat.org:51043";
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
                    await ajaxMyMemory(src, img, checkData);
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

async function ajaxMyMemory(src, img, checkData) {
    console.log("Using PaddleOCR + MyMemory for translation");
    if (!bodyClassName) {
        bodyClassName = document.body.className;
    }
    document.body.className = bodyClassName + " wait";
    // Yield so the browser renders the wait cursor before OCR blocks the thread
    await yieldToBrowser();

    try {
        let dataURL;
        if (src in dataURLMap) {
            dataURL = dataURLMap[src];
        } else if (img) {
            dataURL = await getDataURLFromImg(img);
            dataURLMap[src] = dataURL;
        } else {
            throw new Error("Cannot get image data for OCR");
        }

        let boxes = await paddleOCR(dataURL, sourceLang);

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

        for (let i = 0; i < boxes.length; i++) {
            if (sourceTexts[i]) {
                boxes[i].target = await translateUsingMyMemory(sourceTexts[i]);
            } else {
                boxes[i].target = '';
            }
        }

        document.body.className = bodyClassName;

        const translatedDataURL = await renderTranslatedImage(dataURL, boxes);
        console.log(replaceImgSrc(src, translatedDataURL, checkData, img));

    } catch (err) {
        document.body.className = bodyClassName;
        console.error('Translation failed:', err);
        alert("Translation failed: " + err.message);
    }
}

async function translateUsingMyMemory(source) {
    try {
        let sl = sourceLang === "auto" ? "ja" : sourceLang;
        let tl = targetLang === "auto" ? "en" : targetLang;
        source = reflowText(sl, source);
        let url = "https://api.mymemory.translated.net/get?";
        url = url + "q=" + encodeURIComponent(source);
        url = url + "&langpair=" + sl + "|" + tl;
        let response = await fetch(url);
        let o = await response.json();
        return o.responseData.translatedText;
    } catch (error) {
        console.error(error);
        return "";
    }
}

function reflowText(sourceLang, source) {
    if (sourceLang === "ja" || sourceLang === "zh") {
        return source.replace(/\n/g, "");
    }
    return source.replace(/\n/g, " ");
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
    // Yield so the browser renders the wait cursor before OCR blocks the thread
    await yieldToBrowser();

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

        // Step 2: OCR (text detection + coordinates)
        let boxes;
        if (ocrMethod === "paddleocr") {
            boxes = await paddleOCR(dataURL, sourceLang);
        } else {
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

            boxes = ocrResult["imgMap"]["boxes"];
        }

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
    var rect = img.getBoundingClientRect();
    return captureImageViaFetch(img.src, rect);
};

function compressToWebP(dataURL, quality) {
	quality = quality || 0.8;
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = function() {
			const c = document.createElement("canvas");
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			const ctx = c.getContext('2d');
			ctx.drawImage(img, 0, 0);
			resolve(c.toDataURL("image/webp", quality));
		};
		img.onerror = reject;
		img.src = dataURL;
	});
}

function captureImageViaFetch(src, rect) {
    console.log("captureImageViaFetch: trying to fetch", src);
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({action: "enableCORSForFetch"}, () => {
            fetch(src)
                .then(response => {
                    console.log("captureImageViaFetch: response status", response.status, "type", response.type, "url", response.url);
                    if (!response.ok) {
                        throw new Error('Fetch failed with status ' + response.status);
                    }
                    return response.blob();
                })
                .then(blob => {
                    console.log("captureImageViaFetch: blob size", blob.size, "type", blob.type);
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            console.log("captureImageViaFetch: FileReader done, dataURL length", reader.result ? reader.result.length : 0);
                            compressToWebP(reader.result, 0.8).then(resolve).catch(reject);
                        };
                        reader.onerror = function(e) {
                            console.error("captureImageViaFetch: FileReader error", e);
                            reject(e);
                        };
                        reader.readAsDataURL(blob);
                    });
                })
                .catch(err => {
                    console.error("captureImageViaFetch: failed, falling back to screenshot", err);
                    return captureImageViaScreenshot(rect);
                })
                .then(resolve)
                .finally(() => {
                    chrome.runtime.sendMessage({action: "disableCORSForFetch"});
                });
        });
    });
}

function captureImageViaScreenshot(rect) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: "captureVisibleTab"}, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error("Screenshot failed: " + chrome.runtime.lastError.message));
                return;
            }
            if (!response || !response.dataURL) {
                reject(new Error("Screenshot returned no dataURL"));
                return;
            }
            var img = new Image();
            img.onload = function() {
                if (!canvas) {
                    canvas = document.createElement("canvas");
                }
                var scale = img.naturalWidth / window.innerWidth;
                var sx = rect.left * scale;
                var sy = rect.top * scale;
                var sw = rect.width * scale;
                var sh = rect.height * scale;
                canvas.width = sw;
                canvas.height = sh;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                resolve(canvas.toDataURL("image/webp", 0.8));
            };
            img.onerror = function() {
                reject(new Error("Failed to load screenshot image"));
            };
            img.src = response.dataURL;
        });
    });
}

function parseFontCSS(cssText) {
    const style = {
        fontFamily: 'sans-serif',
        fontWeight: '',
        fontStyle: '',
        color: '#000000',
        textAlign: 'left',
        textTransform: '',
        backgroundColor: '#FFFFFF',
        borderRadius: { value: 0, unit: 'px' },
        strokeColor: '#FFFFFF',
        strokeWidth: null
    };
    if (!cssText) return style;
    const rules = cssText.split(';').map(s => s.trim()).filter(Boolean);
    for (const rule of rules) {
        const colonIdx = rule.indexOf(':');
        if (colonIdx === -1) continue;
        const prop = rule.substring(0, colonIdx).trim().toLowerCase();
        const val = rule.substring(colonIdx + 1).trim();
        switch (prop) {
            case 'font-family': style.fontFamily = val; break;
            case 'font-weight': style.fontWeight = val; break;
            case 'font-style': style.fontStyle = val; break;
            case 'color': style.color = val; break;
            case 'text-align': if (['left','center','right'].includes(val)) style.textAlign = val; break;
            case 'text-transform': if (['uppercase','lowercase','capitalize'].includes(val)) style.textTransform = val; break;
            case 'background-color': style.backgroundColor = val; break;
            case 'border-radius':
                if (val.endsWith('%')) {
                    const pct = parseFloat(val);
                    if (pct > 0) style.borderRadius = { value: pct, unit: '%' };
                } else {
                    const px = parseFloat(val);
                    if (px > 0) style.borderRadius = { value: px, unit: 'px' };
                }
                break;
            case '-webkit-text-stroke-color': style.strokeColor = val; break;
            case '-webkit-text-stroke-width': style.strokeWidth = parseFloat(val) || null; break;
        }
    }
    return style;
}

function buildFontString(fontSize, style) {
    const parts = [];
    if (style.fontStyle) parts.push(style.fontStyle);
    if (style.fontWeight) parts.push(style.fontWeight);
    parts.push(`${fontSize}px`);
    parts.push(style.fontFamily);
    return parts.join(' ');
}

function applyTextTransform(text, transform) {
    switch (transform) {
        case 'uppercase': return text.toUpperCase();
        case 'lowercase': return text.toLowerCase();
        case 'capitalize': return text.replace(/\b\w/g, c => c.toUpperCase());
        default: return text;
    }
}

function fillRoundRect(ctx, x, y, w, h, borderRadius) {
    let r = borderRadius.value;
    if (borderRadius.unit === '%') {
        r = (Math.min(w, h) * r) / 100;
    }
    if (r <= 0) {
        ctx.fillRect(x, y, w, h);
        return;
    }
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
}

async function renderTranslatedImage(base64Image, boxes) {
    console.log(renderTextCSS)
    const textStyle = parseFontCSS(renderTextCSS);
    console.log(textStyle)
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d');

            ctx.drawImage(img, 0, 0);

            const clampBox = function(x, y, w, h) {
                x = Math.max(0, x);
                y = Math.max(0, y);
                w = Math.min(w, c.width - x);
                h = Math.min(h, c.height - y);
                return { x: x, y: y, w: w, h: h };
            };

            for (const box of boxes) {
                const geo = box.geometry || {};
                const bx = geo.X || geo.x || 0;
                const by = geo.Y || geo.y || 0;
                const bw = geo.width || geo.Width || 0;
                const bh = geo.height || geo.Height || 0;
                const targetText = box.target || '';

                if (bw <= 0 || bh <= 0 || !targetText) continue;

                const c1 = clampBox(bx, by, bw, bh);
                ctx.fillStyle = textStyle.backgroundColor;
                fillRoundRect(ctx, c1.x, c1.y, c1.w, c1.h, textStyle.borderRadius);
            }

            for (const box of boxes) {
                const geo = box.geometry || {};
                const bx = geo.X || geo.x || 0;
                const by = geo.Y || geo.y || 0;
                const bw = geo.width || geo.Width || 0;
                const bh = geo.height || geo.Height || 0;
                const targetText = box.target || '';

                if (bw <= 0 || bh <= 0 || !targetText) continue;
                const c2 = clampBox(bx, by, bw, bh);
                const displayText = applyTextTransform(targetText, textStyle.textTransform);

                const fontSize = calcFontSize(ctx, displayText, c2.w, c2.h, textStyle);
                ctx.font = buildFontString(fontSize, textStyle);
                ctx.fillStyle = textStyle.color;
                ctx.textBaseline = 'top';
                ctx.strokeStyle = textStyle.strokeColor;
                if (textStyle.strokeWidth !== null) {
                    ctx.lineWidth = textStyle.strokeWidth;
                }

                drawTextBox(ctx, displayText, c2.x, c2.y, c2.w, c2.h, fontSize, textStyle);
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

function calcFontSize(ctx, text, maxWidth, maxHeight, textStyle) {
    const padding = 2;
    const availWidth = maxWidth - padding * 2;
    const availHeight = maxHeight - padding * 2;
    if (availWidth <= 0 || availHeight <= 0) return 16;

    const lineHeightRatio = 1.3;
    let lo = 16;
    let hi = Math.min(availHeight, 200);

    // Binary search for the largest font size that fits
    let bestSize = lo;
    for (let i = 0; i < 15; i++) {
        const mid = (lo + hi) / 2;
        ctx.font = buildFontString(mid, textStyle);
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
    const hasSpaces = /\s/.test(text);
    const tokens = hasSpaces ? text.split(/(\s+)/) : text.split('');
    let line = '';
    for (const token of tokens) {
        const testLine = line + token;
        if (ctx.measureText(testLine).width > maxWidth) {
            if (line.length > 0) {
                lines.push(line);
                line = hasSpaces ? token.trimStart() : token;
            } else {
                // Single token wider than maxWidth — force char split
                for (const ch of token) {
                    const chTest = line + ch;
                    if (ctx.measureText(chTest).width > maxWidth && line.length > 0) {
                        lines.push(line);
                        line = ch;
                    } else {
                        line = chTest;
                    }
                }
            }
        } else {
            line = testLine;
        }
    }
    if (line.length > 0) lines.push(line);
    return lines;
}

function drawTextBox(ctx, text, x, y, maxWidth, maxHeight, fontSize, textStyle) {
    const padding = 2;
    const availWidth = maxWidth - padding * 2;
    ctx.font = buildFontString(fontSize, textStyle);
    if (textStyle.strokeWidth === null) {
        ctx.lineWidth = Math.max(2, fontSize * 0.15);
    }
    const lineHeight = fontSize * 1.3;
    const lines = wrapLines(ctx, text, availWidth);
    let lineY = y + padding;
    for (let i = 0; i < lines.length; i++) {
        let lineX = x + padding;
        if (textStyle.textAlign === 'center') {
            lineX = x + maxWidth / 2;
            ctx.textAlign = 'center';
        } else if (textStyle.textAlign === 'right') {
            lineX = x + maxWidth - padding;
            ctx.textAlign = 'right';
        } else {
            ctx.textAlign = 'left';
        }
        ctx.strokeText(lines[i], lineX, lineY);
        ctx.fillText(lines[i], lineX, lineY);
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

// PaddleOCR page-context bridge
var paddleInjected = false;
var paddleInitDone = false;
var paddleCurrentModelKey = null;
var paddleInitResolver = null;
var paddlePendingRequests = {};

var PADDLE_MODEL_URLS = {
    korean: {
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/rec/korean_PP-OCRv5_rec_mobile_infer.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/paddle/PP-OCRv5/rec/korean_PP-OCRv5_rec_mobile_infer/ppocrv5_korean_dict.txt'
    },
    latin: {
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/rec/latin_PP-OCRv5_rec_mobile_infer.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/paddle/PP-OCRv5/rec/latin_PP-OCRv5_rec_mobile_infer/ppocrv5_latin_dict.txt'
    },
    eslav: {
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/rec/eslav_PP-OCRv5_rec_mobile_infer.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/paddle/PP-OCRv5/rec/eslav_PP-OCRv5_rec_mobile_infer/ppocrv5_eslav_dict.txt'
    }
};

var PADDLE_LANG_TO_MODEL = {
    ko: 'korean',
    ru: 'eslav',
    fr: 'latin', it: 'latin', es: 'latin', pt: 'latin',
    id: 'latin', vi: 'latin', de: 'latin', nl: 'latin',
    tr: 'latin', pl: 'latin', sv: 'latin', da: 'latin',
    no: 'latin', fi: 'latin', hu: 'latin', cs: 'latin',
    ro: 'latin', bg: 'latin', el: 'latin', ms: 'latin'
};

function getPaddleModelInfo(sourceLang) {
    var modelKey = PADDLE_LANG_TO_MODEL[sourceLang] || 'default';
    var detUrl = chrome.runtime.getURL('paddleocr/ppocr_v5_mobile_det.onnx');
    var modelInfo = PADDLE_MODEL_URLS[modelKey];
    if (modelInfo) {
        return {
            modelKey: modelKey,
            detUrl: detUrl,
            recUrl: modelInfo.rec,
            dicUrl: modelInfo.dict
        };
    }
    return {
        modelKey: 'default',
        detUrl: detUrl,
        recUrl: chrome.runtime.getURL('paddleocr/ppocr_v5_mobile_rec.onnx'),
        dicUrl: chrome.runtime.getURL('paddleocr/ppocrv5_dict.txt')
    };
}

function loadLibrary(src, type, id) {
    return new Promise(function(resolve, reject) {
        var scriptEle = document.createElement("script");
        scriptEle.setAttribute("type", type);
        scriptEle.setAttribute("src", src);
        if (id) scriptEle.id = id;
        document.body.appendChild(scriptEle);
        scriptEle.addEventListener("load", function() {
            console.log(src + " loaded");
            resolve(true);
        });
        scriptEle.addEventListener("error", function(ev) {
            console.log("Error on loading " + src, ev);
            reject(ev);
        });
    });
}

function injectPaddleLibraries() {
    if (paddleInjected) return Promise.resolve();
    paddleInjected = true;

    return new Promise(function(resolve, reject) {
        function messageListener(event) {
            if (event.source !== window) return;
            var data = event.data;
            if (!data || data.source !== 'imagetrans-extension') return;

            if (data.type === 'PADDLE_INIT_RESULT') {
                if (data.success) {
                    paddleInitDone = true;
                    paddleCurrentModelKey = data.modelKey || 'default';
                    if (paddleInitResolver) {
                        paddleInitResolver.resolve(true);
                        paddleInitResolver = null;
                    }
                } else {
                    if (paddleInitResolver) {
                        paddleInitResolver.reject(new Error('PaddleOCR init failed: ' + data.error));
                        paddleInitResolver = null;
                    }
                }
            } else if (data.type === 'PADDLE_OCR_RESULT') {
                var pending = paddlePendingRequests[data.requestId];
                if (pending) {
                    delete paddlePendingRequests[data.requestId];
                    if (data.success) {
                        if (pending.scale && pending.scale !== 1) {
                            data.boxes.forEach(function(box) {
                                box.geometry.X = Math.round(box.geometry.X / pending.scale);
                                box.geometry.Y = Math.round(box.geometry.Y / pending.scale);
                                box.geometry.width = Math.round(box.geometry.width / pending.scale);
                                box.geometry.height = Math.round(box.geometry.height / pending.scale);
                            });
                        }
                        console.log('OCR result for request ' + data.requestId, data.boxes);
                        pending.resolve(data.boxes);
                    } else {
                        pending.reject(new Error(data.error));
                    }
                }
            }
        }
        window.addEventListener('message', messageListener);

        Promise.all([
            loadLibrary(chrome.runtime.getURL('paddleocr/opencv.js'), 'text/javascript'),
            loadLibrary(chrome.runtime.getURL('paddleocr/ort.min.js'), 'text/javascript')
        ]).then(function() {
            return loadLibrary(chrome.runtime.getURL('paddleocr/esearch-ocr/dist/esearch-ocr.umd.cjs'), 'text/javascript');
        }).then(function() {
            return loadLibrary(chrome.runtime.getURL('paddleocr/page-ocr.js'), 'text/javascript');
        }).then(function() {
            resolve();
        }).catch(function(err) {
            paddleInjected = false;
            window.removeEventListener('message', messageListener);
            reject(err);
        });
    });
}

function ensurePaddleModel(sourceLang) {
    var modelInfo = getPaddleModelInfo(sourceLang);
    if (paddleCurrentModelKey === modelInfo.modelKey && paddleInitDone) {
        return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
        paddleInitResolver = {resolve: resolve, reject: reject};
        window.postMessage({
            source: 'imagetrans-extension',
            type: 'PADDLE_INIT',
            detPath: modelInfo.detUrl,
            recPath: modelInfo.recUrl,
            dicPath: modelInfo.dicUrl,
            modelKey: modelInfo.modelKey,
            requestId: 'init_' + modelInfo.modelKey
        }, '*');
    });
}

function paddleOCR(imageDataURL, sourceLang) {
    return injectPaddleLibraries().then(function() {
        return ensurePaddleModel(sourceLang);
    }).then(function() {
        // Downscale large images to reduce OCR processing time.
        // PaddleOCR detection model works at a fixed resolution internally,
        // so oversize images just waste computation without improving accuracy.
        return downscaleDataURL(imageDataURL, 1500);
    }).then(function(result) {
        var dataURL = result.dataURL;
        var scale = result.scale;
        return new Promise(function(resolve, reject) {
            var requestId = 'ocr_' + Date.now() + '_' + Math.random();
            paddlePendingRequests[requestId] = { resolve: resolve, reject: reject, scale: scale };
            window.postMessage({
                source: 'imagetrans-extension',
                type: 'PADDLE_OCR',
                imageDataURL: dataURL,
                sourceLang: sourceLang || 'auto',
                requestId: requestId,
                xSpacing: xSpacing,
                ySpacing: ySpacing
            }, '*');
        });
    });
}

function downscaleDataURL(dataURL, maxDimension) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var w = img.naturalWidth;
            var h = img.naturalHeight;
            if (w <= maxDimension && h <= maxDimension) {
                resolve({ dataURL: dataURL, scale: 1 });
                return;
            }
            var ratio = Math.min(maxDimension / w, maxDimension / h);
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(w * ratio);
            canvas.height = Math.round(h * ratio);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({ dataURL: canvas.toDataURL('image/jpeg', 0.9), scale: ratio });
        };
        img.onerror = function() { resolve({ dataURL: dataURL, scale: 1 }); };
        img.src = dataURL;
    });
}

function yieldToBrowser() {
    return new Promise(function(resolve) {
        setTimeout(resolve, 0);
    });
}

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
        translatedSrcs[src1] = true;
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

// === Auto-translate ===

function startAutoTranslate() {
    if (autoTranslating) return;
    autoTranslating = true;

    autoObserver = new IntersectionObserver(function(entries) {
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.isIntersecting) {
                var img = entry.target;
                var src = getImageSrc(img);
                if (src && !translatedSrcs[src] && !isInQueue(img)) {
                    processingQueue.push(img);
                    processQueue();
                }
            }
        }
    }, {rootMargin: '150px'});

    var imgs = document.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
        observeImage(imgs[i]);
    }

    autoMutationObserver = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            if (mutation.type === 'childList') {
                var addedNodes = mutation.addedNodes;
                for (var j = 0; j < addedNodes.length; j++) {
                    var node = addedNodes[j];
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'IMG') {
                        observeImage(node);
                    }
                    if (node.getElementsByTagName) {
                        var childImgs = node.getElementsByTagName('img');
                        for (var k = 0; k < childImgs.length; k++) {
                            observeImage(childImgs[k]);
                        }
                    }
                }
            } else if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
                // Lazy-loaded image whose src just changed – re-observe to force re-evaluation
                var img = mutation.target;
                if (autoObserver && img.isConnected) {
                    autoObserver.unobserve(img);
                    autoObserver.observe(img);
                }
            }
        }
    });
    autoMutationObserver.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['src']});
}

function observeImage(img) {
    // Only skip images that are loaded AND confirmed small (likely icons).
    // Unloaded images (naturalWidth/Height === 0) must be observed to catch lazy loads.
    if (img.naturalWidth > 0 && img.naturalHeight > 0 && img.naturalWidth < 100 && img.naturalHeight < 100) return;
    if (autoObserver) autoObserver.observe(img);
}

function isInQueue(img) {
    for (var i = 0; i < processingQueue.length; i++) {
        if (processingQueue[i] === img) return true;
    }
    return false;
}

function stopAutoTranslate() {
    autoTranslating = false;
    if (autoObserver) {
        autoObserver.disconnect();
        autoObserver = null;
    }
    if (autoMutationObserver) {
        autoMutationObserver.disconnect();
        autoMutationObserver = null;
    }
    processingQueue = [];
    isProcessing = false;
}

function processQueue() {
    if (isProcessing || processingQueue.length === 0 || !autoTranslating) return;
    isProcessing = true;

    var img = processingQueue.shift();
    var src = getImageSrc(img);

    if (!src || translatedSrcs[src]) {
        isProcessing = false;
        processQueue();
        return;
    }

    translatedSrcs[src] = true;
    autoTranslateImage(img, src).finally(function() {
        isProcessing = false;
        processQueue();
    });
}

function autoTranslateImage(img, src) {
    return new Promise(function(resolve) {
        showTranslatingOverlay(img);

        var origAlert = window.alert;
        var origConfirm = window.confirm;
        window.alert = function(msg) { console.log('[AutoTranslate]', msg); };
        window.confirm = function(msg) { console.log('[AutoTranslate]', msg); return false; };

        var savedBodyClass = document.body.className;

        var done = function() {
            window.alert = origAlert;
            window.confirm = origConfirm;
            document.body.className = savedBodyClass;
            hideTranslatingOverlay(img);
            resolve();
        };

        try {
            var promise = ajax(src, img, true);
            if (promise && promise.then) {
                promise.then(done).catch(function(e) {
                    console.error('[AutoTranslate] Error:', e);
                    delete translatedSrcs[src];
                    done();
                });
            } else {
                done();
            }
        } catch (e) {
            console.error('[AutoTranslate] Error:', e);
            delete translatedSrcs[src];
            done();
        }
    });
}

function showTranslatingOverlay(img) {
    hideTranslatingOverlay(img);
    var overlay = document.createElement('div');
    overlay.className = 'imagetrans-overlay';
    overlay.innerHTML = '<div class="imagetrans-spinner"></div><div>Translating...</div>';
    updateOverlayPosition(overlay, img);
    document.body.appendChild(overlay);
    img._imagetransOverlay = overlay;

    function tick() {
        if (!img._imagetransOverlay) return;
        updateOverlayPosition(overlay, img);
        overlay._imagetransRafId = requestAnimationFrame(tick);
    }
    overlay._imagetransRafId = requestAnimationFrame(tick);
}

function updateOverlayPosition(overlay, img) {
    var rect = img.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
}

function hideTranslatingOverlay(img) {
    if (img._imagetransOverlay) {
        var overlay = img._imagetransOverlay;
        if (overlay._imagetransRafId) {
            cancelAnimationFrame(overlay._imagetransRafId);
        }
        overlay.remove();
        img._imagetransOverlay = null;
    }
}
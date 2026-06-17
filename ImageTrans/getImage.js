// --- Custom i18n: allow user to override UI language ---
(async function() {
  const { uiLanguage } = await chrome.storage.sync.get({ uiLanguage: '' });
  if (uiLanguage && /^[a-z]{2,3}([-_][A-Za-z]{2,4})?$/.test(uiLanguage)) {
    try {
      const url = chrome.runtime.getURL('_locales/' + uiLanguage + '/messages.json');
      const resp = await fetch(url);
      const messages = await resp.json();
      const original = chrome.i18n.getMessage.bind(chrome.i18n);
      chrome.i18n.getMessage = function(key, subs) {
        if (messages[key]) {
          const msg = messages[key];
          let text = msg.message;
          if (subs !== undefined && subs !== null && msg.placeholders) {
            const subsArr = Array.isArray(subs) ? subs : [subs];
            for (const [name, def] of Object.entries(msg.placeholders)) {
              const m = def.content.match(/^\$(\d+)$/);
              if (m) {
                const val = subsArr[parseInt(m[1]) - 1];
                if (val !== undefined) {
                  text = text.replace(new RegExp('\\$' + name.toUpperCase() + '\\$', 'g'), function() { return val; });
                }
              }
            }
          }
          return text;
        }
        return original(key, subs);
      };
    } catch(e) { /* fall back to browser default */ }
  }
})();

var x=0;
var y=0;
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
var useYOLODetection = false;
var useYOLOForJapanese = true;
var translationMode = "imagetrans";
var defaultPresetTranslation = "glm4flash";
var sendRequestsViaBackground = false;
var screenCaptureOverlayMode = false;
var addPinyinToSource = false;
var pinyinProLoaded = false;
var pinyinPendingRequests = {};
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
    useYOLODetection: false,
    useYOLOForJapanese: true,
    translationMode: 'imagetrans',
    defaultPresetTranslation: defaultPresetTranslation,
    sendRequestsViaBackground: false,
    screenCaptureOverlay: false,
    addPinyinToSource: false,
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
    if (items.useYOLODetection != undefined) {
        useYOLODetection = items.useYOLODetection;
    }
    if (items.useYOLOForJapanese != undefined) {
        useYOLOForJapanese = items.useYOLOForJapanese;
    }
    if (items.translationMode) {
        translationMode = items.translationMode;
    }
    if (items.defaultPresetTranslation) {
        defaultPresetTranslation = items.defaultPresetTranslation;
    }
    if (items.xSpacing != undefined) {
        xSpacing = items.xSpacing;
    }
    if (items.ySpacing != undefined) {
        ySpacing = items.ySpacing;
    }
    if (items.sendRequestsViaBackground != undefined) {
        sendRequestsViaBackground = items.sendRequestsViaBackground;
    }
    if (items.screenCaptureOverlay !== undefined) {
        screenCaptureOverlayMode = items.screenCaptureOverlay === true;
    }
    if (items.addPinyinToSource !== undefined) {
        addPinyinToSource = items.addPinyinToSource;
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
        document.body.classList.add("imagetrans-wait");
        var e=getImage(coordinate.x, coordinate.y, request.check);
        var src=getImageSrc(e);
        ajax(src,e,true,true);
    }else if (message == "translateWithMenu") {
        var e = getImageBySrc(request.info.srcUrl)
        ajax(request.info.srcUrl,e,true,true);
    }else if (message == "alterWithMenu") {
        console.log("alter")
        console.log(request.info)
        var e = getImageBySrc(request.info.srcUrl)
        alterLanguage(e);
    }else if (message == "getsrconly"){
        var e=getImage(coordinate.x,coordinate.y,request.check);
        var src=getImageSrc(e);
        setTimeout(function(){
          navigator.clipboard.writeText(src)
            .then(() => {
              console.log('Text copied to clipboard');
              alert(chrome.i18n.getMessage("alert_copied", src));
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
    }else if (message == "startScreenCapture") {
        startScreenCapture();
    }

  }
);

console.log("loaded");

function fetchViaBackground(url, options) {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage({
            action: 'proxyFetch',
            url: url,
            options: options
        }, function(response) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            resolve(response);
        });
    });
}

async function doFetch(url, options) {
    if (sendRequestsViaBackground) {
        return fetchViaBackground(url, options);
    }
    const resp = await fetch(url, options);
    let data;
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await resp.json();
    } else {
        data = await resp.text();
    }
    return { ok: resp.ok, status: resp.status, data: data };
}

async function ajax(src,img,checkData,showOverlay){
    if (useOpenAI) {
        return ajaxOpenAI(src, img, checkData, showOverlay);
    }
    if (translationMode === "local") {
        if (sourceLang === "auto" || targetLang === "auto") {
            alert(chrome.i18n.getMessage("alert_set_langpair"));
            chrome.runtime.sendMessage("showOptions");
            document.body.classList.remove("imagetrans-wait");
            return;
        }
        return ajaxMyMemory(src, img, checkData, showOverlay);
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
    if (showOverlay && img) {
        showTranslatingOverlay(img);
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
                alert(chrome.i18n.getMessage("alert_set_langpair"));
                chrome.runtime.sendMessage("showOptions");
                document.body.classList.remove("imagetrans-wait");
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
            const resp = await doFetch(url + '/translate', {
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
            return resp.data;
        };

        try {
            const respData = await post(serverURL, data);
            console.log(respData);
            document.body.classList.remove("imagetrans-wait");
            if (!respData["imgMap"]) {
                alert(chrome.i18n.getMessage("alert_bad_result"));
            } else if (renderTextInFrontend && respData["imgMap"] && respData["imgMap"]["boxes"]) {
                renderTranslatedImage(data.src, respData["imgMap"]["boxes"]).then(translatedDataURL => {
                    console.log(replaceImgSrc(src, translatedDataURL, checkData, img));
                });
            } else {
                var dataURL = "data:image/jpeg;base64," + respData["img"];
                console.log(replaceImgSrc(src, dataURL, checkData, img));
            }
        } catch (err) {
            document.body.classList.remove("imagetrans-wait");
            console.log('Request failed:', err);
            if (serverURL === "https://local.basiccat.org:51043") {
                var usePublic = confirm(chrome.i18n.getMessage("confirm_failed_connect"));
                if (usePublic) {
                    serverURL = "https://service.basiccat.org:51043";
                    document.body.classList.add("imagetrans-wait");
                    try {
                        const respData = await post(serverURL, data);
                        console.log(respData);
                        document.body.classList.remove("imagetrans-wait");
                        if (!respData["img"]) {
                            alert(chrome.i18n.getMessage("alert_bad_result"));
                        } else if (renderTextInFrontend && respData["imgMap"] && respData["imgMap"]["boxes"]) {
                            renderTranslatedImage(respData["img"], respData["imgMap"]["boxes"]).then(translatedDataURL => {
                                console.log(replaceImgSrc(src, translatedDataURL, checkData, img));
                            });
                        } else {
                            var dataURL = "data:image/jpeg;base64," + respData["img"];
                            console.log(replaceImgSrc(src, dataURL, checkData, img));
                        }
                    } catch (err2) {
                        document.body.classList.remove("imagetrans-wait");
                        alert(chrome.i18n.getMessage("alert_connect_failed"));
                    }
                } else {
                    if (sourceLang === "auto" || targetLang === "auto") {
                        alert(chrome.i18n.getMessage("alert_set_langpair"));
                        chrome.runtime.sendMessage("showOptions");
                        document.body.classList.remove("imagetrans-wait");
                        return;
                    }
                    await ajaxMyMemory(src, img, checkData, showOverlay);
                }
            } else {
                alert(chrome.i18n.getMessage("alert_connect_failed"));
            }
        }
    } catch (e) {
        document.body.classList.remove("imagetrans-wait");
        console.log(e);
    }
    if (showOverlay && img) {
        hideTranslatingOverlay(img);
    }
}

async function ajaxMyMemory(src, img, checkData, showOverlay) {
    console.log("Using PaddleOCR + MyMemory for translation");
    document.body.classList.add("imagetrans-wait");
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
        if (showOverlay && img) {
            showTranslatingOverlay(img);
        }
        let boxes = await paddleOCR(dataURL, sourceLang);

        const sourceTexts = [];
        for (const box of boxes) {
            const sourceText = box.source || box.text || box.target || '';
            sourceTexts.push(sourceText);
        }

        if (sourceTexts.length === 0 || sourceTexts.every(function(t) { return !t; })) {
            document.body.classList.remove("imagetrans-wait");
            alert(chrome.i18n.getMessage("alert_no_text"));
            if (showOverlay && img) {
                hideTranslatingOverlay(img);
            }
            return;
        }

        if (defaultPresetTranslation === "glm4flash") {
            let reflowedTexts = sourceTexts.map(function(t) { return reflowText(sourceLang, t); });
            let translations;
            try {
                translations = await Promise.race([
                    translateUsingGlm4Flash(reflowedTexts),
                    new Promise(function(_, reject) {
                        setTimeout(function() { reject(new Error("glm4flash timeout")); }, 20000);
                    })
                ]);
            } catch (e) {
                console.warn("glm4flash translation timed out or failed, falling back to mymemory:", e);
                translations = null;
            }
            if (translations) {
                for (let i = 0; i < boxes.length && i < translations.length; i++) {
                    boxes[i].target = translations[i] || '';
                }
            } else {
                // Fallback to mymemory
                for (let i = 0; i < boxes.length; i++) {
                    if (sourceTexts[i]) {
                        boxes[i].target = await translateUsingMyMemory(sourceTexts[i]);
                    } else {
                        boxes[i].target = '';
                    }
                }
            }
        } else {
            for (let i = 0; i < boxes.length; i++) {
                if (sourceTexts[i]) {
                    boxes[i].target = await translateUsingMyMemory(sourceTexts[i]);
                } else {
                    boxes[i].target = '';
                }
            }
        }

        document.body.classList.remove("imagetrans-wait");

        const translatedDataURL = await renderTranslatedImage(dataURL, boxes);
        console.log(replaceImgSrc(src, translatedDataURL, checkData, img));

    } catch (err) {
        document.body.classList.remove("imagetrans-wait");
        console.error('Translation failed:', err);
        alert(chrome.i18n.getMessage("alert_translation_failed", err.message));
    }
    if (showOverlay && img) {
        hideTranslatingOverlay(img);
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

function translateUsingGlm4Flash(sourceTexts) {
    return new Promise(function(resolve, reject) {
        let tl = targetLang === "auto" ? "en" : targetLang;
        chrome.runtime.sendMessage({
            action: "translateViaGlm4Flash",
            texts: sourceTexts,
            targetLang: tl
        }, function(response) {
            if (response && response.texts) {
                resolve(response.texts);
            } else {
                var errMsg = "GLM-4-Flash translation failed: " + (response && response.error);
                console.error(errMsg);
                reject(new Error(errMsg));
            }
        });
    });
}

function reflowText(sourceLang, source) {
    if (sourceLang === "ja" || sourceLang === "zh") {
        return source.replace(/\n/g, "");
    }
    return source.replace(/\n/g, " ");
}

async function ajaxOpenAI(src, img, checkData, showOverlay) {
    console.log("Using OpenAI for translation");
    if (!openaiURL || !openaiKey) {
        alert(chrome.i18n.getMessage("alert_openai_not_configured"));
        document.body.classList.remove("imagetrans-wait");
        return;
    }
    document.body.classList.add("imagetrans-wait");
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

        if (showOverlay && img) {
            showTranslatingOverlay(img);
        }

        // Step 2: OCR (text detection + coordinates)
        let boxes;
        if (ocrMethod === "paddleocr") {
            if (sourceLang === "auto") {
                alert(chrome.i18n.getMessage("alert_set_langpair"));
                chrome.runtime.sendMessage("showOptions");
                document.body.classList.remove("imagetrans-wait");
                return;
            }
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

            const ocrResponse = await doFetch(serverURL + '/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: ocrParams.toString(),
                cache: 'no-store'
            });

            if (!ocrResponse.ok) {
                throw new Error('ImageTrans OCR failed: HTTP ' + ocrResponse.status);
            }

            const ocrResult = ocrResponse.data;
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
            document.body.classList.remove("imagetrans-wait");
            alert(chrome.i18n.getMessage("alert_no_text"));
            return;
        }

        // Step 4: Call OpenAI API for translation
        const actualTargetLang = targetLang === 'auto' ? 'English' : targetLang;
        let prompt = openaiPrompt
            .replace(/\{sourceLang\}/g, sourceLang)
            .replace(/\{targetLang\}/g, actualTargetLang)
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

        document.body.classList.remove("imagetrans-wait");

        // Step 7: Render on canvas
        const translatedDataURL = await renderTranslatedImage(dataURL, boxes);
        console.log(replaceImgSrc(src, translatedDataURL, checkData, img));

    } catch (err) {
        document.body.classList.remove("imagetrans-wait");
        console.error('Translation failed:', err);
        alert(chrome.i18n.getMessage("alert_translation_failed", err.message));
    }
    if (showOverlay && img) {
        hideTranslatingOverlay(img);
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

function isCJK(ch) {
    const cp = ch.codePointAt(0);
    return (cp >= 0x4E00 && cp <= 0x9FFF) ||   // CJK Unified Ideographs
           (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK Extension A
           (cp >= 0x3040 && cp <= 0x309F) ||   // Hiragana
           (cp >= 0x30A0 && cp <= 0x30FF) ||   // Katakana
           (cp >= 0xAC00 && cp <= 0xD7AF) ||   // Hangul
           (cp >= 0x3000 && cp <= 0x303F) ||   // CJK punctuation
           (cp >= 0xFF00 && cp <= 0xFFEF);     // Fullwidth forms
}

function tokenizeForWrap(text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        if (isCJK(ch)) {
            tokens.push(ch);
            i++;
        } else if (/\s/.test(ch)) {
            let space = '';
            while (i < text.length && /\s/.test(text[i])) {
                space += text[i];
                i++;
            }
            tokens.push(space);
        } else {
            let seq = '';
            while (i < text.length && !isCJK(text[i]) && !/\s/.test(text[i])) {
                seq += text[i];
                i++;
            }
            tokens.push(seq);
        }
    }
    return tokens;
}

function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    const tokens = tokenizeForWrap(text);
    const hasSpaces = /\s/.test(text);
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
var ppocrv6_small_rec = chrome.runtime.getURL('paddleocr/rec.onnx');
var ppocrv6_small_dict = chrome.runtime.getURL('paddleocr/ppocrv6_dict.txt');
var PADDLE_MODEL_URLS = {
    defaultv5: {
        det: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/det/ch_PP-OCRv5_mobile_det.onnx',
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/rec/ch_PP-OCRv5_rec_mobile_infer.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/paddle/PP-OCRv5/rec/ch_PP-OCRv5_rec_mobile_infer/ppocrv5_dict.txt'
    },
    japanese: {
        rec: ppocrv6_small_rec,
        dict: ppocrv6_small_dict
    },
    arabic: {
        det: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv4/det/Multilingual_PP-OCRv3_det_infer.onnx',
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/master/onnx/PP-OCRv5/rec/arabic_PP-OCRv5_rec_mobile.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/master/paddle/PP-OCRv5/rec/arabic_PP-OCRv5_rec_mobile/ppocrv5_arabic_dict.txt'
    },
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
    },
    th:{
        rec: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/onnx/PP-OCRv5/rec/th_PP-OCRv5_rec_mobile_infer.onnx',
        dict: 'https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.4.0/paddle/PP-OCRv5/rec/th_PP-OCRv5_rec_mobile_infer/ppocrv5_th_dict.txt'
    }
};

var PADDLE_LANG_TO_MODEL = {
    ja: 'japanese',
    ar: 'arabic',
    ko: 'korean',
    ru: 'eslav',
    th: 'th',
    fr: 'latin', it: 'latin', es: 'latin', pt: 'latin',
    id: 'latin', vi: 'latin', de: 'latin', nl: 'latin',
    tr: 'latin', pl: 'latin', sv: 'latin', da: 'latin',
    no: 'latin', fi: 'latin', hu: 'latin', cs: 'latin',
    ro: 'latin', bg: 'latin', el: 'latin', ms: 'latin'
};

function getPaddleModelInfo(sourceLang) {
    var modelKey = PADDLE_LANG_TO_MODEL[sourceLang] || 'default';
    var defaultDetUrl = chrome.runtime.getURL('paddleocr/tiny/det.onnx');
    var modelInfo = PADDLE_MODEL_URLS[modelKey];
    if (modelInfo) {
        return {
            modelKey: modelKey,
            detUrl: modelInfo.det || defaultDetUrl,
            recUrl: modelInfo.rec,
            dicUrl: modelInfo.dict
        };
    }
    return {
        modelKey: 'default',
        detUrl: defaultDetUrl,
        recUrl: chrome.runtime.getURL('paddleocr/tiny/rec.onnx'),
        dicUrl: chrome.runtime.getURL('paddleocr/tiny/ppocrv6_tiny_dict.txt')
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
            return loadLibrary(chrome.runtime.getURL('paddleocr/esearch-ocr/dist/esearch-ocr.umd.js'), 'text/javascript');
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
            wasmPath: chrome.runtime.getURL('paddleocr/'),
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
            var useYOLO = useYOLODetection || (useYOLOForJapanese && (sourceLang || 'auto') === 'ja');
            var msg = {
                source: 'imagetrans-extension',
                type: useYOLO ? 'PADDLE_OCR_YOLO' : 'PADDLE_OCR',
                imageDataURL: dataURL,
                sourceLang: sourceLang || 'auto',
                requestId: requestId,
                xSpacing: xSpacing,
                ySpacing: ySpacing
            };
            if (useYOLO) {
                msg.yoloModelUrl = chrome.runtime.getURL('paddleocr/model.onnx');
            }
            window.postMessage(msg, '*');
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

var pinyinMessageListenerAdded = false;

function loadPinyinPro() {
    if (pinyinProLoaded) return Promise.resolve();

    if (!pinyinMessageListenerAdded) {
        pinyinMessageListenerAdded = true;
        window.addEventListener('message', function(event) {
            if (event.source !== window) return;
            var data = event.data;
            if (!data || data.source !== 'imagetrans-extension') return;
            if (data.type === 'PINYIN_ANNOTATE_RESULT') {
                var pending = pinyinPendingRequests[data.requestId];
                if (pending) {
                    delete pinyinPendingRequests[data.requestId];
                    pending.resolve(data.html);
                }
            }
        });
    }

    return loadLibrary(chrome.runtime.getURL('pinyin.js'), 'text/javascript').then(function() {
        return loadLibrary(chrome.runtime.getURL('pinyin-bridge.js'), 'text/javascript');
    }).then(function() {
        pinyinProLoaded = true;
    });
}

function annotatePinyinAsync(text) {
    if (!addPinyinToSource) return Promise.resolve(text);
    if (!/[一-鿿]/.test(text)) return Promise.resolve(text);
    return loadPinyinPro().then(function() {
        return new Promise(function(resolve) {
            var requestId = 'pinyin_' + Date.now() + '_' + Math.random();
            var timeout = setTimeout(function() {
                delete pinyinPendingRequests[requestId];
                resolve(text);
            }, 5000);
            pinyinPendingRequests[requestId] = {
                resolve: function(html) {
                    clearTimeout(timeout);
                    resolve(html);
                }
            };
            window.postMessage({
                source: 'imagetrans-extension',
                type: 'PINYIN_ANNOTATE',
                requestId: requestId,
                text: text
            }, '*');
        });
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
        var origAlert = window.alert;
        var origConfirm = window.confirm;
        var langpairAlertMsg = chrome.i18n.getMessage("alert_set_langpair");
        window.alert = function(msg) {
            if (msg === langpairAlertMsg) {
                window.alert = origAlert;
                window.confirm = origConfirm;
                stopAutoTranslate();
                delete translatedSrcs[src];
                origAlert(msg);
                resolve();
                return;
            }
            console.log('[AutoTranslate]', msg);
        };
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
            var promise = ajax(src, img, true, true);
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
    var spinner = document.createElement('div');
    spinner.className = 'imagetrans-spinner';
    var textDiv = document.createElement('div');
    textDiv.textContent = chrome.i18n.getMessage("overlay_translating");
    overlay.appendChild(spinner);
    overlay.appendChild(textDiv);
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

// === Screen Capture OCR ===

var screenCaptureActive = false;
var screenCaptureOverlay = null;
var screenCaptureSelection = null;
var screenCaptureToolbar = null;
var screenCaptureStartX = 0;
var screenCaptureStartY = 0;
var screenCaptureRect = null;
var screenCaptureServerFailed = false;

function startScreenCapture() {
    if (screenCaptureActive) return;
    screenCaptureActive = true;

    screenCaptureOverlay = document.createElement('div');
    screenCaptureOverlay.id = 'imagetrans-sc-overlay';
    screenCaptureOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;cursor:crosshair;background:rgba(0,0,0,0.15);';

    screenCaptureSelection = document.createElement('div');
    screenCaptureSelection.id = 'imagetrans-sc-selection';
    screenCaptureSelection.style.cssText = 'position:fixed;border:2px dashed #4A90D9;background:transparent;display:none;z-index:2147483647;pointer-events:none;box-sizing:border-box;';

    document.body.appendChild(screenCaptureSelection);
    document.body.appendChild(screenCaptureOverlay);

    screenCaptureOverlay.addEventListener('mousedown', onScreenCaptureMouseDown);
    window.addEventListener('mousemove', onScreenCaptureMouseMove);
    window.addEventListener('mouseup', onScreenCaptureMouseUp);
    window.addEventListener('keydown', onScreenCaptureKeyDown);

    screenCaptureOverlay.addEventListener('touchstart', onScreenCaptureTouchStart, { passive: false });
    window.addEventListener('touchmove', onScreenCaptureTouchMove, { passive: false });
    window.addEventListener('touchend', onScreenCaptureTouchEnd);
    window.addEventListener('touchcancel', onScreenCaptureTouchEnd);
}

function onScreenCaptureMouseDown(e) {
    screenCaptureStartX = e.clientX;
    screenCaptureStartY = e.clientY;
    screenCaptureSelection.style.display = 'block';
    screenCaptureSelection.style.left = screenCaptureStartX + 'px';
    screenCaptureSelection.style.top = screenCaptureStartY + 'px';
    screenCaptureSelection.style.width = '0px';
    screenCaptureSelection.style.height = '0px';
    e.preventDefault();
    e.stopPropagation();
}

function onScreenCaptureMouseMove(e) {
    if (screenCaptureSelection.style.display === 'none') return;
    var x = Math.min(screenCaptureStartX, e.clientX);
    var y = Math.min(screenCaptureStartY, e.clientY);
    var w = Math.abs(e.clientX - screenCaptureStartX);
    var h = Math.abs(e.clientY - screenCaptureStartY);
    screenCaptureSelection.style.left = x + 'px';
    screenCaptureSelection.style.top = y + 'px';
    screenCaptureSelection.style.width = w + 'px';
    screenCaptureSelection.style.height = h + 'px';
}

function onScreenCaptureMouseUp(e) {
    var endX = e.clientX;
    var endY = e.clientY;

    var rect = {
        left: Math.min(screenCaptureStartX, endX),
        top: Math.min(screenCaptureStartY, endY),
        width: Math.abs(endX - screenCaptureStartX),
        height: Math.abs(endY - screenCaptureStartY)
    };

    cleanupScreenCaptureOverlay();

    if (rect.width < 10 || rect.height < 10) {
        cleanupScreenCaptureAll();
        return;
    }

    screenCaptureRect = rect;
    showSelectionToolbar(rect);
}

function onScreenCaptureKeyDown(e) {
    if (e.key === 'Escape') {
        cleanupScreenCaptureAll();
    }
}

function onScreenCaptureTouchStart(e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    screenCaptureStartX = touch.clientX;
    screenCaptureStartY = touch.clientY;
    screenCaptureSelection.style.display = 'block';
    screenCaptureSelection.style.left = screenCaptureStartX + 'px';
    screenCaptureSelection.style.top = screenCaptureStartY + 'px';
    screenCaptureSelection.style.width = '0px';
    screenCaptureSelection.style.height = '0px';
    e.preventDefault();
    e.stopPropagation();
}

function onScreenCaptureTouchMove(e) {
    if (e.touches.length !== 1) return;
    if (screenCaptureSelection.style.display === 'none') return;
    var touch = e.touches[0];
    var x = Math.min(screenCaptureStartX, touch.clientX);
    var y = Math.min(screenCaptureStartY, touch.clientY);
    var w = Math.abs(touch.clientX - screenCaptureStartX);
    var h = Math.abs(touch.clientY - screenCaptureStartY);
    screenCaptureSelection.style.left = x + 'px';
    screenCaptureSelection.style.top = y + 'px';
    screenCaptureSelection.style.width = w + 'px';
    screenCaptureSelection.style.height = h + 'px';
    e.preventDefault();
}

function onScreenCaptureTouchEnd(e) {
    var touch = e.changedTouches[0];
    if (!touch) {
        cleanupScreenCaptureAll();
        return;
    }
    var endX = touch.clientX;
    var endY = touch.clientY;

    var rect = {
        left: Math.min(screenCaptureStartX, endX),
        top: Math.min(screenCaptureStartY, endY),
        width: Math.abs(endX - screenCaptureStartX),
        height: Math.abs(endY - screenCaptureStartY)
    };

    cleanupScreenCaptureOverlay();

    if (rect.width < 10 || rect.height < 10) {
        cleanupScreenCaptureAll();
        return;
    }

    screenCaptureRect = rect;
    showSelectionToolbar(rect);
}

function cleanupScreenCaptureOverlay() {
    if (screenCaptureOverlay) {
        screenCaptureOverlay.remove();
        screenCaptureOverlay = null;
    }
    window.removeEventListener('mousemove', onScreenCaptureMouseMove);
    window.removeEventListener('mouseup', onScreenCaptureMouseUp);
    window.removeEventListener('keydown', onScreenCaptureKeyDown);
    window.removeEventListener('touchmove', onScreenCaptureTouchMove);
    window.removeEventListener('touchend', onScreenCaptureTouchEnd);
    window.removeEventListener('touchcancel', onScreenCaptureTouchEnd);
}

function showSelectionToolbar(rect) {
    screenCaptureSelection.style.display = 'block';
    screenCaptureSelection.style.left = rect.left + 'px';
    screenCaptureSelection.style.top = rect.top + 'px';
    screenCaptureSelection.style.width = rect.width + 'px';
    screenCaptureSelection.style.height = rect.height + 'px';
    screenCaptureSelection.style.pointerEvents = 'auto';
    screenCaptureSelection.style.cursor = 'move';

    // Add resize handles
    addResizeHandles(rect);

    // Drag support
    screenCaptureSelection.addEventListener('mousedown', onSelectionDragStart);
    screenCaptureSelection.addEventListener('touchstart', onSelectionDragTouchStart, { passive: false });

    // Create toolbar
    screenCaptureToolbar = document.createElement('div');
    screenCaptureToolbar.id = 'imagetrans-sc-toolbar';
    placeToolbar(rect);

    var toolbarMobile = window.innerWidth < 600;
    var tBtnPad = toolbarMobile ? '10px 18px' : '6px 16px';
    var tBtnFont = toolbarMobile ? '15px' : '14px';

    var btnOCR = document.createElement('button');
    btnOCR.textContent = chrome.i18n.getMessage("sc_recognize");
    btnOCR.style.cssText = 'padding:' + tBtnPad + ';background:#4A90D9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:' + tBtnFont + ';box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap;touch-action:manipulation;';
    btnOCR.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    btnOCR.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    btnOCR.addEventListener('click', function(e) {
        e.stopPropagation();
        doScreenOCR();
    });

    var btnClose = document.createElement('button');
    btnClose.textContent = chrome.i18n.getMessage("sc_close");
    btnClose.style.cssText = 'padding:' + tBtnPad + ';background:#fff;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:' + tBtnFont + ';box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap;touch-action:manipulation;';
    btnClose.addEventListener('mousedown', function(e) { e.stopPropagation(); });
    btnClose.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    btnClose.addEventListener('click', function(e) {
        e.stopPropagation();
        var overlayWrap = document.getElementById('imagetrans-sc-overlay-wrap');
        if (overlayWrap) {
            overlayWrap.remove();
        } else {
            cleanupScreenCaptureAll();
        }
    });

    screenCaptureToolbar.appendChild(btnOCR);
    screenCaptureToolbar.appendChild(btnClose);
    document.body.appendChild(screenCaptureToolbar);
}

// === Selection drag & resize ===

var screenCaptureDragging = false;
var screenCaptureResizing = false;
var screenCaptureResizeCorner = null; // 'nw', 'ne', 'sw', 'se'
var screenCaptureDragOffsetX = 0;
var screenCaptureDragOffsetY = 0;
var screenCaptureResizeAnchorX = 0;
var screenCaptureResizeAnchorY = 0;
var screenCaptureHandles = [];

function addResizeHandles(rect) {
    removeResizeHandles();
    var handleMobile = window.innerWidth < 600;
    var handleSize = handleMobile ? 16 : 8;
    var handleOffset = handleSize / 2;
    var corners = [
        { id: 'nw', left: rect.left - handleOffset, top: rect.top - handleOffset, cursor: 'nwse-resize' },
        { id: 'ne', left: rect.left + rect.width - handleOffset, top: rect.top - handleOffset, cursor: 'nesw-resize' },
        { id: 'sw', left: rect.left - handleOffset, top: rect.top + rect.height - handleOffset, cursor: 'nesw-resize' },
        { id: 'se', left: rect.left + rect.width - handleOffset, top: rect.top + rect.height - handleOffset, cursor: 'nwse-resize' }
    ];
    for (var i = 0; i < corners.length; i++) {
        var h = document.createElement('div');
        h.className = 'imagetrans-sc-handle';
        h.setAttribute('data-corner', corners[i].id);
        h.style.cssText = 'position:fixed;z-index:2147483648;width:' + handleSize + 'px;height:' + handleSize + 'px;background:#4A90D9;border:1px solid #fff;cursor:' + corners[i].cursor + ';left:' + corners[i].left + 'px;top:' + corners[i].top + 'px;';
        h.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            onSelectionResizeStart(e);
        });
        h.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
            onSelectionResizeTouchStart(e);
        }, { passive: false });
        document.body.appendChild(h);
        screenCaptureHandles.push(h);
    }
}

function removeResizeHandles() {
    for (var i = 0; i < screenCaptureHandles.length; i++) {
        screenCaptureHandles[i].remove();
    }
    screenCaptureHandles = [];
}

function updateHandlePositions(rect) {
    var handleMobile = window.innerWidth < 600;
    var handleOffset = handleMobile ? 8 : 4;
    var corners = [
        { id: 'nw', left: rect.left - handleOffset, top: rect.top - handleOffset },
        { id: 'ne', left: rect.left + rect.width - handleOffset, top: rect.top - handleOffset },
        { id: 'sw', left: rect.left - handleOffset, top: rect.top + rect.height - handleOffset },
        { id: 'se', left: rect.left + rect.width - handleOffset, top: rect.top + rect.height - handleOffset }
    ];
    for (var i = 0; i < screenCaptureHandles.length; i++) {
        var handle = screenCaptureHandles[i];
        for (var j = 0; j < corners.length; j++) {
            if (handle.getAttribute('data-corner') === corners[j].id) {
                handle.style.left = corners[j].left + 'px';
                handle.style.top = corners[j].top + 'px';
                break;
            }
        }
    }
}

function placeToolbar(rect) {
    var toolbarTop = rect.top + rect.height + 8;
    if (toolbarTop + 42 > window.innerHeight) {
        toolbarTop = rect.top - 42;
    }
    // Keep toolbar within horizontal viewport
    var toolbarLeft = rect.left;
    if (toolbarLeft < 4) toolbarLeft = 4;
    screenCaptureToolbar.style.cssText = 'position:fixed;z-index:2147483647;left:' + toolbarLeft + 'px;top:' + toolbarTop + 'px;display:flex;gap:8px;';
    // Ensure toolbar doesn't overflow right edge on mobile
    if (window.innerWidth < 600 && toolbarLeft + 200 > window.innerWidth) {
        screenCaptureToolbar.style.left = Math.max(4, window.innerWidth - 210) + 'px';
    }
}

function applyRect(rect) {
    screenCaptureRect = rect;
    screenCaptureSelection.style.left = rect.left + 'px';
    screenCaptureSelection.style.top = rect.top + 'px';
    screenCaptureSelection.style.width = rect.width + 'px';
    screenCaptureSelection.style.height = rect.height + 'px';
    updateHandlePositions(rect);
    placeToolbar(rect);
}

function onSelectionDragStart(e) {
    if (screenCaptureResizing) return;
    screenCaptureDragging = true;
    screenCaptureDragOffsetX = e.clientX - screenCaptureRect.left;
    screenCaptureDragOffsetY = e.clientY - screenCaptureRect.top;
    window.addEventListener('mousemove', onSelectionDragMove);
    window.addEventListener('mouseup', onSelectionDragEnd);
    e.preventDefault();
}

function onSelectionDragMove(e) {
    if (!screenCaptureDragging) return;
    var newLeft = e.clientX - screenCaptureDragOffsetX;
    var newTop = e.clientY - screenCaptureDragOffsetY;
    applyRect({
        left: newLeft,
        top: newTop,
        width: screenCaptureRect.width,
        height: screenCaptureRect.height
    });
}

function onSelectionDragEnd(e) {
    screenCaptureDragging = false;
    window.removeEventListener('mousemove', onSelectionDragMove);
    window.removeEventListener('mouseup', onSelectionDragEnd);
}

function onSelectionResizeStart(e) {
    screenCaptureResizing = true;
    screenCaptureResizeCorner = e.target.getAttribute('data-corner');
    // Anchor is the opposite corner
    switch (screenCaptureResizeCorner) {
        case 'nw':
            screenCaptureResizeAnchorX = screenCaptureRect.left + screenCaptureRect.width;
            screenCaptureResizeAnchorY = screenCaptureRect.top + screenCaptureRect.height;
            break;
        case 'ne':
            screenCaptureResizeAnchorX = screenCaptureRect.left;
            screenCaptureResizeAnchorY = screenCaptureRect.top + screenCaptureRect.height;
            break;
        case 'sw':
            screenCaptureResizeAnchorX = screenCaptureRect.left + screenCaptureRect.width;
            screenCaptureResizeAnchorY = screenCaptureRect.top;
            break;
        case 'se':
            screenCaptureResizeAnchorX = screenCaptureRect.left;
            screenCaptureResizeAnchorY = screenCaptureRect.top;
            break;
    }
    window.addEventListener('mousemove', onSelectionResizeMove);
    window.addEventListener('mouseup', onSelectionResizeEnd);
}

function onSelectionResizeMove(e) {
    if (!screenCaptureResizing) return;
    var newLeft = Math.min(screenCaptureResizeAnchorX, e.clientX);
    var newTop = Math.min(screenCaptureResizeAnchorY, e.clientY);
    var newWidth = Math.abs(e.clientX - screenCaptureResizeAnchorX);
    var newHeight = Math.abs(e.clientY - screenCaptureResizeAnchorY);
    applyRect({ left: newLeft, top: newTop, width: newWidth, height: newHeight });
}

function onSelectionResizeEnd(e) {
    screenCaptureResizing = false;
    screenCaptureResizeCorner = null;
    window.removeEventListener('mousemove', onSelectionResizeMove);
    window.removeEventListener('mouseup', onSelectionResizeEnd);
    window.removeEventListener('touchmove', onSelectionResizeTouchMove);
    window.removeEventListener('touchend', onSelectionResizeTouchEnd);
    window.removeEventListener('touchcancel', onSelectionResizeTouchEnd);
}

// === Touch event handlers for drag & resize ===

function onSelectionDragTouchStart(e) {
    if (screenCaptureResizing) return;
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    screenCaptureDragging = true;
    screenCaptureDragOffsetX = touch.clientX - screenCaptureRect.left;
    screenCaptureDragOffsetY = touch.clientY - screenCaptureRect.top;
    window.addEventListener('touchmove', onSelectionDragTouchMove, { passive: false });
    window.addEventListener('touchend', onSelectionDragTouchEnd);
    window.addEventListener('touchcancel', onSelectionDragTouchEnd);
    e.preventDefault();
    e.stopPropagation();
}

function onSelectionDragTouchMove(e) {
    if (!screenCaptureDragging) return;
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    var newLeft = touch.clientX - screenCaptureDragOffsetX;
    var newTop = touch.clientY - screenCaptureDragOffsetY;
    applyRect({
        left: newLeft,
        top: newTop,
        width: screenCaptureRect.width,
        height: screenCaptureRect.height
    });
    e.preventDefault();
}

function onSelectionDragTouchEnd(e) {
    screenCaptureDragging = false;
    window.removeEventListener('touchmove', onSelectionDragTouchMove);
    window.removeEventListener('touchend', onSelectionDragTouchEnd);
    window.removeEventListener('touchcancel', onSelectionDragTouchEnd);
}

function onSelectionResizeTouchStart(e) {
    if (e.touches.length !== 1) return;
    screenCaptureResizing = true;
    screenCaptureResizeCorner = e.currentTarget.getAttribute('data-corner');
    // Anchor is the opposite corner
    switch (screenCaptureResizeCorner) {
        case 'nw':
            screenCaptureResizeAnchorX = screenCaptureRect.left + screenCaptureRect.width;
            screenCaptureResizeAnchorY = screenCaptureRect.top + screenCaptureRect.height;
            break;
        case 'ne':
            screenCaptureResizeAnchorX = screenCaptureRect.left;
            screenCaptureResizeAnchorY = screenCaptureRect.top + screenCaptureRect.height;
            break;
        case 'sw':
            screenCaptureResizeAnchorX = screenCaptureRect.left + screenCaptureRect.width;
            screenCaptureResizeAnchorY = screenCaptureRect.top;
            break;
        case 'se':
            screenCaptureResizeAnchorX = screenCaptureRect.left;
            screenCaptureResizeAnchorY = screenCaptureRect.top;
            break;
    }
    window.addEventListener('touchmove', onSelectionResizeTouchMove, { passive: false });
    window.addEventListener('touchend', onSelectionResizeTouchEnd);
    window.addEventListener('touchcancel', onSelectionResizeTouchEnd);
}

function onSelectionResizeTouchMove(e) {
    if (!screenCaptureResizing) return;
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    var newLeft = Math.min(screenCaptureResizeAnchorX, touch.clientX);
    var newTop = Math.min(screenCaptureResizeAnchorY, touch.clientY);
    var newWidth = Math.abs(touch.clientX - screenCaptureResizeAnchorX);
    var newHeight = Math.abs(touch.clientY - screenCaptureResizeAnchorY);
    applyRect({ left: newLeft, top: newTop, width: newWidth, height: newHeight });
    e.preventDefault();
}

function onSelectionResizeTouchEnd(e) {
    screenCaptureResizing = false;
    screenCaptureResizeCorner = null;
    window.removeEventListener('touchmove', onSelectionResizeTouchMove);
    window.removeEventListener('touchend', onSelectionResizeTouchEnd);
    window.removeEventListener('touchcancel', onSelectionResizeTouchEnd);
}

function cleanupScreenCaptureAll() {
    screenCaptureActive = false;
    screenCaptureDragging = false;
    screenCaptureResizing = false;
    if (screenCaptureOverlay) {
        screenCaptureOverlay.remove();
        screenCaptureOverlay = null;
    }
    window.removeEventListener('mousemove', onScreenCaptureMouseMove);
    window.removeEventListener('mouseup', onScreenCaptureMouseUp);
    window.removeEventListener('keydown', onScreenCaptureKeyDown);
    window.removeEventListener('mousemove', onSelectionDragMove);
    window.removeEventListener('mouseup', onSelectionDragEnd);
    window.removeEventListener('mousemove', onSelectionResizeMove);
    window.removeEventListener('mouseup', onSelectionResizeEnd);
    window.removeEventListener('touchmove', onScreenCaptureTouchMove);
    window.removeEventListener('touchend', onScreenCaptureTouchEnd);
    window.removeEventListener('touchcancel', onScreenCaptureTouchEnd);
    window.removeEventListener('touchmove', onSelectionDragTouchMove);
    window.removeEventListener('touchend', onSelectionDragTouchEnd);
    window.removeEventListener('touchcancel', onSelectionDragTouchEnd);
    window.removeEventListener('touchmove', onSelectionResizeTouchMove);
    window.removeEventListener('touchend', onSelectionResizeTouchEnd);
    window.removeEventListener('touchcancel', onSelectionResizeTouchEnd);
    if (screenCaptureSelection) {
        screenCaptureSelection.remove();
        screenCaptureSelection = null;
    }
    if (screenCaptureToolbar) {
        screenCaptureToolbar.remove();
        screenCaptureToolbar = null;
    }
    removeResizeHandles();
    var existingDialog = document.getElementById('imagetrans-sc-dialog');
    if (existingDialog) existingDialog.remove();
    var existingBackdrop = document.getElementById('imagetrans-sc-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    screenCaptureRect = null;
}

// Fallback screen capture for Android/Kiwi Browser where chrome.tabs.captureVisibleTab
// is not supported. Two strategies, tried in order:
//   1. If the selected region overlaps an <img> element, fetch the image data
//      directly (reusing the existing captureImageViaFetch CORS-bypass pipeline),
//      then crop to the selection. This handles the common manga/comics use case.
//   2. Otherwise, use SVG foreignObject to render the visible viewport into a
//      canvas. This works for text-heavy pages but has limitations with
//      cross-origin resources and external stylesheets.
function tryCaptureViewportFallback(rect) {
    // Overall timeout (15s) to avoid hanging on mobile
    var timeoutMs = 15000;
    var fallbackPromise;

    // Strategy 1: Try to capture from an <img> element in the selected region
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    var imgElement = findImgInRect(rect, centerX, centerY);

    if (imgElement) {
        fallbackPromise = captureFromImageElement(imgElement, rect);
    } else {
        // Strategy 2: No <img> found — use SVG foreignObject for text content
        fallbackPromise = captureViaSVGForeignObject(rect);
    }

    // Wrap with a timeout so we never hang
    return new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
            reject(new Error('Viewport capture timed out after ' + (timeoutMs / 1000) + 's'));
        }, timeoutMs);

        fallbackPromise.then(function(dataURL) {
            clearTimeout(timer);
            resolve(dataURL);
        }).catch(function(err) {
            clearTimeout(timer);
            reject(err);
        });
    });
}

// Walk up from the point to find an <img> element
function findImgInRect(rect, cx, cy) {
    // Check elements at the center point first
    var elements = document.elementsFromPoint(cx, cy);
    if (elements) {
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].tagName && elements[i].tagName.toLowerCase() === 'img') {
                var imgRect = elements[i].getBoundingClientRect();
                if (rectsOverlap(rect, imgRect)) {
                    return elements[i];
                }
            }
        }
    }

    // Fallback: scan all images in the document for overlap
    var imgs = document.getElementsByTagName('img');
    var bestImg = null;
    var bestArea = 0;
    for (var j = 0; j < imgs.length; j++) {
        var r = imgs[j].getBoundingClientRect();
        if (rectsOverlap(rect, r)) {
            var overlapArea = overlapAmount(rect, r);
            if (overlapArea > bestArea) {
                bestArea = overlapArea;
                bestImg = imgs[j];
            }
        }
    }
    return bestImg;
}

function rectsOverlap(a, b) {
    return !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top);
}

function overlapAmount(a, b) {
    var xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    var yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return xOverlap * yOverlap;
}

// Capture from an <img> element using the existing CORS-enabled pipeline
function captureFromImageElement(imgElement, rect) {
    return new Promise(function(resolve, reject) {
        var imgRect = imgElement.getBoundingClientRect();

        // Get the image data via the existing pipeline (handles CORS and WebP compression)
        getDataURLFromImg(imgElement).then(function(dataURL) {
            // Now crop the selected region from the image
            var img = new Image();
            img.onload = function() {
                // The image natural size vs displayed size
                var scaleX = img.naturalWidth / imgRect.width;
                var scaleY = img.naturalHeight / imgRect.height;

                // Selection offset relative to the image element
                var offsetX = rect.left - imgRect.left;
                var offsetY = rect.top - imgRect.top;

                var sx = Math.round(offsetX * scaleX);
                var sy = Math.round(offsetY * scaleY);
                var sw = Math.round(rect.width * scaleX);
                var sh = Math.round(rect.height * scaleY);

                // Clamp to image bounds
                sx = Math.max(0, sx);
                sy = Math.max(0, sy);
                sw = Math.min(img.naturalWidth - sx, sw);
                sh = Math.min(img.naturalHeight - sy, sh);

                if (sw <= 0 || sh <= 0) {
                    reject(new Error('Selection is outside the image bounds'));
                    return;
                }

                var c = document.createElement('canvas');
                c.width = sw;
                c.height = sh;
                var ctx = c.getContext('2d');
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                resolve(c.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = function() {
                reject(new Error('Failed to decode image data for cropping'));
            };
            img.src = dataURL;
        }).catch(function(err) {
            // Image fetch failed (CORS, network, etc.) — try SVG as last resort
            console.warn('Image element capture failed:', err.message);
            captureViaSVGForeignObject(rect).then(resolve).catch(reject);
        });
    });
}

// SVG foreignObject approach for text-heavy pages without images
function captureViaSVGForeignObject(rect) {
    return new Promise(function(resolve, reject) {
        try {
            // Collect accessible CSS rules for inline styling
            var styles = '';
            try {
                var styleSheets = document.styleSheets;
                for (var i = 0; i < styleSheets.length; i++) {
                    try {
                        var rules = styleSheets[i].cssRules || styleSheets[i].rules;
                        if (rules) {
                            for (var j = 0; j < rules.length; j++) {
                                var cssText = rules[j].cssText;
                                if (cssText) {
                                    styles += cssText + '\n';
                                }
                            }
                        }
                    } catch (e) {
                        // Cross-origin stylesheet — skip silently
                    }
                }
            } catch (e) {
                // Stylesheet access denied entirely
            }

            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('width', window.innerWidth);
            svg.setAttribute('height', window.innerHeight);

            var fo = document.createElementNS(svgNS, 'foreignObject');
            fo.setAttribute('width', '100%');
            fo.setAttribute('height', '100%');

            var wrapper = document.createElement('div');
            wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

            if (styles) {
                var styleEl = document.createElement('style');
                styleEl.setAttribute('type', 'text/css');
                styleEl.textContent = styles;
                wrapper.appendChild(styleEl);
            }

            // Clone visible body content (shallow — images/canvases won't render)
            var bodyClone = document.body.cloneNode(true);
            var scripts = bodyClone.querySelectorAll('script');
            for (var s = 0; s < scripts.length; s++) {
                scripts[s].remove();
            }
            wrapper.appendChild(bodyClone);
            fo.appendChild(wrapper);
            svg.appendChild(fo);

            var svgData = new XMLSerializer().serializeToString(svg);
            var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            var url = URL.createObjectURL(svgBlob);

            var img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(url);
                var scale = img.naturalWidth / window.innerWidth;
                var sx = Math.round(rect.left * scale);
                var sy = Math.round(rect.top * scale);
                var sw = Math.round(rect.width * scale);
                var sh = Math.round(rect.height * scale);

                if (sw <= 0 || sh <= 0) {
                    reject(new Error('Invalid crop dimensions'));
                    return;
                }

                var c = document.createElement('canvas');
                c.width = sw;
                c.height = sh;
                var ctx = c.getContext('2d');
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                resolve(c.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject(new Error('Viewport capture is not available on this browser.'));
            };
            img.src = url;
        } catch (e) {
            reject(e);
        }
    });
}

function doScreenOCR() {
    var rect = screenCaptureRect;
    if (screenCaptureToolbar) {
        var btns = screenCaptureToolbar.getElementsByTagName('button');
        if (btns.length > 0) {
            btns[0].textContent = chrome.i18n.getMessage("sc_processing");
            btns[0].disabled = true;
        }
    }

    chrome.runtime.sendMessage({action: "captureVisibleTab"}, function(response) {
        if (chrome.runtime.lastError || !response || !response.dataURL) {
            // Use the error from background's captureVisibleTab if available
            var errMsg = 'unknown error';
            if (chrome.runtime.lastError && chrome.runtime.lastError.message) {
                errMsg = chrome.runtime.lastError.message;
            } else if (response && response.error) {
                errMsg = response.error;
            }
            console.log('captureVisibleTab failed: ' + errMsg + '. Trying fallback...');
            // On Android/Kiwi Browser, captureVisibleTab is not supported.
            // Try a canvas-based fallback to capture the viewport.
            tryCaptureViewportFallback(rect).then(function(croppedDataURL) {
                processScreenOCR(croppedDataURL);
            }).catch(function(fallbackErr) {
                console.error('Viewport fallback also failed:', fallbackErr);
                alert(chrome.i18n.getMessage("sc_failed_capture", errMsg));
                resetToolbarButton();
            });
            return;
        }

        var img = new Image();
        img.onload = function() {
            var scale = img.naturalWidth / window.innerWidth;
            var sx = rect.left * scale;
            var sy = rect.top * scale;
            var sw = rect.width * scale;
            var sh = rect.height * scale;

            var c = document.createElement('canvas');
            c.width = sw;
            c.height = sh;
            var ctx = c.getContext('2d');
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            var croppedDataURL = c.toDataURL('image/jpeg', 0.9);

            processScreenOCR(croppedDataURL);
        };
        img.onerror = function() {
            alert(chrome.i18n.getMessage("sc_failed_load"));
            resetToolbarButton();
        };
        img.src = response.dataURL;
    });
}

function resetToolbarButton() {
    if (screenCaptureToolbar) {
        var btns = screenCaptureToolbar.getElementsByTagName('button');
        if (btns.length > 0) {
            btns[0].textContent = chrome.i18n.getMessage("sc_recognize");
            btns[0].disabled = false;
        }
    }
}

function processScreenOCR(dataURL) {
    if (sourceLang === "auto" && (translationMode === "local" || screenCaptureServerFailed)) {
        alert(chrome.i18n.getMessage("alert_set_langpair"));
        chrome.runtime.sendMessage("showOptions");
        resetToolbarButton();
        return;
    }
    if (translationMode === "imagetrans" && !screenCaptureServerFailed) {
        processScreenOCRWithImageTrans(dataURL);
    } else {
        processScreenOCRWithPaddle(dataURL);
    }
}

function processScreenOCRWithImageTrans(dataURL) {
    var ocrData = {
        src: dataURL,
        saveToFile: "true",
        displayName: displayName || "default",
        password: password,
        withoutImage: "true"
    };
    if (sourceLang !== "auto") ocrData["sourceLang"] = sourceLang;
    if (targetLang !== "auto") ocrData["targetLang"] = targetLang;

    var ocrParams = new URLSearchParams();
    for (var k in ocrData) {
        if (ocrData[k] !== undefined && ocrData[k] !== null) {
            ocrParams.append(k, ocrData[k]);
        }
    }

    doFetch(serverURL + '/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: ocrParams.toString(),
        cache: 'no-store'
    }).then(function(ocrResponse) {
        if (!ocrResponse.ok) {
            throw new Error('ImageTrans OCR failed: HTTP ' + ocrResponse.status);
        }
        return ocrResponse.data;
    }).then(function(ocrResult) {
        if (!ocrResult["imgMap"] || !ocrResult["imgMap"]["boxes"]) {
            throw new Error('ImageTrans did not return text boxes');
        }
        var boxes = ocrResult["imgMap"]["boxes"];
        var hasTranslations = boxes.some(function(b) {
            return b.target && b.target.trim();
        });
        if (hasTranslations) {
            displayResult(dataURL, boxes);
        } else {
            handleScreenOCRResult(dataURL, boxes);
        }
    }).catch(function(err) {
        console.log('ImageTrans screen OCR failed, falling back to PaddleOCR:', err.message);
        screenCaptureServerFailed = true;
        processScreenOCRWithPaddle(dataURL);
    });
}

function processScreenOCRWithPaddle(dataURL) {
    injectPaddleLibraries().then(function() {
        return ensurePaddleModel(sourceLang);
    }).then(function() {
        return paddleOCR(dataURL, sourceLang);
    }).then(function(boxes) {
        handleScreenOCRResult(dataURL, boxes);
    }).catch(function(err) {
        console.error('Screen OCR failed:', err);
        alert(chrome.i18n.getMessage("sc_ocr_failed", err.message));
        resetToolbarButton();
    });
}

function displayResult(dataURL, boxes) {
    console.log('displayResult: screenCaptureOverlayMode=' + screenCaptureOverlayMode + ', boxes.length=' + boxes.length);
    if (screenCaptureOverlayMode && boxes.length > 0) {
        showOverlayResult(dataURL, boxes);
    } else {
        showResultDialog(dataURL, boxes);
        if (addPinyinToSource) {
            annotatePinyinInDialog(boxes);
        }
    }
}

function annotatePinyinInDialog(boxes) {
    var dialog = document.getElementById('imagetrans-sc-dialog');
    if (!dialog) return;
    var sourceDivs = dialog.querySelectorAll('.imagetrans-source-text');
    for (var i = 0; i < boxes.length && i < sourceDivs.length; i++) {
        (function(idx, div) {
            var src = boxes[idx].source || boxes[idx].text || boxes[idx].target || '';
            annotatePinyinAsync(src).then(function(annotated) {
                if (annotated !== src) {
                    div.innerHTML = annotated;
                }
            });
        })(i, sourceDivs[i]);
    }
}

function handleScreenOCRResult(dataURL, boxes) {
    var sourceTexts = [];
    for (var i = 0; i < boxes.length; i++) {
        var t = boxes[i].source || boxes[i].text || boxes[i].target || '';
        sourceTexts.push(t);
    }

    if (sourceTexts.length === 0 || sourceTexts.every(function(t) { return !t; })) {
        showResultDialog(dataURL, [], chrome.i18n.getMessage("sc_no_text_detected"));
        return;
    }

    if (useOpenAI) {
        return translateScreenTextsViaOpenAI(sourceTexts).then(function(translations) {
            for (var j = 0; j < boxes.length && j < translations.length; j++) {
                boxes[j].target = translations[j];
            }
            displayResult(dataURL, boxes);
        });
    } else if (defaultPresetTranslation === "glm4flash") {
        var reflowedTexts = sourceTexts.map(function(t) { return reflowText(sourceLang, t); });
        return Promise.race([
            translateUsingGlm4Flash(reflowedTexts),
            new Promise(function(_, reject) {
                setTimeout(function() { reject(new Error("glm4flash timeout")); }, 10000);
            })
        ]).then(function(translations) {
            for (var j = 0; j < boxes.length && j < translations.length; j++) {
                boxes[j].target = translations[j] || '';
            }
            displayResult(dataURL, boxes);
        }).catch(function(e) {
            console.warn("glm4flash translation timed out or failed, falling back to mymemory:", e);
            return translateScreenTextsViaMyMemory(sourceTexts).then(function(translations) {
                for (var j = 0; j < boxes.length && j < translations.length; j++) {
                    boxes[j].target = translations[j];
                }
                displayResult(dataURL, boxes);
            });
        });
    } else {
        return translateScreenTextsViaMyMemory(sourceTexts).then(function(translations) {
            for (var j = 0; j < boxes.length && j < translations.length; j++) {
                boxes[j].target = translations[j];
            }
            displayResult(dataURL, boxes);
        });
    }
}

function translateScreenTextsViaMyMemory(sourceTexts) {
    var promises = [];
    for (var i = 0; i < sourceTexts.length; i++) {
        if (sourceTexts[i]) {
            promises.push(translateUsingMyMemory(sourceTexts[i]));
        } else {
            promises.push(Promise.resolve(''));
        }
    }
    return Promise.all(promises);
}

function translateScreenTextsViaOpenAI(sourceTexts) {
    var actualTargetLang = targetLang === 'auto' ? 'english' : targetLang;
    var prompt = openaiPrompt
        .replace(/\{sourceLang\}/g, sourceLang)
        .replace(/\{targetLang\}/g, actualTargetLang)
        .replace(/\{texts\}/g, JSON.stringify(sourceTexts));

    var apiUrl = openaiURL.replace(/\/+$/, '') + '/chat/completions';

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + openaiKey
        },
        body: JSON.stringify({
            model: openaiModel,
            messages: [{ role: 'user', content: prompt }]
        })
    }).then(function(resp) {
        if (!resp.ok) {
            return resp.text().then(function(t) { throw new Error('OpenAI API error HTTP ' + resp.status + ': ' + t); });
        }
        return resp.json();
    }).then(function(result) {
        var content = result.choices[0].message.content;
        var translatedTexts;
        try {
            translatedTexts = JSON.parse(content);
        } catch (e) {
            var match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) {
                translatedTexts = JSON.parse(match[1]);
            } else {
                throw new Error('Failed to parse translation response as JSON.');
            }
        }
        if (!Array.isArray(translatedTexts)) {
            if (translatedTexts && translatedTexts.translations) {
                translatedTexts = translatedTexts.translations;
            } else if (translatedTexts && translatedTexts.texts) {
                translatedTexts = translatedTexts.texts;
            } else {
                return sourceTexts.map(function() { return ''; });
            }
        }
        return translatedTexts;
    });
}

function showOverlayResult(dataURL, boxes) {
    var existingOverlay = document.getElementById('imagetrans-sc-overlay-wrap');
    if (existingOverlay) existingOverlay.remove();

    resetToolbarButton();

    renderTranslatedImage(dataURL, boxes).then(function(renderedDataURL) {
        var rect = screenCaptureRect;

        var wrap = document.createElement('div');
        wrap.id = 'imagetrans-sc-overlay-wrap';
        wrap.style.cssText = 'position:fixed;z-index:2147483647;';
        wrap.style.left = rect.left + 'px';
        wrap.style.top = rect.top + 'px';
        wrap.style.width = rect.width + 'px';
        wrap.style.height = rect.height + 'px';

        var img = document.createElement('img');
        img.src = renderedDataURL;
        img.style.cssText = 'width:100%;height:100%;display:block;';
        img.draggable = false;

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute;top:2px;right:2px;z-index:1;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;line-height:1;cursor:pointer;display:none;padding:0;';
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            wrap.remove();
        });

        wrap.appendChild(img);
        wrap.appendChild(closeBtn);
        document.body.appendChild(wrap);

        wrap.addEventListener('mouseenter', function() { closeBtn.style.display = 'block'; });
        wrap.addEventListener('mouseleave', function() { closeBtn.style.display = 'none'; });

        var dragging = false;
        var dragStartX = 0;
        var dragStartY = 0;
        var wrapStartLeft = 0;
        var wrapStartTop = 0;

        wrap.addEventListener('mousedown', function(e) {
            if (e.target === closeBtn) return;
            dragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            wrapStartLeft = wrap.offsetLeft;
            wrapStartTop = wrap.offsetTop;
            wrap.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            var dx = e.clientX - dragStartX;
            var dy = e.clientY - dragStartY;
            wrap.style.left = Math.max(0, Math.min(wrapStartLeft + dx, window.innerWidth - wrap.offsetWidth)) + 'px';
            wrap.style.top = Math.max(0, Math.min(wrapStartTop + dy, window.innerHeight - wrap.offsetHeight)) + 'px';
        });
        document.addEventListener('mouseup', function() {
            if (dragging) {
                dragging = false;
                wrap.style.cursor = 'grab';
            }
        });

        wrap.addEventListener('touchstart', function(e) {
            if (e.target === closeBtn) return;
            if (e.touches.length === 1) {
                dragging = true;
                dragStartX = e.touches[0].clientX;
                dragStartY = e.touches[0].clientY;
                wrapStartLeft = wrap.offsetLeft;
                wrapStartTop = wrap.offsetTop;
            }
        }, {passive: true});
        document.addEventListener('touchmove', function(e) {
            if (!dragging || e.touches.length !== 1) return;
            var dx = e.touches[0].clientX - dragStartX;
            var dy = e.touches[0].clientY - dragStartY;
            wrap.style.left = Math.max(0, Math.min(wrapStartLeft + dx, window.innerWidth - wrap.offsetWidth)) + 'px';
            wrap.style.top = Math.max(0, Math.min(wrapStartTop + dy, window.innerHeight - wrap.offsetHeight)) + 'px';
        }, {passive: true});
        document.addEventListener('touchend', function() {
            dragging = false;
        });

        wrap.style.cursor = 'grab';
    }).catch(function(err) {
        console.error('showOverlayResult render failed:', err);
        showResultDialog(dataURL, boxes);
    });
}

function showResultDialog(dataURL, boxes, message) {
    var existingBackdrop = document.getElementById('imagetrans-sc-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    var existingDialog = document.getElementById('imagetrans-sc-dialog');
    if (existingDialog) existingDialog.remove();

    resetToolbarButton();

    var backdrop = document.createElement('div');
    backdrop.id = 'imagetrans-sc-backdrop';
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;background:rgba(0,0,0,0.3);';
    backdrop.addEventListener('click', function() {
        backdrop.remove();
        dialog.remove();
    });

    var isMobile = window.innerWidth < 600;
    var dialog = document.createElement('div');
    dialog.id = 'imagetrans-sc-dialog';
    dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483648;background:#fff;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.25);width:' + (isMobile ? 'calc(100vw - 16px)' : '520px') + ';max-width:520px;max-height:85vh;display:flex;flex-direction:column;font-family:sans-serif;';
    dialog.addEventListener('click', function(e) { e.stopPropagation(); });

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:' + (isMobile ? '14px 12px' : '12px 16px') + ';border-bottom:1px solid #eee;flex-shrink:0;';
    var title = document.createElement('span');
    title.textContent = chrome.i18n.getMessage("sc_title");
    title.style.cssText = 'font-size:' + (isMobile ? '15px' : '16px') + ';font-weight:600;color:#333;';
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;font-size:' + (isMobile ? '22px' : '18px') + ';cursor:pointer;color:#999;padding:' + (isMobile ? '4px' : '0') + ';line-height:1;min-width:32px;min-height:32px;';
    closeBtn.addEventListener('click', function() { backdrop.remove(); dialog.remove(); });
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    var body = document.createElement('div');
    body.style.cssText = 'padding:' + (isMobile ? '12px' : '16px') + ';overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch;';

    if (message) {
        var msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.cssText = 'color:#666;text-align:center;padding:20px 0;';
        body.appendChild(msgDiv);
    } else if (boxes.length === 0) {
        var emptyDiv = document.createElement('div');
        emptyDiv.textContent = chrome.i18n.getMessage("sc_no_text");
        emptyDiv.style.cssText = 'color:#666;text-align:center;padding:20px 0;';
        body.appendChild(emptyDiv);
    } else {
        // Image thumbnail
        var thumbWrap = document.createElement('div');
        thumbWrap.style.cssText = 'text-align:center;margin-bottom:16px;';
        var thumb = document.createElement('img');
        thumb.src = dataURL;
        thumb.style.cssText = 'max-width:200px;max-height:120px;border-radius:4px;border:1px solid #eee;';
        thumbWrap.appendChild(thumb);
        body.appendChild(thumbWrap);

        // Results list
        var list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
        for (var i = 0; i < boxes.length; i++) {
            var source = boxes[i].source || boxes[i].text || boxes[i].target || '';
            var target = boxes[i].target || '';
            if (!source && !target) continue;

            var row = document.createElement('div');
            row.style.cssText = 'border-left:3px solid #4A90D9;padding-left:10px;';

            var resultFontSource = isMobile ? '15px' : '14px';
            var resultFontTarget = isMobile ? '14px' : '13px';

            var sourceDiv = document.createElement('div');
            sourceDiv.textContent = source;
            sourceDiv.className = 'imagetrans-source-text';
            sourceDiv.style.cssText = 'font-size:' + resultFontSource + ';color:#333;margin-bottom:4px;line-height:1.4;word-break:break-word;';

            var transDiv = document.createElement('div');
            transDiv.textContent = chrome.i18n.getMessage("sc_arrow") + target;
            transDiv.style.cssText = 'font-size:' + resultFontTarget + ';color:#4A90D9;line-height:1.4;word-break:break-word;';

            row.appendChild(sourceDiv);
            row.appendChild(transDiv);
            list.appendChild(row);
        }
        body.appendChild(list);
    }

    // Footer
    var btnPad = isMobile ? '10px 14px' : '6px 16px';
    var btnFont = isMobile ? '15px' : '14px';
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:' + (isMobile ? '12px 10px' : '12px 16px') + ';border-top:1px solid #eee;display:flex;justify-content:space-between;gap:6px;flex-shrink:0;flex-wrap:wrap;';
    var footerLeft = document.createElement('div');
    footerLeft.style.cssText = 'display:flex;gap:6px;';
    var footerRight = document.createElement('div');
    footerRight.style.cssText = 'display:flex;gap:6px;';

    var btnContinue = document.createElement('button');
    btnContinue.textContent = chrome.i18n.getMessage("sc_new_region");
    btnContinue.style.cssText = 'padding:' + btnPad + ';background:#5cb85c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:' + btnFont + ';white-space:nowrap;touch-action:manipulation;';
    btnContinue.addEventListener('click', function() {
        backdrop.remove();
        dialog.remove();
        cleanupScreenCaptureAll();
        startScreenCapture();
    });

    var btnReOCR = document.createElement('button');
    btnReOCR.textContent = chrome.i18n.getMessage("sc_recognize");
    btnReOCR.style.cssText = 'padding:' + btnPad + ';background:#4A90D9;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:' + btnFont + ';white-space:nowrap;touch-action:manipulation;';
    btnReOCR.addEventListener('click', function() {
        backdrop.remove();
        dialog.remove();
        doScreenOCR();
    });

    var btnClose = document.createElement('button');
    btnClose.textContent = chrome.i18n.getMessage("sc_close");
    btnClose.style.cssText = 'padding:' + btnPad + ';background:#fff;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:' + btnFont + ';white-space:nowrap;touch-action:manipulation;';
    btnClose.addEventListener('click', function() { backdrop.remove(); dialog.remove(); });

    footerLeft.appendChild(btnContinue);
    footerRight.appendChild(btnReOCR);
    footerRight.appendChild(btnClose);
    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
}
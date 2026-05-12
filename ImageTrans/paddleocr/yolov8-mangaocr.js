
// localOcr.js - Local OCR using ONNX Runtime Web
// YOLOv8 text line detection + MangaOCR text recognition
var LocalOCR = (function () {
    // "use strict";

    let initialized = false;
    let yoloSession = null;
    let encoderSession = null;
    let decoderSession = null;
    let vocab = [];

    const INPUT_SIZE_YOLO = 640;
    const INPUT_SIZE_OCR = 224;
    const CONF_THRESHOLD = 0.25;
    const NMS_THRESHOLD = 0.45;
    const MAX_DECODER_STEPS = 64;

    function extUrl(path) {
        return (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL(path) : path;
    }

    // ---- Vocab loading ----
    async function loadVocab() {
        const resp = await fetch(extUrl("mangaocr/vocab.txt"));
        const text = await resp.text();
        vocab = text.split("\n").map(function (l) { return l.trim(); });
    }

    // ---- Image utilities ----
    function loadImageFromDataURL(dataURL) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    function imageElementToCanvas(img) {
        var c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return c;
    }

    // ---- YOLOv8 preprocessing (letterbox) ----
    function letterbox(sourceCanvas, targetW, targetH) {
        var srcW = sourceCanvas.width;
        var srcH = sourceCanvas.height;
        var ratio = Math.min(targetW / srcW, targetH / srcH);
        var newW = Math.round(srcW * ratio);
        var newH = Math.round(srcH * ratio);
        var dw = (targetW - newW) / 2;
        var dh = (targetH - newH) / 2;

        var canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "#727272";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(sourceCanvas, 0, 0, srcW, srcH, dw, dh, newW, newH);

        return { canvas: canvas, ratio: ratio, dw: dw, dh: dh, srcW: srcW, srcH: srcH };
    }

    // Convert ImageData to NCHW Float32Array
    function imageDataToNCHW(imageData, mean, std, targetW, targetH) {
        var data = imageData.data;
        var h = targetH || imageData.height;
        var w = targetW || imageData.width;
        var size = h * w;
        var tensorData = new Float32Array(3 * size);

        for (var i = 0; i < size; i++) {
            var r = data[i * 4] / 255.0;
            var g = data[i * 4 + 1] / 255.0;
            var b = data[i * 4 + 2] / 255.0;
            tensorData[i] = (r - mean[0]) / std[0];
            tensorData[size + i] = (g - mean[1]) / std[1];
            tensorData[2 * size + i] = (b - mean[2]) / std[2];
        }
        return tensorData;
    }

    function preprocessYOLO(sourceCanvas) {
        var lb = letterbox(sourceCanvas, INPUT_SIZE_YOLO, INPUT_SIZE_YOLO);
        var ctx = lb.canvas.getContext("2d");
        var inputImageData = ctx.getImageData(0, 0, INPUT_SIZE_YOLO, INPUT_SIZE_YOLO);
        var tensorData = imageDataToNCHW(inputImageData, [0, 0, 0], [1, 1, 1], INPUT_SIZE_YOLO, INPUT_SIZE_YOLO);
        return { tensorData: tensorData, ratio: lb.ratio, dw: lb.dw, dh: lb.dh, srcW: lb.srcW, srcH: lb.srcH };
    }

    // ---- YOLOv8 postprocessing ----
    function postprocessYOLO(outputData, outputDims, ratio, dw, dh, srcW, srcH) {
        var numDims = outputDims.length;
        var dims, numBoxes;

        // Handle both [1, dims, numBoxes] and [dims, numBoxes]
        if (numDims === 3) {
            dims = outputDims[1];
            numBoxes = outputDims[2];
        } else {
            dims = outputDims[0];
            numBoxes = outputDims[1];
        }

        // Transpose to [numBoxes, dims]
        var numClasses = dims - 4;
        var detections = [];

        for (var i = 0; i < numBoxes; i++) {
            // Extract box coordinates and class scores
            var x = outputData[i];
            var y = outputData[numBoxes + i];
            var w = outputData[2 * numBoxes + i];
            var h = outputData[3 * numBoxes + i];

            var maxScore = -1;
            var maxClass = -1;
            for (var c = 0; c < numClasses; c++) {
                var score = outputData[(4 + c) * numBoxes + i];
                if (score > maxScore) {
                    maxScore = score;
                    maxClass = c;
                }
            }

            if (maxScore < CONF_THRESHOLD) continue;
            if (maxClass === 5) continue;

            // xywh to xyxy
            var x1 = x - w / 2;
            var y1 = y - h / 2;
            var x2 = x + w / 2;
            var y2 = y + h / 2;
            if (x1 >= x2 || y1 >= y2) continue;

            detections.push({ classId: maxClass, confidence: maxScore, bbox: [x1, y1, x2, y2] });
        }

        var nmsResults = applyNMS(detections, NMS_THRESHOLD);
        return scaleCoords(nmsResults, ratio, dw, dh, srcW, srcH);
    }

    function iou(boxA, boxB) {
        var xA = Math.max(boxA[0], boxB[0]);
        var yA = Math.max(boxA[1], boxB[1]);
        var xB = Math.min(boxA[2], boxB[2]);
        var yB = Math.min(boxA[3], boxB[3]);
        var interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        if (interArea === 0) return 0;
        var boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
        var boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);
        return interArea / (boxAArea + boxBArea - interArea);
    }

    function applyNMS(detections, iouThreshold) {
        var byClass = {};
        for (var d = 0; d < detections.length; d++) {
            var det = detections[d];
            var cls = det.classId;
            if (!byClass[cls]) byClass[cls] = [];
            byClass[cls].push(det);
        }

        var results = [];
        var classKeys = Object.keys(byClass);
        for (var k = 0; k < classKeys.length; k++) {
            var boxes = byClass[classKeys[k]];
            boxes.sort(function (a, b) { return b.confidence - a.confidence; });

            while (boxes.length > 0) {
                var best = boxes.shift();
                results.push(best);
                for (var i = boxes.length - 1; i >= 0; i--) {
                    if (iou(best.bbox, boxes[i].bbox) >= iouThreshold) {
                        boxes.splice(i, 1);
                    }
                }
            }
        }
        return results;
    }

    function scaleCoords(detections, ratio, dw, dh, srcW, srcH) {
        var result = [];
        for (var d = 0; d < detections.length; d++) {
            var det = detections[d];
            var b = det.bbox;
            result.push({
                classId: det.classId,
                confidence: det.confidence,
                bbox: [
                    Math.max(0, Math.min(srcW - 1, Math.round((b[0] - dw) / ratio))),
                    Math.max(0, Math.min(srcH - 1, Math.round((b[1] - dh) / ratio))),
                    Math.max(0, Math.min(srcW - 1, Math.round((b[2] - dw) / ratio))),
                    Math.max(0, Math.min(srcH - 1, Math.round((b[3] - dh) / ratio)))
                ]
            });
        }
        return result;
    }

    // ---- MangaOCR preprocessing ----
    function preprocessMangaOCR(sourceCanvas) {
        // sourceCanvas is the cropped text region
        var canvas = document.createElement("canvas");
        canvas.width = INPUT_SIZE_OCR;
        canvas.height = INPUT_SIZE_OCR;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, INPUT_SIZE_OCR, INPUT_SIZE_OCR);
        var imageData = ctx.getImageData(0, 0, INPUT_SIZE_OCR, INPUT_SIZE_OCR);
        var data = imageData.data;

        var size = INPUT_SIZE_OCR * INPUT_SIZE_OCR;
        var tensorData = new Float32Array(3 * size);

        for (var i = 0; i < size; i++) {
            // Convert to grayscale, then normalize with mean=0.5, std=0.5 => [0,255]/127.5 - 1 = [-1, 1]
            var gray = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
            var normalized = gray / 127.5 - 1.0;
            tensorData[i] = normalized;
            tensorData[size + i] = normalized;
            tensorData[2 * size + i] = normalized;
        }
        return tensorData;
    }

    // ---- MangaOCR decoding and postprocessing ----
    function decodeTokens(tokenIds) {
        var result = "";
        for (var i = 0; i < tokenIds.length; i++) {
            var id = tokenIds[i];
            if (id < 5) continue;
            if (id < vocab.length) {
                result += vocab[id];
            }
        }
        return postprocessText(result);
    }

    function postprocessText(text) {
        text = text.replace(/\s+/g, "");
        text = text.replace(/…/g, "...");
        text = text.replace(/[・.]{2,}/g, function (m) { return ".".repeat(Math.min(m.length, 3)); });
        text = h2z(text);
        return text;
    }

    function h2z(text) {
        var result = "";
        for (var i = 0; i < text.length; i++) {
            var code = text.charCodeAt(i);
            if (code >= 33 && code <= 126) {
                result += String.fromCharCode(code - 33 + 0xFF01);
            } else if (code === 32) {
                result += "　";
            } else {
                result += text[i];
            }
        }
        return result;
    }

    // ---- Inference functions ----
    async function runYOLO(sourceCanvas) {
        if (!yoloSession) throw new Error("YOLO model not loaded");

        var prep = preprocessYOLO(sourceCanvas);
        var tensor = new ort.Tensor("float32", prep.tensorData, [1, 3, INPUT_SIZE_YOLO, INPUT_SIZE_YOLO]);

        var outputMap = await yoloSession.run((function () {
            var feeds = {};
            feeds[yoloSession.inputNames[0]] = tensor;
            return feeds;
        })());

        var output = outputMap[yoloSession.outputNames[0]];
        return postprocessYOLO(output.data, output.dims, prep.ratio, prep.dw, prep.dh, prep.srcW, prep.srcH);
    }

    async function runMangaOCR(cropCanvas) {
        if (!encoderSession || !decoderSession) throw new Error("MangaOCR models not loaded");

        var tensorData = preprocessMangaOCR(cropCanvas);
        var encoderInput = new ort.Tensor("float32", tensorData, [1, 3, INPUT_SIZE_OCR, INPUT_SIZE_OCR]);

        var encFeeds = {};
        encFeeds[encoderSession.inputNames[0]] = encoderInput;
        var encoderOutputs = await encoderSession.run(encFeeds);
        var encoderHiddenStates = encoderOutputs[encoderSession.outputNames[0]];

        // Autoregressive decoding
        var tokenIds = [2]; // BOS
        var decoderInputName = decoderSession.inputNames[0];
        var decoderHiddenName = decoderSession.inputNames[1];

        for (var step = 0; step < MAX_DECODER_STEPS; step++) {
            var bigIntArr = new BigInt64Array(tokenIds.length);
            for (var t = 0; t < tokenIds.length; t++) {
                bigIntArr[t] = BigInt(tokenIds[t]);
            }
            var inputIdsTensor = new ort.Tensor("int64", bigIntArr, [1, tokenIds.length]);

            var decFeeds = {};
            decFeeds[decoderInputName] = inputIdsTensor;
            decFeeds[decoderHiddenName] = encoderHiddenStates;
            var decoderOutputs = await decoderSession.run(decFeeds);
            var logits = decoderOutputs[decoderSession.outputNames[0]];

            var logitsData = logits.data;
            var vocabSize = logits.dims[logits.dims.length - 1];
            var lastPos = logits.dims[logits.dims.length - 2] - 1;
            var offset = lastPos * vocabSize;

            var maxLogit = -Infinity;
            var maxId = 0;
            for (var v = 0; v < vocabSize; v++) {
                if (logitsData[offset + v] > maxLogit) {
                    maxLogit = logitsData[offset + v];
                    maxId = v;
                }
            }

            tokenIds.push(maxId);
            if (maxId === 3) break;
        }

        return decodeTokens(tokenIds);
    }

    // ---- Public API ----
    async function initialize(progressCallback) {
        if (initialized) return;

        var ortGlobal = (typeof ort !== "undefined") ? ort : (window.ort || self.ort);
        if (!ortGlobal) {
            throw new Error("ONNX Runtime Web not loaded. Make sure lib/ort.all.min.js is loaded.");
        }

        ortGlobal.env.wasm.wasmPaths = extUrl("./");
        ortGlobal.env.wasm.numThreads = 1;

        if (progressCallback) progressCallback("Loading vocabulary...");
        await loadVocab();

        var yoloUrl = extUrl("model.onnx");
        var encoderUrl = extUrl("mangaocr/encoder.onnx");
        var decoderUrl = extUrl("mangaocr/decoder.onnx");

        if (progressCallback) progressCallback("Loading models (this may take a while)...");
        var sessionOpts = { executionProviders: ["webgpu", "webgl", "wasm"], graphOptimizationLevel: "all" };
        // Create sessions sequentially to avoid WASM init race condition in ONNX Runtime Web
        yoloSession = await ortGlobal.InferenceSession.create(yoloUrl, sessionOpts);
        encoderSession = await ortGlobal.InferenceSession.create(encoderUrl, sessionOpts);
        decoderSession = await ortGlobal.InferenceSession.create(decoderUrl, sessionOpts);

        yoloSession = results[0];
        encoderSession = results[1];
        decoderSession = results[2];
        initialized = true;

        if (progressCallback) progressCallback("Local OCR ready.");
    }

    // Merge detections that are on the same horizontal line and close together.
    // This reduces OCR calls without hurting accuracy since MangaOCR expects single lines.
    function mergeHorizontalNeighbors(detections) {
        if (detections.length <= 1) return detections;

        // Sort by Y first, then X
        var sorted = detections.slice().sort(function (a, b) {
            var ay = (a.bbox[1] + a.bbox[3]) / 2;
            var by = (b.bbox[1] + b.bbox[3]) / 2;
            if (Math.abs(ay - by) < 10) return a.bbox[0] - b.bbox[0];
            return ay - by;
        });

        var merged = [];
        var used = new Array(sorted.length).fill(false);

        for (var i = 0; i < sorted.length; i++) {
            if (used[i]) continue;
            var base = sorted[i];
            var bx1 = base.bbox[0], by1 = base.bbox[1], bx2 = base.bbox[2], by2 = base.bbox[3];
            used[i] = true;

            // Look for neighbors on the same line to the right
            for (var j = 0; j < sorted.length; j++) {
                if (used[j]) continue;
                var cand = sorted[j];
                var cx1 = cand.bbox[0], cy1 = cand.bbox[1], cx2 = cand.bbox[2], cy2 = cand.bbox[3];

                // Same line: vertical overlap > 50% of the shorter box
                var overlapTop = Math.max(by1, cy1);
                var overlapBot = Math.min(by2, cy2);
                var overlapH = overlapBot - overlapTop;
                var minH = Math.min(by2 - by1, cy2 - cy1);
                if (overlapH > 0 && overlapH / minH > 0.5) {
                    // Close horizontally: gap < average height
                    var gap = cx1 - bx2;
                    var avgH = (by2 - by1 + cy2 - cy1) / 2;
                    if (gap > 0 && gap < avgH * 2) {
                        // Merge
                        bx2 = Math.max(bx2, cx2);
                        by1 = Math.min(by1, cy1);
                        by2 = Math.max(by2, cy2);
                        used[j] = true;
                    }
                }
            }

            merged.push({
                classId: base.classId,
                confidence: base.confidence,
                bbox: [bx1, by1, bx2, by2]
            });
        }

        return merged;
    }

    async function detectAndRecognize(source, progressCallback) {
        // source can be: dataURL string, HTMLImageElement, HTMLCanvasElement
        var canvas;
        if (typeof source === "string") {
            var img = await loadImageFromDataURL(source);
            canvas = imageElementToCanvas(img);
        } else if (source.tagName === "IMG") {
            canvas = imageElementToCanvas(source);
        } else if (source.tagName === "CANVAS") {
            canvas = source;
        } else {
            throw new Error("Unsupported source type for local OCR");
        }

        if (progressCallback) progressCallback("Detecting text lines...");
        var detections = await runYOLO(canvas);

        // Merge horizontally-adjacent regions to reduce OCR calls
        detections = mergeHorizontalNeighbors(detections);
        if (progressCallback) progressCallback("Recognizing " + detections.length + " text regions...");

        var results = [];
        for (var i = 0; i < detections.length; i++) {
            if (progressCallback) {
                progressCallback("OCR " + (i + 1) + "/" + detections.length + "...");
            }

            var det = detections[i];
            var b = det.bbox;
            var w = b[2] - b[0];
            var h = b[3] - b[1];
            if (w < 4 || h < 4) continue;

            var cropCanvas = document.createElement("canvas");
            cropCanvas.width = w;
            cropCanvas.height = h;
            var cropCtx = cropCanvas.getContext("2d");
            cropCtx.drawImage(canvas, b[0], b[1], w, h, 0, 0, w, h);

            try {
                var text = await runMangaOCR(cropCanvas);
                if (text) {
                    results.push({
                        geometry: { X: b[0], Y: b[1], width: w, height: h },
                        source: text,
                        target: "",
                        classId: det.classId,
                        confidence: det.confidence
                    });
                }
            } catch (e) {
                console.error("OCR failed for region " + i, e);
            }
        }

        return results;
    }

    function isInitialized() {
        return initialized;
    }

    return {
        initialize: initialize,
        detectAndRecognize: detectAndRecognize,
        isInitialized: isInitialized
    };
})();

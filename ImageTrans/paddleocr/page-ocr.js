/**
 * Runs in the page context. Communicates with the content script via postMessage.
 * Handles PaddleOCR initialization and OCR requests.
 */
(function() {
  'use strict';

  const Paddle = window['esearch-ocr'];
  let paddleReady = false;
  let currentModelKey = null;
  let initPromise = null;

  function waitForDeps() {
    return new Promise(function(resolve) {
      const check = function() {
        const hasOrt = typeof window.ort !== 'undefined';
        const hasCv = typeof window.cv !== 'undefined';
        const hasPaddle = typeof window['esearch-ocr'] !== 'undefined';
        if (hasOrt && hasCv && hasPaddle) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  async function init(detPath, recPath, dicUrl, modelKey, wasmPath) {
    // Same model already loaded — reuse
    if (currentModelKey === modelKey && initPromise) return initPromise;
    // Switching to a different model — reset and re-init
    if (currentModelKey !== modelKey) {
      paddleReady = false;
      initPromise = null;
    }
    initPromise = (async function() {
      await waitForDeps();

      if (window.ort.env && window.ort.env.wasm) {
        window.ort.env.wasm.wasmPaths = wasmPath;
      }

      const res = await fetch(dicUrl);
      const dic = await res.text();

      await Paddle.init({
        detPath: detPath,
        recPath: recPath,
        dic: dic,
        ort: window.ort,
        node: false,
        cv: window.cv
      });

      currentModelKey = modelKey;
      paddleReady = true;
      return true;
    })();
    return initPromise;
  }
  // --- Tesseract worker for Japanese vertical text ---
  let tessWorker = null;
  let tessWorkerLoading = null;

  async function ensureTessWorker(workerPath, corePath, langPath) {
    if (tessWorker) return tessWorker;
    if (tessWorkerLoading) return tessWorkerLoading;

    tessWorkerLoading = (async function() {
      while (typeof window.Tesseract === 'undefined') {
        await new Promise(function(r) { setTimeout(r, 100); });
      }
      tessWorker = await Tesseract.createWorker('jpn_vert', 1, {
        langPath: langPath,
        workerPath: workerPath,
        corePath: corePath
      });
      await tessWorker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK_VERT_TEXT
      });
      return tessWorker;
    })();
    return tessWorkerLoading;
  }

  // --- 合并逻辑 ---
  function mergeTextBoxes(items, sourceLang, xSpacing, ySpacing) {
    if (items.length === 0) return [];
    var xGap = (xSpacing != null) ? xSpacing : 15;
    var yGap = (ySpacing != null) ? ySpacing : 15;
    console.log('Merging text boxes with xGap=' + xGap + ' and yGap=' + yGap);

    function boxHeight(box) {
      var minY = Math.min(box[0][1], box[1][1]);
      var maxY = Math.max(box[2][1], box[3][1]);
      return maxY - minY;
    }

    function xOverlapRatio(a, b) {
      var aMinX = Math.min(a[0][0], a[3][0]);
      var aMaxX = Math.max(a[1][0], a[2][0]);
      var bMinX = Math.min(b[0][0], b[3][0]);
      var bMaxX = Math.max(b[1][0], b[2][0]);
      var aW = aMaxX - aMinX;
      var bW = bMaxX - bMinX;
      var marginA = Math.min(aW * 0.25, 20);
      var marginB = Math.min(bW * 0.25, 20);
      var overlap = Math.min(aMaxX + marginA, bMaxX + marginB) - Math.max(aMinX - marginA, bMinX - marginB);
      if (overlap <= 0) return 0;
      var minW = Math.min(aW, bW);
      return overlap / minW;
    }

    // X 间距不超过设定值即视为可合并
    function xCloseEnough(a, b) {
      var aMinX = Math.min(a[0][0], a[3][0]);
      var aMaxX = Math.max(a[1][0], a[2][0]);
      var bMinX = Math.min(b[0][0], b[3][0]);
      var bMaxX = Math.max(b[1][0], b[2][0]);
      var gap;
      if (aMaxX < bMinX) gap = bMinX - aMaxX;
      else if (bMaxX < aMinX) gap = aMinX - bMaxX;
      else gap = 0;
      return gap <= xGap;
    }

    // Y 重叠比例：0 = 不相交，1 = 完全重叠（带容差，上下各扩展 15% 高度或 5px）
    function yOverlapRatio(a, b) {
      var aMinY = Math.min(a[0][1], a[1][1]);
      var aMaxY = Math.max(a[2][1], a[3][1]);
      var bMinY = Math.min(b[0][1], b[1][1]);
      var bMaxY = Math.max(b[2][1], b[3][1]);
      var aH = aMaxY - aMinY;
      var bH = bMaxY - bMinY;
      var marginA = Math.min(aH * 0.25, 30);
      var marginB = Math.min(bH * 0.25, 30);
      var overlap = Math.min(aMaxY + marginA, bMaxY + marginB) - Math.max(aMinY - marginA, bMinY - marginB);
      if (overlap <= 0) return 0;
      var minH = Math.min(aH, bH);
      return overlap / minH;
    }

    // Y 间距不超过设定值即视为可合并
    function yCloseEnough(a, b) {
      var aMinY = Math.min(a[0][1], a[1][1]);
      var aMaxY = Math.max(a[2][1], a[3][1]);
      var bMinY = Math.min(b[0][1], b[1][1]);
      var bMaxY = Math.max(b[2][1], b[3][1]);
      var gap;
      if (aMaxY < bMinY) gap = bMinY - aMaxY;
      else if (bMaxY < aMinY) gap = aMinY - bMaxY;
      else gap = 0;
      return gap <= yGap;
    }

    function unionBox(group) {
      var allX = [], allY = [];
      group.forEach(function(item) {
        item.box.forEach(function(p) { allX.push(p[0]); allY.push(p[1]); });
      });
      var minX = Math.min.apply(null, allX);
      var maxX = Math.max.apply(null, allX);
      var minY = Math.min.apply(null, allY);
      var maxY = Math.max.apply(null, allY);
      return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
    }

    // 按 XYCut 排序（从上到下，从左到右）
    var heights = items.map(function(item) {
      return Math.abs(item.box[2][1] - item.box[0][1]);
    }).sort(function(a, b) { return a - b; });
    var medianHeight = heights[Math.floor(heights.length / 2)] || 10;
    var lineThreshold = medianHeight * 0.5;

    var sorted = items.slice().sort(function(a, b) {
      var aY = a.box[0][1];
      var bY = b.box[0][1];
      if (Math.abs(aY - bY) < lineThreshold) {
        return a.box[0][0] - b.box[0][0];
      }
      return aY - bY;
    });

    // 检测是否为竖排文字（多数 box 高度 > 宽度）
    var tallCount = 0;
    items.forEach(function(item) {
      var w = item.box[1][0] - item.box[0][0];
      var h = item.box[2][1] - item.box[0][1];
      if (h > w) tallCount++;
    });
    var isVertical = tallCount > items.length / 2;
    var isRTL = sourceLang === 'ar';

    // Phase 1: 左右合并 — 按 Y 重叠 + X 接近合并成行
    var lines = [];
    var used1 = new Array(sorted.length).fill(false);

    for (var i = 0; i < sorted.length; i++) {
      if (used1[i]) continue;
      var line = [sorted[i]];
      used1[i] = true;

      var changed = true;
      while (changed) {
        changed = false;
        for (var j = 0; j < sorted.length; j++) {
          if (used1[j]) continue;
          for (var k = 0; k < line.length; k++) {
            if (yOverlapRatio(line[k].box, sorted[j].box) >= 0.15 && xCloseEnough(line[k].box, sorted[j].box)) {
              line.push(sorted[j]);
              used1[j] = true;
              changed = true;
              break;
            }
          }
        }
      }
      if (isRTL) {
        line.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
      } else {
        line.sort(function(a, b) { return a.box[0][0] - b.box[0][0]; });
      }
      lines.push(line);
    }

    // Phase 2: 上下合并 — 按 X 重叠 + Y 接近合并行组成块
    var groups = [];
    var used2 = new Array(lines.length).fill(false);

    for (var i = 0; i < lines.length; i++) {
      if (used2[i]) continue;
      var group = lines[i].slice();
      used2[i] = true;

      var changed = true;
      while (changed) {
        changed = false;
        for (var j = 0; j < lines.length; j++) {
          if (used2[j]) continue;
          for (var k = 0; k < group.length; k++) {
            for (var l = 0; l < lines[j].length; l++) {
              if (xOverlapRatio(group[k].box, lines[j][l].box) >= 0.15 && yCloseEnough(group[k].box, lines[j][l].box)) {
                group = group.concat(lines[j]);
                used2[j] = true;
                changed = true;
                break;
              }
            }
            if (changed) break;
          }
        }
      }
      groups.push(group);
    }

    var merged = groups.map(function(group) {
      if (isVertical) {
        // 竖排文字：组内从右往左排列
        group.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
      } else if (isRTL) {
        // 阿拉伯文：组内从右往左排列
        group.sort(function(a, b) {
          var ya = a.box[0][1], yb = b.box[0][1];
          var ha = Math.abs(a.box[3][1] - a.box[0][1]);
          var hb = Math.abs(b.box[3][1] - b.box[0][1]);
          var minH = Math.min(ha, hb);
          if (Math.abs(ya - yb) < minH * 0.5) {
            return b.box[0][0] - a.box[0][0];
          }
          return ya - yb;
        });
      } else {
        // 横排文字行：xycut排序
        group.sort(function(a, b) {
          var ya = a.box[0][1], yb = b.box[0][1];
          var ha = Math.abs(a.box[3][1] - a.box[0][1]);
          var hb = Math.abs(b.box[3][1] - b.box[0][1]);
          var minH = Math.min(ha, hb);
          if (Math.abs(ya - yb) < minH * 0.5) {
            return a.box[0][0] - b.box[0][0];
          }
          return ya - yb;
        });
      }

      var texts = group.map(function(item) { return item.text; });
      var box = unionBox(group);
      var noSpaceLangs = ['zh', 'ja', 'th'];
      var sep = noSpaceLangs.includes(sourceLang) ? '' : ' ';
      return { text: texts.join(sep), box: box };
    });

    // 竖排文字：组间也从右往左排列
    if (isVertical) {
      merged.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
    }
    // 阿拉伯文：组间也从右往左排列
    if (isRTL && !isVertical) {
      merged.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
    }

    return merged;
  }

  // --- YOLOv8 detection ---
  var yoloSession = null;
  var yoloModelUrl = null;
  var INPUT_SIZE_YOLO = 640;
  var YOLO_CONF_THRESHOLD = 0.25;
  var YOLO_NMS_THRESHOLD = 0.45;

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

  function iouBox(boxA, boxB) {
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
      boxes.sort(function(a, b) { return b.confidence - a.confidence; });

      while (boxes.length > 0) {
        var best = boxes.shift();
        results.push(best);
        for (var i = boxes.length - 1; i >= 0; i--) {
          if (iouBox(best.bbox, boxes[i].bbox) >= iouThreshold) {
            boxes.splice(i, 1);
          }
        }
      }
    }
    return results;
  }

  function scaleYoloCoords(detections, ratio, dw, dh, srcW, srcH) {
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

  function postprocessYOLO(outputData, outputDims, ratio, dw, dh, srcW, srcH) {
    var numDims = outputDims.length;
    var dims, numBoxes;
    if (numDims === 3) {
      dims = outputDims[1];
      numBoxes = outputDims[2];
    } else {
      dims = outputDims[0];
      numBoxes = outputDims[1];
    }

    var numClasses = dims - 4;
    var detections = [];

    for (var i = 0; i < numBoxes; i++) {
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

      if (maxScore < YOLO_CONF_THRESHOLD) continue;
      if (maxClass === 5) continue;

      var x1 = x - w / 2;
      var y1 = y - h / 2;
      var x2 = x + w / 2;
      var y2 = y + h / 2;
      if (x1 >= x2 || y1 >= y2) continue;

      detections.push({ classId: maxClass, confidence: maxScore, bbox: [x1, y1, x2, y2] });
    }

    var nmsResults = applyNMS(detections, YOLO_NMS_THRESHOLD);
    return scaleYoloCoords(nmsResults, ratio, dw, dh, srcW, srcH);
  }

  async function runYOLO(sourceCanvas) {
    if (!yoloSession) throw new Error("YOLO model not loaded");

    var prep = preprocessYOLO(sourceCanvas);
    var tensor = new window.ort.Tensor("float32", prep.tensorData, [1, 3, INPUT_SIZE_YOLO, INPUT_SIZE_YOLO]);

    var feeds = {};
    feeds[yoloSession.inputNames[0]] = tensor;
    var outputMap = await yoloSession.run(feeds);

    var output = outputMap[yoloSession.outputNames[0]];
    return postprocessYOLO(output.data, output.dims, prep.ratio, prep.dw, prep.dh, prep.srcW, prep.srcH);
  }

  async function ensureYOLOModel(yoloUrl) {
    if (yoloSession && yoloModelUrl === yoloUrl) return;
    yoloModelUrl = yoloUrl;
    var sessionOpts = { executionProviders: ["wasm"], graphOptimizationLevel: "all" };
    yoloSession = await window.ort.InferenceSession.create(yoloUrl, sessionOpts);
  }

  async function doOCRYolo(imageDataURL, sourceLang, xSpacing, ySpacing, yoloUrl, tessWorkerPath, tessCorePath, tessLangPath) {
    await ensureYOLOModel(yoloUrl);

    var img = new Image();
    img.src = imageDataURL;
    await new Promise(function(resolve) {
      img.onload = resolve;
      img.onerror = function() { resolve(); };
    });

    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);


    // YOLOv8 detection
    var detections = await runYOLO(canvas);
    console.log("YOLO detections:", detections);
    // Recognize each text region
    var srcItems = [];
    for (var i = 0; i < detections.length; i++) {
      try {
        var det = detections[i];
        var b = det.bbox;
        var w = b[2] - b[0];
        var h = b[3] - b[1];
        if (w < 10 || h < 10) continue;

        var cropCanvas = document.createElement("canvas");
        cropCanvas.width = w;
        cropCanvas.height = h;
        var cropCtx = cropCanvas.getContext("2d");
        cropCtx.drawImage(canvas, b[0], b[1], w, h, 0, 0, w, h);
        // Use Tesseract single-line mode for Japanese vertical text
        var useTesseract = sourceLang === 'ja' && (cropCanvas.height / cropCanvas.width) > 1.1  && (cropCanvas.height / cropCanvas.width) < 8;
        if (useTesseract) {
          await ensureTessWorker(tessWorkerPath, tessCorePath, tessLangPath);
        }
        console.log(sourceLang, 'use Tesseract:', useTesseract);
        console.log(cropCanvas.width, cropCanvas.height);
        var text;
        if (useTesseract) {
          console.log("Using Tesseract");
          var tessResult = await tessWorker.recognize(cropCanvas);
          text = tessResult.data.text.replace(/[\r\n]+/g, '').replace(/\s+/g, '').trim();
        } else {
          console.log("Using PaddleOCR");
          var recResult = await Paddle.recognize(cropCanvas);
          text = recResult[0].text;
        }
        srcItems.push({
          text: text.trim(),
          box: [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]]
        });
      } catch (e) {
        console.error("Recognize failed for region " + i, e);
      }
    }

    if (srcItems.length === 0) return [];

    // Merge neighboring text blocks
    var mergedGroups = mergeTextBoxes(srcItems, sourceLang, xSpacing, ySpacing);

    var boxes = [];
    mergedGroups.forEach(function(group) {
      var b = group.box;
      boxes.push({
        geometry: {
          X: b[0][0],
          Y: b[0][1],
          width: b[2][0] - b[0][0],
          height: b[2][1] - b[0][1]
        },
        text: group.text
      });
    });

    return boxes;
  }

  async function doOCR(imageDataURL, sourceLang, xSpacing, ySpacing) {
    const img = new Image();
    img.src = imageDataURL;
    await new Promise(function(resolve) {
      img.onload = resolve;
      img.onerror = function() { resolve(); };
    });

    const result = await Paddle.ocr(img);

    // 使用 result.src 过滤空文本
    const srcItems = result.src.filter(function(item) {
      return item.text && item.text.trim() !== '';
    });

    // 修正负坐标
    srcItems.forEach(function(srcItem) {
      srcItem.box.forEach(function(box) {
        if (box[0] < 0 || box[1] < 0) {
          var x = Math.abs(box[1]);
          var y = Math.abs(box[0]);
          box[0] = x;
          box[1] = y;
        }
      });
    });

    // 合并相邻文本块
    const mergedGroups = mergeTextBoxes(srcItems, sourceLang, xSpacing, ySpacing);

    // 转换为 ImageTrans 需要的格式
    const boxes = [];
    mergedGroups.forEach(function(group) {
      const b = group.box;
      boxes.push({
        geometry: {
          X: b[0][0],
          Y: b[0][1],
          width: b[2][0] - b[0][0],
          height: b[2][1] - b[0][1]
        },
        text: group.text
      });
    });

    return boxes;
  }

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'imagetrans-extension') return;

    switch (data.type) {
      case 'PADDLE_INIT':
        (async function() {
          try {
            await init(data.detPath, data.recPath, data.dicPath, data.modelKey || 'default', data.wasmPath);
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_INIT_RESULT',
              success: true,
              modelKey: data.modelKey || 'default',
              requestId: data.requestId
            }, '*');
          } catch (err) {
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_INIT_RESULT',
              success: false,
              error: err.message,
              requestId: data.requestId
            }, '*');
          }
        })();
        break;

      case 'PADDLE_OCR':
        (async function() {
          try {
            if (!paddleReady) {
              throw new Error('PaddleOCR not initialized');
            }
            const boxes = await doOCR(data.imageDataURL, data.sourceLang, data.xSpacing, data.ySpacing);
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_OCR_RESULT',
              success: true,
              boxes: boxes,
              requestId: data.requestId
            }, '*');
          } catch (err) {
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_OCR_RESULT',
              success: false,
              error: err.message,
              requestId: data.requestId
            }, '*');
          }
        })();
        break;

      case 'PADDLE_OCR_YOLO':
        (async function() {
          try {
            if (!paddleReady) {
              throw new Error('PaddleOCR not initialized');
            }
            const boxes = await doOCRYolo(data.imageDataURL, data.sourceLang, data.xSpacing, data.ySpacing, data.yoloModelUrl, data.tessWorkerPath, data.tessCorePath, data.tessLangPath);
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_OCR_RESULT',
              success: true,
              boxes: boxes,
              requestId: data.requestId
            }, '*');
          } catch (err) {
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_OCR_RESULT',
              success: false,
              error: err.message,
              requestId: data.requestId
            }, '*');
          }
        })();
        break;
    }
  });

})();

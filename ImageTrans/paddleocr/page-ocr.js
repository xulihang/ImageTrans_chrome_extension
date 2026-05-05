/**
 * Runs in the page context. Communicates with the content script via postMessage.
 * Handles PaddleOCR initialization and OCR requests.
 */
(function() {
  'use strict';

  const Paddle = window['esearch-ocr'];
  let paddleReady = false;
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

  async function init(detPath, recPath, dicUrl) {
    if (initPromise) return initPromise;
    initPromise = (async function() {
      await waitForDeps();

      if (window.ort.env && window.ort.env.wasm) {
        window.ort.env.wasm.wasmPaths = new URL('.', detPath).href;
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

      paddleReady = true;
      return true;
    })();
    return initPromise;
  }

  // --- 合并逻辑（与 test.html 一致）---
  function mergeTextBoxes(items) {
    if (items.length === 0) return [];

    function xOverlapRatio(a, b) {
      var aMinX = Math.min(a[0][0], a[3][0]);
      var aMaxX = Math.max(a[1][0], a[2][0]);
      var bMinX = Math.min(b[0][0], b[3][0]);
      var bMaxX = Math.max(b[1][0], b[2][0]);
      var aW = aMaxX - aMinX;
      var bW = bMaxX - bMinX;
      var marginA = Math.max(aW * 0.25, 10);
      var marginB = Math.max(bW * 0.25, 10);
      var overlap = Math.min(aMaxX + marginA, bMaxX + marginB) - Math.max(aMinX - marginA, bMinX - marginB);
      if (overlap <= 0) return 0;
      var minW = Math.min(aW, bW);
      return overlap / minW;
    }

    function yOverlapRatio(a, b) {
      var aMinY = Math.min(a[0][1], a[1][1]);
      var aMaxY = Math.max(a[2][1], a[3][1]);
      var bMinY = Math.min(b[0][1], b[1][1]);
      var bMaxY = Math.max(b[2][1], b[3][1]);
      var aH = aMaxY - aMinY;
      var bH = bMaxY - bMinY;
      var marginA = Math.max(aH * 0.25, 10);
      var marginB = Math.max(bH * 0.25, 10);
      var overlap = Math.min(aMaxY + marginA, bMaxY + marginB) - Math.max(aMinY - marginA, bMinY - marginB);
      if (overlap <= 0) return 0;
      var minH = Math.min(aH, bH);
      return overlap / minH;
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

    // 检测是否为竖排文字
    var tallCount = 0;
    items.forEach(function(item) {
      var w = item.box[1][0] - item.box[0][0];
      var h = item.box[2][1] - item.box[0][1];
      if (h > w) tallCount++;
    });
    var isVertical = tallCount > items.length / 2;

    var sorted = items.slice().sort(function(a, b) {
      var aY = Math.min(a.box[0][1], a.box[1][1]);
      var bY = Math.min(b.box[0][1], b.box[1][1]);
      return aY - bY;
    });

    var groups = [];
    var used = new Array(sorted.length).fill(false);

    for (var i = 0; i < sorted.length; i++) {
      if (used[i]) continue;
      var group = [sorted[i]];
      used[i] = true;

      var changed = true;
      while (changed) {
        changed = false;
        for (var j = 0; j < sorted.length; j++) {
          if (used[j]) continue;
          for (var k = 0; k < group.length; k++) {
            if (xOverlapRatio(group[k].box, sorted[j].box) >= 0.3) {
              if (yOverlapRatio(group[k].box, sorted[j].box) >= 0.3) {
                group.push(sorted[j]);
                used[j] = true;
                changed = true;
                break;
              }
            }
          }
        }
      }
      groups.push(group);
    }

    var merged = groups.map(function(group) {
      if (isVertical) {
        group.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
      }
      var texts = group.map(function(item) { return item.text; });
      var box = unionBox(group);
      return { text: texts.join(''), box: box };
    });

    if (isVertical) {
      merged.sort(function(a, b) { return b.box[0][0] - a.box[0][0]; });
    }

    return merged;
  }

  async function doOCR(imageDataURL) {
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
    const mergedGroups = mergeTextBoxes(srcItems);

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
            await init(data.detPath, data.recPath, data.dicPath);
            window.postMessage({
              source: 'imagetrans-extension',
              type: 'PADDLE_INIT_RESULT',
              success: true,
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
            const boxes = await doOCR(data.imageDataURL);
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

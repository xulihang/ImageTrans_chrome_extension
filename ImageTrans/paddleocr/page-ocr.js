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

  async function doOCR(imageDataURL) {
    const img = new Image();
    img.src = imageDataURL;
    await new Promise(function(resolve) {
      img.onload = resolve;
      img.onerror = function() { resolve(); };
    });

    const result = await Paddle.ocr(img);
    const boxes = [];

    result.columns.forEach(function(column) {
      const box = {};
      box.geometry = {
        X: column.outerBox[0][0],
        Y: column.outerBox[0][1],
        width: column.outerBox[2][0] - column.outerBox[0][0],
        height: column.outerBox[2][1] - column.outerBox[0][1]
      };
      box.text = '';
      let text = '';
      column.src.forEach(function(src) {
        text = text + src.text + '\n';
      });
      box.text = text.trimEnd();
      boxes.push(box);
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

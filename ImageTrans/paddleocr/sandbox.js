/**
 * Loads the OCR stack inside the sandboxed page (see sandbox.html) and reports
 * the outcome back to the content script.
 *
 * Everything is loaded from here rather than with plain <script> tags in the
 * markup so that the page needs no inline script: Firefox's default sandbox CSP
 * is `script-src 'self'` with neither 'unsafe-inline' nor 'unsafe-eval', so the
 * policy is declared explicitly in each repo's manifest and kept free of
 * 'unsafe-inline'.
 */
(function() {
  'use strict';

  // Firefox ships OpenCV gzipped to keep the 10MB bundle out of its message
  // limits, the Chrome build ships it as a plain script. The check mirrors the
  // one in getImage.js, keeping both repos' copies of this file identical.
  var isFirefox = /Firefox\//i.test(navigator.userAgent);

  function post(type, extra) {
    var message = { source: 'imagetrans-extension', type: type };
    for (var key in extra) message[key] = extra[key];
    (window.parent || window).postMessage(message, '*');
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = function() { resolve(); };
      el.onerror = function() { reject(new Error(src + ' failed to load')); };
      document.head.appendChild(el);
    });
  }

  // Decompresses and evaluates a gzipped script. Indirect eval runs the code in
  // global scope, exactly as a <script> tag would, and the sandbox CSP allows it
  // — which is the whole reason this page exists instead of the page's main world.
  function loadGzippedScript(src) {
    return fetch(src)
      .then(function(response) {
        if (!response.ok) throw new Error(src + ' failed to load');
        return response.body.pipeThrough(new DecompressionStream('gzip'));
      })
      .then(function(stream) { return new Response(stream).text(); })
      .then(function(code) { (0, eval)(code); });
  }

  // Either repo's layout works on either browser: fall back to the other form if
  // the preferred one isn't bundled.
  var loadOpenCV = isFirefox
    ? loadGzippedScript('opencv.js.gz').catch(function() { return loadScript('opencv.js'); })
    : loadScript('opencv.js').catch(function() { return loadGzippedScript('opencv.js.gz'); });

  loadOpenCV
    .then(function() { return loadScript('ort.min.js'); })
    .then(function() { return loadScript('esearch-ocr/dist/esearch-ocr.umd.js'); })
    .then(function() { return loadScript('page-ocr.js'); })
    .then(function() {
      // page-ocr.js's waitForDeps() is what actually waits for the libraries to
      // finish initializing. The deps are reported back so that a sandbox which
      // loads but can't initialize — a CSP or cross-origin surprise — shows up in
      // the console instead of hanging.
      post('SANDBOX_READY', {
        deps: {
          cv: typeof window.cv,
          ort: typeof window.ort,
          paddle: typeof window['esearch-ocr'],
          // The whole point of the sandbox: dynamic code evaluation must work
          // here, since the host page's CSP blocks it in the main world.
          dynamicCode: (function() {
            try {
              new Function('return 1')();
              return 'ok';
            } catch (e) {
              return e.name;
            }
          })()
        }
      });
    })
    .catch(function(err) {
      post('SANDBOX_ERROR', { error: err.message });
    });
})();

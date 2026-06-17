(function() {
    var kuroshiro = null;
    var ready = false;
    var pendingQueue = [];

    function processRequest(data) {
        kuroshiro.convert(data.text, {
            mode: 'furigana',
            to: 'hiragana'
        }).then(function(html) {
            window.postMessage({
                source: 'imagetrans-extension',
                type: 'FURIGANA_ANNOTATE_RESULT',
                requestId: data.requestId,
                html: html
            }, '*');
        }).catch(function(e) {
            console.warn('Kuroshiro convert failed:', e);
            window.postMessage({
                source: 'imagetrans-extension',
                type: 'FURIGANA_ANNOTATE_RESULT',
                requestId: data.requestId,
                html: data.text
            }, '*');
        });
    }

    window.addEventListener('message', function(event) {
        var data = event.data;
        if (!data || data.source !== 'imagetrans-extension') return;

        if (data.type === 'FURIGANA_INIT') {
            try {
                kuroshiro = new Kuroshiro.default();
                var analyzer = new KuromojiAnalyzer({
                    dictPath: data.dictPath
                });
                kuroshiro.init(analyzer).then(function() {
                    ready = true;
                    for (var i = 0; i < pendingQueue.length; i++) {
                        processRequest(pendingQueue[i]);
                    }
                    pendingQueue = [];
                }).catch(function(e) {
                    console.warn('Kuroshiro init failed:', e);
                    for (var i = 0; i < pendingQueue.length; i++) {
                        window.postMessage({
                            source: 'imagetrans-extension',
                            type: 'FURIGANA_ANNOTATE_RESULT',
                            requestId: pendingQueue[i].requestId,
                            html: pendingQueue[i].text
                        }, '*');
                    }
                    pendingQueue = [];
                    ready = true;
                });
            } catch (e) {
                console.warn('Kuroshiro setup failed:', e);
            }
        } else if (data.type === 'FURIGANA_ANNOTATE') {
            if (ready) {
                processRequest(data);
            } else {
                pendingQueue.push(data);
            }
        }
    });
})();

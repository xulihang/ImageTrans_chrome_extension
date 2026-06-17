window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || data.source !== 'imagetrans-extension') return;
    if (data.type === 'PINYIN_ANNOTATE') {
        var html = data.text;
        if (typeof pinyinPro !== 'undefined') {
            try { html = pinyinPro.html(data.text); } catch (e) {}
        }
        window.postMessage({
            source: 'imagetrans-extension',
            type: 'PINYIN_ANNOTATE_RESULT',
            requestId: data.requestId,
            html: html
        }, '*');
    }
});

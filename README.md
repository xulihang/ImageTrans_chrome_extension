# ImageTrans Chrome Extension

> **Languages / 语言:** [English](README.md) · [简体中文](README_zh.md)

Translate images on webpages — you can translate all images on a page at once, or a single image or a selected region. Supports translation of all kinds of images, optimized for comics, manga, manhua, webtoons and doujinshi.

It can be used in two ways:

* **With [ImageTrans](https://www.basiccat.org/imagetrans)** — the local **ImageTrans desktop program** does the recognition and translation (relayed through its local server bridge), giving the highest quality.
* **Fully in-browser** — using the built-in local [PaddleOCR](https://www.paddlepaddle.org.cn/) for text recognition and a free or [OpenAI-compatible](https://platform.openai.com/docs) translation API of your choice, with no extra software to install.

Recognition, translation and rendering all happen on your machine — nothing is sent to us, and there's no subscription to pay. The translation can complete in seconds.

**Whole image translation:**

https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/e3cf01e9-9545-483b-b1d1-c488c775d72f

**Screen capture translation:**

https://github.com/user-attachments/assets/7078e908-9526-4945-948f-458543a50d08

Other versions:

* [Firefox addon](https://github.com/xulihang/ImageTrans_firefox_extension)
* [online image translator (web version)](https://www.basiccat.org/online-image-translator/)

## Table of Contents

* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
* [Local PaddleOCR vs. ImageTrans server](#local-paddleocr-vs-imagetrans-server)
* [Configuration](#configuration)
* [Supported Web Sites](#supported-web-sites)
* [Video](#video)
* [FAQ](#faq)

## Features

* **Whole image translation** — replace any image on a page with its translated version, keeping the original layout.
* **Screen capture OCR & translation** — draw a rectangle over any area (images, scans, game screens) to recognize and translate the text in it. Recognized text is selectable and copiable.
* **Camera translation** — point the camera at real-world text and translate it.
* **Auto-translate** — automatically translate the images currently in your viewport, without touching the rest of the page. (If you enable auto-scroll, it automatically scrolls the page down to translate all the images.)
* **Text to speech** — have the recognized source text and/or translation read aloud, separately or continuously.
* **Learn-a-language extras** — Japanese furigana and Chinese pinyin annotations added to the source text.
* **Translation cache & reader** — save the original image, translated image and text boxes locally, reuse cached results, and re-read them later in the built-in reader (also exportable as a ZIP).
* **Floating translate button** — a draggable on-page button for quick translation; its click action is configurable.

## Installation

1. Install from [Chrome Web Store](https://chromewebstore.google.com/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en), or install manually by downloading this repository and loading the extension through **More Tools → Extensions → Load unpacked** (remember to enable developer mode).
2. (Optional, for best quality) Purchase and install [ImageTrans](https://www.basiccat.org/imagetrans). You can otherwise work fully in-browser with PaddleOCR.
3. (Optional, for working with ImageTrans) Download [ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar) and put it together with ImageTrans.
4. (Optional. The function is already built into the extension.) Install and enable [Allow CORS](https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf) to remove restrictions on downloading images for some websites.

On Android, use Kiwi Browser or Microsoft Edge. On iOS, use Orion Browser.

## Usage

### With ImageTrans server

1. Pin the ImageTrans extension to the toolbar.
2. Open ImageTrans. Open the server through **Tools → Server**. Press the **Start the server** button and then the **Reconnect** button.
3. Open or create an ImageTrans project and set things up, like its language pair. Choose params like `ocrengine` and `language` as needed.
4. In Chrome, right-click on the image to translate it.
5. If the context menu is disabled, use the popup menu to translate the image. After setup you can call it quickly with **CTRL+SHIFT+F** (**CTRL+SHIFT+V** on Mac), press **TAB** to switch buttons, then **Enter** to run the desired action ( translating, altering source/target, getting the image's `src`, and more).

### Fully in-browser (no ImageTrans)

1. Open the extension **Options** page.
2. Set **Translation Mode** to *Local PaddleOCR + Free Translation or OpenAI*.
3. Pick an OCR method: **PaddleOCR (local)** for in-browser recognition, or **ImageTrans** if you use a remote server.
4. Select a **Source lang** / **Target lang** (PaddleOCR needs an explicit language pair, not "auto").
5. For translation, either pick one of the built-in free preset translators (e.g. **GLM-4-Flash**, **MyMemory**), or enable **OpenAI-compatible API** and fill in your API URL, key and model to use ChatGPT, Gemini, DeepSeek, GLM, etc.
6. Save, reload the page, then right-click on an image or use the popup to translate.

### Screen capture, camera & auto-translate

Look for these in the popup and through keyboard shortcuts:

* **Screen capture OCR** (**CTRL+SHIFT+L**) — draw a region to recognize/translate it. The recognized area stays with your selection; copy text, read it aloud, or re-pick a new region.
* **Camera translate** — allow camera access and translate what it sees.
* **Start/Stop Auto Translating** — automatically translate the images currently in the viewport. Enable auto scrolling to translate all the images.

## Local PaddleOCR vs. ImageTrans server

Both the fully in-browser local mode (PaddleOCR) and [ImageTrans](https://www.basiccat.org/imagetrans/) — the desktop app, which the extension connects to through its server — do OCR, translation and text rendering, and both let you plug in a custom API. ImageTrans is a far more complete tool for demanding, high-quality work:

| | Browser (local PaddleOCR) | [ImageTrans](https://www.basiccat.org/imagetrans/) |
| :-- | :-- | :-- |
| Basic OCR / translation / text rendering | ✅ | ✅ |
| Custom (OpenAI-compatible) translation API | ✅ | ✅ |
| Vertical text (e.g. Japanese manga) | ✅ | ✅ |
| Layout analysis (ppdoclayout, DeepSeek-OCR) for reading order & text merging | ❌ | ✅ |
| Translation memory, term management, corpus concordance | ❌ | ✅ |
| Context-aware translation (uses the preceding images' text and, with a vision model, their image content) | ❌ | ✅ |
| OCR quality — proofread & correct with LLMs | ❌ | ✅ |
| More OCR engines + custom OCR plugin support | ❌ | ✅ (incl. macOS Vision OCR, PaddleOCR-VL, and LLM OCR via ChatGPT / Gemini) |
| Text removal / inpainting | ❌ | ✅ (binarization, PatchMatch, LaMa, Gemini Nano; screentone-preserving) |
| Professional typesetting (smart line-breaking, punctuation, text-color detection, rotation, rich font styles) | ❌ | ✅ |
| Image editor, search & replace, alignment guides | ❌ | ✅ |
| Export PSD (separate text layers), Excel/Word/XLIFF | ❌ | ✅ |
| Batch processing with custom pipelines, command-line & API server | ❌ | ✅ |
| Extra tools — PDF→Markdown & searchable PDF, subtitle extraction (SRT), scanning, real-time screen translation | ❌ | ✅ |

How to choose? If you just want to translate images on web pages quickly, the browser extension alone is usually enough — its local OCR mode runs entirely **inside the browser**, with no separate ImageTrans program to install, so it works out of the box on most devices (phones, tablets, Chromebooks, etc.). If you want the full toolset — the highest recognition and translation quality, clean text removal and professional typesetting — use ImageTrans and let this extension connect to it through its server bridge; and since the extension connects over the network, other devices can share that same ImageTrans setup too. (Note: iOS doesn't support local OCR, so on iOS — e.g. Orion Browser — you need the ImageTrans server bridge.)

## Configuration

The **Options** page groups settings into a few sections:

* **Translation** — translation mode (local in-browser or ImageTrans server), source/target language, and the default preset translator for PaddleOCR.
* **Server Connection** — server URL (local `ImageTrans_wsServer` or a public/remote instance), instance display name, optional password, and whether requests are sent from the background service worker.
* **Image Capture and Rendering** — where the image is picked from (behind the mouse cursor or center of the screen), Canvas vs DOM rendering, CORS headers for cross-domain images, front-end text rendering with custom font CSS (vertical text, RTL, fonts, colors, minimum font size, etc.).
* **Image Processing (for PaddleOCR)** — spacing for merging adjacent text boxes, YOLOv8 text-line detection, detection/recognition model choice, inference engine (WebGPU or WASM), and extra OCR params.
* **OpenAI-Compatible API (optional)** — enable an LLM-based translator and configure its URL, key, model and prompt.
* **Storage** — save translation results to IndexedDB, reuse the cached results, and view them in the built-in reader (with ZIP download), optionally filtering by page.
* **Automation** — during auto-translate, automatically scroll to the next untranslated image.
* **Floating Translate Button** — show a draggable on-page translate button and choose what it does when clicked.
* **Language Learners** — add pinyin to Chinese source text and/or furigana to Japanese source text.
* **Interface Language** — override the extension UI language independently of the browser (it can also be set per-usage on the popup and Options pages).

## Supported Web Sites

Basically, all web sites are supported. Image replacing may not work on some sites, but the screen capture methods work for any site.

I've tested replacing images on the following sites:

* [Lezhin](https://www.lezhinus.com/)
* [Tencent Comics](https://ac.qq.com/)
* [mangadex](https://mangadex.org/)
* [pixiv](https://www.pixiv.net/)

## Video

* Demo video on YouTube: [link](https://www.youtube.com/watch?v=R7pv02jwL_k)
* Tutorial: <https://www.bilibili.com/video/BV1E5411p73K?p=2>

## FAQ

* How long does translating an image take?

   It depends on your hardware and setup. As a reference, translating a Japanese manga page into Chinese takes roughly **5 seconds** using the local PaddleOCR mode (WebGPU inference engine) with DeepSeek v4 Flash as the translation model, measured on a Minisforum 760 Plus mini PC with an AMD Ryzen 5 7640HS.

* Why does it say "Failed to connect to ImageTrans server"?

   Please check whether you are running the server. You can visit <https://local.basiccat.org:51043/translator> to see if it is running. If you're working fully in-browser, make sure **Translation Mode** is not set to ImageTrans.

* What are the differences from other image translation extensions?

   This extension processes on your own device. No subscription to an online service is required, which saves you money.

* Why does it say the connection is not private?

   This is because the certificate hasn't been updated. Please click **Advanced** and continue to visit the site.

   ![image](https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/99734b8a-c04c-46b6-8154-4cb46ec62f27)

## License

Released under the [GPL-3.0](LICENSE) license.

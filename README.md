# ImageTrans Chrome Extension

> **Languages / 语言:** [English](README.md) · [简体中文](README_zh.md)

Chrome Extension for [ImageTrans](https://www.basiccat.org/imagetrans). You can use this to translate images on webpages.

It is designed to be used together with [ImageTrans](https://www.basiccat.org/imagetrans) and [ImageTrans_wsServer](https://github.com/xulihang/ImageTrans_wsServer). It can also work without ImageTrans using local PaddleOCR.

It has two translation modes: whole image translation and screen capture translation.

| Whole image translation | Screen capture translation |
| :---: | :---: |
| <img src="https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/e3cf01e9-9545-483b-b1d1-c488c775d72f" width="300"> | <img src="https://github.com/user-attachments/assets/7078e908-9526-4945-948f-458543a50d08" width="300"> |

Other versions:

* [Firefox addon](https://github.com/xulihang/ImageTrans_firefox_extension)
* [online image translator (web version)](https://www.basiccat.org/online-image-translator/)

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Extra Features](#extra-features)
* [Supported Web Sites](#supported-web-sites)
* [Video](#video)
* [FAQ](#faq)

## Installation

1. Install from [Chrome Web Store](https://chromewebstore.google.com/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en), or manually install it by downloading this repository and installing the extension through **More Tools → Extensions → Load unpacked**. Remember to enable developer mode.
2. Purchase and install ImageTrans (optional if you just use PaddleOCR).
3. Download [ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar) and put it together with ImageTrans.
4. (Optional. The function is already built into the extension.) Install and enable [Allow CORS](https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf) to remove restrictions on downloading images for some websites.

For Android, use Kiwi Browser. For iOS, use Orion Browser.

## Usage

1. Pin the ImageTrans extension to the toolbar.
2. Open ImageTrans. Open the server through **Tools → Server**. Press the **Start the server** button and then press the **Reconnect** button. Check **silent translation mode** if you want ImageTrans to do tasks silently.
3. Open or create an ImageTrans project. Set up things like its language pair in project settings. Choose params like `ocrengine` and `language`.
4. In Chrome, right-click on the image to translate it.
5. If the context menu is disabled, you can use the popup menu to translate the image in the center of the screen. You can also set it to translate the image behind the mouse cursor. After the setup, press **CTRL+SHIFT+F** (**CTRL+SHIFT+V** on Mac) to call the popup and press **TAB** to alter the buttons. Then press **Enter** to run the desired action like translating the image or getting the image's `src`.

Automatic batch translation and regional OCR via screen capture are also supported, where text is copiable.

ImageTrans is optional if you use PaddleOCR. You can also set up OpenAI-compatible APIs to use ChatGPT, Gemini, DeepSeek, etc., for text translation.

PaddleOCR's function is limited (lack of supported languages and options, low performance). You need to set the language pair on the options page as well.

## Extra Features

For language learners, Japanese furigana and Chinese pinyin annotation are supported.

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

* Why does it say "Failed to connect to ImageTrans server"?

   Please check whether you are running the server. You can visit <https://local.basiccat.org:51043/translator> to see if it is running.

* What are the differences from other image translation extensions?

   This extension processes on your own device. No subscription to an online service is required, which saves you money.

* Why does it say the connection is not private?

   This is because the certificate hasn't been updated. Please click **Advanced** and continue to visit the site.

   ![image](https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/99734b8a-c04c-46b6-8154-4cb46ec62f27)

## License

Released under the [GPL-3.0](LICENSE) license.

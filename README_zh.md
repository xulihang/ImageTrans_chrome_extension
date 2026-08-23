# ImageTrans 扩展（Chrome）

> **Languages / 语言:** [English](README.md) · [简体中文](README_zh.md)

ImageTrans 的 Chrome 扩展程序。你可以用它来翻译网页上的图像。

它需要与 [ImageTrans](https://www.basiccat.org/imagetrans) 和 [ImageTrans_wsServer](https://github.com/xulihang/ImageTrans_wsServer) 配合使用。如果只是用本地 PaddleOCR 识别文字，则可以不依赖 ImageTrans。

它有两种翻译模式：整图翻译和截屏翻译。

| 整图翻译 | 截屏翻译 |
| :---: | :---: |
| <img src="https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/e3cf01e9-9545-483b-b1d1-c488c775d72f" width="300"> | <img src="https://github.com/user-attachments/assets/7078e908-9526-4945-948f-458543a50d08" width="300"> |

其它版本：

* [Firefox 扩展](https://github.com/xulihang/ImageTrans_firefox_extension)
* [在线图片翻译器（网页版）](https://www.basiccat.org/zh/online-image-translator/)

## 目录

* [安装](#安装)
* [用法](#用法)
* [其他功能](#其他功能)
* [受支持的网站](#受支持的网站)
* [视频](#视频)
* [常见问题](#常见问题)

## 安装

1. 从 [商店](https://chromewebstore.google.com/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en) 安装，或者下载这个仓库中的扩展手动安装。手动安装操作：**更多工具 → 扩展程序 → 加载已解压的扩展程序**，记得勾选开发者模式。
2. 购买并安装 ImageTrans（可选步骤，如果只用 PaddleOCR）。
3. 下载 [ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar) 并将其与 ImageTrans 放在一起。
4. （可选，本插件已经包含该功能）安装并启用 [Allow CORS](https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf) 以移除某些站点对下载图片的限制。

安卓系统请使用 Kiwi 浏览器，iOS 系统请使用 Orion 浏览器。

## 用法

1. 将 ImageTrans 扩展到固定到工具栏。
2. 打开 ImageTrans，点击菜单栏 **工具 → 服务器** 打开服务器程序，点击 **启动服务器** 按钮，然后点击 **重新连接** 按钮。如果希望 ImageTrans 以静默方式执行任务，请勾选静默翻译。
3. 打开或创建一个 ImageTrans 项目，在项目设置中设置如语言对等项目，选好 OCR 引擎和语言。
4. 在 Chrome 中，在图片上右键进行翻译。
5. 如果右键菜单被禁用了，可以点击工具栏上的图标唤出弹窗进行操作，翻译屏幕中央的图片。你也可以设置翻译鼠标下方的图片。设置完成后将鼠标移到需要翻译的图片上，按下 **CTRL + SHIFT + F**（在 Mac 上为 **CTRL + SHIFT + V**）调出操作窗口，按 **TAB** 键更改按钮，之后按回车键运行所需的操作，比如翻译图像或获取图像的链接。

另外还支持自动批量翻译和区域截图翻译，识别出的文字支持复制。

ImageTrans 是可选的，不用 ImageTrans 可以使用 PaddleOCR 识别文字。也可以自定义设置 OpenAI 兼容 API，来使用 ChatGPT、Gemini、DeepSeek 等大模型进行文字翻译。

本地 PaddleOCR 的功能比较有限：支持的语言较少，设置选项也比较少，识别效果和性能也较差。使用时记得在扩展选项里设置好语言对。

## 其他功能

对于语言学习者，可以使用插件的日语假名和汉语拼音标注功能。

## 受支持的网站

基本上所有网站都是支持的。如果直接操作图片失败，也可以用屏幕截图的方式。

我测试以下网站都是支持替换图片的：

* [Lezhin](https://www.lezhinus.com/)
* [腾讯动漫](https://ac.qq.com/)
* [mangadex](https://mangadex.org/)
* [pixiv](https://www.pixiv.net/)

## 视频

* YouTube 上的演示视频：[链接](https://www.youtube.com/watch?v=R7pv02jwL_k)
* B站上的演示和教程视频：[链接](https://www.bilibili.com/video/BV1E5411p73K/)

## 常见问题

* 提示 "Failed to connect to ImageTrans server"？

   检查一下是否正确运行了服务器。可以访问 <https://local.basiccat.org:51043/translator> 以检查它是不是在运行。

* 和其它的图片翻译插件有什么不同？

   这个插件在本地电脑上完成处理，不需要额外花钱订阅在线服务。

* 为什么显示“连接不是私密连接”问题？

   因为我没有及时更新证书。请先点击 **高级** 选项继续访问页面。

   ![image](https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/4cf0d4da-f1d7-4942-b1a2-dfac7703fc95)

## 许可证

本插件基于 [GPL-3.0](LICENSE) 许可协议发布。

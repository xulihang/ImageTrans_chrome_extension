# ImageTrans 扩展（Chrome）

> **Languages / 语言:** [English](README.md) · [简体中文](README_zh.md)

翻译网页上的图片，可以一次翻译一整页的全部图片，也可以只翻译你框选的部分。专为漫画、条漫、同人本的翻译而设计。

有两种使用方式：

* **配合 [ImageTrans](https://www.basiccat.org/imagetrans)** —— 由本地的 **ImageTrans 桌面程序**完成文字识别与翻译（通过其本地服务器中转），质量最好。
* **完全在浏览器里完成** —— 用内置的本地 [PaddleOCR](https://www.paddlepaddle.org.cn/) 识别文字，再用自选的免费或 [OpenAI 兼容](https://platform.openai.com/docs) 翻译接口进行翻译，无需安装任何额外软件。

识别、翻译和渲染都在你的设备本地完成——数据不会上传到我们这边，也不需要订阅付费。

| 整图翻译 | 截屏翻译 |
| :---: | :---: |
| <img src="https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/e3cf01e9-9545-483b-b1d1-c488c775d72f" width="300"> | <img src="https://github.com/user-attachments/assets/7078e908-9526-4945-948f-458543a50d08" width="300"> |

其它版本：

* [Firefox 扩展](https://github.com/xulihang/ImageTrans_firefox_extension)
* [Edge 扩展](https://github.com/xulihang/ImageTrans_firefox_extension#edge)
* [在线图片翻译器（网页版）](https://www.basiccat.org/zh/online-image-translator/)

## 目录

* [功能特性](#功能特性)
* [安装](#安装)
* [用法](#用法)
* [本地 PaddleOCR 与 ImageTrans 服务器对比](#本地-paddleocr-与-imagetrans-服务器对比)
* [配置](#配置)
* [其他功能](#其他功能)
* [受支持的网站](#受支持的网站)
* [视频](#视频)
* [常见问题](#常见问题)

## 功能特性

* **整图翻译** —— 把页面上的任意图片替换为其翻译版本，同时保留原有的排版布局。
* **截屏翻译 / OCR** —— 在页面上框选任意区域（图片、扫描件、游戏画面等）识别并翻译其中的文字，识别出的文字可以直接复制。
* **拍照翻译** —— 用摄像头对准现实中的文字（招牌、菜单、纸质文件），实时翻译看到的内容。
* **自动翻译** —— 自动翻译当前视口内的图片，不会改动页面其它部分。（若开启自动滚动，则会随你向下滚动继续翻译后面的图片。）
* **批处理与自动化** —— 按你喜欢的方式自由翻译；悬浮翻译按钮和快捷键能让你更快上手。
* **朗读（TTS）** —— 朗读识别出的原文和/或译文，可单条朗读，也可连续朗读。
* **语言学习辅助** —— 为中文原文添加拼音、为日文原文添加振假名（furigana）标注。
* **翻译缓存** —— 在本地保存原图、译图和文字框数据，可复用缓存结果避免重复翻译，也可以在自带的阅读器里回看。

## 安装

1. 从 [商店](https://chromewebstore.google.com/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en) 安装，或者下载这个仓库中的扩展手动安装。手动安装操作：**更多工具 → 扩展程序 → 加载已解压的扩展程序**，记得勾选开发者模式。
2. （可选，为获得最佳效果）购买并安装 [ImageTrans](https://www.basiccat.org/imagetrans)。否则也可以完全在浏览器里用 PaddleOCR 完成。
3. （可选，配合 ImageTrans 使用时）下载 [ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar) 并将其与 ImageTrans 放在一起。
4. （可选，本插件已经包含该功能）安装并启用 [Allow CORS](https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf) 以移除某些站点对下载图片的限制。

安卓系统请使用 Kiwi 浏览器或者 Microsoft Edge，iOS 系统请使用 Orion 浏览器。

## 用法

### 配合 ImageTrans 服务器

1. 将 ImageTrans 扩展固定到工具栏。
2. 打开 ImageTrans，点击菜单栏 **工具 → 服务器** 打开服务器程序，点击 **启动服务器** 按钮，然后点击 **重新连接** 按钮。如果希望 ImageTrans 以静默方式执行任务，请勾选静默翻译。
3. 打开或创建一个 ImageTrans 项目，在项目设置中设置如语言对等项目，选好 OCR 引擎和语言。
4. 在 Chrome 中，在图片上右键进行翻译。
5. 如果右键菜单被禁用了，可以点击工具栏上的图标唤出弹窗进行操作。设置完成后按 **CTRL + SHIFT + F**（在 Mac 上为 **CTRL + SHIFT + V**）可快速唤出操作窗口，按 **TAB** 键切换按钮，之后按回车键运行所需的操作（翻译、切换原文/译文、获取图片地址等）。

### 完全在浏览器里完成（不装 ImageTrans）

1. 打开扩展的 **选项** 页面。
2. 将 **翻译模式** 设为 *本地 PaddleOCR + 免费翻译或 OpenAI*。
3. 选择一种 OCR 方法：**PaddleOCR（本地）** 在浏览器内识别文字，或选择 **ImageTrans** 使用远程服务器。
4. 设置**源语言**和**目标语言**（PaddleOCR 需要使用明确的语言对，不能选“自动”）。
5. 翻译方面，既可以选用内置的免费预设翻译器（如 **GLM-4-Flash**、**MyMemory**），也可以启用 **OpenAI 兼容 API**，填入 API 地址、密钥和模型，以使用 ChatGPT、Gemini、DeepSeek、GLM 等大模型。
6. 保存设置并刷新页面，然后在图片上右键或用弹窗进行翻译。

### 截屏、拍照与自动翻译

可以在弹窗和快捷键中调用：

* **屏幕截图 OCR**（Windows 下为 **CTRL + SHIFT + L**，Mac 下为 **CTRL + SHIFT + L**）—— 框选一个区域即可识别/翻译，识别出的文字可复制、朗读，或在弹出窗口里新建区域继续识别。
* **拍照翻译** —— 允许摄像头权限后翻译摄像头看到的内容。
* **开始/停止自动翻译** —— 自动翻译当前视口内的图片。

### 滚动页面自动翻译图片（自动翻译）

不用一张一张地点击翻译，开启自动翻译后直接滚动页面即可：

1. 在**选项**页面的 **自动化** 分组中，勾选 **自动翻译时滚动页面**，这样滚动时扩展会继续翻译后面的图片。
2. 打开扩展弹窗，点击 **开始自动翻译**。
3. 向下滚动页面即可。进入视口的图片会自动翻译，无需逐张点击。

## 本地 PaddleOCR 与 ImageTrans 服务器对比

无论是完全在浏览器里的本地模式（PaddleOCR）还是 [ImageTrans](https://www.basiccat.org/imagetrans/)——桌面版程序，扩展通过其服务器连接——都能完成 OCR、翻译和文字渲染，也都能接入自定义 API。ImageTrans 是一个功能完备得多的工具，更适合做高要求的精细工作：

| | 浏览器（本地 PaddleOCR） | [ImageTrans](https://www.basiccat.org/imagetrans/) |
| :-- | :-- | :-- |
| 基本 OCR / 翻译 / 文字渲染 | ✅ | ✅ |
| 自定义（OpenAI 兼容）翻译 API | ✅ | ✅ |
| 竖排文字（如日文漫画） | ✅ | ✅ |
| 布局分析（ppdoclayout、DeepSeek-OCR）确定阅读顺序并正确合并文字 | ❌ | ✅ |
| 翻译记忆库、术语管理、语料检索 | ❌ | ✅ |
| 上下文感知翻译（利用周围文字 / 视觉模型提高质量） | ❌ | ✅ |
| OCR 质量——用大模型校对纠错 | ❌ | ✅ |
| 更多 OCR 引擎 + 自定义 OCR 插件 | ❌ | ✅（含 macOS Vision OCR、PaddleOCR-VL，以及 ChatGPT / Gemini 的 LLM OCR） |
| 文字去除 / 图像修复 | ❌ | ✅（二值化、PatchMatch、LaMa、Gemini Nano，可保留网点） |
| 专业排版（智能断行、标点定位、文字颜色检测、旋转、富文本字体样式） | ❌ | ✅ |
| 图片编辑、查找替换、对齐辅助 | ❌ | ✅ |
| 导出 PSD（独立文字层）、Excel/Word/XLIFF | ❌ | ✅ |
| 批处理自定义流水线、命令行与 API 服务器 | ❌ | ✅ |
| 额外工具——PDF 转 Markdown 及可搜索 PDF、字幕提取（SRT）、扫描、实时屏幕翻译 | ❌ | ✅ |

怎么选？如果你只是想在网页上快速翻译图片，浏览器扩展本身通常就够了——它的本地 OCR 模式完全在**浏览器内**运行，无需额外安装 ImageTrans 程序，开箱即用，在大多数设备上都能使用（手机、平板、Chromebook 等）。若需要完整的功能集——最高的识别与翻译质量、干净的文字去除和专业的排版——请使用 ImageTrans，并让本扩展通过其服务器桥接连接；由于扩展通过网络连接，其它设备也能共用这套 ImageTrans。注意：iOS 不支持本地 OCR，因此在 iOS 上（如 Orion 浏览器）需要使用 ImageTrans 的服务器桥接。

## 配置

**选项**页面把设置按类别分组：

* **翻译** —— 翻译模式（本地浏览器内完成，或使用 ImageTrans 服务器）、源/目标语言，以及 PaddleOCR 默认使用的预设翻译器。
* **服务器连接** —— 服务器 URL（本地 `ImageTrans_wsServer` 或公共/远程实例）、实例显示名称、可选密码，以及是否在后台 service worker 中发送网络请求。
* **图片捕获与渲染** —— 图片来源（鼠标光标后方或屏幕中央）、使用 Canvas 还是 DOM 获取图片、为跨域图片启用 CORS 头、前端文本渲染及其自定义字体 CSS（竖排、RTL、字体、颜色、最小字号等）。
* **图片处理（用于 PaddleOCR）** —— 合并相邻文本框的间距、YOLOv8 文字行检测、检测/识别模型选择、推理引擎（WebGPU 或 WASM）、额外 OCR 参数。
* **OpenAI 兼容 API（可选）** —— 启用大模型翻译，并配置其 URL、密钥、模型和提示词。
* **存储** —— 将翻译结果保存到 IndexedDB、复用已缓存的结果，并在自带的阅读器中查看（支持下载 ZIP），可按页面过滤。
* **自动化** —— 自动翻译时滚动到下一张未翻译的图片、显示悬浮翻译按钮，以及点击该按钮时要执行的操作。
* **语言学习者** —— 为中文原文添加拼音，为日文原文添加振假名。
* **界面语言** —— 独立于浏览器偏好设置扩展界面语言。

## 其他功能

* **振假名 / 拼音标注** —— 对日语学习者很实用：为日文原文添加振假名、为中文原文添加拼音。
* **朗读（TTS）** —— 在截屏、拍照的结果中可以朗读原文、译文或二者兼有，并支持列表连续朗读。
* **悬浮翻译按钮** —— 网页上可拖拽的快捷翻译按钮，点击时执行的操作可配置。
* **翻译缓存与阅读器** —— 开启保存后，每次翻译（原图、译图、文字框）都会存入 IndexedDB。缓存结果可复用避免重复翻译，还能在自带的阅读器里回看或导出为 ZIP。

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

* 翻译一张图大概需要多久？

   这取决于你的硬件和配置。作为参考，把一张日语漫画图翻译成中文大约需要 **5 秒**，使用的是本地 PaddleOCR 模式（WebGPU 推理引擎）+ DeepSeek v4 Flash 翻译API，测试设备是铭凡 760 Plus 迷你主机（AMD Ryzen 5 7640HS）。

* 提示 "Failed to connect to ImageTrans server"？

   检查一下是否正确运行了服务器。可以访问 <https://local.basiccat.org:51043/translator> 以检查它是不是在运行。如果你完全在浏览器里使用，请确认**翻译模式**没有设置为 ImageTrans。

* 和其它的图片翻译插件有什么不同？

   这个插件在本地电脑上完成处理，不需要额外花钱订阅在线服务。

* 为什么显示“连接不是私密连接”问题？

   因为我没有及时更新证书。请先点击 **高级** 选项继续访问页面。

   ![image](https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/4cf0d4da-f1d7-4942-b1a2-dfac7703fc95)

## 许可证

本插件基于 [GPL-3.0](LICENSE) 许可协议发布。

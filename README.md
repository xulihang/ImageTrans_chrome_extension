# ImageTrans_chrome_extension

Chrome Extension for ImageTrans. You can use this to translate images on webpages.

It should be used in couple with [ImageTrans](https://www.basiccat.org/imagetrans) and [ImageTrans_wsServer](https://github.com/xulihang/ImageTrans_wsServer).




https://github.com/xulihang/ImageTrans_chrome_extension/assets/5462205/e3cf01e9-9545-483b-b1d1-c488c775d72f



## Installation

1. Install from [Chrome Store](https://chrome.google.com/webstore/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en) or manually install it by downloading this repository and installing the extension through More Tools->Extensions->Load unpacked. Remember to check developer mode.
2. Purchase ImageTrans and install it.
3. Download [ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar) and put it with ImageTrans.

## Usage

1. Pin the ImageTrans extension.
2. Open ImageTrans. Open Server through Tools->Server. Press Start the server button and press Reconnect button. Check silent translation mode if you want ImageTrans to do tasks silently.
3. Open or create an ImageTrans project. Set up things like its language pair in project setting. Choose params like ocrengine and language.
4. In Chrome, right click on the image to translate it.
5. If the context menu is disabled, you can use the popup menu to translate the image in the center of the screen. You can also set it to translate the image behind the mouse cursor. After the setup, you can press CTRL+SHIFT+F (CTRL+SHIFT+V on mac) to call the popup and press TAB to alter the buttons. Then press Enter to run the desired action like translating the image or getting the image's src.


## Supported Web Sites

If the images on a web site have a unique URL and are downloadable, then the extension can handle it, otherwise, the web site is not supported.

[List of supported sites](./supported-sites.md)

## Video

* Demo video on Youtube: [link](https://www.youtube.com/watch?v=R7pv02jwL_k)
* Tutorial: <https://www.bilibili.com/video/BV1E5411p73K?p=2>

## FAQ

* Why it says "Failed to connect to ImageTrans server"?

   Please check if you are running the server. You can visit <https://local.basiccat.org:51043/translator> to see if it is running.
   
* What are the differences from other image translation extensions?

   This extension works on your own device. No subscription to an online service is required which saves you money.
   
* Why it cannot connect to the server on macOS?

   Please make sure that the system's Java version is above 11.
   
   If not, you need to upgrade it. You can download one from [here](https://download.bell-sw.com/java/11.0.19+7/bellsoft-jdk11.0.19+7-macos-amd64-full.pkg).

<hr/>

ImageTrans的Chrome扩展程序。你可以用它来翻译网页上的图像。

它需要与[ImageTrans](https://www.basiccat.org/imagetrans)和[ImageTrans_wsServer](https://github.com/xulihang/ImageTrans_wsServer)配合使用。

## 安装

1. 从[商店](https://chrome.google.com/webstore/detail/imagetrans/lkijcgjookpddgfacoankphnpbinmhia?hl=en)安装或者下载这个仓库中的扩展手动安装。手动安装操作：更多工具->扩展程序->加载已解压的扩展程序。记得勾选开发者模式。
2. 购买ImageTrans并安装。
3. 下载[ImageTrans_wsServer.jar](https://github.com/xulihang/ImageTrans_wsServer/releases/download/builds/ImageTrans_wsServer.jar)并将其与ImageTrans放在一起。

## 用法

1. 固定ImageTrans扩展到工具栏。
2. 打开ImageTrans。点击菜单栏->工具->服务器，打开服务器程序。点击“启动服务器”按钮，然后点击“重新连接”按钮。如果希望ImageTrans以静默方式执行任务，勾选静默翻译。
3. 打开或创建一个ImageTrans项目。在项目设置中设置如语言对等项目。选好OCR引擎和语言。
4. 在Chrome中，在图片上右键进行翻译。
5. 如果右键菜单被禁用了，可以点击工具栏上的图标唤出弹窗进行操作，翻译屏幕中央的图片。你也可以设置翻译鼠标下方的图片。设置完成后将鼠标移到需要翻译的图片上。按下CTRL + SHIFT + F（在Mac上为CTRL + SHIFT + V）调出操作窗口，按TAB键更改按钮。之后按回车键运行所需的操作，比如翻译图像或获取图像的链接。

## 受支持的网站

如果网站的图片有明确的URL并且可以下载，那这个扩展程序就能处理，如果不是的话，这个网站就不受支持。

[支持的网站列表](./supported-sites.md)

## 视频

B站上的演示和教程视频：[链接](https://www.bilibili.com/video/BV1E5411p73K/)

## 常见问题

* 提示"Failed to connect to ImageTrans server"?

   检查下是不是正确运行了服务器。可以访问<https://local.basiccat.org:51043/translator>以检查它是不是在运行。
   
* 和其它的图片翻译插件有什么不同？

   这个插件在本地电脑上完成处理，不需要花额外的钱订阅在线服务。

* 在macOS上为什么不能连接到服务器？

   请确保系统的Java版本大于11。
   
   如果低于11，请进行升级。可以使用[这个](https://download.bell-sw.com/java/11.0.19+7/bellsoft-jdk11.0.19+7-macos-amd64-full.pkg)安装文件。

# ImageTrans 网页版设置页

Edge 安卓无法可靠渲染扩展的 options 页面（打开 options.html 会崩溃），
因此提供这个部署在 `basiccat.org` 上的网页设置页作为替代。它通过
`chrome.runtime.sendMessage(扩展ID, ...)` 与扩展通信，由 background.js 的
`onMessageExternal` 读写 `chrome.storage.sync`。

## 部署

1. 把 `index.html` 上传到 `https://www.basiccat.org/`（建议路径
   `https://www.basiccat.org/imagetrans-options.html`）。域名必须匹配
   manifest 里 `externally_connectable` 的 `https://*.basiccat.org/*`。
2. 扩展侧的改动（必须随扩展一起发布）：
   - `manifest.json`：新增 `externally_connectable`（已加）。
   - `background.js`：新增 `onMessageExternal` 监听 `getSettings` / `saveSettings`（已加）。
3. 用户在手机/桌面打开网页，填扩展 ID（或 URL 加 `?ext=<扩展ID>`），点"读取设置"
   即可看到并修改配置，点"保存设置"写回扩展。

## 工作原理

- 网页 → 扩展：`chrome.runtime.sendMessage(扩展ID, {action:"getSettings"|"saveSettings", ...})`
- 扩展 → 网页：background 返回 `{ok, settings}`，并把网页发来的设置写入 `chrome.storage.sync`
- 只有匹配 `*.basiccat.org` 的页面能调用（manifest `externally_connectable` 限制 +
  background 里对 `sender.url` 二次校验）

## 注意事项

- 扩展 ID 会随签名密钥变化：从商店安装的版本用商店密钥，本地重新打包的 CRX 用
  本地密钥，两者 ID 不同。页面默认填的是开发者测试用的 ID
  `dcjjajdbklncgghkkjhichndapaehgni`，发布到商店后记得改成正式 ID。
- 如果 `chrome.runtime` 在当前页面不可用，说明页面不在允许的域名下，或扩展未安装。

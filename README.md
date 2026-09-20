# zMenu 菜单编辑器

一个可离线运行的 zMenu Minecraft 菜单编辑器，使用静态 HTML、CSS 和 JavaScript 实现，无需后端服务或构建步骤。

## 功能

- 内置 1783 个英文 Minecraft 物品和对应图标。
- 支持 32 个 Minecraft 版本筛选，从 1.0 到 26.2。
- 支持拖动添加物品、跟随鼠标的物品预览、搜索和滚动浏览。
- 支持调整物品面板和右侧配置面板大小，并可折叠物品面板。
- 支持 Button 的 Requirements、Actions、Advanced 和 General 配置。
- 支持 Item Stack、Components、Display Name、Lore 和 MiniMessage 预览。
- 支持 MiniMessage 加粗、颜色、渐变、悬停、点击事件、Sprites 等编辑工具。
- 支持导入 YAML、导出 zMenu YAML，以及查看和复制 YAML 预览。
- 支持桌面端、窄屏和触摸操作。

## 项目结构

```text
.
├── index.html                         # 页面入口
├── _serve.ps1                         # PowerShell 本地静态服务器
├── editor-assets/
│   ├── zmenu-editor.js                # 编辑器核心逻辑
│   ├── reference-items.js             # 内置物品目录和版本数据
│   ├── style.css                      # 基础和图标样式
│   ├── minecraft-icons.css            # Minecraft 精灵图坐标
│   ├── items-panel.css                # 物品面板和工作区样式
│   ├── button-behaviour.css           # Button 配置面板样式
│   ├── actions-ui.css                 # Actions 界面样式
│   ├── mm-toolbar.css                 # MiniMessage 工具栏样式
│   ├── responsive.css                 # 响应式样式
│   ├── mm-toolbar.js                  # MiniMessage 工具栏逻辑
│   ├── mm-preview.js                  # MiniMessage 预览逻辑
│   ├── yaml-preview.js                # YAML 预览和复制逻辑
│   ├── actions-ui.js                  # Actions 界面逻辑
│   ├── items-panel-resize.js          # 物品面板拖动调整
│   └── right-panel-resize.js          # 右侧面板拖动调整
├── images/
│   └── sprites.webp                   # Minecraft 物品精灵图
├── favicon.ico                        # 网站图标
├── apple-touch-icon.png               # Apple 设备图标
├── android-chrome-192x192.png         # Android 图标
├── android-chrome-512x512.png         # Android 图标
└── site.webmanifest                   # PWA 清单
```

## 本地运行

推荐使用项目自带的 PowerShell 静态服务器：

```powershell
powershell -ExecutionPolicy Bypass -File .\_serve.ps1
```

然后访问 `http://localhost:8765/`。

也可以使用 Python：

```powershell
python -m http.server 8765
```

直接打开 `index.html` 也可以加载静态物品目录，但使用 HTTP 服务更适合测试文件导入、下载和浏览器权限相关功能。

## 数据和资源

- 物品目录、英文名称、材质 ID、图标类名和版本筛选数据位于 `editor-assets/reference-items.js`。
- Minecraft 图标 CSS 位于 `editor-assets/minecraft-icons.css`。
- 精灵图位于 `images/sprites.webp`，由图标 CSS 使用背景坐标读取。
- 当前入口只加载 `editor-assets` 中的运行文件，不依赖旧的参考站点构建包或第三方前端目录。

## 部署

这是一个静态网站，可以部署到 Nginx、Apache、Docker 静态容器或任意静态文件服务器。部署时将仓库根目录作为网站根目录，并确保服务器将 `index.html` 作为默认入口。

`ssl/` 目录仅用于本地部署证书，已加入 `.gitignore`，不会提交到 GitHub。不要把私钥提交到公开仓库；如果私钥曾经出现在 Git 历史中，应及时更换或重新签发证书。

## 致谢

- [Minecraft Inventory Builder](https://minecraft-inventory-builder.com/)
- [zMenu](https://github.com/Maxlego08/zMenu)
- [zMenu 官方文档](https://docs.groupez.dev/zmenu/)

## 版本

`1.1.0` - 2026-09-20

## 许可

本项目仅供学习和个人使用。Minecraft 内容版权归 Mojang AB 所有。

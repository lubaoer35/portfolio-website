# LV BAO ER / 吕宝儿 · Design Portfolio

基于用户提供的 54 页 PDF，使用 React 19、Vite 7、Motion 构建。8 个真实项目、47 页完整项目画面、185 个嵌入图像资源均保留，未使用网络假作品。页码对应见 [PDF 内容核对](docs/pdf-content-audit.md)。

## 开发与预览

需要 Node.js ^20.19.0 或 >=22.12.0，当前使用 Node 24。

```sh
npm ci
npm run dev
```

首页、七种分类筛选、项目详情、个人介绍、Other 子详情均为独立 React 页面。图片支持完整构图、点击放大与键盘切换。原 PDF 下载及原始二维码保留；没有伪造视频播放器。

```sh
npm run build
npm run preview
```

## 管理员编辑台

```sh
npm run editor
```

在本机打开 Vite 输出的 5175 端口地址，右上角可打开齿轮编辑台。该进程仅绑定 `127.0.0.1`。管理员模式依赖专用 `editor` 构建与本机访问，不是远程登录系统；公开生产构建不包含编辑台模块，URL 参数不能开启它。

- 双击页面中带虚线的文字编辑，或使用面板修改个人信息、项目、奖项、分类和经历。
- 上传、替换、排序图片，或从草稿中移除图片引用；原始 PDF 图片文件不会被删除。
- 调整主题及选中元素的字体、颜色、大小、对齐、间距、偏移和图片容器比例。
- IndexedDB 自动保存本浏览器草稿；**SAVE** 建立本机检查点，**CANCEL** 恢复最近检查点。
- **PREVIEW** 隐藏编辑界面，预览当前本机草稿。
- **PUBLISH** 明确提示并导出包含上传图片的发布包，**不会自动上传或发布到公网**。
- 可以导入/导出备份 JSON，以及恢复原始内置内容。

公开访客只读取 `public/content.json`；本机管理员草稿与公开内容隔离。跨设备同步、远程管理员登录或一键在线发布需要另行配置经过认证的后端/数据库。前端不包含 GitHub Token 或管理员密钥。

## 发布编辑后的内容

导出发布包后，在仓库目录执行：

```sh
npm run content:import -- /path/to/lv-bao-er-release.json
npm test
npm run build -- --base=/portfolio-website/
```

导入器校验发布包、将上传图片写入 `public/editor-assets/`，并备份和更新 `public/content.json`。备份在被 Git 忽略的 `.content-backups/` 中。它不会更改原始作品图片，也不会执行 Git 推送。构建检查后，由管理员提交并推送修改，再验证 GitHub Actions 与线上部署。

## 测试

```sh
npm test
npm run test:browser
```

浏览器测试使用系统 Chromium（如已安装），否则先执行 `npx playwright install chromium`。可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定浏览器。测试会启动本机 5180、5181 两个隔离端口，检查公开浏览、筛选、放大、手机与减少动画模式、管理员草稿保存和发布导出。

## GitHub Pages

工作流 `.github/workflows/deploy.yml` 在 `main` 推送后运行依赖安装、内容测试、构建与 Pages 部署。仓库 Settings → Pages 的 Source 需要设置为 **GitHub Actions**。不会更改仓库可见性。

```sh
npm run build -- --base=/portfolio-website/
npm run preview -- --base=/portfolio-website/ --port 4174
```

资源和内容请求遵循 Vite base。构建后复制应用入口为 `404.html`，使 Pages 上的详情直达链接仍可显示应用；GitHub Pages 直接访问这些路由会返回 HTTP 404 状态并显示应用，支持 SPA rewrite 的主机可改为 HTTP 200。

目标地址：`https://lubaoer35.github.io/portfolio-website/`。**此处仅声明目标地址，不能代替实际部署成功与 HTTPS 访问验证。**

## 内容与结构

- `src/pages/`：首页、目录、详情、About、404。
- `src/components/`、`src/sections/`：导航、项目卡片、图片查看器、个人介绍。
- `src/content/`：默认内容、运行时内容、本地草稿与共享发布校验。
- `src/editor/`：仅本机管理员构建使用的编辑台。
- `src/animations.jsx`：原始标题分段渐显、光标、视差、共享图片转场与回顶。
- `public/projects/`：全部原始 PDF 资源与追溯 manifest。
- `public/content.json`：可发布的网站文案与图片引用。

个人介绍为用户本次提供的文案；学校、专业、奖项和技能依据 PDF 第 2 页。未虚构入学日期、实习、客户合作或上线指标。第 34、44 页实际是章节目录，按原稿归档，不重复收录为项目图片。

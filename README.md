# Latex_Equation2Image_Easy2Copy

一个运行在 **Cloudflare Workers + Hono (TypeScript)** 的 LaTeX 公式工具：
- 前端实时渲染 LaTeX（MathJax）
- 支持导出/复制 SVG、PNG
- 支持上传或粘贴图片，经 SimpleTex OCR 识别为 LaTeX 并自动回填

---

## 目录

1. [项目目标与能力](#项目目标与能力)
2. [技术栈总览](#技术栈总览)
3. [架构与原理](#架构与原理)
4. [数据流转流程](#数据流转流程)
5. [项目结构与文件职责](#项目结构与文件职责)
6. [本地开发指南](#本地开发指南)
7. [部署指南（Cloudflare）](#部署指南cloudflare)
8. [配置与环境变量](#配置与环境变量)
9. [API 说明](#api-说明)
10. [前端功能说明](#前端功能说明)
11. [常见问题与排查](#常见问题与排查)
12. [安全与工程建议](#安全与工程建议)

---

## 项目目标与能力

这个项目面向“公式输入、渲染、导出、OCR 回填”一体化场景，提供以下能力：

- 输入 LaTeX 后实时预览公式
- 一键下载 SVG / PNG
- 一键复制 SVG 文本 / PNG 图片到剪贴板
- 上传图片进行 OCR，返回 LaTeX 并自动填入输入框
- 支持公式模板管理（新增、编辑、删除、使用）
- 模板持久化到浏览器 `localStorage`

---

## 技术栈总览

### 运行与后端

- **Cloudflare Workers**
  - 承载后端 API（`/upload`）
  - 承载静态资源分发（`ASSETS` 绑定）
- **Hono**
  - Worker 内的轻量 Web 框架
  - 负责路由与请求处理
- **TypeScript**
  - 后端入口使用 TS 编写（`src/index.ts`）

### 前端

- **HTML/CSS/Vanilla JavaScript**
  - 页面结构、交互逻辑、样式
- **MathJax (tex-svg)**
  - 将 LaTeX 渲染为 SVG
- **he.js**
  - 对用户输入进行实体编码，降低注入风险
- **Web APIs**
  - `fetch`, `FormData`, `Clipboard API`, `Canvas API`, `XMLSerializer`, `localStorage`

### 外部服务

- **SimpleTex OCR API**
  - 图片转 LaTeX 的识别服务
  - 当前接口：`https://server.simpletex.cn/api/latex_ocr_turbo`

### 工具链与依赖管理

- **Node.js + npm**
  - 仅用于本地开发、依赖安装、调用 Wrangler、部署
  - 线上不以传统 Node Server 方式运行
- **Wrangler**
  - Cloudflare Workers 的开发/部署 CLI

---

## 架构与原理

### 总体架构

- 浏览器负责：
  - LaTeX 输入、实时渲染、导出与复制
  - 上传/粘贴图片并发起 OCR 请求
- Worker 负责：
  - 接收图片文件
  - 注入 `SIMPLETEX_UAT` 密钥并代理调用 SimpleTex
  - 将上游响应透传回前端
- SimpleTex 负责：
  - OCR 识别并返回 LaTeX 结果

### Node 在项目中的作用

Node 不承担线上业务请求处理，只承担工程工具职责：

- 依赖安装：`npm install` / `npm ci`
- 本地运行：`npm run dev`（实际由 Wrangler 启动本地 Worker runtime）
- 发布部署：`npm run deploy`

线上业务实际运行在 Cloudflare Workers runtime，而不是 Node 进程。

---

## 数据流转流程

### A. LaTeX 渲染与导出链路

1. 用户在输入框输入 LaTeX
2. 前端防抖（约 300ms）触发渲染
3. `he` 对输入编码后，交给 MathJax 渲染为 SVG
4. 渲染结果挂载到 `#output`
5. 导出时：
   - SVG：序列化 DOM 中的 `<svg>` 后下载/复制
   - PNG：将 SVG 转为 Image，再绘制到 Canvas，导出/复制 PNG

### B. OCR 回填链路

1. 用户上传图片或 `Ctrl+V` 粘贴图片
2. 前端构造 `FormData(file)` 请求 `POST /upload`
3. Worker 接收文件并检查 `SIMPLETEX_UAT`
4. Worker 将文件转发到 SimpleTex OCR API（Header 带 token）
5. Worker 透传上游响应给前端
6. 前端从 JSON 里提取 `latex` 字段
7. 成功则自动回填输入框并重新渲染；失败则显示错误

---

## 项目结构与文件职责

```text
.
├─ src/
│  └─ index.ts                 # Worker 入口：/upload + 静态资源回退
├─ public/
│  ├─ index.html               # 页面结构
│  └─ static/
│     ├─ script.js             # 前端主逻辑（渲染/导出/OCR/模板）
│     ├─ styles.css            # 页面样式
│     ├─ js/
│     │  ├─ he.min.js          # 输入编码库
│     │  └─ mathjax/           # 本地 MathJax 资源
│     ├─ icons/                # favicon / 图标
│     └─ img/                  # 静态图片
├─ wrangler.toml               # Worker 配置（入口、assets 绑定等）
├─ package.json                # 脚本与依赖
├─ CLOUDFLARE_AUTO_DEPLOY.md   # Cloudflare 自动部署说明
└─ README.md                   # 本文档
```

说明：仓库中还存在 `static/`、`templates/` 目录，当前主部署链路使用的是 `public/` + `src/`。

---

## 本地开发指南

### 1) 环境准备

- Node.js 18+（建议 LTS）
- npm 9+
- Cloudflare 账号（用于部署与密钥管理）

### 2) 安装依赖

```bash
npm install
```

### 3) Cloudflare 登录

```bash
npx wrangler login
```

### 4) 配置 OCR 密钥

```bash
npx wrangler secret put SIMPLETEX_UAT
```

按提示输入你的 SimpleTex token。

### 5) 启动本地开发

```bash
npm run dev
```

默认访问：`http://127.0.0.1:8787`

### 6) 本地验证建议

- 输入示例：`\frac{a^2+b^2}{c^2}=1`
- 测试 SVG / PNG 下载
- 测试 SVG / PNG 复制到剪贴板
- 上传一张公式图片验证 OCR 回填
- 测试模板增删改查并刷新页面验证持久化

---

## 部署指南（Cloudflare）

### 一键部署

```bash
npm run deploy
```

### `wrangler.toml` 关键配置

- `main = "src/index.ts"`：Worker 入口
- `[assets] directory = "./public"`：静态资源目录
- `[assets] binding = "ASSETS"`：与 `src/index.ts` 中绑定名一致
- `compatibility_date`：Workers 兼容日期

部署前请确认已在对应环境配置 `SIMPLETEX_UAT`。

---

## 配置与环境变量

### 必需密钥

- `SIMPLETEX_UAT`：SimpleTex OCR API token

### 安全要求

- 不要把 token 硬编码在前端或源码中
- 通过 `wrangler secret put` 注入
- 由 Worker 在服务端请求时附加 `token` header

---

## API 说明

### `POST /upload`

功能：上传图片并进行 OCR 识别（Worker 代理上游）。

#### 请求

- `Content-Type: multipart/form-data`
- 字段：`file`（图片文件）

#### 成功响应

- 状态码：通常为 `200`
- Body：透传 SimpleTex 返回 JSON（字段结构可能随上游变化）

#### 失败响应（本服务层）

- `400`：未提供文件
- `500`：缺少 `SIMPLETEX_UAT` 或服务内部异常

#### 前端兼容提取逻辑

前端会按以下路径尝试提取 latex：

- `res.latex`
- `result.latex`
- `data.latex`
- `latex`

---

## 前端功能说明

### 1) 实时渲染

- 输入框变更后 300ms 防抖触发
- 空输入显示提示
- 渲染失败显示语法错误提示

### 2) 导出与复制

- SVG：直接序列化 `<svg>`
- PNG：SVG -> Image -> Canvas -> PNG
- DPI 控制：通过分辨率输入影响 Canvas 缩放

### 3) OCR 识别

- 支持文件选择上传
- 支持剪贴板粘贴图片触发上传
- 成功后自动回填并重新渲染

### 4) 模板管理

- 默认内置若干模板
- 用户可新增、编辑、删除
- 数据保存在 `localStorage`（key: `latex_eq_presets_v1`）

---

## 常见问题与排查

### 1) OCR 请求失败

检查项：
- 是否已设置 `SIMPLETEX_UAT`
- token 是否有效
- 上游服务是否可达
- 上传文件是否为支持格式（PNG/JPEG）

### 2) 页面可打开但 OCR 不工作

- 确认 `POST /upload` 返回状态码与响应体
- 查看 Worker 日志，确认上游请求异常原因

### 3) 剪贴板复制失败

- 浏览器需支持 Clipboard API
- 需在安全上下文（HTTPS 或 localhost）下使用
- 某些浏览器策略会限制图片写入剪贴板

### 4) MathJax 不渲染

- 确认 `/static/js/mathjax/tex-svg.js` 能加载
- 检查 LaTeX 语法

---

## 安全与工程建议

- 建议增加上传文件大小限制与 MIME 校验
- 建议在 Worker 侧增加请求频率限制（防滥用）
- 建议增加最小化日志策略，避免记录敏感数据
- 建议补充自动化测试：
  - `/upload` 接口参数校验测试
  - 前端 OCR 响应解析测试
  - 导出链路冒烟测试

---

## NPM Scripts

```json
{
  "dev": "wrangler dev",
  "deploy": "wrangler deploy",
  "cf:install": "npm ci",
  "cf:build": "wrangler versions upload",
  "cf:deploy": "wrangler deploy"
}
```

---

## License

当前仓库未显式声明 License；如需开源发布，建议补充 `LICENSE` 文件并在 README 标注。

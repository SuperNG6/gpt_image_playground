<div align="center">

# 🎨 GPT Image Playground

[![GitHub Repo stars](https://img.shields.io/github/stars/SuperNG6/gpt_image_playground?style=flat-square&color=eab308)](https://github.com/SuperNG6/gpt_image_playground/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/SuperNG6/gpt_image_playground?style=flat-square&color=3b82f6)](https://github.com/SuperNG6/gpt_image_playground/network/members)
[![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](https://github.com/SuperNG6/gpt_image_playground/blob/main/LICENSE)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**基于 OpenAI gpt-image-2 API 的图片生成、编辑与切分工具**

提供简洁精美的 Web UI，支持 OpenAI / OpenAI 兼容接口、fal.ai 与可导入的自定义 HTTP 服务商。<br>
支持文本生图、参考图与遮罩编辑、宫格切分导出，数据纯本地化存储，带来流畅的历史记录与参数管理体验。

<br>

[![GitHub Pages 在线体验](https://img.shields.io/badge/GitHub%20Pages-%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-222222?style=for-the-badge&logo=github&logoColor=white)](https://superng6.github.io/gpt_image_playground)

</div>

<br>

> 💡 **提示**：若需调用非 HTTPS 的内网或本地 HTTP API，请使用 GitHub Pages 版本或自行部署，Vercel 部署的体验版绑定的 `.dev` 域名因安全策略通常要求接口必须为 HTTPS。

---

## 📸 界面预览

<details>
<summary><b>点击展开截图展示</b></summary>
<br>

<div align="center">
  <b>桌面端主界面</b><br>
  <img src="docs/images/example_pc_1.png" alt="桌面端主界面" />
</div>

<br>

<div align="center">
  <b>任务详情与实际参数</b><br>
  <img src="docs/images/example_pc_2.png" alt="任务详情与实际参数" />
</div>

<br>

<div align="center">
  <b>桌面端批量选择</b><br>
  <img src="docs/images/example_pc_3.png" alt="桌面端批量选择" />
</div>

<br>

<div align="center">
  <b>移动端主界面</b><br>
  <img src="docs/images/example_mb_1.jpg" alt="移动端主界面" width="420" />
</div>

<br>

<div align="center">
  <b>移动端侧滑多选</b><br>
  <img src="docs/images/example_mb_2.jpg" alt="移动端侧滑多选" width="420" />
</div>

</details>

---

## ✨ 核心特性

### 🖼️ 宫格图切分工作台（新增）

- **可视化切线编辑**：在画布上拖拽纵横线精确分割，实时预览分割效果；支持点击选中单条切线后删除，或一键清空全部切线。
- **快速宫格预设**：输入列数 × 行数后点击「应用宫格」，自动均匀排布切线，快速生成 3×3、9×9 等标准宫格布局。
- **切片多选与按需导出**：生成切片预览后，支持鼠标拖框批量选中、Cmd/Ctrl 点击追加选中；可单独下载某张切片，也可将所有选中切片一键打包为 ZIP 导出。
- **切图历史自动保存**：每次生成切片后自动将图片与切线配置保存至 IndexedDB，侧栏展示最近 30 条记录，一键恢复任意历史配置继续编辑。

### 🎨 强大的图像生成与编辑

- **双模接口支持**：自由切换使用常规 `Images API` (`/v1/images`) 或 `Responses API` (`/v1/responses`)。
- **参考图与遮罩**：支持上传最多 16 张参考图（支持剪贴板和拖拽）。内置可视化遮罩编辑器，自动预处理以符合官方分辨率限制。
- **批量与迭代**：支持单次多图生成；一键将满意结果转为参考图，无缝开启下一轮修改。

### 🌗 主题切换（新增）

支持**浅色 / 深色 / 跟随系统**三种主题模式，在页面顶部随时切换，偏好持久保存。

### ⚙️ 精细化参数追踪

- **智能尺寸控制**：提供 1K/2K/4K 快速预设，自定义宽高时会自动规整至模型安全范围（16 的倍数、总像素校验等）。
- **实际参数对比**：自动提取 API 响应中真实生效的尺寸、质量、耗时以及**模型改写后的提示词**，与你的请求参数高亮对比。

### 📁 高效历史管理（纯本地）

- **瀑布流与画廊**：历史任务自动保存，支持按状态过滤、全屏大图预览与快捷下载。
- **快捷批量操作**：桌面端支持鼠标拖拽框选、Ctrl/⌘ 连选，移动端支持顺滑侧滑多选；轻松实现批量收藏与清理。
- **极致性能与隐私**：所有记录与图片均存放在浏览器 IndexedDB 中（采用 SHA-256 去重压缩），不经过任何第三方服务器。支持一键打包导出 ZIP 备份。

### 🔌 多配置与服务商增强

- **多配置管理**：支持创建并保存多个 API 配置，按需快速切换；支持一键复制当前配置并通过拖拽排序。
- **多服务商接入**：内置 OpenAI 兼容接口（含 `Images API` 和 `Responses API`）、fal.ai（支持队列），并支持通过 JSON 导入自定义 HTTP 服务商配置（兼容同步/异步任务）。
- **API 代理**：OpenAI 兼容接口与 fal.ai 均可配置自定义代理，支持同源 `/api-proxy/` 代理转发，绕开浏览器 CORS 限制。
- **Codex CLI 兼容模式**：对上游为 Codex CLI 的 API，开启后应用 Codex CLI 实际支持的参数，并将多图生成拆分为并发单图。
- **提示词防改写**：Responses API 会始终在请求文本前加入强制指令防止提示词被改写。
- **智能诊断提示**：当检测到接口异常改写行为或缺少常规参数时，自动提示开启相应的兼容模式。

---

## 🚀 部署与使用

<details>
<summary><strong>🐳 方式一：Docker 部署（推荐）</strong></summary>

官方镜像已发布至 GitHub Container Registry，支持 `linux/amd64` 和 `linux/arm64`。

**环境变量说明：**

| 变量               | 说明                                                          |
| ------------------ | ------------------------------------------------------------- |
| `DEFAULT_API_URL`  | 设置页面上默认显示的 API 地址                                 |
| `API_PROXY_URL`    | 内置代理实际转发到的目标 API 地址（仅开启代理时有效）         |
| `ENABLE_API_PROXY` | 设为 `true` 开启容器内置 Nginx 同源代理，解决浏览器 CORS 限制 |
| `LOCK_API_PROXY`   | 设为 `true` 将 API 代理开关强制锁定为开启，用户无法关闭       |
| `HOST` / `PORT`    | 指定容器内 Nginx 监听地址和端口（默认 `0.0.0.0:80`）          |

> ⚠️ **安全警告**：开启 API 代理后，任何人都能将你的服务器作为代理来请求目标 API。建议仅在有访问控制（如 IP 白名单）或本地网络中开启。

**Docker CLI 示例**

```bash
docker run -d -p 8080:80 \
  -e DEFAULT_API_URL=https://api.openai.com/v1 \
  -e ENABLE_API_PROXY=true \
  -e LOCK_API_PROXY=true \
  -e API_PROXY_URL=https://api.openai.com/v1 \
  ghcr.io/superng6/gpt_image_playground:latest
```

**Docker Compose 示例**

```yaml
services:
  gpt-image-playground:
    image: ghcr.io/superng6/gpt_image_playground:latest
    environment:
      - DEFAULT_API_URL=https://api.openai.com/v1
    ports:
      - '8080:80'
    restart: unless-stopped
```

更新时重新拉取镜像即可：`docker compose pull && docker compose up -d`

</details>

<details>
<summary><strong>▲ 方式二：Vercel 一键部署</strong></summary>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSuperNG6%2Fgpt_image_playground&project-name=gpt-image-playground&repository-name=gpt-image-playground)

点击上方按钮导入仓库即可，Vercel 会自动执行构建并部署静态文件。

**配置默认 API URL**：在 Vercel 项目的 **Settings → Environment Variables** 中添加 `VITE_DEFAULT_API_URL`（如 `https://api.openai.com/v1`），然后重新部署即可生效。

**配置自动更新**：

1. 在 Vercel 项目设置 **Settings → Git → Deploy Hooks** 中创建一个名为 `Release` 的 Hook（Branch 填 `main`）并复制生成的 URL。
2. 在 GitHub 仓库设置 **Settings → Secrets and variables → Actions** 中，新建 Secret `VERCEL_DEPLOY_HOOK`，填入刚才的 URL。

此后每次推送或发布 Release，都会自动触发 Vercel 构建部署。

</details>

<details>
<summary><strong>☁️ 方式三：Cloudflare Workers 部署</strong></summary>

```bash
npx wrangler login
npm run deploy:cf
```

若需预设默认 API 地址，请在构建前设置环境变量：

```bash
VITE_DEFAULT_API_URL=https://api.openai.com/v1 npm run deploy:cf
```

PowerShell 示例：

```powershell
$env:VITE_DEFAULT_API_URL="https://api.openai.com/v1"; npm run deploy:cf
```

</details>

<details>
<summary><strong>💻 方式四：本地开发与静态构建</strong></summary>

**1. 安装依赖并启动**

```bash
npm install
npm run dev
```

可在项目根目录新建 `.env.local` 配置默认 API URL：

```
VITE_DEFAULT_API_URL=https://api.openai.com/v1
```

**2. 本地开发跨域代理（可选）**

```bash
cp dev-proxy.config.example.json dev-proxy.config.json
```

修改 `dev-proxy.config.json`，将 `target` 设置为真实的图片接口地址，重启开发服务器后在页面设置中开启 **API 代理** 即可。此功能仅在 `npm run dev` 阶段生效。

**3. 本地故障模拟 API（可选）**

```bash
npm run mock:api
```

用于复现图片 URL 跨域、接口返回结构异常等问题，详见 [本地故障模拟 API](docs/mock-image-api.md)。

**4. 静态构建**

```bash
npm run build
```

输出至 `dist/` 目录，可部署至任何静态文件服务器。

</details>

---

## 🛠️ URL 传参快速填充

应用支持通过 URL 查询参数快速填入配置，适合创建书签或集成分享。

**方式一：标准 OpenAI 兼容服务商**

| 参数       | 说明                                     |
| ---------- | ---------------------------------------- |
| `apiUrl`   | API 地址，如 `https://api.openai.com/v1` |
| `apiKey`   | API Key                                  |
| `apiMode`  | `images` 或 `responses`（默认 `images`） |
| `model`    | 模型名称（默认按 apiMode 使用默认模型）  |
| `codexCli` | `true` 开启 Codex CLI 兼容模式           |

示例：

```
https://superng6.github.io/gpt_image_playground?apiUrl={address}&apiKey={key}&model={model}
```

**方式二：自定义格式服务商**

使用 `settings` 参数传入 URL 编码后的完整 JSON（只读取 `customProviders` 和 `profiles` 字段）：

```
?settings={URL编码后的JSON}
```

推荐在项目内完成配置：**设置 → API 配置 → 服务商类型 → 创建自定义服务商 → AI 一键生成与导入**，再通过右侧链接按钮复制可分享的 URL。

<details>
<summary>自定义服务商 JSON 结构示例</summary>

```json
{
  "customProviders": [
    {
      "id": "custom-example-task",
      "name": "示例异步任务服务商",
      "submit": {
        "path": "images/generations",
        "method": "POST",
        "contentType": "json",
        "body": {
          "model": "$profile.model",
          "prompt": "$prompt",
          "size": "$params.size",
          "quality": "$params.quality",
          "output_format": "$params.output_format",
          "n": "$params.n"
        },
        "taskIdPath": "data.0.task_id"
      },
      "poll": {
        "path": "tasks/{task_id}",
        "method": "GET",
        "intervalSeconds": 5,
        "statusPath": "data.status",
        "successValues": ["completed"],
        "failureValues": ["failed", "cancelled"],
        "errorPath": "data.error.message",
        "result": {
          "imageUrlPaths": ["data.result.images.*.url.*"]
        }
      }
    }
  ],
  "profiles": [
    {
      "name": "示例异步任务服务商",
      "provider": "custom-example-task",
      "baseUrl": "https://api.example.com/v1",
      "model": "example-image-model",
      "apiMode": "images"
    }
  ]
}
```

</details>

第三方服务商可参考 [自定义服务商 LLM 提示词](docs/custom-provider-llm-prompt.md)，让 LLM 根据自己的 API 文档生成可导入的完整配置。

---

## 💻 技术栈

<div align="center">
  <br>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 3" /></a>
  <a href="https://zustand.docs.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" /></a>
  <br>
  <br>
</div>

---

## 📄 许可证 & 致谢

本项目基于 [MIT License](LICENSE) 开源。

本项目 Fork 自 [CookSleep/gpt_image_playground](https://github.com/CookSleep/gpt_image_playground)，感谢原作者的出色工作。

## ⭐ Star History

<div align="center">
  <a href="https://www.star-history.com/#SuperNG6/gpt_image_playground&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=SuperNG6/gpt_image_playground&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=SuperNG6/gpt_image_playground&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=SuperNG6/gpt_image_playground&type=Date" />
    </picture>
  </a>
</div>

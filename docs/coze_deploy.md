# SoloMate Coze 部署说明

本文档用于补齐 SoloMate 在本地和 Coze 编程平台的部署准备。目标是保持现有前后端接口字段不变，同时保证没有真实后端时也能走 mock fallback。

## 目录结构

- `frontend`：Vite React App
- `backend`：Express API Server
- `config`：persona、tasks、mock 数据
- `skills`：ArkClaw Skills 目录

## 本地启动

后端：

```bash
cd backend
npm install
npm run dev
```

前端：

```bash
cd frontend
npm install
npm run dev
```

默认情况下：

- 后端运行在 `http://localhost:3001`
- 前端通过 `VITE_API_BASE_URL` 读取 API 地址
- 如果没有配置 `VITE_API_BASE_URL`，前端默认访问 `http://localhost:3001`

## 前端 API 地址配置

前端统一在 `frontend/src/services/api.js` 中读取：

```env
VITE_API_BASE_URL=http://localhost:3001
```

说明：

- 本地开发时，可保持默认值 `http://localhost:3001`
- 部署到 Coze 编程平台时，将其改为后端可公网访问的 API 根地址
- 推荐不要在末尾添加 `/`，前端已做结尾斜杠兼容处理
- 所有接口请求都统一走 `API_BASE_URL + /api/...`

## 构建

```bash
cd frontend
npm run build
```

## 后端健康检查

后端健康检查接口：

```http
GET /api/health
```

成功返回示例：

```json
{
  "status": "ok",
  "service": "SoloMate mock backend",
  "mode": "mock-fallback"
}
```

## Smoke Test

```bash
cd backend
npm.cmd run test:smoke
```

该脚本会：

- 启动隔离端口上的后端实例
- 检查 `/api/health`
- 验证聊天、图片分析、状态接口等核心 API 是否可用
- 默认关闭 LLM、Vision、Weather 的真实能力，确保 mock/fallback 可跑通

## 环境变量填写

### frontend/.env.example

```env
VITE_API_BASE_URL=http://localhost:3001
```

### backend/.env.example

```env
PORT=3001
LLM_ENABLE=false
LLM_PROVIDER=openai_compatible
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_TIMEOUT_MS=8000

VISION_ENABLE=false
VISION_PROVIDER=openai_compatible
VISION_API_KEY=
VISION_BASE_URL=
VISION_MODEL=
VISION_TIMEOUT_MS=10000

WEATHER_ENABLE=true
WEATHER_PROVIDER=open_meteo
WEATHER_TIMEOUT_MS=8000
```

说明：

- 不要提交任何 `.env` 文件或真实 API Key
- 本地可复制 `.env.example` 为 `.env` 再填写
- 如果未启用真实模型，可保持 `LLM_ENABLE=false`、`VISION_ENABLE=false`
- 天气能力默认可以开启，但如果平台网络策略有限，也可以改为 `WEATHER_ENABLE=false`

## Coze 编程平台部署建议

### 后端

- 以 `backend` 目录作为服务启动目录
- 启动命令使用：

```bash
npm install
npm start
```

- 在平台环境变量中填写后端需要的变量，至少包括：

```env
PORT=3001
LLM_ENABLE=false
VISION_ENABLE=false
WEATHER_ENABLE=true
```

- 如果要接入真实 LLM 或视觉模型，再补充对应的 `API_KEY`、`BASE_URL`、`MODEL`

### 前端

- 以 `frontend` 目录作为构建目录
- 构建命令使用：

```bash
npm install
npm run build
```

- 在 Coze 编程平台的前端环境变量配置中添加：

```env
VITE_API_BASE_URL=https://your-backend-domain.example.com
```

填写原则：

- 值应为后端的可访问根地址
- 不包含 `/api`
- 不要填写真实密钥到前端环境变量

## Fallback 模式说明

SoloMate 当前保留 mock/fallback 设计，便于黑客松演示和 Coze 部署：

- 当前端请求后端失败、超时、或返回非 2xx 时，`frontend/src/services/api.js` 会自动回退到本地 mock 数据
- 后端 `/api/health` 默认返回 `mock-fallback` 模式
- 即使未配置真实 LLM、Vision，也能完成聊天建议、任务触发、照片分析占位和日记生成 Demo 流程

这意味着：

- 本地没有真实模型时，Demo 仍可跑通
- Coze 部署初期可以先用 fallback 版本上线
- 后续只需补环境变量，不需要改动前端接口字段

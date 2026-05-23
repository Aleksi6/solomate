# SoloMate API Contract

当前后端支持两种运行模式：

- `mock-fallback`：默认模式，不依赖真实 LLM，适合本地 Demo 与 smoke test。
- `llm-adapter`：可选模式，只有在 `LLM_ENABLE=true` 且配置完整时才尝试调用 OpenAI-compatible 接口。

无论是否启用真实 LLM，以下核心接口字段都 **不能变化**：

- `/api/chat`
- `/api/analyze-photo`
- `/api/complete-task`
- `/api/generate-diary`

如果环境变量未配置、模型超时、接口失败、返回非 JSON 或字段缺失，后端必须自动回退到当前 mock/fallback，并继续返回标准 JSON。

基础地址：

```text
http://localhost:3001
```

前端环境变量：

```text
VITE_API_BASE_URL=http://localhost:3001
```

## LLM 配置

后端读取 `backend/.env`，示例见 `backend/.env.example`：

```text
LLM_PROVIDER=openai_compatible
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_TIMEOUT_MS=8000
LLM_ENABLE=false
```

说明：

- `LLM_ENABLE=false` 时完全使用 mock/fallback。
- 只有 `LLM_ENABLE=true` 且 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL` 都存在时，才会尝试真实模型。
- `LLM_BASE_URL` 支持两种写法：
  - 基础 URL，例如 `https://api.example.com/v1`
  - 完整 endpoint，例如 `https://api.example.com/v1/chat/completions`
- 后端会自动按 OpenAI-compatible `POST /chat/completions` 风格请求。

## Smoke Test

在 `backend/` 目录运行：

```powershell
npm run test:smoke
```

或：

```powershell
npm run test:smoke:mock
```

该测试显式以 `LLM_ENABLE=false` 启动后端，验证 mock-fallback 仍然稳定。

## 可选真实 LLM 测试

1. 在 `backend/.env` 中填写：

```text
LLM_PROVIDER=openai_compatible
LLM_API_KEY=your_key
LLM_BASE_URL=https://your-provider.example/v1
LLM_MODEL=your-model
LLM_TIMEOUT_MS=8000
LLM_ENABLE=true
```

2. 启动后端：

```powershell
cd backend
npm run dev
```

3. 用现有 smoke 请求或前端主线验证接口。

4. 如果真实 LLM 失败，接口仍会回退到 mock/fallback，字段不变。

## 统一约定

- 所有核心接口返回 JSON。
- 前端不要依赖 `error/message` 作为正常响应。
- 成员 B 可以继续按当前字段联调，不需要感知是否启用了真实 LLM。

## POST /api/chat

用途：文本或语音转文字后发送给 SoloMate，返回陪伴回复、建议、安全提醒和任务触发。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `user_text` | string | 否 | 用户输入文本 |
| `persona_id` | string | 否 | 默认 `gentle_friend` |
| `mode` | string | 否 | `chat`、`decision`、`safety`、`guide`、`photo`、`game` |
| `location` | object | 否 | 缺失时使用 mock location |
| `context` | object | 否 | 缺失时使用空对象 |
| `nearby_places` | array | 否 | 缺失时使用 `config/mock_places.json` |
| `history` | array | 否 | 最近对话历史，MVP 可为空 |

响应字段，必须固定为：

```json
{
  "reply_text": "",
  "reply_type": "",
  "emotion_detected": "",
  "suggested_action": "",
  "safety_tip": "",
  "next_options": [],
  "task_triggered": ""
}
```

成员 B 映射：

| 后端字段 | 前端展示 |
|---|---|
| `reply_text` | AI 回复气泡 |
| `reply_type` | 回复类型或状态标签 |
| `emotion_detected` | 心情标签 |
| `suggested_action` | 推荐动作 |
| `safety_tip` | 安全提醒卡片 |
| `next_options` | 下一步按钮 |
| `task_triggered` | 任务卡片 |

## GET /api/mock-places

用途：读取 `config/mock_places.json`，返回模拟附近地点。

响应字段：

| 字段 | 类型 | 前端展示 |
|---|---|---|
| `id` | string | 地点 ID |
| `name` | string | `PlaceCard` 标题 |
| `type` | string | 地点类型 |
| `distance` | number | 距离标签 |
| `safety_level` | string | 安全等级标签 |
| `tags` | array | 标签组 |
| `description` | string | 推荐理由 |
| `task_id` | string | 可触发任务 |

## POST /api/analyze-photo

用途：分析照片，当前仍然保持 mock 视觉逻辑，不接真实视觉模型。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `image` | file | 否 | `multipart/form-data` 图片字段 |
| `persona_id` | string | 否 | 当前搭子人格 |
| `task_id` | string | 否 | 默认 `firework_photo_task` |
| `location` | string/object | 否 | 当前地点 |
| `user_question` | string | 否 | 用户对照片的提问 |

响应字段固定为：

```json
{
  "scene_summary": "",
  "safety_observation": "",
  "photo_advice": "",
  "task_result": {
    "passed": true,
    "reward_badge": "",
    "reason": ""
  },
  "reply_text": ""
}
```

成员 B 映射：

| 后端字段 | 前端展示 |
|---|---|
| `scene_summary` | 场景理解卡片 |
| `safety_observation` | 安全观察卡片 |
| `photo_advice` | 拍照建议卡片 |
| `task_result.passed` | 任务完成状态 |
| `task_result.reward_badge` | 徽章弹窗 |
| `task_result.reason` | 完成原因 |
| `reply_text` | 搭子回应气泡 |

## POST /api/complete-task

用途：根据任务结果返回已完成任务和徽章。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `task_id` | string | 否 | 默认 `firework_photo_task` |
| `passed` | boolean | 否 | 缺失默认 `true` |

响应字段固定为：

```json
{
  "completed_tasks": [],
  "badges": []
}
```

成员 B 映射：

| 后端字段 | 前端展示 |
|---|---|
| `completed_tasks` | 已完成任务列表 |
| `badges` | 已解锁徽章列表 |

## POST /api/generate-diary

用途：生成旅行日记。当前默认走 mock/fallback；启用 LLM 后可优化文案，但字段不变。

请求字段：

| 字段 | 类型 | 必填 | fallback |
|---|---|---:|---|
| `visited_places` | array | 否 | `["老街入口", "夜市街区"]` |
| `badges` | array | 否 | `["城市烟火徽章"]` |
| `mood_history` | array | 否 | `["uncertain", "relaxed"]` |
| `chat_summary` | string | 否 | 空摘要 |

响应字段固定为：

```json
{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

成员 B 映射：

| 后端字段 | 前端展示 |
|---|---|
| `diary` | 日记正文 |
| `share_caption` | 分享文案 |
| `summary_tags` | 标签列表 |

## 共享配置

| 文件 | 用途 | 对齐点 |
|---|---|---|
| `config/personas.json` | 搭子人格 | `persona_id` |
| `config/tasks.json` | 任务与徽章 | `task_id`、`reward_badge` |
| `config/mock_places.json` | 模拟地点 | `task_id` |
| `config/ui_copy.json` | 前端文案 | 不影响接口字段 |
| `config/demo_state.json` | Demo 默认状态 | 默认人格、任务、地点、徽章 |

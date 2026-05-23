# SoloMate 前后端联调说明

本文档给成员 B 接入当前 SoloMate backend 使用。当前后端是 **mock-fallback 模式**：不接真实 LLM、不接真实视觉模型、不接真实地图、不接数据库。后续接真实 LLM 或视觉模型时，不改变现有接口字段。

前端不要依赖 `error/message` 作为核心接口的正常响应。若接口失败，前端应展示本地 fallback 文案，保证 Demo 主线继续跑通。

## 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

默认地址：

```text
http://localhost:3001
```

前端 API_BASE_URL：

```js
const API_BASE_URL = "http://localhost:3001";
```

## 2. Smoke Test

```bash
cd backend
npm run test:smoke
```

该命令会测试：

- `GET /api/health`
- `GET /api/mock-places`
- `POST /api/chat`
- `POST /api/analyze-photo`
- `POST /api/complete-task`
- `POST /api/generate-diary`

## 3. 推荐联调顺序

1. 先接 `GET /api/mock-places`
2. 再接 `POST /api/chat`
3. 再接 `POST /api/analyze-photo`
4. 再接 `POST /api/complete-task`
5. 最后接 `POST /api/generate-diary`

这样能先跑通“模拟地点 -> AI 回复 -> 照片分析 -> 任务徽章 -> 旅行日记”的 Demo 主线。

## 4. GET /api/mock-places

用途：获取模拟附近地点，供 `PlaceCard`、首页推荐、对话页推荐使用。

Fetch 示例：

```js
export async function getMockPlaces() {
  const res = await fetch(`${API_BASE_URL}/api/mock-places`);
  if (!res.ok) throw new Error("Failed to fetch mock places");
  return res.json();
}
```

返回示例：

```json
[
  {
    "id": "night_market",
    "name": "夜市街区",
    "type": "food",
    "distance": 600,
    "safety_level": "high",
    "tags": ["吃饭", "人多", "夜间安全", "烟火气"],
    "description": "适合单人旅行者吃饭和短暂停留，人流较多，夜间相对安心。",
    "task_id": "firework_photo_task"
  }
]
```

建议映射：

| 字段 | 前端位置 |
|---|---|
| `name` | 地点卡片标题 |
| `distance` | 距离标签 |
| `safety_level` | 安心程度标签 |
| `tags` | 标签组 |
| `description` | 推荐理由 |
| `task_id` | 可触发任务 |

## 5. POST /api/chat

用途：用户文本或语音转文字后，发给旅行搭子获取回复。

Fetch 示例：

```js
export async function chat(payload) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_text: payload.user_text || "",
      persona_id: payload.persona_id || "gentle_friend",
      mode: payload.mode || "decision",
      location: payload.location,
      context: payload.context || {},
      nearby_places: payload.nearby_places || [],
      history: payload.history || []
    })
  });

  if (!res.ok) throw new Error("Failed to chat with SoloMate");
  return res.json();
}
```

返回字段：

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

字段映射：

| 后端字段 | 前端展示 |
|---|---|
| `reply_text` | AI 回复气泡 |
| `safety_tip` | 安全提醒卡片 |
| `next_options` | 下一步按钮 |
| `task_triggered` | 任务卡片 |
| `emotion_detected` | 心情标签 |
| `suggested_action` | 推荐动作 |

## 6. POST /api/analyze-photo

用途：上传照片并获取 mock 图片分析；没有图片时也会返回标准 mock JSON。

Fetch 示例，使用 `multipart/form-data`：

```js
export async function analyzePhoto({ image, task_id, persona_id, user_question }) {
  const formData = new FormData();

  if (image) formData.append("image", image);
  formData.append("task_id", task_id || "firework_photo_task");
  formData.append("persona_id", persona_id || "game_sprite");
  if (user_question) formData.append("user_question", user_question);

  const res = await fetch(`${API_BASE_URL}/api/analyze-photo`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Failed to analyze photo");
  return res.json();
}
```

返回字段：

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

字段映射：

| 后端字段 | 前端展示 |
|---|---|
| `scene_summary` | 场景理解卡片 |
| `safety_observation` | 安全观察卡片 |
| `photo_advice` | 拍照建议卡片 |
| `task_result.passed` | 任务完成状态 |
| `task_result.reward_badge` | 徽章弹窗 |
| `task_result.reason` | 完成原因 |
| `reply_text` | 搭子回应气泡 |

## 7. POST /api/complete-task

用途：确认任务完成并返回已完成任务、已解锁徽章。

Fetch 示例：

```js
export async function completeTask({ task_id, passed }) {
  const res = await fetch(`${API_BASE_URL}/api/complete-task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      task_id: task_id || "firework_photo_task",
      passed: passed ?? true
    })
  });

  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}
```

返回字段：

```json
{
  "completed_tasks": [],
  "badges": []
}
```

字段映射：

| 后端字段 | 前端展示 |
|---|---|
| `completed_tasks` | 已完成任务列表 |
| `badges` | 已解锁徽章列表 |

## 8. POST /api/generate-diary

用途：根据地点、徽章、心情变化和对话摘要生成旅行日记。

Fetch 示例：

```js
export async function generateDiary(payload) {
  const res = await fetch(`${API_BASE_URL}/api/generate-diary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      visited_places: payload.visited_places || ["老街入口", "夜市街区"],
      badges: payload.badges || ["城市烟火徽章"],
      mood_history: payload.mood_history || ["uncertain", "relaxed"],
      chat_summary: payload.chat_summary || ""
    })
  });

  if (!res.ok) throw new Error("Failed to generate diary");
  return res.json();
}
```

返回字段：

```json
{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

字段映射：

| 后端字段 | 前端展示 |
|---|---|
| `diary` | 日记正文 |
| `share_caption` | 朋友圈文案 |
| `summary_tags` | 标签 |

## 9. 前端 Fallback 建议

当前后端已经提供稳定 mock-fallback，但前端仍建议保留本地 fallback：

- `/api/chat` 失败：展示本地固定搭子回复、安全提醒和三个下一步按钮。
- `/api/mock-places` 失败：使用本地 mock 地点数组。
- `/api/analyze-photo` 失败：展示本地模拟图片分析和任务完成结果。
- `/api/complete-task` 失败：写入 localStorage 的已完成任务和徽章。
- `/api/generate-diary` 失败：用本地模板生成短日记。

这样即使网络或后端启动失败，成员 B 也可以先完成 Demo 主线。

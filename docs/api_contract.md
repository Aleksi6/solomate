# SoloMate API Contract

当前后端是 **mock-fallback 模式**：不接真实 LLM、不接真实视觉模型、不接真实地图、不接数据库。后续可以在 `backend/services/*` 中替换真实能力，但接口字段必须保持兼容。

本地基础地址：

```text
http://localhost:3001
```

前端建议通过：

```text
VITE_API_BASE_URL=http://localhost:3001
```

重要约定：

- 所有核心接口都返回 JSON。
- 字段缺失时后端使用 fallback，不能崩溃。
- 核心接口不能把 `error/message` 当正常响应字段返回。
- 成员 B 前端不要依赖 `error/message` 作为正常渲染逻辑。
- 字段名不得改名；新增字段先更新本文档。

## PowerShell Smoke Test

在 `backend/` 目录运行：

```powershell
npm run test:smoke
```

脚本会测试：

- `GET /api/health`
- `GET /api/mock-places`
- `POST /api/chat`
- `POST /api/analyze-photo`
- `POST /api/complete-task`
- `POST /api/generate-diary`

## GET /api/health

用途：检查后端是否启动。

请求字段：无。

响应字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | string | `ok` 表示服务可用 |
| `service` | string | 服务名称 |
| `mode` | string | 当前模式，现为 `mock-fallback` |
| `timestamp` | string | 服务响应时间 |

示例请求：

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/health"
```

示例响应：

```json
{
  "status": "ok",
  "service": "SoloMate mock backend",
  "mode": "mock-fallback",
  "timestamp": "2026-05-23T06:00:00.000Z"
}
```

成员 B 映射：只用于联调检查，不作为页面主流程依赖。

## POST /api/chat

用途：文本或语音转文字后发送给 AI 旅行搭子，返回陪伴回复、行动建议、安全提醒和任务触发。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `user_text` | string | 否 | 用户文本，缺失时也会返回 fallback |
| `persona_id` | string | 否 | 对应 `config/personas.json`，找不到则用 `gentle_friend` |
| `mode` | string | 否 | `chat`、`decision`、`safety`、`guide`、`photo`、`game` |
| `location` | object | 否 | 缺失时使用 mock location |
| `context` | object | 否 | 缺失时使用 `{}` |
| `nearby_places` | array | 否 | 缺失时读取 `config/mock_places.json` |
| `history` | array | 否 | MVP 可为空 |

响应字段，必须完整返回：

| 字段 | 类型 | 前端映射 |
|---|---|---|
| `reply_text` | string | `ChatBubble` 主回复 |
| `reply_type` | string | 回复类型或样式 |
| `emotion_detected` | string | 心情标签、日记素材 |
| `suggested_action` | string | 下一步状态、日记素材 |
| `safety_tip` | string | 安全提醒卡片 |
| `next_options` | array | 下一步按钮 |
| `task_triggered` | string | `TaskCard` 任务触发 |

示例请求：

```json
{
  "user_text": "我现在一个人有点不知道去哪",
  "persona_id": "gentle_friend",
  "mode": "decision",
  "context": {
    "mood": "uncertain"
  }
}
```

示例响应：

```json
{
  "reply_text": "我在，你不是一个人。我们先选一个更安心的方向。 你现在一个人出行，可以先去夜市街区这样人多、灯光亮、容易停留的地方。先吃点东西、缓一下，再决定下一步也来得及。",
  "reply_type": "comfort_decision",
  "emotion_detected": "uncertain",
  "suggested_action": "go_to_night_market",
  "safety_tip": "夜间单人出行建议优先选择主路和开放街区，尽量靠近商铺、地铁站或便利店。",
  "next_options": ["去夜市街区", "找咖啡店坐一会儿", "回酒店休息"],
  "task_triggered": "firework_photo_task"
}
```

## GET /api/mock-places

用途：读取 `config/mock_places.json`，返回模拟附近地点。

请求字段：无。可选 query 目前只保留扩展，不影响结果。

响应字段：

| 字段 | 类型 | 前端映射 |
|---|---|---|
| `id` | string | 地点 ID |
| `name` | string | `PlaceCard` 标题 |
| `type` | string | 地点类型 |
| `distance` | number | 距离标签 |
| `safety_level` | string | 安心程度标签 |
| `tags` | array | 标签组 |
| `description` | string | 推荐理由 |
| `task_id` | string | 可触发任务 |

示例响应：

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

## POST /api/analyze-photo

用途：分析照片或返回 mock 图片分析。支持 `multipart/form-data` 的 `image` 字段；没有图片也必须返回标准结构。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `image` | file | 否 | multipart 图片字段 |
| `persona_id` | string | 否 | 当前搭子人格 |
| `task_id` | string | 否 | 找不到则用 `firework_photo_task` |
| `location` | string/object | 否 | 当前地点 |
| `user_question` | string | 否 | 用户对照片的提问 |

响应字段，必须完整返回：

| 字段 | 类型 | 前端映射 |
|---|---|---|
| `scene_summary` | string | 场景理解卡片 |
| `safety_observation` | string | 安全观察卡片 |
| `photo_advice` | string | 拍照建议卡片 |
| `task_result.passed` | boolean | 任务完成状态 |
| `task_result.reward_badge` | string | 徽章弹窗与 `BadgeCard` |
| `task_result.reason` | string | 任务判定说明 |
| `reply_text` | string | 搭子回应气泡 |

示例响应：

```json
{
  "scene_summary": "画面像是城市夜间街区，有灯光、店铺和生活气息，适合短暂停留和观察周围环境。",
  "safety_observation": "从画面判断这里相对明亮，更适合单人短暂停留；夜间仍建议靠近主路、人流和开放店铺。",
  "photo_advice": "可以把招牌、街灯和人流放进画面，让城市烟火气更明显，也更适合生成旅行日记素材。",
  "task_result": {
    "passed": true,
    "reward_badge": "城市烟火徽章",
    "reason": "照片包含城市街区与生活氛围，符合“烟火气打卡”的 mock 判定。"
  },
  "reply_text": "我看到了你眼前的城市烟火气，这张照片可以完成任务，已解锁「城市烟火徽章」。"
}
```

## POST /api/complete-task

用途：根据任务 ID 和完成状态返回已完成任务和徽章。MVP 状态存在内存中，前端仍建议用 localStorage 保存一份。

请求字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `task_id` | string | 否 | 找不到则用 `firework_photo_task` |
| `passed` | boolean | 否 | 缺失默认 `true` |

响应字段，必须完整返回：

| 字段 | 类型 | 前端映射 |
|---|---|---|
| `completed_tasks` | array | `BadgePage` 已完成任务 |
| `badges` | array | `BadgeCard` 已解锁徽章 |

示例响应：

```json
{
  "completed_tasks": ["firework_photo_task"],
  "badges": ["城市烟火徽章"]
}
```

## POST /api/generate-diary

用途：根据地点、徽章、心情变化和对话摘要生成短旅行日记。

请求字段：

| 字段 | 类型 | 必填 | fallback |
|---|---|---:|---|
| `visited_places` | array | 否 | `["老街入口", "夜市街区"]` |
| `badges` | array | 否 | `["城市烟火徽章"]` |
| `mood_history` | array | 否 | `["uncertain", "relaxed"]` |
| `chat_summary` | string | 否 | 空摘要 |

响应字段，必须完整返回：

| 字段 | 类型 | 前端映射 |
|---|---|---|
| `diary` | string | `DiaryPage` 日记正文 |
| `share_caption` | string | 分享文案卡片 |
| `summary_tags` | array | 日记标签 |

示例响应：

```json
{
  "diary": "今天你一个人走过了老街入口、夜市街区。一开始你有点uncertain，但你还是慢慢做出了下一步选择，完成了城市里的小任务，也解锁了城市烟火徽章。这不是一段孤单的行程，而是一段被认真记录下来的探索。",
  "share_caption": "一个人的旅行，也会遇到刚刚好的热闹。今天解锁：城市烟火徽章。",
  "summary_tags": ["单人旅行", "AI搭子", "城市探索"]
}
```

## 共享配置

| 文件 | 用途 | 对齐点 |
|---|---|---|
| `config/personas.json` | 搭子人格 | `persona_id` 必须一致 |
| `config/tasks.json` | 任务与徽章 | `task_id`、`reward_badge` 必须一致 |
| `config/mock_places.json` | 模拟地点 | `task_id` 可触发任务 |
| `config/ui_copy.json` | 前端文案 | 不影响接口字段 |
| `config/demo_state.json` | Demo 默认状态 | 默认人格、任务、地点、徽章 |

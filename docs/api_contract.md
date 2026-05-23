# SoloMate API Contract

SoloMate 当前保持这些边界不变：
- 不修改既有 `/api/chat` 返回字段名
- 所有核心接口都保留 mock / fallback
- P0 不新增数据库
- 当前 Demo 会话主要保存在前端 `localStorage`

基础地址：

```text
http://localhost:3001
```

前端环境变量：

```text
VITE_API_BASE_URL=http://localhost:3001
```

## GET /api/health

```json
{
  "status": "ok",
  "service": "SoloMate mock backend",
  "mode": "mock-fallback"
}
```

## POST /api/chat

用途：
- 文本聊天
- 语音识别后的文本聊天
- 多轮连续上下文承接

### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `conversation_id` | string | 否 | 前端使用 `solomate_conversation_id` 持久化当前会话 |
| `user_text` | string | 是 | 当前用户输入 |
| `persona_id` | string | 否 | 默认 `gentle_friend` |
| `mode` | string | 否 | 一般传 `chat` |
| `location` | object | 否 | App 传入的位置；没有时允许后端使用 mock fallback |
| `context` | object | 否 | 轻量上下文，如 `mood`、`travel_mode`、`local_time`、`time_of_day` |
| `nearby_places` | array | 否 | 附近地点列表；没有时后端读取 `config/mock_places.json` |
| `history` | array | 否 | 最近 12 条聊天记录，必须包含 user 和 assistant 消息 |
| `conversation_state` | object | 否 | 前端持久化的轻量会话状态 |
| `live_context` | object | 否 | 当前发送时的实时上下文快照 |

### history 格式

前端每次请求只传最近 12 条：

```json
[
  {
    "role": "user",
    "text": "我想去迪士尼",
    "timestamp": "2026-05-24T12:00:00.000Z",
    "persona_id": "gentle_friend"
  },
  {
    "role": "assistant",
    "text": "好，那我们这轮先围绕迪士尼继续。",
    "timestamp": "2026-05-24T12:00:05.000Z",
    "persona_id": "gentle_friend"
  }
]
```

### conversation_state 格式

```json
{
  "current_city": "",
  "current_place": "",
  "origin_place": "",
  "target_place": "",
  "last_place": "",
  "last_intent": "",
  "last_user_goal": "",
  "pending_question": "",
  "mood": "",
  "travel_mode": "solo",
  "preferences": {
    "crowd": "",
    "pace": "",
    "budget": "",
    "food_preference": ""
  },
  "history_summary": "",
  "visited_places": [],
  "badges": [],
  "live_context": {
    "local_time": "",
    "time_of_day": "",
    "latitude": null,
    "longitude": null,
    "city": "",
    "place_name": "",
    "weather": {
      "condition": "",
      "temperature_c": null,
      "rain_probability": null,
      "uv_index": null,
      "source": "mock"
    },
    "nearby_places": []
  }
}
```

### live_context 格式

```json
{
  "local_time": "2026-05-24T19:30:00.000Z",
  "time_of_day": "night",
  "latitude": 30.25,
  "longitude": 120.15,
  "city": "杭州",
  "place_name": "西湖附近",
  "weather": {
    "condition": "rain",
    "temperature_c": 19,
    "rain_probability": 80,
    "uv_index": 0,
    "source": "mock"
  },
  "nearby_places": []
}
```

### 返回字段

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

### 上下文机制

- 前端使用 `localStorage` 保存：
  - `solomate_conversation_id`
  - `solomate_chat_messages`
  - `solomate_conversation_state`
- 每次 `/api/chat` 都会带最近 12 条 `history`
- 文字输入、语音输入、快捷按钮、语音面板共用同一个 `sendMessage(userText, options = {})`
- 后端按 `user_text > conversation_state > history > location > mock` 解析当前 `effective_place`
- 后端会同时解析：
  - `target_place`
  - `origin_place`
  - `current_place`
  - `detected_intent`
  - `user_goal`
  - `live_context`
- 当用户说了新地点时，会承认上下文切换
- 当用户只追问“哪里好拍照 / 有啥好吃的 / 怎么从这里去”时，会默认承接当前主题地点
- 默认 mock location 只作兜底，不会污染用户明确说的新地点

### 为什么暂不加数据库

- P0 Demo 阶段，`localStorage + history payload + conversation_state + live_context` 已足够支撑连续聊天体验
- 这样可以保持黑客松版本轻量、稳定、方便快速复现
- 数据库作为 P1 可扩展项
- 后续可以用 SQLite 保存 `conversation_id / messages / summary`

## 实时能力边界

P0 已实现：
- 时间：真实，由前端发送 `local_time` 和 `time_of_day`
- 浏览器位置：可选获取，失败时 fallback 到 mock
- 附近地点：使用 `config/mock_places.json`
- 路线：提供文字思路，不做真实导航

P1 可扩展：
- 天气：支持 `WEATHER_ENABLE` 开关；当前默认 mock/fallback，后续可接真实天气服务
- Places：后续可接 Places API 做更真实的附近地点排序
- SQLite 会话存储

P2 仅概念：
- 打车建议可以作为文案思路存在，但不调用真实打车平台

## GET /api/mock-places

返回 mock 地点列表，前端地点卡片和聊天建议都可以复用。

## POST /api/analyze-photo

### 返回字段

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

## POST /api/complete-task

### 返回字段

```json
{
  "completed_tasks": [],
  "badges": []
}
```

## POST /api/generate-diary

### 返回字段

```json
{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

## Smoke Test

```powershell
cd backend
npm.cmd run test:smoke
```

当前 smoke test 覆盖：
- health
- chat greeting
- location source explanation
- follow-up photo question around current target place
- switching target place
- route follow-up from origin to target
- default location contamination guard
- weather mock reminder
- analyze-photo fallback
- complete-task
- generate-diary

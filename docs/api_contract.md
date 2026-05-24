# SoloMate API Contract

SoloMate 当前保持这些边界不变：
- 不修改既有 `/api/chat`、`/api/analyze-photo`、`/api/complete-task`、`/api/generate-diary` 的返回字段名
- 所有核心接口都保留 mock / fallback
- P0 不新增数据库
- P0 会话记忆主要保存在前端 `localStorage`

基础地址：
```text
http://localhost:3001
```

前端环境变量：
```text
VITE_API_BASE_URL=http://localhost:3001
```

## P0 会话与本地存储

前端使用这些 key：
- `solomate_conversation_id`
- `solomate_session_date`
- `solomate_chat_messages`
- `solomate_conversation_state`
- `solomate_memory_fragments`
- `solomate_badges`
- `solomate_completed_tasks`
- `solomate_diary`

会话生命周期：
- App 启动时检查 `solomate_session_date`
- 如果不是今天，则创建新的当日会话
- 新会话会刷新 `conversation_id`，并清空 `chat_messages` / `conversation_state`
- `memory_fragments` 和 `badges` 可保留，用于碎片册回看
- “重置今日旅程 / 清空 Demo” 会清空以上全部 key

为什么 P0 不用数据库：
- Demo 阶段以 `localStorage` 足够支撑连续聊天、碎片册、徽章和日记
- 数据结构已经按 `conversation_id / history / conversation_state / live_context` 组织
- P1 可升级为 SQLite，保存 `conversation_id / messages / summary / fragments`

## GET /api/health

```json
{
  "status": "ok",
  "service": "SoloMate mock backend",
  "mode": "mock-fallback"
}
```

## GET /api/live-context-status

用于前端判断当前 Demo 的实时能力状态。

```json
{
  "geolocation_recommended": true,
  "weather_enable": false,
  "weather_has_api_key": false,
  "fallback": "mock live_context"
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
| `conversation_id` | string | 是 | 前端持久化的当前会话 id |
| `user_text` | string | 是 | 当前用户输入 |
| `persona_id` | string | 否 | 默认 `gentle_friend` |
| `mode` | string | 否 | 一般传 `chat` |
| `location` | object | 否 | App 传入位置；没有时后端用 mock fallback |
| `context` | object | 否 | 轻量上下文，如 `mood`、`travel_mode` |
| `nearby_places` | array | 否 | 附近地点列表；为空时后端读取 `config/mock_places.json` |
| `history` | array | 否 | 最近 12 条消息，必须包含 user + assistant |
| `conversation_state` | object | 否 | 前端持久化会话状态 |
| `live_context` | object | 否 | 发送当下的实时上下文快照 |

### history 格式

```json
[
  {
    "role": "user",
    "text": "我又想去外滩了",
    "timestamp": "2026-05-24T12:00:00.000Z",
    "persona_id": "gentle_friend"
  },
  {
    "role": "assistant",
    "text": "好，那我们先把目标切到外滩。",
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
    "location_source": "browser|mock|manual|none",
    "weather": {
      "condition": "",
      "temperature_c": null,
      "rain_probability": null,
      "uv_index": null,
      "source": "mock|api|none"
    },
    "nearby_places": []
  }
}
```

### 上下文解析优先级

后端按以下优先级确定 `effective_place`：

```text
user_text > conversation_state > history > location > mock
```

规则：
- 用户在当前轮提到新地点，立即切换上下文
- 用户问“怎么从重庆去呢”时，会优先识别 `origin_place=重庆`
- 用户问“附近有什么吃的 / 今天穿什么 / 我在哪”时，优先使用 `current_place / live_context`
- `location` 只作兜底，不能污染用户明确说的新地点
- 不会把默认 mock 位置拼成“西湖夜市”这类错误组合

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

## POST /api/analyze-photo

用途：
- 上传图片给搭子
- 生成场景分析
- 判断任务是否通过

### 请求方式

- 支持 `multipart/form-data`
- 文件字段名：`image`
- 其余字段：`task_id`、`persona_id`、`user_question`

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

说明：
- DeepSeek 文本模型只用于 chat / diary，不作为真实视觉模型
- 真正的图片识别走独立 `VISION_*` 适配器
- 若 `VISION_ENABLE=false` 或视觉失败，接口仍返回标准字段，并明确为 Demo mock 判定

## POST /api/complete-task

```json
{
  "completed_tasks": [],
  "badges": []
}
```

## POST /api/generate-diary

```json
{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

## 实时能力边界

P0 已实现：
- 时间：真实
- 浏览器定位：可选，失败时 fallback
- 天气：mock 或可选 API，失败时 fallback
- 附近地点：`config/mock_places.json`
- 路线：文字建议，不做真实导航

P1：
- SQLite 会话存储
- 真实天气 API
- 更细的地点服务

P2：
- 打车 / 导航平台接入


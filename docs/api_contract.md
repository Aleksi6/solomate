# SoloMate API Contract

本文件用于成员A后端和成员B前端对齐接口字段。

## 0. 基本原则

### 0.1 项目主线

SoloMate MVP 只围绕以下 Demo 闭环开发：

```text
选择搭子
→ 文本/语音对话
→ AI 根据位置、时间、心情给建议
→ 展示附近地点
→ 上传照片
→ AI 图片分析
→ 判断任务完成
→ 解锁徽章
→ 生成旅行日记
```

### 0.2 双方同步规则

1. 成员A不随意修改接口字段。
2. 成员B不随意新增前端需要但后端无法返回的字段。
3. 所有字段变动必须先修改本文件。
4. 前端先用 mock 数据开发，后端接口完成后再替换真实接口。
5. 所有接口必须有 fallback，保证 Demo 不因模型、网络、定位、图片识别失败而中断。
6. MVP 不依赖真实地图 API、复杂数据库、系统级悬浮窗、真 AR、实时视频理解。
7. 所有返回尽量使用结构化 JSON，不要只返回纯文本。

### 0.3 基础地址

本地开发阶段：

```text
http://localhost:3001
```

前端通过环境变量读取：

```text
VITE_API_BASE_URL=http://localhost:3001
```

如果没有配置环境变量，前端应使用 mock fallback。

### 0.4 通用状态码约定

| 状态码 | 含义 | 前端处理 |
|---|---|---|
| 200 | 成功 | 正常渲染 |
| 400 | 请求字段缺失或格式错误 | 显示温和错误提示，并使用 mock fallback |
| 500 | 后端或模型异常 | 显示“搭子正在调整状态”，并使用 mock fallback |

---

# 1. 对话接口

## 1.1 接口说明

```text
POST /api/chat
```

用途：

```text
用户输入文本或语音转文字后，发送给后端 Agent。
后端根据人格、位置、时间、心情、附近地点和历史对话，返回搭子回复、下一步建议、安全提醒和可能触发的任务。
```

对应页面：

```text
ChatPage.jsx
```

对应前端方法：

```text
services/api.js -> chat(payload)
```

---

## 1.2 Request Body

```json
{
  "user_text": "我现在一个人有点不知道去哪",
  "persona_id": "gentle_friend",
  "mode": "decision",
  "location": {
    "city": "杭州",
    "place_name": "西湖附近",
    "lat": 30.25,
    "lng": 120.15
  },
  "context": {
    "time": "20:30",
    "travel_mode": "solo",
    "mood": "uncertain",
    "budget": 100,
    "walking_minutes": 35
  },
  "nearby_places": [],
  "history": []
}
```

---

## 1.3 Request 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `user_text` | string | 是 | 用户输入文本，语音识别后也转成这个字段 |
| `persona_id` | string | 是 | 当前选择的人格 ID，对应 `config/personas.json` |
| `mode` | string | 否 | 当前对话模式，默认 `chat` |
| `location` | object | 否 | 用户当前位置；定位失败时用模拟位置 |
| `location.city` | string | 否 | 城市名 |
| `location.place_name` | string | 否 | 当前地点名 |
| `location.lat` | number | 否 | 纬度，MVP 可模拟 |
| `location.lng` | number | 否 | 经度，MVP 可模拟 |
| `context` | object | 否 | 用户当前旅行上下文 |
| `context.time` | string | 否 | 当前时间，如 `20:30` |
| `context.travel_mode` | string | 否 | 出行方式，MVP 默认 `solo` |
| `context.mood` | string | 否 | 心情状态，如 `uncertain`、`tired`、`relaxed` |
| `context.budget` | number | 否 | 预算，省钱人格可使用 |
| `context.walking_minutes` | number | 否 | 已步行时间 |
| `nearby_places` | array | 否 | 附近地点列表，可由 `/api/mock-places` 返回 |
| `history` | array | 否 | 最近几轮对话历史 |

---

## 1.4 `mode` 可选值

| 值 | 含义 | 使用场景 |
|---|---|---|
| `chat` | 普通陪聊 | 用户随便聊天 |
| `decision` | 旅行决策 | 用户不知道下一站去哪 |
| `safety` | 安心守护 | 用户害怕、迷路、觉得路黑 |
| `guide` | 景点讲解 | 用户询问景点故事 |
| `photo` | 拍照建议 | 用户想拍照或发朋友圈 |
| `game` | 游戏任务 | 用户想做城市探索任务 |

---

## 1.5 Response Body

```json
{
  "reply_text": "没关系，我陪你。你现在一个人出行，又已经有点犹豫，我建议先去人多、灯光亮的夜市街区。",
  "reply_type": "comfort_decision",
  "emotion_detected": "uncertain",
  "suggested_action": "go_to_night_market",
  "safety_tip": "夜间单人出行建议优先选择主路和人流较多的区域。",
  "next_options": ["去夜市", "找咖啡店休息", "回酒店"],
  "task_triggered": "firework_photo_task"
}
```

---

## 1.6 Response 字段说明

| 字段 | 类型 | 必填 | 前端展示位置 |
|---|---|---|---|
| `reply_text` | string | 是 | AI 主回复气泡 |
| `reply_type` | string | 否 | 用于前端区分回复类型 |
| `emotion_detected` | string | 否 | 当前心情标签 |
| `suggested_action` | string | 否 | 推荐动作，可用于按钮或状态记录 |
| `safety_tip` | string | 否 | 安全提醒卡片 |
| `next_options` | array | 否 | 下一步建议按钮 |
| `task_triggered` | string/null | 否 | 触发任务 ID，对应 `config/tasks.json` |

---

## 1.7 前端渲染规则

| 后端字段 | 前端展示 |
|---|---|
| `reply_text` | `ChatBubble` 中的 AI 回复 |
| `safety_tip` | 安全提醒卡片 |
| `next_options` | 三个下一步按钮 |
| `task_triggered` | 弹出 `TaskCard` |
| `emotion_detected` | 心情标签 |
| `suggested_action` | 保存到 demoState，用于日记生成 |

---

## 1.8 对话接口 fallback

当前端请求失败时，使用以下 mock：

```json
{
  "reply_text": "我现在网络有点慢，但我还在。你可以先选择人多、灯光亮的方向，避免进入偏僻小路。如果你愿意，我可以先帮你从附近的夜市、咖啡店和地铁站里选一个更安心的目的地。",
  "reply_type": "fallback",
  "emotion_detected": "uncertain",
  "suggested_action": "choose_safe_place",
  "safety_tip": "夜间单人出行建议优先选择主路、人多、灯光亮的区域。",
  "next_options": ["去夜市", "找咖啡店休息", "回酒店"],
  "task_triggered": "firework_photo_task"
}
```

---

# 2. 图片分析接口

## 2.1 接口说明

```text
POST /api/analyze-photo
```

用途：

```text
用户上传照片后，后端进行图片理解，返回场景总结、安全观察、拍照建议，并判断是否完成任务。
```

对应页面：

```text
PhotoPage.jsx
```

对应前端方法：

```text
services/api.js -> analyzePhoto(payload)
```

---

## 2.2 Request Body

MVP 阶段可以先用 JSON mock。

```json
{
  "image": "uploaded_file_or_base64",
  "persona_id": "game_sprite",
  "task_id": "firework_photo_task",
  "location": {
    "place_name": "夜市街区"
  },
  "user_question": "这张照片能完成任务吗？"
}
```

如果后端使用真实文件上传，可以改为 `multipart/form-data`，但返回字段必须保持不变。

---

## 2.3 Request 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `image` | file/string | 是 | 上传图片；MVP 可用 base64 或 mock 占位 |
| `persona_id` | string | 否 | 当前人格 ID |
| `task_id` | string | 否 | 当前任务 ID，对应 `config/tasks.json` |
| `location` | object | 否 | 当前地点信息 |
| `location.place_name` | string | 否 | 地点名 |
| `user_question` | string | 否 | 用户对照片的提问 |

---

## 2.4 Response Body

```json
{
  "scene_summary": "画面中有店铺、灯光和街道人流，接近夜市或商业街场景。",
  "safety_observation": "画面中灯光较充足，人流较多，单人短暂停留相对更安心。",
  "photo_advice": "可以把招牌和街灯放在画面上方，让烟火气更明显。",
  "task_result": {
    "passed": true,
    "reward_badge": "城市烟火徽章",
    "reason": "照片包含店铺、灯光和生活街区元素。"
  },
  "reply_text": "你拍到了很有生活气息的一面，烟火气打卡完成！"
}
```

---

## 2.5 Response 字段说明

| 字段 | 类型 | 必填 | 前端展示位置 |
|---|---|---|---|
| `scene_summary` | string | 是 | 场景理解卡片 |
| `safety_observation` | string | 否 | 安全观察卡片 |
| `photo_advice` | string | 否 | 拍照建议卡片 |
| `task_result` | object | 是 | 任务判断结果 |
| `task_result.passed` | boolean | 是 | 是否完成任务 |
| `task_result.reward_badge` | string | 否 | 解锁徽章名称 |
| `task_result.reason` | string | 否 | 完成或未完成原因 |
| `reply_text` | string | 是 | 搭子回应气泡 |

---

## 2.6 前端渲染规则

| 后端字段 | 前端展示 |
|---|---|
| `scene_summary` | 场景理解卡片 |
| `safety_observation` | 安全观察卡片 |
| `photo_advice` | 拍照建议卡片 |
| `task_result.passed` | 任务完成状态 |
| `task_result.reward_badge` | 徽章弹窗，并写入 localStorage |
| `task_result.reason` | 任务判断说明 |
| `reply_text` | 搭子回应气泡 |

---

## 2.7 图片分析 fallback

视觉模型失败时，必须返回模拟结果，保证 Demo 能继续。

```json
{
  "scene_summary": "画面中有街道、灯光和生活气息，接近城市夜间街区场景。",
  "safety_observation": "从画面看，灯光较明显，适合短暂停留；夜间单人出行仍建议靠近主路和人流较多区域。",
  "photo_advice": "可以把灯光、招牌和街道线条放进画面，让城市烟火气更明显。",
  "task_result": {
    "passed": true,
    "reward_badge": "城市烟火徽章",
    "reason": "照片包含城市街区和生活氛围，符合烟火气打卡要求。"
  },
  "reply_text": "我看到了你眼前的城市烟火气，这张照片可以完成任务，城市烟火徽章已解锁。"
}
```

---

# 3. 附近地点接口

## 3.1 接口说明

```text
GET /api/mock-places
```

用途：

```text
返回模拟附近地点，用于地点推荐、旅行决策和任务触发。
MVP 阶段不依赖真实地图 API。
```

对应页面：

```text
ChatPage.jsx
HomePage.jsx
```

对应前端方法：

```text
services/api.js -> getMockPlaces()
```

---

## 3.2 Query 参数

MVP 阶段可不传参数。

可选扩展：

```text
/api/mock-places?city=杭州&place_name=西湖附近
```

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `city` | string | 否 | 当前城市 |
| `place_name` | string | 否 | 当前地点 |
| `time` | string | 否 | 当前时间，用于夜间推荐 |

---

## 3.3 Response Body

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
  },
  {
    "id": "old_street",
    "name": "老街入口",
    "type": "culture",
    "distance": 850,
    "safety_level": "medium",
    "tags": ["拍照", "文化", "散步", "街景"],
    "description": "适合白天或傍晚慢慢逛，可以拍到有城市记忆感的街景。",
    "task_id": "firework_photo_task"
  },
  {
    "id": "riverside",
    "name": "江边步道",
    "type": "view",
    "distance": 1200,
    "safety_level": "medium",
    "tags": ["风景", "散步", "夜景"],
    "description": "风景好，但夜间单人前往需要注意人流和照明情况。",
    "task_id": "safe_route_task"
  }
]
```

---

## 3.4 地点字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 地点 ID |
| `name` | string | 是 | 地点名称 |
| `type` | string | 是 | 地点类型，如 `food`、`culture`、`view` |
| `distance` | number | 是 | 距离，单位米 |
| `safety_level` | string | 是 | 安全等级：`high`、`medium`、`low` |
| `tags` | array | 否 | 地点标签 |
| `description` | string | 是 | 推荐说明 |
| `task_id` | string/null | 否 | 可触发任务 ID |

---

## 3.5 前端渲染规则

| 后端字段 | 前端展示 |
|---|---|
| `name` | 地点卡片标题 |
| `distance` | 距离标签 |
| `safety_level` | 安全等级标签 |
| `tags` | 标签组 |
| `description` | 推荐理由 |
| `task_id` | 可触发任务 |

---

## 3.6 地点接口 fallback

如果接口失败，前端直接读取本地 mock：

```text
config/mock_places.json
```

---

# 4. 任务完成接口

## 4.1 接口说明

```text
POST /api/complete-task
```

用途：

```text
当用户完成任务后，记录完成状态并返回已解锁徽章。
MVP 阶段可以不依赖数据库，前端 localStorage 也要保存一份。
```

对应页面：

```text
BadgePage.jsx
PhotoPage.jsx
```

对应前端方法：

```text
services/api.js -> completeTask(payload)
```

---

## 4.2 Request Body

```json
{
  "task_id": "firework_photo_task",
  "passed": true
}
```

---

## 4.3 Request 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `task_id` | string | 是 | 任务 ID，对应 `config/tasks.json` |
| `passed` | boolean | 是 | 是否完成任务 |

---

## 4.4 Response Body

```json
{
  "completed_tasks": ["firework_photo_task"],
  "badges": ["城市烟火徽章"]
}
```

---

## 4.5 Response 字段说明

| 字段 | 类型 | 必填 | 前端展示位置 |
|---|---|---|---|
| `completed_tasks` | array | 是 | 已完成任务列表 |
| `badges` | array | 是 | 已获得徽章列表 |

---

## 4.6 前端渲染规则

| 后端字段 | 前端展示 |
|---|---|
| `completed_tasks` | BadgePage 中标记任务完成 |
| `badges` | BadgePage 中高亮徽章，并写入 localStorage |

---

## 4.7 任务完成 fallback

如果接口失败，前端直接用本地状态保存：

```json
{
  "completed_tasks": ["firework_photo_task"],
  "badges": ["城市烟火徽章"]
}
```

---

# 5. 旅行日记接口

## 5.1 接口说明

```text
POST /api/generate-diary
```

用途：

```text
根据用户走过的地点、获得的徽章、心情变化和对话摘要，生成旅行日记、朋友圈文案和标签。
```

对应页面：

```text
DiaryPage.jsx
```

对应前端方法：

```text
services/api.js -> generateDiary(payload)
```

---

## 5.2 Request Body

```json
{
  "visited_places": ["老街入口", "夜市街区"],
  "completed_tasks": ["firework_photo_task"],
  "badges": ["城市烟火徽章"],
  "mood_history": ["uncertain", "relaxed"],
  "chat_summary": "用户一开始有点不安，后来完成了拍照任务。",
  "diary_style": "gentle"
}
```

---

## 5.3 Request 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `visited_places` | array | 是 | 用户走过或选择过的地点 |
| `completed_tasks` | array | 否 | 已完成任务 ID |
| `badges` | array | 否 | 已获得徽章 |
| `mood_history` | array | 否 | 心情变化，如 `uncertain -> relaxed` |
| `chat_summary` | string | 否 | 对话摘要 |
| `diary_style` | string | 否 | 日记风格，默认 `gentle` |

---

## 5.4 `diary_style` 可选值

| 值 | 含义 |
|---|---|
| `gentle` | 温柔日记版 |
| `share` | 朋友圈文案版 |
| `route` | 路线总结版 |

---

## 5.5 Response Body

```json
{
  "diary": "今天你一个人从老街走到了夜市。刚开始你有点犹豫，但你完成了烟火气打卡，也慢慢放松下来。",
  "share_caption": "一个人的旅行，也会遇到刚刚好的热闹。",
  "route_summary": "今日路线：老街入口 → 夜市街区。完成任务：烟火气打卡。获得徽章：城市烟火徽章。",
  "summary_tags": ["单人旅行", "夜市", "烟火气"]
}
```

---

## 5.6 Response 字段说明

| 字段 | 类型 | 必填 | 前端展示位置 |
|---|---|---|---|
| `diary` | string | 是 | 旅行日记正文 |
| `share_caption` | string | 是 | 朋友圈文案 |
| `route_summary` | string | 否 | 路线总结 |
| `summary_tags` | array | 否 | 标签组 |

---

## 5.7 前端渲染规则

| 后端字段 | 前端展示 |
|---|---|
| `diary` | 日记卡片 |
| `share_caption` | 朋友圈文案卡片 |
| `route_summary` | 路线总结卡片 |
| `summary_tags` | 标签组 |

---

## 5.8 旅行日记 fallback

如果接口失败，前端使用固定模板：

```json
{
  "diary": "今天你一个人走过了老街入口和夜市街区。一开始你有点犹豫，但后来你完成了烟火气打卡，也慢慢放松下来。你解锁了城市烟火徽章。这不是一次孤单的旅行，而是一次属于自己的探索。",
  "share_caption": "一个人的旅行，也会遇到刚刚好的热闹。",
  "route_summary": "今日路线：老街入口 → 夜市街区。完成任务：烟火气打卡。获得徽章：城市烟火徽章。",
  "summary_tags": ["单人旅行", "夜市", "烟火气"]
}
```

---

# 6. 共享配置文件字段

## 6.1 `config/personas.json`

由成员B主写，成员A读取。

```json
{
  "id": "gentle_friend",
  "name": "温柔朋友型",
  "tagline": "陪你聊天，提醒安全",
  "avatar": "/assets/personas/gentle_friend.png",
  "tone": "温柔、自然、像朋友，不说教",
  "voice_style": "warm",
  "opening_line": "今天我陪你走，不用急，我们慢慢来。",
  "comfort_line": "我在，你不是一个人。我们先选一个更安心的方向。",
  "safety_line": "我建议你优先走人多、灯光亮的路，不要往太偏的地方走。",
  "system_prompt": "你是一个温柔可靠的旅行搭子，适合陪伴单人出行用户。"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 人格 ID，用于接口中的 `persona_id` |
| `name` | string | 前端展示名称 |
| `tagline` | string | 一句话介绍 |
| `avatar` | string | 头像路径 |
| `tone` | string | 语气说明 |
| `voice_style` | string | 语音风格标识 |
| `opening_line` | string | 开场白 |
| `comfort_line` | string | 安慰语 |
| `safety_line` | string | 安全提醒语 |
| `system_prompt` | string | 后端 Agent Prompt 可读取 |

---

## 6.2 `config/tasks.json`

由成员B主写，成员A读取并判断。

```json
{
  "id": "firework_photo_task",
  "title": "烟火气打卡",
  "description": "拍一张有本地生活气息的照片。",
  "requirements": ["店铺", "灯光", "人流", "招牌", "小吃摊"],
  "reward_badge": "城市烟火徽章",
  "success_message": "你捕捉到了这座城市最有生活感的一面，已解锁城市烟火徽章。"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 任务 ID |
| `title` | string | 任务标题 |
| `description` | string | 任务描述 |
| `requirements` | array | 任务完成条件 |
| `reward_badge` | string | 奖励徽章 |
| `success_message` | string | 成功提示文案 |

---

## 6.3 `config/mock_places.json`

成员A提供结构，成员B优化文案。

```json
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
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 地点 ID |
| `name` | string | 地点名称 |
| `type` | string | 地点类型 |
| `distance` | number | 距离，单位米 |
| `safety_level` | string | 安全等级 |
| `tags` | array | 标签 |
| `description` | string | 推荐说明 |
| `task_id` | string/null | 可触发任务 ID |

---

# 7. 前端本地状态结构

MVP 阶段不强制依赖数据库，前端使用 localStorage 保存 Demo 状态。

```json
{
  "personaId": "gentle_friend",
  "messages": [],
  "currentTaskId": "firework_photo_task",
  "completedTasks": [],
  "badges": [],
  "visitedPlaces": ["老街入口"],
  "moodHistory": ["uncertain"],
  "lastPhotoAnalysis": null
}
```

字段说明：

| 字段 | 说明 |
|---|---|
| `personaId` | 当前选择的人格 |
| `messages` | 对话消息 |
| `currentTaskId` | 当前任务 |
| `completedTasks` | 已完成任务 |
| `badges` | 已获得徽章 |
| `visitedPlaces` | 走过或选择过的地点 |
| `moodHistory` | 心情变化 |
| `lastPhotoAnalysis` | 最近一次图片分析结果 |

---

# 8. 安全与边界说明

1. SoloMate 的安全提示只作为辅助性提醒，不替代报警、急救或专业安全服务。
2. 不能承诺某地点“绝对安全”。
3. 当用户表达害怕、迷路、路太黑、不知道是否继续前进时，优先建议：
   - 回到人多、灯光亮的主路；
   - 前往便利店、商场、地铁站等公共场所；
   - 联系朋友或家人；
   - 紧急情况直接联系当地紧急服务。
4. 黑客松 MVP 不做真实路线导航，只做建议型路线选择。
5. 图片分析失败时必须返回模拟结果，保证 Demo 不断。

---

# 9. 成员A后端验收标准

成员A接口至少满足：

```text
1. /api/chat 能返回固定 JSON。
2. /api/mock-places 能返回地点数组。
3. /api/analyze-photo 能返回图片分析 JSON。
4. /api/complete-task 能返回 completed_tasks 和 badges。
5. /api/generate-diary 能返回 diary、share_caption、summary_tags。
6. 所有接口失败时有 fallback。
7. 返回字段和本文件一致。
```

---

# 10. 成员B前端验收标准

成员B前端至少满足：

```text
1. ChatPage 能调用 chat(payload) 并展示 reply_text。
2. ChatPage 能展示 safety_tip、next_options、task_triggered。
3. PhotoPage 能展示 scene_summary、safety_observation、photo_advice。
4. PhotoPage 能根据 task_result.reward_badge 解锁徽章。
5. BadgePage 能读取 localStorage 中的 badges。
6. DiaryPage 能调用 generateDiary(payload) 并展示 diary、share_caption、route_summary。
7. 后端接口失败时，前端 mock fallback 仍能跑完整 Demo。
```

---

# 11. 禁止临时新增的 P2 字段

以下内容不进入 P0 接口：

```text
真实 AR 坐标
实时视频流
多用户社交匹配
复杂地图导航路径
系统级悬浮窗权限
商业订单/酒店/机票预订
支付字段
用户账号系统
```

如果后续需要这些功能，只能作为 P2 概念展示，不影响主线 Demo。
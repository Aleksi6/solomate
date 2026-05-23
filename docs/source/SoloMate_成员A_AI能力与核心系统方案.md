# SoloMate 成员 A 开发方案：AI 能力与核心系统负责人

## 1. 你的角色定位

成员 A 负责 SoloMate 的核心技术底座。

一句话：

> 你负责让 SoloMate 真的能听、能看、能判断、能回复，并且现场演示稳定不崩。

你的工作重点不是 UI 美观，而是保证完整技术链路能跑通。

---

## 2. 你的核心目标

你需要跑通下面这条链路：

```text
用户输入文本/语音
→ 选择人格
→ 发送当前位置和上下文
→ Agent 生成回复
→ 前端展示/语音播报
→ 用户上传照片
→ 视觉模型分析
→ 判断任务状态
→ 解锁徽章
→ 生成旅行日记
```

---

## 3. 你负责的模块总览

| 模块 | 你的任务 |
|---|---|
| 后端服务 | 搭建 API 服务，保证前端可调用 |
| AI 对话 | 调用大模型，融合人格、位置、情绪和任务状态 |
| 语音能力 | 语音识别、文本转语音、失败兜底 |
| 图片分析 | 图片上传、视觉模型分析、任务判断 |
| 地点数据 | 提供模拟位置和附近地点 |
| 情绪/模式判断 | 判断用户当前是陪聊、决策、安全、拍照还是游戏模式 |
| 任务状态 | 维护任务完成状态和徽章状态 |
| 旅行日记 | 生成温柔日记、朋友圈文案、路线总结 |
| 稳定性 | 兜底回复、模拟数据、一键启动、部署 |

---

## 4. 推荐后端目录结构

```text
backend/
├─ app.py / server.js
├─ routes/
│  ├─ chat.py
│  ├─ photo.py
│  ├─ diary.py
│  └─ places.py
├─ services/
│  ├─ llm_service.py
│  ├─ vision_service.py
│  ├─ voice_service.py
│  ├─ agent_service.py
│  └─ task_service.py
├─ prompts/
│  ├─ base_agent_prompt.txt
│  ├─ safety_prompt.txt
│  ├─ photo_prompt.txt
│  └─ diary_prompt.txt
└─ utils/
   ├─ fallback.py
   └─ json_loader.py
```

你可以根据实际技术栈调整，但要保持接口清晰。

---

## 5. 你必须实现的接口

### 5.1 对话接口

```text
POST /api/chat
```

#### 请求字段

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

#### 返回字段

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

#### 实现要点

1. 读取 `persona_id` 对应的人格配置；
2. 根据 `mode` 判断当前任务；
3. 融合位置、时间、心情、附近地点；
4. 返回结构化 JSON，不要只返回一段纯文本；
5. 大模型失败时必须返回 fallback。

---

### 5.2 照片分析接口

```text
POST /api/analyze-photo
```

#### 请求字段

```json
{
  "image": "uploaded_file",
  "persona_id": "game_sprite",
  "task_id": "firework_photo_task",
  "location": {
    "place_name": "夜市街区"
  },
  "user_question": "这张照片能完成任务吗？"
}
```

#### 返回字段

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

#### 实现要点

1. 先保证图片上传成功；
2. 可以先用固定 mock 返回，后接真实视觉模型；
3. 任务判断可以先用大模型根据任务 requirements 判断；
4. 图片分析失败时返回模拟成功结果，保证 Demo 不断。

---

### 5.3 附近地点接口

```text
GET /api/mock-places
```

#### 返回示例

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

#### 实现要点

1. 先读取 `config/mock_places.json`；
2. 前端不传位置时，返回固定 Demo 地点；
3. 有时间再根据真实定位排序。

---

### 5.4 任务完成接口

```text
POST /api/complete-task
```

#### 请求字段

```json
{
  "task_id": "firework_photo_task",
  "passed": true
}
```

#### 返回字段

```json
{
  "completed_tasks": ["firework_photo_task"],
  "badges": ["城市烟火徽章"]
}
```

#### 实现要点

1. MVP 可以不用数据库；
2. 状态可以保存在前端 localStorage，后端只返回判断结果；
3. 后端也可以使用内存字典临时保存 Demo 状态；
4. 不要把数据库作为黑客松关键依赖。

---

### 5.5 旅行日记接口

```text
POST /api/generate-diary
```

#### 请求字段

```json
{
  "visited_places": ["老街入口", "夜市街区"],
  "badges": ["城市烟火徽章"],
  "mood_history": ["uncertain", "relaxed"],
  "chat_summary": "用户一开始有点不安，后来完成了拍照任务。"
}
```

#### 返回字段

```json
{
  "diary": "今天你一个人从老街走到了夜市。刚开始你有点犹豫，但你完成了烟火气打卡，也慢慢放松下来。",
  "share_caption": "一个人的旅行，也会遇到刚刚好的热闹。",
  "summary_tags": ["单人旅行", "夜市", "烟火气"]
}
```

#### 实现要点

1. 日记要短、温柔、有陪伴感；
2. 不要生成过长小作文；
3. 支持 fallback 固定模板；
4. 成员 B 会提供日记模板，你负责填入数据并调用模型优化。

---

## 6. 语音能力实现方案

### 推荐优先级

```text
P0：文本输入 + AI 回复
P1：浏览器语音识别转文字
P2：AI 回复文本转语音播放
P3：实时语音通话，有时间再做
```

### MVP 语音流程

```text
点击麦克风
→ 浏览器识别语音为文本
→ 发给 /api/chat
→ 后端返回 reply_text
→ 前端用 TTS 播放 reply_text
```

### 必须保留兜底

```text
语音识别失败 → 用户手动输入
TTS 失败 → 只显示文本
AI 请求失败 → 返回固定陪伴回复
```

---

## 7. Agent 决策逻辑

你不要只做普通聊天接口，而是让 Agent 根据 `mode` 工作。

| mode | 含义 |
|---|---|
| `chat` | 普通陪聊 |
| `decision` | 帮用户做旅行选择 |
| `safety` | 安心守护 |
| `guide` | 景点讲解 |
| `photo` | 拍照建议 |
| `game` | 游戏任务 |

Prompt 需要融合：

```text
人格 persona
用户输入 user_text
当前位置 location
当前时间 time
用户情绪 mood
附近地点 nearby_places
任务状态 task_state
安全规则 safety_rules
```

---

## 8. Prompt 设计建议

### 8.1 基础 Prompt 规则

Agent 必须遵守：

```text
1. 你是旅行搭子，不是客服。
2. 先回应用户情绪，再给建议。
3. 建议要具体、可执行。
4. 涉及安全时只能给辅助性提醒，不能做绝对判断。
5. 输出要简洁，适合语音播报。
6. 必须根据 persona 调整语气。
7. 返回结构化 JSON，方便前端展示。
```

### 8.2 回复结构

建议回复分三层：

```text
情绪回应
→ 场景判断
→ 下一步选择
```

示例：

```text
我在，不用急。
你现在一个人出行，又已经有点累，我建议先去人多一点的夜市。
你可以选：去夜市 / 找咖啡店休息 / 回酒店。
```

---

## 9. 兜底机制

黑客松现场稳定性比功能数量更重要。

你必须准备以下 fallback：

| 风险 | 兜底 |
|---|---|
| LLM 接口失败 | 返回固定陪伴回复 |
| 视觉模型失败 | 返回模拟图片分析 |
| 语音识别失败 | 使用文本输入 |
| TTS 失败 | 只展示文字 |
| 定位失败 | 使用模拟位置 |
| 网络慢 | 显示“搭子正在思考” |
| JSON 解析失败 | 后端强制转成标准字段 |

### 固定兜底回复

```text
我现在网络有点慢，但我还在。你可以先选择人多、灯光亮的方向，避免进入偏僻小路。如果你愿意，我可以先帮你从附近的夜市、咖啡店和地铁站里选一个更安心的目的地。
```

---

## 10. 你需要读取的配置文件

### 10.1 `personas.json`

由成员 B 主写，你负责读取。

用途：

```text
根据 persona_id 找到对应人格、语气、system_prompt。
```

### 10.2 `tasks.json`

由成员 B 主写，你负责读取并判断。

用途：

```text
根据 task_id 找到任务要求和奖励徽章。
```

### 10.3 `mock_places.json`

你负责结构，成员 B 优化文案。

用途：

```text
返回附近地点、推荐理由和可触发任务。
```

---

## 11. 开发优先级

### 第一阶段：骨架可跑

```text
1. 启动后端服务
2. 实现 /api/chat 假接口
3. 实现 /api/mock-places
4. 返回固定 JSON
5. 让前端能调用
```

目标：

```text
用户能选人格，输入一句话，页面能显示 AI 回复。
```

---

### 第二阶段：接入核心能力

```text
1. 接入 LLM
2. 接入语音识别/播报
3. 实现图片上传接口
4. 实现任务判断
5. 实现任务/徽章状态
```

目标：

```text
能语音聊天，能上传照片，能显示任务完成和徽章。
```

---

### 第三阶段：完成 Demo

```text
1. 实现旅行日记接口
2. 优化 Prompt
3. 增加 fallback
4. 协助前端联调
5. 准备一键启动脚本
```

目标：

```text
3 分钟内完整演示：
选择搭子 → 语音陪伴 → 推荐地点 → 上传照片 → 解锁徽章 → 生成日记。
```

---

## 12. 你和成员 B 的接口同步规则

你必须保证：

```text
1. 不随意改接口字段。
2. 所有返回都符合 api_contract.md。
3. 如果字段要改，先通知成员 B。
4. 所有接口先给 mock 返回，方便前端并行开发。
5. 真实 API 不稳定时也要能演示。
```

最关键字段：

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

---

## 13. 你的最终交付物

```text
1. 后端可启动服务
2. /api/chat
3. /api/analyze-photo
4. /api/mock-places
5. /api/complete-task
6. /api/generate-diary
7. personas.json 读取逻辑
8. tasks.json 读取逻辑
9. mock_places.json 读取逻辑
10. 语音识别/播报可用方案
11. AI 接口失败时的 fallback
12. 一键启动说明
13. Demo 联调文档
```

---

## 14. 最终验收标准

你的部分合格，需要满足：

```text
1. 后端能启动；
2. 前端能正常调用接口；
3. 文本输入能得到回复；
4. 语音失败时不影响文本输入；
5. 图片上传失败时有模拟分析；
6. 没有定位时能使用模拟位置；
7. 任务完成状态能返回；
8. 旅行日记能生成；
9. Demo 过程中接口不崩；
10. 有一套稳定 fallback。
```

---

## 15. 你的核心任务总结

你负责的是 SoloMate 的“能力中台”。

最重要的不是做很多花哨功能，而是保证：

```text
能听；
能看；
能判断；
能回复；
能记录；
能兜底；
能稳定演示。
```

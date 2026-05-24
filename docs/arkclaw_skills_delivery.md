# SoloMate ArkClaw Skills 交付说明

本文档说明 SoloMate 的 ArkClaw Skills 交付包如何对应 App 功能、Demo 演示和后续 ArkClaw 平台上线映射。

SoloMate 的 Skill 设计目标不是做一个复杂旅游平台，而是把 MVP 主线拆成 4 个清晰能力节点：

```text
陪伴式对话 -> 单人旅行决策 -> 照片任务判断 -> 旅行日记生成
```

## 1. Skills 目录结构

```text
skills/
├─ solomate_persona_companion/
│  └─ SKILL.md
├─ solomate_trip_decision/
│  └─ SKILL.md
├─ solomate_photo_task/
│  └─ SKILL.md
└─ solomate_diary_writer/
   └─ SKILL.md
```

每个 `SKILL.md` 都包含：

- Overview
- When to use
- Inputs
- Outputs
- Steps
- ArkClaw model mapping
- Prompt template
- Fallback behavior
- Demo example

## 2. Skill 与 App 功能对应

| Skill | 对应 App 功能 | 对应 API | 核心价值 |
|---|---|---|---|
| `solomate_persona_companion` | 文本/语音聊天、搭子人格回复、上下文承接 | `POST /api/chat` | 让 SoloMate 像旅行搭子，而不是普通机器人 |
| `solomate_trip_decision` | 路线/吃饭/安全/天气/拍照点决策 | `POST /api/chat` 中 decision 类回复 | 帮单人旅行者把“下一步去哪”变成低压力选择 |
| `solomate_photo_task` | 上传照片、场景分析、任务判断、徽章触发 | `POST /api/analyze-photo` | 让用户把“看到的世界”分享给搭子，并完成任务 |
| `solomate_diary_writer` | 旅行日记、分享文案、标签生成 | `POST /api/generate-diary` | 把聊天、照片、徽章收束成情感闭环 |

## 3. Demo 录屏展示方式

推荐录屏按这条主线展示，评委能看到 4 个 Skill 的协作：

```text
1. 打开 SoloMate，选择“温柔朋友型”
2. 用户输入或语音说：朋友临时来不了了，我现在一个人有点不知道去哪
3. solomate_persona_companion 生成陪伴式回复
4. solomate_trip_decision 推荐夜市街区，并给出安全提醒
5. 用户切到照片页，上传夜市/街区照片
6. solomate_photo_task 输出场景摘要、拍照建议，并判断烟火气任务完成
7. App 展示城市烟火徽章
8. 用户进入日记页
9. solomate_diary_writer 生成今日旅行日记、朋友圈文案和标签
```

录屏讲解重点：

- SoloMate 会承接上下文，不要求用户每轮重复地点。
- SoloMate 会先回应情绪，再给决策，不像冷冰冰攻略工具。
- 照片不是只做识别，而是和任务、徽章、旅行记忆连接。
- 日记把一次单人旅行变成可回看的故事。
- 真实模型不可用时，fallback 仍能保持 Demo 主线完整。

## 4. ArkClaw 上线映射

### 4.1 对话工作流

ArkClaw 推荐节点：

```text
App input
-> Context merge node
-> Persona config node
-> solomate_persona_companion model node
-> Optional solomate_trip_decision model node
-> JSON output parser
-> App /api/chat response
```

输入映射：

```json
{
  "user_text": "{{app.user_text}}",
  "persona_id": "{{app.persona_id}}",
  "history": "{{app.history}}",
  "conversation_state": "{{app.conversation_state}}",
  "live_context": "{{app.live_context}}"
}
```

输出映射到 `/api/chat`：

```json
{
  "reply_text": "{{model.reply_text}}",
  "reply_type": "{{model.reply_type}}",
  "emotion_detected": "{{model.emotion_detected}}",
  "suggested_action": "{{model.suggested_action}}",
  "safety_tip": "{{model.safety_tip}}",
  "next_options": "{{model.next_options}}",
  "task_triggered": "{{model.task_triggered}}"
}
```

### 4.2 决策工作流

`solomate_trip_decision` 可以作为 `/api/chat` 内部的决策节点。当 intent 是 route、food、weather、photo、safety 或 place decision 时调用。

输入映射：

```json
{
  "current_place": "{{conversation_state.current_place}}",
  "target_place": "{{conversation_state.target_place}}",
  "time_of_day": "{{live_context.time_of_day}}",
  "weather": "{{live_context.weather}}",
  "nearby_places": "{{live_context.nearby_places}}",
  "mood": "{{conversation_state.mood}}"
}
```

输出仍映射为 `/api/chat` 标准字段，避免改前端接口。

### 4.3 照片任务工作流

ArkClaw 推荐节点：

```text
Image input
-> Vision model node
-> Task config node
-> solomate_photo_task model node
-> JSON output parser
-> App /api/analyze-photo response
```

输入映射：

```json
{
  "image": "{{app.image}}",
  "task_id": "{{app.task_id}}",
  "persona_id": "{{app.persona_id}}",
  "place_name": "{{app.place_name}}"
}
```

输出映射到 `/api/analyze-photo`：

```json
{
  "scene_summary": "{{model.scene_summary}}",
  "safety_observation": "{{model.safety_observation}}",
  "photo_advice": "{{model.photo_advice}}",
  "task_result": {
    "passed": "{{model.task_result.passed}}",
    "reward_badge": "{{model.task_result.reward_badge}}",
    "reason": "{{model.task_result.reason}}"
  },
  "reply_text": "{{model.reply_text}}"
}
```

### 4.4 日记生成工作流

ArkClaw 推荐节点：

```text
Session memory input
-> Id normalization node
-> solomate_diary_writer model node
-> JSON output parser
-> App /api/generate-diary response
```

输入映射：

```json
{
  "visited_places": "{{session.visited_places}}",
  "badges": "{{session.badges}}",
  "mood_history": "{{session.mood_history}}",
  "memory_fragments": "{{session.memory_fragments}}",
  "chat_summary": "{{session.chat_summary}}"
}
```

输出映射到 `/api/generate-diary`：

```json
{
  "diary": "{{model.diary}}",
  "share_caption": "{{model.share_caption}}",
  "summary_tags": "{{model.summary_tags}}"
}
```

## 5. Fallback 与评审稳定性

所有 Skill 都必须保留 fallback：

- LLM 失败：返回标准 JSON mock response。
- Vision 失败：返回 Demo 场景分析，不假装真实看见具体物体。
- 天气/定位失败：使用 mock live context，不编造实时精度。
- JSON 解析失败：后端或 ArkClaw 输出解析节点强制转成标准字段。

Fallback 的意义：

- 现场网络不稳定时，Demo 主线仍可走完。
- 前端不用感知模型失败，仍能展示聊天、照片、任务、徽章、日记。
- 评委能看到完整产品闭环，而不是只看到 API 成败。

## 6. 不包含内容

本交付包不包含：

- 任何 API Key。
- 真实 ArkClaw SDK 调用代码。
- 数据库依赖。
- 真实地图导航。
- 真实打车/订票/酒店预订。
- 系统级悬浮窗或真 AR。

这些能力可以作为后续 P1/P2 方向，但不属于 SoloMate MVP 交付范围。

## 7. 验收清单

交付前检查：

- `skills/solomate_persona_companion/SKILL.md` 已描述陪伴式聊天 Skill。
- `skills/solomate_trip_decision/SKILL.md` 已描述单人旅行决策 Skill。
- `skills/solomate_photo_task/SKILL.md` 已描述照片分析与任务判断 Skill。
- `skills/solomate_diary_writer/SKILL.md` 已描述旅行日记 Skill。
- 所有 Skill 输入输出与 `docs/api_contract.md` 对齐。
- 所有 Skill 都包含 fallback。
- 所有 Skill 都说明 ArkClaw 模型节点映射。
- 文档没有 API Key。
- App 主流程代码无需修改即可引用这些 Skill 作为交付说明。

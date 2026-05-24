# SoloMate Photo Task Skill

## Overview

`solomate_photo_task` analyzes a user-uploaded travel photo and turns it into a companion-style scene summary, safety observation, photo suggestion, and task/badge judgment.

This Skill is designed for the "send what I see to my travel buddy" moment. It should make the user feel that SoloMate is responding to their current world, not merely running an image detector. It also powers the MVP task loop:

```text
upload photo -> analyze scene -> judge task -> unlock badge -> save memory fragment
```

It maps to the app API:

```text
POST /api/analyze-photo
```

## When to use

Use this Skill when the app needs to:

- Analyze a street, food, scenery, route, sign, or travel moment photo.
- Decide whether a photo completes a task such as `firework_photo_task`, `local_food_task`, or `safe_route_task`.
- Generate a scene summary for the photo result card.
- Generate a practical safety observation for solo travel.
- Generate a gentle photo tip for better framing or memory value.
- Produce a companion response for the photo page and memory fragment.

Do not use this Skill for normal chat decisions or final diary generation.

## Inputs

Expected input:

```json
{
  "image": "file or image_url",
  "task_id": "",
  "persona_id": "",
  "place_name": ""
}
```

Field notes:

- `image`: Uploaded file, image URL, or ArkClaw image input object.
- `task_id`: Optional task id from `config/tasks.json`. Default to `firework_photo_task` for Demo if missing.
- `persona_id`: Persona tone hint. `photo_buddy` gives more photo advice; `game_sprite` gives more task energy; `gentle_friend` gives calmer feedback.
- `place_name`: Optional place label, such as `夜市街区`, `老街入口`, or `江边步道`.

Recommended extra model context:

```json
{
  "task": {
    "id": "firework_photo_task",
    "title": "烟火气打卡",
    "requirements": ["店铺", "灯光", "人流", "招牌", "小吃摊"],
    "reward_badge": "城市烟火徽章"
  },
  "vision_result": {},
  "mock_scene": ""
}
```

## Outputs

The Skill must return strict JSON matching `/api/analyze-photo`:

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

Output rules:

- `scene_summary`: One mobile-card-sized sentence about what the scene feels like.
- `safety_observation`: Solo-travel safety note based on visible or mock context.
- `photo_advice`: One practical tip about framing, light, angle, timing, or memory value.
- `task_result.passed`: Boolean task judgment. In Demo fallback, may be optimistic but must explain that it is based on Demo context if no real vision result exists.
- `task_result.reward_badge`: Badge from `tasks.json`, such as `城市烟火徽章`, `本地味道徽章`, or `安心探索徽章`.
- `task_result.reason`: Short reason tied to task requirements.
- `reply_text`: A warm companion response suitable for the photo page.

## Steps

1. Receive the image input from the app or ArkClaw image node.
2. If a vision model is available, extract concise visual signals:

```text
scene type, lighting, people/crowd, shops/signs, food/menu, road/water/traffic, indoor/outdoor, photo quality
```

3. Load task definition from `config/tasks.json` by `task_id`.
4. Compare visual signals with task `requirements`.
5. Decide `task_result.passed`.
6. Choose `reward_badge` from the task config.
7. Write `scene_summary`, `safety_observation`, and `photo_advice` in the selected persona tone.
8. Avoid pretending to see concrete objects if no real visual result exists.
9. Return strict JSON only.

## ArkClaw model mapping

Recommended ArkClaw node setup:

- Image understanding node: receives `image` and returns `vision_result`.
- Task config node: loads task requirements and reward badge by `task_id`.
- Model node: combines `vision_result`, task config, persona, and place context into the strict output schema.
- Output parser: validates `/api/analyze-photo` JSON.

If ArkClaw does not provide an image model in the current environment, pass a `mock_scene` string into the model node. The prompt must clearly tell the model to say "从当前 Demo 场景看" or use general wording.

## Prompt template

```text
You are SoloMate's photo task Skill.
Turn a travel photo analysis into a warm companion response and task judgment.

Persona:
{{persona_profile}}

Place:
{{place_name}}

Task:
{{task}}

Vision result:
{{vision_result}}

Mock scene, only if vision_result is unavailable:
{{mock_scene}}

Rules:
1. If vision_result is available, describe visible scene signals naturally.
2. If vision_result is unavailable, do not pretend to see exact objects. Use "从当前 Demo 场景看" or general wording.
3. Judge the task using task.requirements.
4. Keep all text short enough for mobile result cards.
5. Give one safety observation for solo travel.
6. Give one photo tip that is useful and kind.
7. Return strict JSON only:

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

## Fallback behavior

If image upload, vision analysis, or JSON parsing fails, return a stable Demo response:

```json
{
  "scene_summary": "从当前 Demo 场景看，这更像一段适合收进旅行记忆的城市瞬间。",
  "safety_observation": "一个人停留拍照时，建议靠近主路、开放店铺或人流稳定的位置，不要为了构图走到太暗太偏的地方。",
  "photo_advice": "可以把灯光、招牌或路面线条留进画面，让今天的城市感更完整。",
  "task_result": {
    "passed": true,
    "reward_badge": "城市烟火徽章",
    "reason": "当前为 Demo fallback 判定，按烟火气任务给出可演示结果。"
  },
  "reply_text": "我先把这个瞬间收进今天的旅行碎片里，等真实视觉能力打开后还能判断得更细。"
}
```

Fallback rules:

- Preserve the exact output schema.
- Never leak model or upload errors to the user.
- If `task_id` maps to a known task, use that task's `reward_badge`.
- If `task_id` is missing, use `firework_photo_task` and `城市烟火徽章` for MVP Demo.

## Demo example

Input:

```json
{
  "image": "uploaded_file",
  "task_id": "firework_photo_task",
  "persona_id": "photo_buddy",
  "place_name": "夜市街区"
}
```

Output:

```json
{
  "scene_summary": "画面有街区灯光和生活气息，像是一次很适合留作旅行记忆的夜间停靠。",
  "safety_observation": "这里看起来更适合在明亮、开放的位置短暂停留，拍完可以顺着人流回到主路。",
  "photo_advice": "再稍微侧一点，把招牌、街灯和一点人流都收进画面，烟火气会更明显。",
  "task_result": {
    "passed": true,
    "reward_badge": "城市烟火徽章",
    "reason": "照片主题符合店铺、灯光和本地生活氛围，满足烟火气打卡要求。"
  },
  "reply_text": "这张很有今天的现场感，烟火气打卡可以算完成了。"
}
```

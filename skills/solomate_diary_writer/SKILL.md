# SoloMate Diary Writer Skill

## Overview

`solomate_diary_writer` turns a solo travel day into a short, warm memory artifact. It uses visited places, unlocked badges, mood changes, memory fragments, and chat summary to generate the final diary card, share caption, and summary tags.

This Skill closes the SoloMate MVP loop:

```text
chat companion -> trip decision -> photo task -> badge -> travel diary
```

The writing should feel like a travel buddy helping the user put the day into a small notebook, not like a long travel essay or a generic social caption.

It maps to the app API:

```text
POST /api/generate-diary
```

## When to use

Use this Skill when the user taps a diary or memory generation action after:

- Chatting with a persona companion.
- Visiting or discussing places.
- Uploading photo fragments.
- Completing a task or unlocking a badge.
- Recording mood notes.

Do not use this Skill for live route suggestions or photo task judgment.

## Inputs

Expected input:

```json
{
  "visited_places": [],
  "badges": [],
  "mood_history": [],
  "memory_fragments": [],
  "chat_summary": ""
}
```

Field notes:

- `visited_places`: Natural names or ids, such as `夜市街区`, `old_street`, `coffee_stop`.
- `badges`: Badge names or ids, such as `城市烟火徽章`, `不孤单徽章`.
- `mood_history`: Mood labels or short notes, such as `uncertain`, `tired`, `relaxed`.
- `memory_fragments`: Photo or souvenir fragments saved by the app. May include scene summary, reply text, place, task, image metadata, or created time.
- `chat_summary`: Short summary of the day's conversation and choices.

Recommended `memory_fragments` item:

```json
{
  "type": "photo_fragment",
  "title": "今天的小停靠",
  "description": "画面有街区灯光和生活气息。",
  "location": "夜市街区",
  "source": "photo_task",
  "badge": "城市烟火徽章"
}
```

## Outputs

The Skill must return strict JSON matching `/api/generate-diary`:

```json
{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

Output rules:

- `diary`: Chinese, warm, concrete, no more than about 180 Chinese characters for MVP mobile display.
- `share_caption`: Short social caption with memory value, not exaggerated.
- `summary_tags`: 3 to 5 Chinese tags.

The output must not include internal ids such as `night_market`, `old_street`, `firework_photo_task`, or raw file names. Convert ids to natural Chinese labels.

## Steps

1. Normalize ids into human-readable Chinese names:

```text
night_market -> 夜市街区
old_street -> 老街入口
coffee_stop -> 街角咖啡店
riverside -> 江边步道
firework_photo_task -> 烟火气打卡
first_voice_task -> 旅行第一步
safe_route_task -> 安心路线选择
local_food_task -> 本地味道挑战
```

2. Extract the day's emotional arc from `mood_history` and `chat_summary`.
3. Extract concrete moments from `memory_fragments`.
4. Mention only places, badges, and fragments that appear in the input.
5. Write a concise diary with this shape:

```text
today's route/moment -> user's feeling change -> task or badge -> gentle closing
```

6. Write a short `share_caption`.
7. Generate 3 to 5 `summary_tags`.
8. Return strict JSON only.

## ArkClaw model mapping

In ArkClaw, this Skill can be a final text-generation model node:

- Input node: collects `visited_places`, `badges`, `mood_history`, `memory_fragments`, and `chat_summary` from the app session.
- Optional transform node: converts internal ids to Chinese labels.
- Model node: generates diary JSON.
- Output parser: validates `diary`, `share_caption`, and `summary_tags`.

The Skill does not need database access for MVP. The frontend can pass localStorage session data directly into the backend or ArkClaw workflow.

## Prompt template

```text
You are SoloMate's diary writer for solo travelers.
Write a short Chinese travel diary that feels like a companion helping the user save today's memory.

Input:
visited_places: {{visited_places}}
badges: {{badges}}
mood_history: {{mood_history}}
memory_fragments: {{memory_fragments}}
chat_summary: {{chat_summary}}

Rules:
1. Write in Chinese.
2. diary should be warm, concrete, and under about 180 Chinese characters.
3. Do not invent places, badges, or events not present in the input.
4. Do not expose internal ids. Convert ids into natural Chinese names.
5. If mood changed from uncertain/tired/nervous to relaxed/brave/calm, show that small change.
6. Avoid over-poetic or motivational language.
7. share_caption should be short and suitable for sharing.
8. summary_tags should contain 3 to 5 Chinese tags.
9. Return strict JSON only:

{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}
```

## Fallback behavior

If model generation fails or input is sparse:

```json
{
  "diary": "今天你一个人出发，也认真走完了属于自己的这一段路。中间有一点犹豫，但你还是把看到的风景、做出的选择和小小勇气都留了下来。",
  "share_caption": "一个人的旅行，也有被好好记录的一天。",
  "summary_tags": ["单人旅行", "今日记忆", "旅行搭子"]
}
```

Fallback rules:

- If there are places, include at most 2 natural place names.
- If there are badges, include at most 1 badge name.
- If there is no mood history, keep the tone neutral and gentle.
- Never expose raw ids, API errors, or file names.

## Demo example

Input:

```json
{
  "visited_places": ["老街入口", "夜市街区"],
  "badges": ["城市烟火徽章"],
  "mood_history": ["uncertain", "relaxed"],
  "memory_fragments": [
    {
      "type": "photo_fragment",
      "description": "画面有街区灯光和生活气息。",
      "location": "夜市街区",
      "badge": "城市烟火徽章"
    }
  ],
  "chat_summary": "用户一开始因为朋友临时来不了有点犹豫，后来选择去夜市，拍下了城市烟火气。"
}
```

Output:

```json
{
  "diary": "今天你一个人从老街入口走到夜市街区。刚开始有点犹豫，但你慢慢找回了自己的节奏，拍下街区灯光和生活气息，也解锁了城市烟火徽章。这段路，被好好收进了今天。",
  "share_caption": "一个人的夜晚，也会遇到刚刚好的烟火气。",
  "summary_tags": ["单人旅行", "夜市街区", "城市烟火气", "被陪伴的路"]
}
```

# SoloMate Trip Decision Skill

## Overview

`solomate_trip_decision` helps a solo traveler make the next small travel decision. It uses place context, time of day, weather, nearby places, safety level, and mood to recommend a route direction, food/rest stop, photo spot, or safer alternative.

This Skill should feel like a capable friend who can help the user decide what to do next, especially when the user is tired, uncertain, hungry, worried about crowds, or choosing between nearby places. It does not perform real map navigation, route optimization, ride-hailing, or booking.

It maps to decision-style replies inside:

```text
POST /api/chat
```

## When to use

Use this Skill when the app needs to answer questions like:

- "我现在该去哪？"
- "附近有什么好吃的？"
- "这条路安全吗？"
- "我有点累，还要不要去江边？"
- "哪里适合拍照？"
- "下雨了还适合出门吗？"

This Skill can be called by the chat agent as a focused decision node, then its output can be returned through the same `/api/chat` fields.

## Inputs

Expected input:

```json
{
  "current_place": "",
  "target_place": "",
  "time_of_day": "",
  "weather": {},
  "nearby_places": [],
  "mood": ""
}
```

Field notes:

- `current_place`: Where the user is now or the place currently being discussed.
- `target_place`: The place the user wants to go, if known.
- `time_of_day`: Values like `morning`, `noon`, `afternoon`, `evening`, `night`.
- `weather`: Current or mock weather, including condition, rain probability, temperature, source.
- `nearby_places`: List from `config/mock_places.json` or a live place provider.
- `mood`: User state such as `uncertain`, `tired`, `hungry`, `relaxed`, `nervous`, `curious`.

Example `nearby_places` item:

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

## Outputs

Return the same structured fields as `/api/chat` decision replies:

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

Recommended `reply_type` values:

- `place_decision`
- `food_advice`
- `route_advice`
- `safety_support`
- `photo_advice`
- `weather_advice`
- `rest_suggestion`

Recommended `suggested_action` values:

- `go_to_night_market`
- `rest_at_coffee_stop`
- `avoid_riverside_at_night`
- `choose_main_road`
- `look_for_photo_spot`
- `find_food_nearby`
- `wait_or_adjust_plan`

## Steps

1. Normalize the input. If `target_place` is empty, use `current_place` as the decision anchor.
2. Rank nearby places by:

```text
solo safety > mood fit > time fit > weather fit > task opportunity > distance
```

3. Apply time rules:

- At night, prefer high-safety public places, main roads, malls, coffee shops, night markets, or subway-adjacent areas.
- At noon, mention food, shade, hydration, or a rest stop if relevant.
- In rainy weather, prefer indoor or covered locations and remind the user about umbrella/ground safety.

4. Apply mood rules:

- `tired`: choose a rest stop or nearby food option.
- `hungry`: prioritize food places.
- `nervous`: choose bright, populated, easy-to-leave places.
- `curious`: suggest a story or culture stop.
- `relaxed`: offer a photo or slow-walk option.

5. If a place has `task_id`, mention the task only when it naturally fits the route.
6. Produce a direct recommendation plus one brief reason.
7. Include a calm `safety_tip` for night, rain, crowd, low-light, or isolated route cases.
8. Return strict JSON only.

## ArkClaw model mapping

In ArkClaw, this Skill can be a decision model node or a rule-plus-model chain:

- Rule node: rank `nearby_places` by safety, mood, time, and weather.
- Model node: turn the top recommendation into a SoloMate-style response.
- Output parser: `/api/chat` JSON fields.

For MVP, ArkClaw can pass the raw input JSON and place list into a single model node. The model should not invent real routes; it should produce text guidance suitable for the app.

## Prompt template

```text
You are SoloMate's trip decision Skill for solo travelers.
Help the user choose the next safe, realistic, low-pressure step.

Input:
current_place: {{current_place}}
target_place: {{target_place}}
time_of_day: {{time_of_day}}
weather: {{weather}}
nearby_places: {{nearby_places}}
mood: {{mood}}

Decision principles:
1. Prefer safe, bright, populated, easy-to-leave places for solo travelers.
2. If the user is tired, reduce walking and suggest a rest stop.
3. If the user is hungry, prioritize nearby food.
4. If it is night, avoid isolated waterside or low-light routes unless clearly safe.
5. If it is raining, prefer indoor or covered places and mention umbrella/ground safety.
6. Use task opportunities only when they fit naturally.
7. Do not provide turn-by-turn navigation, exact travel times, or booking actions.
8. Keep reply_text short, warm, and specific.
9. Return strict JSON only:

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

## Fallback behavior

If the model or place ranking fails:

```json
{
  "reply_text": "我会先帮你选稳一点的方向。现在可以优先去明亮、人多、方便停留的地方，比如附近的咖啡店、夜市或商场入口，先让自己缓下来。",
  "reply_type": "place_decision",
  "emotion_detected": "uncertain",
  "suggested_action": "choose_safe_public_place",
  "safety_tip": "一个人出行时，先避开太暗、太偏、需要长时间步行的路线。",
  "next_options": ["找地方坐一下", "去人多的街区", "回到主路"],
  "task_triggered": ""
}
```

Fallback rules:

- If `nearby_places` is empty, use mock candidates: night market, old street, coffee stop, riverside.
- If weather is missing, avoid claiming exact weather.
- If time is missing, do not make strong day/night assumptions.
- Always return the same JSON schema.

## Demo example

Input:

```json
{
  "current_place": "老街入口",
  "target_place": "",
  "time_of_day": "night",
  "weather": {
    "condition": "cloudy",
    "rain_probability": 20,
    "source": "mock"
  },
  "nearby_places": [
    {
      "id": "night_market",
      "name": "夜市街区",
      "type": "food",
      "distance": 600,
      "safety_level": "high",
      "tags": ["吃饭", "人多", "夜间安全", "烟火气"],
      "task_id": "firework_photo_task"
    },
    {
      "id": "riverside",
      "name": "江边步道",
      "type": "view",
      "distance": 1200,
      "safety_level": "medium",
      "tags": ["风景", "散步", "夜景"],
      "task_id": "safe_route_task"
    }
  ],
  "mood": "tired"
}
```

Output:

```json
{
  "reply_text": "你现在有点累，又是夜里，我更建议先去夜市街区。它离得近一些，人流也更稳定，可以先吃点东西、休息一下，再决定还要不要继续逛。",
  "reply_type": "place_decision",
  "emotion_detected": "tired",
  "suggested_action": "go_to_night_market",
  "safety_tip": "江边步道夜景好看，但一个人夜里过去要看人流和照明，不建议把它放在第一选择。",
  "next_options": ["去夜市", "找咖啡店坐会儿", "看看拍照任务"],
  "task_triggered": "firework_photo_task"
}
```

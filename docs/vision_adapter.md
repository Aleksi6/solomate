# SoloMate Vision Adapter

SoloMate 当前不把 DeepSeek 文本 Chat API 当成真实视觉模型。图片分析默认是：

- mock scene
- optional LLM polish

只有在配置了 `VISION_*` 且 `VISION_ENABLE=true` 时，后端才会尝试走 OpenAI-compatible vision endpoint。

## 配置

在 `backend/.env` 中配置：

```text
VISION_ENABLE=false
VISION_PROVIDER=
VISION_API_KEY=
VISION_BASE_URL=
VISION_MODEL=
VISION_TIMEOUT_MS=10000
```

## 当前行为

- `VISION_ENABLE=false`：
  - 不调用真实视觉模型
  - 使用 mock scene
  - 如果 `LLM_ENABLE=true`，允许对 mock 结果做文案润色
- `VISION_ENABLE=true` 且配置完整：
  - 尝试发送 image base64 data URL 到多模态 chat completions
  - 如果模型失败、接口不支持图片或返回异常，自动回退到 mock scene

## 返回字段不变

`/api/analyze-photo` 仍然只返回：

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

## 日志

- `[PHOTO] received image=true/false`
- `[PHOTO] vision_enabled=true/false`
- `[PHOTO] vision_used=true/false`
- `[PHOTO] llm_polish_used=true/false`
- `[PHOTO] fallback reason: xxx`

## 说明

当前 Demo 可以完全只用 mock scene 跑通，不依赖真实视觉模型。

# SoloMate Vision Adapter

## 目标

SoloMate 的真实图片识别与文本聊天拆开配置：
- DeepSeek 文本模型只负责 `chat / diary`
- 图片识别走独立 `VISION_*` 适配器
- 视觉失败时必须 fallback，不允许让 `/api/analyze-photo` 崩掉

## 环境变量

`backend/.env.example` 中保留这些可选配置：

```text
VISION_ENABLE=false
VISION_PROVIDER=openai_compatible
VISION_API_KEY=
VISION_BASE_URL=
VISION_MODEL=
VISION_TIMEOUT_MS=10000
```

## 运行模式

### 1. 未启用真实视觉

触发条件：
- `VISION_ENABLE=false`
- 或 `VISION_API_KEY / VISION_BASE_URL / VISION_MODEL` 缺失

行为：
- 不调用真实视觉模型
- 返回标准照片分析字段
- `task_result.reason` 明确说明当前为 Demo mock 判定
- 日志输出：

```text
[PHOTO] vision_enabled=false
[PHOTO] vision_used=false
[PHOTO] fallback=mock_scene
```

### 2. 启用真实视觉

触发条件：
- `VISION_ENABLE=true`
- 且 `VISION_API_KEY / VISION_BASE_URL / VISION_MODEL` 都存在

行为：
- 上传图片转为 base64 data URL
- 调用 OpenAI-compatible vision chat completions
- message content 使用 `text + image_url`
- 视觉模型需返回严格 JSON

内部标准化结构：

```json
{
  "scene_summary": "",
  "safety_observation": "",
  "photo_advice": "",
  "visual_tags": [],
  "detected_scene_type": "",
  "confidence": 0
}
```

## 任务判断

视觉结果会再映射到任务：
- `firework_photo_task`
  关注：街道、灯光、人流、店铺、招牌、小吃摊、本地生活
- `local_food_task`
  关注：食物、餐盘、菜单、餐厅、摊位
- `safe_route_task`
  关注：明亮道路、人流、主路、地铁站、便利店

若不匹配：
- `passed=false`
- 不解锁徽章
- 返回补拍建议

## 边界

- P0 不做真实导航和打车判断
- P0 即使有视觉，也只做保守任务判断
- 若视觉超时、非 JSON、字段缺失，统一 fallback 到 mock scene


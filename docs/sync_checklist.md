# SoloMate Sync Checklist

成员 A 和成员 B 每次联调前确认以下内容。

## 环境

- [ ] 后端运行在 `http://localhost:3001`，或双方确认相同的 `API_BASE_URL` / `VITE_API_BASE_URL`。
- [ ] `npm run test:smoke` 通过，确认 `LLM_ENABLE=false` 时 mock-fallback 稳定。
- [ ] 如果要测试真实模型，`backend/.env` 已配置，且双方知道这是可选增强而不是 Demo 必需依赖。

## LLM 模式

- [ ] `LLM_ENABLE=false` 时，`/api/chat` 和 `/api/generate-diary` 仍能返回标准 JSON。
- [ ] `LLM_ENABLE=true` 时，若模型失败、超时、返回非 JSON 或字段缺失，接口仍会自动 fallback。
- [ ] 前端不需要因为启用 LLM 改动任何字段映射。

## 配置 ID

- [ ] `persona_id` 与 `config/personas.json` 一致，默认 `gentle_friend`。
- [ ] `task_id` 与 `config/tasks.json` 一致，默认 `firework_photo_task`。
- [ ] 地点数据中的 `task_id` 能在 `config/tasks.json` 找到。
- [ ] 徽章名称与 `reward_badge` 一致，例如 `城市烟火徽章`。

## 接口字段

- [ ] `/api/chat` 返回 `reply_text`、`reply_type`、`emotion_detected`、`suggested_action`、`safety_tip`、`next_options`、`task_triggered`。
- [ ] `/api/analyze-photo` 返回 `scene_summary`、`safety_observation`、`photo_advice`、`task_result`、`reply_text`。
- [ ] `/api/analyze-photo` 的 `task_result` 返回 `passed`、`reward_badge`、`reason`。
- [ ] `/api/complete-task` 返回 `completed_tasks`、`badges`。
- [ ] `/api/generate-diary` 返回 `diary`、`share_caption`、`summary_tags`。
- [ ] 前端不依赖 `error/message` 作为正常响应。

## Demo 主线

- [ ] 选择搭子 -> 文本/语音输入 -> AI 回复 -> 模拟地点推荐 -> 照片上传 -> 图片分析 -> 任务/徽章 -> 旅行日记。
- [ ] 不新增真实地图导航、真 AR、实时视频理解、多用户社交匹配。
- [ ] 接口字段或 prompt 策略变更前先更新 `docs/api_contract.md`。

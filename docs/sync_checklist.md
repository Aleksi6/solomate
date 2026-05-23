# SoloMate Sync Checklist

成员 A 和成员 B 每次联调前确认以下项目。

## 环境

- [ ] 后端运行在 `http://localhost:3001`，或双方确认同一个 `API_BASE_URL` / `VITE_API_BASE_URL`。
- [ ] `backend/package.json` 中 `npm run test:smoke` 通过。
- [ ] 前端所有接口调用仍集中在 `frontend/src/services/api.js`。

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
- [ ] 前端不依赖 `error/message` 作为核心接口正常响应。

## Demo 主线

- [ ] 选择搭子 -> 文本/语音输入 -> AI 回复 -> 模拟地点推荐 -> 照片上传 -> 图片分析 -> 任务/徽章 -> 旅行日记。
- [ ] 不新增真实地图导航、真 AR、实时视频理解、多用户社交匹配。
- [ ] 接口字段变更前先更新 `docs/api_contract.md`。

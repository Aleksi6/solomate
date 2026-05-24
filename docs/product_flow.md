# SoloMate Product Flow

## P0 Demo 主线

1. 用户打开 App
2. 选择搭子人格
3. 文本或语音输入当前状态
4. 前端发送：
   - `conversation_id`
   - 最近 12 条 `history`
   - `conversation_state`
   - `live_context`
5. 后端按 `user_text > conversation_state > history > location > mock` 解析上下文
6. AI 返回聊天建议、下一步选项和安全提醒
7. 用户上传照片
8. `/api/analyze-photo` 返回：
   - 场景摘要
   - 安全观察
   - 拍摄建议
   - 任务判定
9. 前端把照片分析保存为 `memory_fragment`
10. 若任务通过：
   - 调用 `/api/complete-task`
   - 本地保存徽章与来源 `fragment_id`
11. 用户在碎片册里查看：
   - 缩略图
   - 搭子评论
   - 来源徽章
12. 最后用 `/api/generate-diary` 生成今日旅行日记

## 记忆边界

- P0 只用 `localStorage`
- 今日会话按 `solomate_session_date` 切分
- 碎片册和徽章可跨天保留
- 不使用数据库

## 实时能力边界

- 时间：真实
- 位置：浏览器定位可选
- 天气：mock 或可选 API
- 附近地点：mock places
- 视觉：可选 `VISION_*`
- 路线 / 打车：只做文字建议，不做真实接入


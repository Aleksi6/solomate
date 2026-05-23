# SoloMate 开发规则

你正在协助开发 SoloMate：一个面向单人出行者的 AI 旅行搭子 App。

## 当前身份

我是成员B，负责前端体验、搭子人格、任务内容、UI 风格、徽章、旅行日记页和 Demo 故事线。

## 核心 MVP 闭环

用户打开 App
→ 选择旅行搭子人格
→ 文本/语音说出当前状态
→ AI 根据位置、时间、心情给建议
→ 用户上传照片
→ AI 看图分析并反馈
→ 触发任务/解锁徽章
→ 生成旅行日记

## 技术要求

- 使用 React + Vite。
- 页面要轻量、稳定、适合黑客松 Demo。
- 先用 mock 数据跑通，不依赖真实后端。
- 所有接口调用统一写在 frontend/src/services/api.js。
- 后端接口失败时必须有 mock fallback。
- 不做复杂旅游平台。
- 不做真实地图导航。
- 不做真 AR。
- 不做实时视频理解。
- 不做多用户社交匹配。

## 成员B必做页面

- HomePage
- PersonaPage
- ChatPage
- PhotoPage
- BadgePage
- DiaryPage

## 成员B必做组件

- PersonaCard
- VoiceButton
- ChatBubble
- PlaceCard
- TaskCard
- BadgeCard
- FloatingBuddy

## 共享配置

- config/personas.json
- config/tasks.json
- config/mock_places.json
- config/ui_copy.json
- config/demo_state.json

## UI 风格

温暖、轻量、旅行感、陪伴感、低压力。

不要做成普通聊天机器人，要像一个陪用户旅行的搭子。
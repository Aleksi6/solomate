# SoloMate Voice Integration

SoloMate 当前的语音链路优先使用浏览器能力，不把后端 ASR 做成 P0 依赖。

## 当前链路

点击麦克风  
-> 浏览器 `SpeechRecognition` / `webkitSpeechRecognition`  
-> 语音识别为文本  
-> 前端把文本写入 `solomate_chat_messages`  
-> 前端调用现有 `POST /api/chat`，并带最近 10 条 `history`  
-> 前端展示用户气泡和 AI 气泡  
-> 浏览器 `speechSynthesis` 播放 `reply_text`

## 关键规则

- 语音识别文本必须走和文本输入同一套 `sendMessage` 逻辑
- 不允许语音消息绕过 `history`
- 页面刷新后，聊天记录仍从 `localStorage` 恢复
- 如果用户点击“重置 Demo”，需要清空：
  - `solomate_chat_messages`
  - `solomate_conversation_id`
  - 任务 / 徽章 / 日记相关本地状态

## 本地存储

- `solomate_chat_messages`
- `solomate_conversation_id`
- `solomate_chat_summary`（可选）

## 浏览器兼容

如果浏览器不支持语音识别，前端应提示：

```text
当前浏览器不支持语音识别，可以直接输入文字。
```

如果 TTS 不支持：
- 只展示文字
- 不阻断聊天流程

## 后端状态接口

`GET /api/voice-status`

```json
{
  "browser_asr_recommended": true,
  "backend_asr_enabled": false,
  "tts_recommended": "browser_speech_synthesis"
}
```

## 当前语音状态

- `idle`
- `listening`
- `transcribing`
- `sending`
- `speaking`
- `error`

## 测试建议

1. 打开聊天页
2. 先说一句：`我要去洪崖洞玩了，妈呀感觉好多人啊`
3. 再说一句：`哪里好拍照啊`
4. 在 Network 里确认第二次 `/api/chat` 请求携带了第一句 history
5. 页面上应看到用户气泡和 AI 气泡
6. AI 回复应围绕洪崖洞，而不是泛泛地问“你想去哪”

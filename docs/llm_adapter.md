# SoloMate LLM Adapter

SoloMate 当前支持一个可选的 LLM adapter，用于增强 `/api/chat` 和 `/api/generate-diary` 的文案质量，但不会改变接口字段。

## 目标

- `LLM_ENABLE=false` 时完全走 mock-fallback，Demo 不依赖真实模型。
- `LLM_ENABLE=true` 且配置完整时，后端尝试调用 OpenAI-compatible chat completions。
- 模型失败、超时、返回非 JSON 或字段缺失时，自动 fallback 到当前 mock 结果。

## 配置

在 `backend/.env` 中配置：

```text
LLM_PROVIDER=openai_compatible
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_TIMEOUT_MS=8000
LLM_ENABLE=false
```

`LLM_BASE_URL` 可以写：

- 基础 URL，例如 `https://api.deepseek.com/v1`
- 完整 endpoint，例如 `https://api.deepseek.com/v1/chat/completions`

## 当前使用范围

- `/api/chat`
  - greeting、identity、safety 会优先使用稳定本地策略。
  - decision、photo、game、普通 chat 可选用 LLM 优化。
- `/api/generate-diary`
  - 会优先尝试 LLM 生成温柔短日记。
  - 失败时自动回退到模板日记。

## 验证方式

```powershell
cd backend
npm run test:smoke
```

如果要测试真实 LLM：

1. 填好 `backend/.env`
2. 设置 `LLM_ENABLE=true`
3. 启动后端 `npm run dev`
4. 观察聊天和日记日志

## 日志

- 日记接口会输出：
  - `[DIARY] llm_enabled=true/false`
  - `[DIARY] calling LLM`
  - `[DIARY] llm_used=true/false`
  - `[DIARY] fallback reason: xxx`

不会打印真实 API Key。

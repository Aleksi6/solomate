const { getEnvConfig, loadEnvFile } = require("../utils/json_loader");
const { parseJsonObject } = require("../utils/fallback");

loadEnvFile();

function getLlmConfig() {
  return getEnvConfig();
}

function isLlmEnabled() {
  const config = getLlmConfig();

  return Boolean(
    config.enable &&
    config.provider === "openai_compatible" &&
    config.apiKey &&
    config.baseUrl &&
    config.model
  );
}

function buildChatCompletionsUrl(baseUrl) {
  const trimmed = String(baseUrl || "").replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

async function callChatCompletion({ messages, temperature = 0.4, max_tokens = 400 }) {
  const config = getLlmConfig();
  if (!isLlmEnabled()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(buildChatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateStructuredJson({ messages, normalizer, fallbackValue }) {
  const content = await callChatCompletion({ messages });
  if (!content) {
    return {
      data: fallbackValue,
      source: "fallback"
    };
  }

  const parsed = parseJsonObject(content);
  if (!parsed || typeof parsed !== "object") {
    return {
      data: fallbackValue,
      source: "fallback"
    };
  }

  try {
    return {
      data: normalizer(parsed),
      source: "llm"
    };
  } catch (error) {
    return {
      data: fallbackValue,
      source: "fallback"
    };
  }
}

module.exports = {
  getLlmConfig,
  isLlmEnabled,
  callChatCompletion,
  generateStructuredJson,
  buildChatCompletionsUrl
};

const { loadEnvFile, readPromptFile } = require("../utils/json_loader");
const { fallbackPhotoAnalysis, normalizePhotoAnalysisResponse, parseJsonObject } = require("../utils/fallback");
const { callCompatibleChatCompletion, generateStructuredJson, isLlmEnabled } = require("./llm_service");
const { getTask } = require("./task_service");

loadEnvFile();

function getVisionConfig() {
  const timeoutValue = Number(process.env.VISION_TIMEOUT_MS || "10000");

  return {
    enable: String(process.env.VISION_ENABLE || "false").toLowerCase() === "true",
    provider: process.env.VISION_PROVIDER || "",
    apiKey: process.env.VISION_API_KEY || "",
    baseUrl: process.env.VISION_BASE_URL || "",
    model: process.env.VISION_MODEL || "",
    timeoutMs: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 10000
  };
}

function getVisionStatus() {
  const config = getVisionConfig();

  return {
    vision_enable: config.enable,
    provider: config.provider,
    has_api_key: Boolean(config.apiKey),
    has_base_url: Boolean(config.baseUrl),
    has_model: Boolean(config.model),
    model: config.model || "",
    timeout_ms: config.timeoutMs
  };
}

function isVisionEnabled() {
  const config = getVisionConfig();
  return Boolean(config.enable && config.apiKey && config.baseUrl && config.model);
}

function fileToDataUrl(file) {
  if (!file || !file.buffer) {
    return "";
  }

  const mimeType = file.mimetype || "image/jpeg";
  return `data:${mimeType};base64,${file.buffer.toString("base64")}`;
}

async function tryVisionModel({ file, task, personaId }) {
  if (!isVisionEnabled() || !file?.buffer) {
    return null;
  }

  const config = getVisionConfig();
  const prompt = readPromptFile("photo_prompt.txt", "Return strict JSON only.");
  const imageUrl = fileToDataUrl(file);

  const content = await callCompatibleChatCompletion({
    config,
    messages: [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                instruction: "请分析这张旅行照片，并返回严格 JSON。",
                persona_id: personaId || "photo_buddy",
                task: {
                  id: task.id,
                  title: task.title,
                  requirements: task.requirements || [],
                  reward_badge: task.reward_badge
                }
              },
              null,
              2
            )
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 500
  });

  if (!content) {
    return null;
  }

  const parsed = parseJsonObject(content);
  if (!parsed) {
    return null;
  }

  return normalizePhotoAnalysisResponse(parsed);
}

function buildPolishMessages({ task, personaId, fallbackResponse }) {
  const prompt = readPromptFile("photo_prompt.txt", "Return strict JSON only.");

  return [
    {
      role: "system",
      content: prompt
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          instruction: "当前没有真实视觉结果。请基于 mock 场景和任务要求，把返回文案润色得更自然，但不要假装真实识别。",
          persona_id: personaId || "photo_buddy",
          task: {
            id: task.id,
            title: task.title,
            requirements: task.requirements || [],
            reward_badge: task.reward_badge
          },
          mock_scene: fallbackResponse
        },
        null,
        2
      )
    }
  ];
}

async function analyzePhoto(input = {}) {
  const task = getTask(input.task_id || "firework_photo_task");
  const fallbackResponse = normalizePhotoAnalysisResponse(fallbackPhotoAnalysis(task));
  const hasImage = Boolean(input.file?.buffer);
  const visionEnabled = isVisionEnabled();
  let visionUsed = false;
  let llmPolishUsed = false;
  let fallbackReason = "";
  let response = fallbackResponse;

  console.log(`[PHOTO] received image=${hasImage}`);
  console.log(`[PHOTO] vision_enabled=${visionEnabled}`);

  if (visionEnabled && hasImage) {
    const visionResult = await tryVisionModel({
      file: input.file,
      task,
      personaId: input.persona_id
    });

    if (visionResult) {
      response = visionResult;
      visionUsed = true;
    } else {
      fallbackReason = "vision_failed_or_non_json";
    }
  } else {
    fallbackReason = !hasImage ? "missing_image_or_mock_only" : "vision_disabled_or_missing_config";
  }

  if (!visionUsed && isLlmEnabled()) {
    const polishResult = await generateStructuredJson({
      messages: buildPolishMessages({
        task,
        personaId: input.persona_id,
        fallbackResponse
      }),
      normalizer: normalizePhotoAnalysisResponse,
      fallbackValue: fallbackResponse
    });

    if (polishResult.source === "llm") {
      response = normalizePhotoAnalysisResponse(polishResult.data);
      llmPolishUsed = true;
    }
  }

  console.log(`[PHOTO] vision_used=${visionUsed}`);
  console.log(`[PHOTO] llm_polish_used=${llmPolishUsed}`);
  if (!visionUsed) {
    console.log(`[PHOTO] fallback reason: ${fallbackReason || "mock_scene_used"}`);
  }

  return normalizePhotoAnalysisResponse(response);
}

module.exports = {
  analyzePhoto,
  getVisionConfig,
  getVisionStatus,
  isVisionEnabled
};

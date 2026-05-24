const { loadEnvFile, readPromptFile } = require("../utils/json_loader");
const { fallbackPhotoAnalysis, normalizePhotoAnalysisResponse, parseJsonObject } = require("../utils/fallback");
const { callCompatibleChatCompletion, generateStructuredJson, isLlmEnabled } = require("./llm_service");
const { getTask } = require("./task_service");

loadEnvFile();

function getVisionConfig() {
  const timeoutValue = Number(process.env.VISION_TIMEOUT_MS || "10000");

  return {
    enable: String(process.env.VISION_ENABLE || "false").toLowerCase() === "true",
    provider: process.env.VISION_PROVIDER || "openai_compatible",
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

function normalizeConfidence(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  return Math.max(0, Math.min(1, num));
}

function normalizeVisionResult(input = {}) {
  const visualTags = Array.isArray(input.visual_tags)
    ? input.visual_tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];

  return {
    scene_summary: String(input.scene_summary || "").trim(),
    safety_observation: String(input.safety_observation || "").trim(),
    photo_advice: String(input.photo_advice || "").trim(),
    visual_tags: visualTags,
    detected_scene_type: String(input.detected_scene_type || "").trim(),
    confidence: normalizeConfidence(input.confidence)
  };
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
                instruction: "请分析这张旅行照片，并严格返回 JSON。字段必须包含 scene_summary、safety_observation、photo_advice、visual_tags、detected_scene_type、confidence。",
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

  const parsed = parseJsonObject(content || "");
  if (!parsed) {
    return null;
  }

  const normalized = normalizeVisionResult(parsed);
  if (!normalized.scene_summary && !normalized.detected_scene_type && normalized.visual_tags.length === 0) {
    return null;
  }

  return normalized;
}

function tagsToHaystack(visionData = {}) {
  return `${visionData.detected_scene_type || ""} ${(visionData.visual_tags || []).join(" ")} ${visionData.scene_summary || ""} ${visionData.safety_observation || ""}`.toLowerCase();
}

function evaluateTaskResult({ task, visionData, visionUsed }) {
  const rewardBadge = task.reward_badge || "";

  if (!visionUsed || !visionData) {
    return {
      passed: true,
      reward_badge: rewardBadge,
      reason: `当前为 Demo mock 判定，未启用真实视觉模型时先按「${task.title || task.id}」给出保守结果。`
    };
  }

  const haystack = tagsToHaystack(visionData);
  const matches = {
    firework_photo_task: /(street|shop|crowd|light|sign|stall|夜景|灯光|店铺|招牌|小吃|人流|街道|本地生活)/.test(haystack),
    local_food_task: /(food|dish|menu|restaurant|stall|meal|食物|餐盘|菜单|餐厅|摊位|小吃)/.test(haystack),
    safe_route_task: /(road|station|store|bright|crossing|crowd|main road|地铁站|便利店|明亮|主路|人流|路口)/.test(haystack)
  };

  const passed = matches[task.id] !== undefined ? matches[task.id] : true;
  if (passed) {
    return {
      passed: true,
      reward_badge: rewardBadge,
      reason: `视觉结果与「${task.title || task.id}」的要求基本匹配。`
    };
  }

  return {
    passed: false,
    reward_badge: "",
    reason: `这张照片和「${task.title || task.id}」的要求还不太对上。可以再拍得更贴近任务内容一点。`
  };
}

function buildMockAnalysis({ task, taskResult }) {
  const fallback = fallbackPhotoAnalysis(task);
  return normalizePhotoAnalysisResponse({
    ...fallback,
    task_result: taskResult
  });
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
  const hasImage = Boolean(input.file?.buffer);
  const visionAvailable = isVisionEnabled();
  const fallbackResult = evaluateTaskResult({ task, visionData: null, visionUsed: false });
  let response = buildMockAnalysis({ task, taskResult: fallbackResult });
  let visionUsed = false;
  let llmPolishUsed = false;

  console.log(`[PHOTO] vision_enabled=${visionAvailable}`);

  if (visionAvailable && hasImage) {
    const visionData = await tryVisionModel({
      file: input.file,
      task,
      personaId: input.persona_id
    });

    if (visionData) {
      const taskResult = evaluateTaskResult({
        task,
        visionData,
        visionUsed: true
      });

      response = normalizePhotoAnalysisResponse({
        scene_summary: visionData.scene_summary || response.scene_summary,
        safety_observation: visionData.safety_observation || response.safety_observation,
        photo_advice: visionData.photo_advice || response.photo_advice,
        task_result: taskResult,
        reply_text: taskResult.passed
          ? `我看过这张照片了，它和「${task.title || task.id}」这条任务是对得上的，我先替你把这页收进今天的碎片册里。`
          : `我看过这张照片了，先别急着补拍失败感。这张已经能收进碎片册，不过如果你想冲这条任务，我可以按任务要求帮你补一版拍摄思路。`
      });
      visionUsed = true;
    }
  }

  if (!visionUsed && isLlmEnabled()) {
    const polishResult = await generateStructuredJson({
      messages: buildPolishMessages({
        task,
        personaId: input.persona_id,
        fallbackResponse: response
      }),
      normalizer: normalizePhotoAnalysisResponse,
      fallbackValue: response
    });

    if (polishResult.source === "llm") {
      response = normalizePhotoAnalysisResponse({
        ...response,
        ...polishResult.data,
        task_result: response.task_result
      });
      llmPolishUsed = true;
    }
  }

  console.log(`[PHOTO] vision_used=${visionUsed}`);
  if (!visionUsed) {
    console.log("[PHOTO] fallback=mock_scene");
  }
  console.log(`[PHOTO] llm_polish_used=${llmPolishUsed}`);

  return normalizePhotoAnalysisResponse(response);
}

module.exports = {
  analyzePhoto,
  getVisionConfig,
  getVisionStatus,
  isVisionEnabled
};

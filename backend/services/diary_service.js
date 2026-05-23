const { readJsonConfig, readPromptFile, findById } = require("../utils/json_loader");
const { fallbackDiary, normalizeDiaryResponse } = require("../utils/fallback");
const { generateStructuredJson, isLlmEnabled } = require("./llm_service");

const PLACE_FALLBACK_MAP = {
  night_market: "夜市街区",
  old_street: "老街入口",
  coffee_stop: "街角咖啡店",
  riverside: "江边步道"
};

const TASK_FALLBACK_MAP = {
  first_step: "旅行第一步",
  first_voice_task: "旅行第一步",
  firework_photo_task: "烟火气打卡",
  safe_route_task: "安心路线选择",
  local_food_task: "本地味道挑战"
};

function getPlaces() {
  const places = readJsonConfig("mock_places.json", []);
  return Array.isArray(places) ? places : [];
}

function getTasks() {
  const tasks = readJsonConfig("tasks.json", []);
  return Array.isArray(tasks) ? tasks : [];
}

function toReadablePlace(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return value.name || value.place_name || value.id || "";
  }

  const fromConfig = findById(getPlaces(), value, "night_market");
  if (fromConfig && fromConfig.id === value && fromConfig.name) {
    return fromConfig.name;
  }

  return PLACE_FALLBACK_MAP[value] || String(value);
}

function toReadableBadge(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return value.reward_badge || value.name || value.title || value.id || "";
  }

  const task = findById(getTasks(), value, "");
  if (task && task.id === value) {
    return task.reward_badge || task.title || value;
  }

  return TASK_FALLBACK_MAP[value] || String(value);
}

function sanitizeDiaryPayload(payload = {}) {
  return {
    visited_places: Array.isArray(payload.visited_places) && payload.visited_places.length > 0
      ? payload.visited_places.map(toReadablePlace).filter(Boolean)
      : ["老街入口", "夜市街区"],
    badges: Array.isArray(payload.badges) && payload.badges.length > 0
      ? payload.badges.map(toReadableBadge).filter(Boolean)
      : ["城市烟火徽章"],
    mood_history: Array.isArray(payload.mood_history) && payload.mood_history.length > 0
      ? payload.mood_history.map((item) => String(item))
      : ["uncertain", "relaxed"],
    chat_summary: payload.chat_summary || ""
  };
}

function buildDiaryMessages(payload, fallbackResponse) {
  const diaryPrompt = readPromptFile("diary_prompt.txt", "Return strict JSON only.");

  return [
    {
      role: "system",
      content: diaryPrompt
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          request: payload,
          fallback_response: fallbackResponse
        },
        null,
        2
      )
    }
  ];
}

async function generateDiaryResponse(payload = {}) {
  const safePayload = sanitizeDiaryPayload(payload);
  const fallbackResponse = normalizeDiaryResponse(fallbackDiary(safePayload));

  console.log(`[DIARY] llm_enabled=${isLlmEnabled()}`);

  if (!isLlmEnabled()) {
    console.log("[DIARY] llm_used=false");
    console.log("[DIARY] fallback reason: llm_disabled_or_missing_config");
    return {
      data: fallbackResponse,
      meta: { llm_used: false, fallback_reason: "llm_disabled_or_missing_config" }
    };
  }

  console.log("[DIARY] calling LLM");
  const llmResult = await generateStructuredJson({
    messages: buildDiaryMessages(safePayload, fallbackResponse),
    normalizer: normalizeDiaryResponse,
    fallbackValue: fallbackResponse
  });

  const llmUsed = llmResult.source === "llm";
  console.log(`[DIARY] llm_used=${llmUsed}`);
  if (!llmUsed) {
    console.log("[DIARY] fallback reason: llm_failed_or_non_json");
  }

  return {
    data: normalizeDiaryResponse(llmResult.data),
    meta: {
      llm_used: llmUsed,
      fallback_reason: llmUsed ? "" : "llm_failed_or_non_json"
    }
  };
}

module.exports = {
  generateDiaryResponse,
  sanitizeDiaryPayload
};

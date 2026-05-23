const { readJsonConfig, findById, readPromptFile } = require("../utils/json_loader");
const {
  DEFAULT_LOCATION,
  fallbackChatResponse,
  fallbackDiary,
  normalizeChatResponse,
  normalizeDiaryResponse
} = require("../utils/fallback");
const { generateStructuredJson, isLlmEnabled } = require("./llm_service");

const DEFAULT_PERSONA = {
  id: "gentle_friend",
  name: "温柔朋友型",
  tone: "温柔、自然、像朋友，不说教",
  opening_line: "今天我陪你走，不用急，我们慢慢来。",
  comfort_line: "我在，你不是一个人。我们先选一个更安心的方向。",
  safety_line: "建议你优先走人多、灯光亮的路，不要往太偏的地方走。",
  system_prompt: "你是一个温柔可靠的旅行搭子，适合陪伴单人出行用户。"
};

const DEFAULT_PLACE = {
  id: "night_market",
  name: "夜市街区",
  type: "food",
  distance: 600,
  safety_level: "high",
  tags: ["吃饭", "人多", "夜间安全", "烟火气"],
  description: "适合单人旅行者吃饭和短暂停留，人流较多，夜间相对安心。",
  task_id: "firework_photo_task"
};

function getPersonas() {
  const personas = readJsonConfig("personas.json", []);
  return Array.isArray(personas) ? personas : [];
}

function getMockPlaces() {
  const places = readJsonConfig("mock_places.json", []);
  return Array.isArray(places) && places.length > 0 ? places : [DEFAULT_PLACE];
}

function pickPersona(personaId) {
  return findById(getPersonas(), personaId, DEFAULT_PERSONA.id) || DEFAULT_PERSONA;
}

function normalizeLocation(location) {
  return location && typeof location === "object" ? { ...DEFAULT_LOCATION, ...location } : DEFAULT_LOCATION;
}

function detectEmotion(userText = "", context = {}) {
  if (context && typeof context.mood === "string" && context.mood.trim()) {
    return context.mood;
  }

  const text = String(userText || "");
  if (/害怕|不安|危险|迷路|黑|怕/.test(text)) return "nervous";
  if (/累|疲惫|走不动|休息/.test(text)) return "tired";
  if (/不知道|纠结|去哪|迷茫|犹豫/.test(text)) return "uncertain";
  if (/开心|放松|舒服|好玩/.test(text)) return "relaxed";

  return "uncertain";
}

function pickPlace(nearbyPlaces) {
  const places = Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0 ? nearbyPlaces : getMockPlaces().slice(0, 4);

  return (
    places.find((place) => place && place.id === "night_market") ||
    places.find((place) => place && place.safety_level === "high") ||
    places[0] ||
    DEFAULT_PLACE
  );
}

function getSuggestedAction(place = DEFAULT_PLACE) {
  if (place.id === "night_market") return "go_to_night_market";
  if (place.id === "coffee_stop") return "rest_at_cafe";
  if (place.id === "riverside") return "avoid_quiet_riverside_at_night";
  return place.id ? `go_to_${place.id}` : "choose_safe_place";
}

function buildFallbackChatResponse({ persona, location, mode, emotion, place }) {
  const personaLine = persona.comfort_line || persona.opening_line || DEFAULT_PERSONA.comfort_line;

  if (mode === "safety" || emotion === "nervous") {
    return normalizeChatResponse({
      reply_text: `${personaLine} 先不要往更暗或更偏的地方走，建议你回到${location.place_name}附近的主路，或者去最近的便利店、商场、地铁站。`,
      reply_type: "safety_companion",
      emotion_detected: emotion,
      suggested_action: "move_to_bright_public_place",
      safety_tip: persona.safety_line || DEFAULT_PERSONA.safety_line,
      next_options: ["去便利店", "回到主路", "联系朋友"],
      task_triggered: "safe_route_task"
    });
  }

  if (mode === "photo") {
    return normalizeChatResponse({
      reply_text: `${personaLine} 你可以先拍一张包含招牌、灯光和街道氛围的照片，我来帮你看看画面，也顺便判断能不能完成任务。`,
      reply_type: "photo_advice",
      emotion_detected: emotion,
      suggested_action: "upload_photo",
      safety_tip: "拍照时注意脚下和身后，不要为了构图走到车道或偏僻位置。",
      next_options: ["上传照片", "换个角度拍", "先去亮一点的地方"],
      task_triggered: "firework_photo_task"
    });
  }

  if (mode === "game") {
    return normalizeChatResponse({
      reply_text: `${persona.opening_line || personaLine} 当前推荐任务是“烟火气打卡”：去${place.name || DEFAULT_PLACE.name}拍一张有本地生活气息的照片。`,
      reply_type: "game_task",
      emotion_detected: emotion,
      suggested_action: "start_firework_photo_task",
      safety_tip: "探索任务也以安全路线优先，尽量待在人多、明亮、开放的街区。",
      next_options: ["开始打卡", "查看附近地点", "换一个任务"],
      task_triggered: place.task_id || "firework_photo_task"
    });
  }

  return fallbackChatResponse({
    personaLine,
    placeName: place.name || DEFAULT_PLACE.name,
    reply_type: mode === "decision" ? "comfort_decision" : "companion_chat",
    emotion_detected: emotion,
    suggested_action: getSuggestedAction(place),
    task_triggered: place.task_id || "firework_photo_task"
  });
}

function buildChatMessages({ payload, persona, location, mode, emotion, nearbyPlaces, fallbackResponse }) {
  const basePrompt = readPromptFile(
    "base_agent_prompt.txt",
    "You are SoloMate. Return strict JSON only."
  );

  const userPrompt = JSON.stringify(
    {
      persona: {
        id: persona.id,
        name: persona.name,
        tone: persona.tone || DEFAULT_PERSONA.tone,
        opening_line: persona.opening_line || DEFAULT_PERSONA.opening_line,
        comfort_line: persona.comfort_line || DEFAULT_PERSONA.comfort_line,
        safety_line: persona.safety_line || DEFAULT_PERSONA.safety_line,
        system_prompt: persona.system_prompt || DEFAULT_PERSONA.system_prompt
      },
      request: {
        user_text: payload.user_text || "",
        persona_id: payload.persona_id || DEFAULT_PERSONA.id,
        mode,
        location,
        context: payload.context || {},
        nearby_places: nearbyPlaces,
        history: Array.isArray(payload.history) ? payload.history.slice(-6) : []
      },
      hints: {
        detected_emotion: emotion,
        preferred_place: placeSummary(nearbyPlaces[0] || DEFAULT_PLACE),
        fallback_response: fallbackResponse
      }
    },
    null,
    2
  );

  return [
    {
      role: "system",
      content: basePrompt
    },
    {
      role: "user",
      content: userPrompt
    }
  ];
}

function placeSummary(place) {
  if (!place) {
    return DEFAULT_PLACE;
  }

  return {
    id: place.id || DEFAULT_PLACE.id,
    name: place.name || DEFAULT_PLACE.name,
    safety_level: place.safety_level || DEFAULT_PLACE.safety_level,
    description: place.description || DEFAULT_PLACE.description,
    task_id: place.task_id || DEFAULT_PLACE.task_id
  };
}

function buildDiaryMessages({ payload, fallbackResponse }) {
  const diaryPrompt = readPromptFile(
    "diary_prompt.txt",
    "Write a short diary in strict JSON only."
  );

  return [
    {
      role: "system",
      content: diaryPrompt
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          visited_places: Array.isArray(payload.visited_places) ? payload.visited_places : [],
          badges: Array.isArray(payload.badges) ? payload.badges : [],
          mood_history: Array.isArray(payload.mood_history) ? payload.mood_history : [],
          chat_summary: payload.chat_summary || "",
          fallback_response: fallbackResponse
        },
        null,
        2
      )
    }
  ];
}

async function generateChatResponse(payload = {}) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const persona = pickPersona(safePayload.persona_id);
  const context = safePayload.context && typeof safePayload.context === "object" ? safePayload.context : {};
  const location = normalizeLocation(safePayload.location);
  const mode = safePayload.mode || "chat";
  const emotion = detectEmotion(safePayload.user_text, context);
  const nearbyPlaces = Array.isArray(safePayload.nearby_places) && safePayload.nearby_places.length > 0
    ? safePayload.nearby_places
    : getMockPlaces().slice(0, 4);
  const place = pickPlace(nearbyPlaces);
  const fallbackResponse = buildFallbackChatResponse({
    persona,
    location,
    mode,
    emotion,
    place
  });

  if (!isLlmEnabled()) {
    return fallbackResponse;
  }

  const llmResult = await generateStructuredJson({
    messages: buildChatMessages({
      payload: safePayload,
      persona,
      location,
      mode,
      emotion,
      nearbyPlaces,
      fallbackResponse
    }),
    normalizer: normalizeChatResponse,
    fallbackValue: fallbackResponse
  });

  return normalizeChatResponse(llmResult.data);
}

async function generateDiary(payload = {}) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const fallbackResponse = normalizeDiaryResponse(fallbackDiary(safePayload));

  if (!isLlmEnabled()) {
    return fallbackResponse;
  }

  const llmResult = await generateStructuredJson({
    messages: buildDiaryMessages({
      payload: safePayload,
      fallbackResponse
    }),
    normalizer: normalizeDiaryResponse,
    fallbackValue: fallbackResponse
  });

  return normalizeDiaryResponse(llmResult.data);
}

module.exports = {
  getPersonas,
  getMockPlaces,
  generateChatResponse,
  generateDiary
};

const { readJsonConfig, findById } = require("../utils/json_loader");
const {
  DEFAULT_LOCATION,
  fallbackChatResponse,
  fallbackDiary,
  normalizeChatResponse,
  normalizeDiaryResponse
} = require("../utils/fallback");

const DEFAULT_PERSONA = {
  id: "gentle_friend",
  name: "温柔朋友型",
  opening_line: "今天我陪你走，不用急，我们慢慢来。",
  comfort_line: "我在，你不是一个人。我们先选一个更安心的方向。",
  safety_line: "建议你优先走人多、灯光亮的路，不要往太偏的地方走。"
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
  return location && typeof location === "object"
    ? { ...DEFAULT_LOCATION, ...location }
    : DEFAULT_LOCATION;
}

function detectEmotion(userText = "", context = {}) {
  if (context && typeof context.mood === "string" && context.mood.trim()) {
    return context.mood;
  }

  const text = String(userText || "");
  if (/害怕|不安|危险|迷路|好黑|黑|怕/.test(text)) return "nervous";
  if (/累|疲惫|走不动|休息/.test(text)) return "tired";
  if (/不知道|纠结|去哪|迷茫|犹豫/.test(text)) return "uncertain";
  if (/开心|放松|舒服|好玩/.test(text)) return "relaxed";

  return "uncertain";
}

function pickPlace(nearbyPlaces) {
  const places = Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0
    ? nearbyPlaces
    : getMockPlaces().slice(0, 4);

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

async function generateChatResponse(payload = {}) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const persona = pickPersona(safePayload.persona_id);
  const context = safePayload.context && typeof safePayload.context === "object" ? safePayload.context : {};
  const location = normalizeLocation(safePayload.location);
  const mode = safePayload.mode || "chat";
  const emotion = detectEmotion(safePayload.user_text, context);
  const place = pickPlace(safePayload.nearby_places);
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

function generateDiary(payload = {}) {
  return normalizeDiaryResponse(fallbackDiary(payload && typeof payload === "object" ? payload : {}));
}

module.exports = {
  getPersonas,
  getMockPlaces,
  generateChatResponse,
  generateDiary
};

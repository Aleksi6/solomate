const { readJsonConfig, findById, readPromptFile } = require("../utils/json_loader");
const {
  DEFAULT_LOCATION,
  fallbackChatResponse,
  fallbackDiary,
  normalizeChatResponse,
  normalizeDiaryResponse
} = require("../utils/fallback");
const { generateStructuredJson, isLlmEnabled } = require("./llm_service");
const { DEFAULT_PLACE, getMockPlaces, getRelevantNearbyPlaces, normalizePlace } = require("./place_service");
const { inferTimeOfDay, resolveWeatherContext } = require("./weather_service");

const DEFAULT_PERSONA = {
  id: "gentle_friend",
  name: "温柔朋友型",
  tone: "温柔、自然、像朋友，不说教",
  opening_line: "今天我陪你走，不用急，我们慢慢来。",
  comfort_line: "我在，我们先把这一步走稳。",
  safety_line: "优先走人多、灯光亮的路，别为了省几步钻进太偏的地方。",
  system_prompt: "你是一个温柔可靠的旅行搭子，陪伴单人出行用户。"
};

const DEFAULT_CONVERSATION_STATE = {
  current_city: "",
  current_place: "",
  origin_place: "",
  target_place: "",
  last_place: "",
  last_intent: "",
  last_user_goal: "",
  pending_question: "",
  mood: "",
  travel_mode: "solo",
  preferences: {
    crowd: "",
    pace: "",
    budget: "",
    food_preference: ""
  },
  history_summary: "",
  visited_places: [],
  badges: [],
  live_context: {
    local_time: "",
    time_of_day: "",
    source: "unavailable",
    latitude: null,
    longitude: null,
    city: "",
    place_name: "",
    weather: {
      condition: "",
      temperature_c: null,
      rain_probability: null,
      uv_index: null,
      source: "mock"
    },
    nearby_places: []
  }
};

const PLACE_STOP_WORDS = new Set([
  "这里",
  "那里",
  "这边",
  "那边",
  "附近",
  "一下",
  "今天",
  "现在",
  "晚上",
  "白天",
  "一个人",
  "我们",
  "那里去",
  "这里去"
]);

const CONTINUATION_PATTERNS = /继续聊|继续说|展开讲|然后呢|再讲讲|多说点|细说说|继续吧|接着聊|好的，继续聊吧|好啊继续/;

function getPersonas() {
  const personas = readJsonConfig("personas.json", []);
  return Array.isArray(personas) ? personas : [];
}

function pickPersona(personaId) {
  return findById(getPersonas(), personaId, DEFAULT_PERSONA.id) || DEFAULT_PERSONA;
}

function normalizeLocation(location) {
  return location && typeof location === "object" ? { ...location } : {};
}

function normalizeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeConversationState(state = {}) {
  const preferences = state.preferences && typeof state.preferences === "object" ? state.preferences : {};
  const liveContext = state.live_context && typeof state.live_context === "object" ? state.live_context : {};
  const weather = liveContext.weather && typeof liveContext.weather === "object" ? liveContext.weather : {};

  return {
    ...DEFAULT_CONVERSATION_STATE,
    ...state,
    preferences: {
      ...DEFAULT_CONVERSATION_STATE.preferences,
      ...preferences
    },
    visited_places: Array.isArray(state.visited_places) ? state.visited_places.filter(Boolean) : [],
    badges: Array.isArray(state.badges) ? state.badges.filter(Boolean) : [],
    live_context: {
      ...DEFAULT_CONVERSATION_STATE.live_context,
      ...liveContext,
      source: liveContext.source || "unavailable",
      latitude: normalizeNumber(liveContext.latitude),
      longitude: normalizeNumber(liveContext.longitude),
      nearby_places: Array.isArray(liveContext.nearby_places) ? liveContext.nearby_places.filter(Boolean) : [],
      weather: {
        ...DEFAULT_CONVERSATION_STATE.live_context.weather,
        ...weather,
        temperature_c: normalizeNumber(weather.temperature_c),
        rain_probability: normalizeNumber(weather.rain_probability),
        uv_index: normalizeNumber(weather.uv_index)
      }
    }
  };
}

function cleanPlaceCandidate(value = "") {
  let place = String(value || "").trim();
  if (!place) {
    return "";
  }

  place = place.split(/[\s，。？！!?,、\n]/)[0] || "";
  place = place.replace(/^(那个|这个|这家|这里的|那家|那边的|从这里|从那边)/, "");
  place = place.replace(/(啊|呀|呢|了|吧|嘛|哦|呐|呀呀)+$/g, "");
  place = place.replace(/(玩|逛|看看|看一看|拍照|打卡|吃饭|喝咖啡|喝点东西)+$/g, "");
  place = place.replace(/(附近|周边)+$/g, "");
  place = place.trim();

  if (!place || place.length > 16 || PLACE_STOP_WORDS.has(place)) {
    return "";
  }

  return place;
}

function getMessageText(message = {}) {
  if (!message || typeof message !== "object") {
    return "";
  }

  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content.trim();
  }

  if (typeof message.reply_text === "string" && message.reply_text.trim()) {
    return message.reply_text.trim();
  }

  return "";
}

function isContinuationPrompt(text = "") {
  return CONTINUATION_PATTERNS.test(String(text || "").trim());
}

function inferIntentFromGoal(goal = "") {
  const text = String(goal || "");

  if (!text) return "";
  if (/故事|来历|记忆/.test(text)) return "story";
  if (/找吃的|吃什么|喝/.test(text)) return "food";
  if (/拍照|出片/.test(text)) return "photo";
  if (/去/.test(text) && /从/.test(text)) return "route";
  if (/天气|出门/.test(text)) return "weather";
  return "";
}

function buildPlaceCultureHint(place = "") {
  const value = String(place || "");
  if (!value) {
    return {
      place_character: "",
      story_angles: [],
      reply_style: "用正常聊天口吻，先给一个具体细节，再补一句感受或联想。"
    };
  }

  let placeCharacter = "可以从它为什么会成为城市记忆点、当地人怎么使用这个地方、以及不同时间的气质变化来讲。";

  if (/[江河湖海滩湾港桥]/.test(value)) {
    placeCharacter = "可以从水岸、来往的人流、城市天际线、以及它如何承接到达与告别来讲。";
  } else if (/[街巷里坊路弄]/.test(value)) {
    placeCharacter = "可以从街区生活、店铺更替、旧城节奏、以及人为什么愿意一遍遍回来这里来讲。";
  } else if (/[园公园山岛林]/.test(value)) {
    placeCharacter = "可以从季节变化、散步感、城市留白和当地人怎样在这里放松来讲。";
  } else if (/[馆院寺塔楼城站]/.test(value)) {
    placeCharacter = "可以从建筑、历史层叠、公共记忆和它见过的城市变化来讲。";
  }

  return {
    place_character: placeCharacter,
    story_angles: [
      "为什么它会被一代代人记住",
      "白天和夜里气质有什么不同",
      "当地人通常怎么使用这个地方",
      "最值得注意的一两个具体细节"
    ],
    reply_style: "故事类回复用2到4句自然聊天语气，至少给1个具体意象或细节，不要只说抽象感受。"
  };
}

function isCurrentPlaceStatement(text = "") {
  return /我在|到.+了|已经到/.test(String(text || ""));
}

function extractExplicitPlace(userText = "") {
  const text = String(userText || "").trim();
  if (!text) {
    return "";
  }

  const patterns = [
    /(?:我又想去|我想去|我要去|准备去|想去)([^，。？！!?,、\s\n]{1,16})/,
    /(?:去)([^，。？！!?,、\s\n]{1,16})(?:玩|逛|看看|打卡)?/,
    /(?:到)([^，。？！!?,、\s\n]{1,16})了/,
    /(?:我在)([^，。？！!?,、\s\n]{1,16})/,
    /(?:想找|想吃|想喝)([^，。？！!?,、\s\n]{1,16})/,
    /([^，。？！!?,、\s\n]{1,16})(?:哪里好拍照|哪儿好拍|怎么拍|好拍吗|有什么好吃的|有啥好吃的|人好多|好多人)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const place = cleanPlaceCandidate(match?.[1] || "");
    if (place) {
      return place;
    }
  }

  return "";
}

function extractRouteIntent(userText = "", conversationState = {}) {
  const text = String(userText || "").trim();
  const state = sanitizeConversationState(conversationState);
  const result = {
    origin_place: "",
    target_place: "",
    is_route_question: false
  };

  if (!text) {
    return result;
  }

  const fullRoutePatterns = [
    /(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去([^，。？！!?,、\s\n]{1,16})/,
    /([^，。？！!?,、\s\n]{1,16})到([^，。？！!?,、\s\n]{1,16})(?:怎么走|怎么去|怎么过去|路线|咋走|咋去)/
  ];

  for (const pattern of fullRoutePatterns) {
    const match = text.match(pattern);
    const originPlace = cleanPlaceCandidate(match?.[1] || "");
    const targetPlace = cleanPlaceCandidate(match?.[2] || "");
    if (originPlace || targetPlace) {
      return {
        origin_place: originPlace,
        target_place: targetPlace,
        is_route_question: true
      };
    }
  }

  const originOnlyMatch = text.match(/(?:怎么|如何)?从([^，。？！!?,、\s\n]{1,16})去(?:呢|呀|啊|嘛)?$/);
  if (originOnlyMatch) {
    return {
      origin_place: cleanPlaceCandidate(originOnlyMatch[1] || ""),
      target_place: cleanPlaceCandidate(state.target_place || state.current_place || state.last_place || ""),
      is_route_question: true
    };
  }

  if (/从这里去|怎么从这里去|怎么从这边去|怎么从那边去/.test(text)) {
    return {
      origin_place: cleanPlaceCandidate(state.current_place || state.origin_place || state.live_context.place_name || ""),
      target_place: cleanPlaceCandidate(state.target_place || state.last_place || ""),
      is_route_question: true
    };
  }

  if (/怎么去那里|怎么过去|怎么去|怎么走|回酒店|回去|回住的地方|回住处/.test(text)) {
    return {
      origin_place: cleanPlaceCandidate(state.current_place || state.origin_place || state.live_context.place_name || ""),
      target_place: cleanPlaceCandidate(state.target_place || state.last_place || ""),
      is_route_question: true
    };
  }

  return result;
}

function detectIntent({ userText = "", mode = "chat", explicitPlace = "", routeInfo = {}, conversationState = {} } = {}) {
  const text = String(userText || "");
  const state = sanitizeConversationState(conversationState);

  if (isContinuationPrompt(text)) {
    return inferIntentFromGoal(state.last_user_goal) || state.last_intent || "chat";
  }

  if (/你怎么知道|定位|位置怎么来的|你有我定位/.test(text)) return "identity";
  if (/危险|害怕|不安全|有人跟着|迷路|救命/.test(text) || mode === "safety") return "safety";
  if (/我的位置|我在哪|我现在在哪|现在在哪/.test(text)) return "location_status";
  if (/现在几点|几点了|现在几号|今天几号|几点啦/.test(text)) return "time";
  if (routeInfo.is_route_question || /怎么去|怎么走|怎么从|从哪里去|从.+到.+|过去|回酒店|回去/.test(text)) return "route";
  if (/天气|下雨|冷不冷|热不热|带伞|防晒|穿什么/.test(text)) return "weather";
  if (/有什么故事|有什么来历|为什么有名|历史|典故/.test(text)) return "story";
  if (/有啥好吃的|有什么好吃的|吃什么|想吃|餐厅|小吃|夜宵|火锅|咖啡|喝点什么/.test(text)) return "food";
  if (/哪里好拍照|哪儿好拍|怎么拍|拍哪里|机位|角度|出片|打卡照|拍照|照片|好拍吗/.test(text) || mode === "photo") return "photo";
  if (/好多人|人好多|太挤|人挤人|排队|人山人海|热闹/.test(text)) return "crowd";
  if (explicitPlace) return "place_specific";
  if (/任务|徽章|打卡|解锁/.test(text) || mode === "game") return "game";
  if (/不知道去哪|附近有什么|推荐一下|去哪里|想去玩|我要去玩/.test(text) || mode === "decision") return "decision";
  if (/你好|嗨|hello|hi|在吗/.test(text)) return "greeting";
  return "chat";
}

function detectEmotion(userText = "", context = {}) {
  if (context && typeof context.mood === "string" && context.mood.trim()) {
    return context.mood;
  }

  const text = String(userText || "");
  if (/害怕|不安|危险|迷路|慌|不敢/.test(text)) return "nervous";
  if (/累|疲惫|走不动|困/.test(text)) return "tired";
  if (/开心|放松|舒服|好玩/.test(text)) return "relaxed";
  return "uncertain";
}

function extractRecentPlaceFromHistory(history = [], userText = "") {
  const currentPlace = extractExplicitPlace(userText);
  if (currentPlace) {
    return currentPlace;
  }

  const recentHistory = Array.isArray(history) ? history.slice(-12).reverse() : [];
  for (const message of recentHistory) {
    const text = getMessageText(message);
    const routeInfo = extractRouteIntent(text);
    const place = routeInfo.target_place || extractExplicitPlace(text);
    if (place) {
      return place;
    }
  }

  return "";
}

function extractQuestionTarget(userText = "", conversationState = {}) {
  const state = sanitizeConversationState(conversationState);
  const text = String(userText || "");
  const explicitPlace = extractExplicitPlace(text);
  const routeInfo = extractRouteIntent(text, state);

  if (explicitPlace || routeInfo.target_place) {
    return explicitPlace || routeInfo.target_place;
  }

  if (/哪里好拍照|哪儿好拍|怎么拍|好拍吗|有啥好吃的|有什么好吃的|吃什么|人好多怎么办|怎么走|附近有什么|怎么去|怎么从这里去/.test(text)) {
    return cleanPlaceCandidate(state.target_place || state.current_place || state.last_place || state.live_context.place_name || "");
  }

  if (/有什么故事|有什么来历|为什么有名|历史|典故/.test(text)) {
    return cleanPlaceCandidate(state.target_place || state.current_place || state.last_place || state.live_context.place_name || "");
  }

  return "";
}

function deriveUserGoal({ detectedIntent = "", originPlace = "", targetPlace = "", effectivePlace = "", userText = "" } = {}) {
  if (detectedIntent === "route" && originPlace && targetPlace) {
    return `从${originPlace}去${targetPlace}`;
  }

  if (detectedIntent === "route" && targetPlace) {
    return `去${targetPlace}`;
  }

  if (detectedIntent === "food" && effectivePlace) {
    return `在${effectivePlace}附近找吃的`;
  }

  if (detectedIntent === "photo" && effectivePlace) {
    return `在${effectivePlace}附近拍照`;
  }

  if (detectedIntent === "weather") {
    return "根据天气决定出门安排";
  }

  if (detectedIntent === "story" && effectivePlace) {
    return `了解${effectivePlace}的故事`;
  }

  if (detectedIntent === "time") {
    return "确认当前本地时间";
  }

  if (detectedIntent === "location_status") {
    return "确认当前所在位置";
  }

  if (detectedIntent === "story" && effectivePlace) {
    return `了解${effectivePlace}的故事`;
  }

  if (detectedIntent === "place_specific" && targetPlace) {
    return `把目标切到${targetPlace}`;
  }

  return String(userText || "").trim();
}

function buildLiveContext({ payload = {}, conversationState = {}, location = {}, nearbyPlaces = [] } = {}) {
  const payloadLiveContext = payload.live_context && typeof payload.live_context === "object" ? payload.live_context : {};
  const stateLiveContext = conversationState.live_context || {};
  const localTime = payloadLiveContext.local_time || stateLiveContext.local_time || new Date().toLocaleString("sv-SE").replace(" ", "T");
  const timeOfDay = payloadLiveContext.time_of_day || stateLiveContext.time_of_day || inferTimeOfDay(localTime);
  const city = payloadLiveContext.city || stateLiveContext.city || location.city || conversationState.current_city || "";
  const placeName =
    payloadLiveContext.place_name ||
    stateLiveContext.place_name ||
    location.place_name ||
    conversationState.current_place ||
    "";
  const source =
    payloadLiveContext.source ||
    stateLiveContext.source ||
    (payloadLiveContext.latitude !== undefined || stateLiveContext.latitude !== undefined ? "browser" : "") ||
    (conversationState.current_place ? "user_text" : "unavailable");
  const latitude = normalizeNumber(payloadLiveContext.latitude, normalizeNumber(stateLiveContext.latitude));
  const longitude = normalizeNumber(payloadLiveContext.longitude, normalizeNumber(stateLiveContext.longitude));
  const weather = resolveWeatherContext({
    liveContext: {
      ...stateLiveContext,
      ...payloadLiveContext
    },
    localTime
  });
  const contextualPlaces = getRelevantNearbyPlaces({
    providedPlaces: Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0 ? nearbyPlaces : stateLiveContext.nearby_places,
    effectivePlace: conversationState.target_place || conversationState.current_place || placeName,
    detectedIntent: "",
    liveContext: {
      city,
      place_name: placeName
    }
  });

  return {
    local_time: localTime,
    time_of_day: timeOfDay,
    source,
    latitude,
    longitude,
    city,
    place_name: placeName,
    weather,
    nearby_places: contextualPlaces
  };
}

function resolveConversationContext(payload = {}) {
  const userText = String(payload.user_text || "");
  const history = Array.isArray(payload.history) ? payload.history : [];
  const conversationState = sanitizeConversationState(payload.conversation_state);
  const location = normalizeLocation(payload.location);
  const rawNearbyPlaces = Array.isArray(payload.nearby_places) ? payload.nearby_places : [];
  const liveContext = buildLiveContext({
    payload,
    conversationState,
    location,
    nearbyPlaces: rawNearbyPlaces
  });
  const explicitPlace = extractExplicitPlace(userText);
  const routeInfo = extractRouteIntent(userText, conversationState);
  const detectedIntent = detectIntent({
    userText,
    mode: payload.mode || "chat",
    explicitPlace,
    routeInfo,
    conversationState
  });
  const recentPlace = extractRecentPlaceFromHistory(history, userText);
  const currentPlace = cleanPlaceCandidate(conversationState.current_place || liveContext.place_name || "");
  const targetPlace = cleanPlaceCandidate(conversationState.target_place || "");
  const lastPlace = cleanPlaceCandidate(conversationState.last_place || "");
  const questionTarget = extractQuestionTarget(userText, conversationState);
  const locationPlace = cleanPlaceCandidate(location.place_name || liveContext.place_name || "");
  const mockPlace = liveContext.nearby_places[0]?.name || DEFAULT_PLACE.name;

  let effectivePlace = "";
  let placeSource = "mock";

  if (routeInfo.target_place || explicitPlace) {
    effectivePlace = routeInfo.target_place || explicitPlace;
    placeSource = "user_text";
  } else if (questionTarget) {
    effectivePlace = questionTarget;
    placeSource = "conversation_state";
  } else if (targetPlace || currentPlace || lastPlace) {
    effectivePlace = targetPlace || currentPlace || lastPlace;
    placeSource = "conversation_state";
  } else if (recentPlace) {
    effectivePlace = recentPlace;
    placeSource = "history";
  } else if (locationPlace) {
    effectivePlace = locationPlace;
    placeSource = "location";
  } else {
    effectivePlace = mockPlace;
    placeSource = "mock";
  }

  const originPlace = cleanPlaceCandidate(routeInfo.origin_place || conversationState.origin_place || currentPlace || "");
  const resolvedTargetPlace = cleanPlaceCandidate(routeInfo.target_place || explicitPlace || targetPlace || questionTarget || "");
  const userGoal = deriveUserGoal({
    detectedIntent,
    originPlace,
    targetPlace: resolvedTargetPlace || effectivePlace,
    effectivePlace,
    userText
  });
  const nearbyPlaces = getRelevantNearbyPlaces({
    providedPlaces: rawNearbyPlaces.length > 0 ? rawNearbyPlaces : liveContext.nearby_places,
    effectivePlace,
    detectedIntent,
    liveContext
  });

  let instruction = "";
  if (routeInfo.is_route_question && originPlace && (resolvedTargetPlace || effectivePlace)) {
    instruction = `用户当前在问路线问题，请理解为从${originPlace}去${resolvedTargetPlace || effectivePlace}，给路线思路，不要假装真实导航。`;
  } else if (explicitPlace && recentPlace && explicitPlace !== recentPlace) {
    instruction = `用户这一轮把目标切换到了${explicitPlace}，不要继续围绕${recentPlace}。`;
  } else if (detectedIntent === "food" && effectivePlace) {
    instruction = `用户在问${effectivePlace}附近吃什么，请围绕当前地点给建议，不要反问目标地点。`;
  } else if (detectedIntent === "photo" && effectivePlace) {
    instruction = `用户在问${effectivePlace}的拍照建议，请承接当前地点继续。`;
  } else if (effectivePlace) {
    instruction = `当前已知主题地点是${effectivePlace}，用户没有重复地点时也要承接它。`;
  } else {
    instruction = "当前输入没有明确地点时，再结合 history、conversation_state 和 live_context 理解上下文。";
  }

  return {
    explicit_place: explicitPlace,
    origin_place: originPlace,
    target_place: resolvedTargetPlace,
    current_place: currentPlace,
    effective_place: effectivePlace,
    place_source: placeSource,
    detected_intent: detectedIntent,
    user_goal: userGoal,
    live_context: {
      ...liveContext,
      nearby_places: nearbyPlaces
    },
    instruction,
    recent_place: recentPlace
  };
}

function pickPlace(nearbyPlaces = [], effectivePlace = "") {
  const source = Array.isArray(nearbyPlaces) && nearbyPlaces.length > 0 ? nearbyPlaces : getMockPlaces();

  if (effectivePlace) {
    const matchedPlace = source.find((place) => String(place?.name || "").includes(effectivePlace));
    if (matchedPlace) {
      return normalizePlace(matchedPlace);
    }
  }

  return normalizePlace(source[0] || DEFAULT_PLACE);
}

function getSuggestedAction(intent = "chat", place = DEFAULT_PLACE, contextSummary = {}) {
  if (intent === "identity") return "clarify_location_source";
  if (intent === "location_status") return "share_location_status";
  if (intent === "time") return "share_time_status";
  if (intent === "route") return "plan_route";
  if (intent === "weather") return "check_weather_and_prepare";
  if (intent === "story") return "share_place_story";
  if (intent === "food") return "find_food_nearby";
  if (intent === "photo") return "look_for_photo_spot";
  if (intent === "crowd") return "avoid_crowded_spot";
  if (intent === "place_specific" && contextSummary.target_place) return "continue_place_plan";
  if (intent === "game") return "start_firework_photo_task";
  if (intent === "decision" && place.id) return `go_to_${place.id}`;
  return place.id ? `go_to_${place.id}` : "choose_safe_place";
}

function buildFallbackChatResponse({
  persona,
  location,
  emotion,
  place,
  detectedIntent,
  contextSummary,
  userText,
  conversationState
}) {
  return fallbackChatResponse({
    personaLine: persona.comfort_line || persona.opening_line || DEFAULT_PERSONA.comfort_line,
    emotion_detected: emotion,
    intent: detectedIntent,
    userText,
    originPlace: contextSummary.origin_place,
    targetPlace: contextSummary.target_place,
    effectivePlace: contextSummary.effective_place,
    placeSource: contextSummary.place_source,
    conversationState,
    liveContext: contextSummary.live_context,
    location: Object.keys(location || {}).length > 0 ? location : DEFAULT_LOCATION,
    suggested_action: getSuggestedAction(detectedIntent, place, contextSummary),
    task_triggered: detectedIntent === "game" ? place.task_id || "firework_photo_task" : ""
  });
}

function placeSummary(place) {
  return normalizePlace(place || DEFAULT_PLACE);
}

function toLlmHistoryMessages(history = []) {
  return (Array.isArray(history) ? history.slice(-12) : [])
    .map((message) => {
      const text = getMessageText(message);
      if (!text) {
        return null;
      }

      return {
        role: message.role === "assistant" ? "assistant" : "user",
        content: text
      };
    })
    .filter(Boolean);
}

function buildChatMessages({
  payload,
  persona,
  location,
  emotion,
  nearbyPlaces,
  fallbackResponse,
  detectedIntent,
  contextSummary
}) {
  const basePrompt = readPromptFile("base_agent_prompt.txt", "You are SoloMate. Return strict JSON only.");
  const conversationState = sanitizeConversationState(payload.conversation_state);
  const cultureHint = buildPlaceCultureHint(contextSummary.effective_place || contextSummary.target_place);

  return [
    {
      role: "system",
      content: basePrompt
    },
    {
      role: "system",
      content: `当前会话状态 JSON: ${JSON.stringify(conversationState, null, 2)}`
    },
    {
      role: "system",
      content: `实时上下文 JSON: ${JSON.stringify(contextSummary.live_context, null, 2)}`
    },
    {
      role: "system",
      content: `地点细节与城市文化提示 JSON: ${JSON.stringify(cultureHint, null, 2)}`
    },
    ...toLlmHistoryMessages(payload.history),
    {
      role: "user",
      content: JSON.stringify(
        {
          user_text: payload.user_text || "",
          detected_intent: detectedIntent,
          user_goal: contextSummary.user_goal,
          origin_place: contextSummary.origin_place,
          target_place: contextSummary.target_place,
          effective_place: contextSummary.effective_place,
          place_source: contextSummary.place_source,
          conversation_state: conversationState,
          live_context: contextSummary.live_context,
          nearby_places: nearbyPlaces,
          location,
          constraints: {
            do_not_use_default_location_if_user_specified_place: true,
            do_not_ask_known_place_again: true,
            if_user_mentions_new_place_switch_context: true,
            answer_follow_up_using_current_topic: true
          },
          response_style: {
            target_length: "2_to_4_sentences",
            be_natural: true,
            avoid_over_brief: true,
            avoid_overlong: true,
            story_reply_should_include_one_concrete_detail: detectedIntent === "story"
          },
          hints: {
            detected_emotion: emotion,
            preferred_place: placeSummary(nearbyPlaces[0] || DEFAULT_PLACE),
            fallback_response: fallbackResponse,
            instruction: contextSummary.instruction
          }
        },
        null,
        2
      )
    }
  ];
}

function buildDiaryMessages({ payload, fallbackResponse }) {
  const diaryPrompt = readPromptFile("diary_prompt.txt", "Write a short diary in strict JSON only.");

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

function shouldForceFallback(response, context = {}) {
  const replyText = String(response?.reply_text || "");
  const detectedIntent = context.detectedIntent || "";
  const effectivePlace = context.effectivePlace || "";
  const originPlace = context.originPlace || "";
  const targetPlace = context.targetPlace || "";
  const placeSource = context.placeSource || "";

  if (detectedIntent === "identity" && !/App|location|位置|定位|模拟位置/.test(replyText)) {
    return true;
  }

  if (detectedIntent === "route" && targetPlace) {
    if (!replyText.includes(targetPlace)) {
      return true;
    }

    if (originPlace && !replyText.includes(originPlace)) {
      return true;
    }
  }

  if (["food", "photo", "crowd", "place_specific"].includes(detectedIntent) && effectivePlace) {
    if (!replyText.includes(effectivePlace)) {
      return true;
    }
  }

  if (placeSource === "user_text" && effectivePlace && replyText.includes(`${DEFAULT_LOCATION.place_name}${effectivePlace}`)) {
    return true;
  }

  return false;
}

async function generateChatResponse(payload = {}) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const persona = pickPersona(safePayload.persona_id);
  const location = normalizeLocation(safePayload.location);
  const context = safePayload.context && typeof safePayload.context === "object" ? safePayload.context : {};
  const conversationState = sanitizeConversationState(safePayload.conversation_state);
  const contextSummary = resolveConversationContext({
    ...safePayload,
    location,
    conversation_state: conversationState
  });
  const detectedIntent = contextSummary.detected_intent;
  const emotion = detectEmotion(safePayload.user_text, {
    ...context,
    mood: context.mood || conversationState.mood
  });
  const nearbyPlaces = getRelevantNearbyPlaces({
    providedPlaces: Array.isArray(safePayload.nearby_places) ? safePayload.nearby_places : [],
    effectivePlace: contextSummary.effective_place,
    detectedIntent,
    liveContext: contextSummary.live_context
  });
  const place = pickPlace(nearbyPlaces, contextSummary.effective_place);
  const fallbackResponse = buildFallbackChatResponse({
    persona,
    location,
    emotion,
    place,
    detectedIntent,
    contextSummary,
    userText: safePayload.user_text,
    conversationState: {
      ...conversationState,
      live_context: contextSummary.live_context
    }
  });

  if (!isLlmEnabled()) {
    return fallbackResponse;
  }

  const llmResult = await generateStructuredJson({
    messages: buildChatMessages({
      payload: {
        ...safePayload,
        conversation_state: {
          ...conversationState,
          live_context: contextSummary.live_context
        }
      },
      persona,
      location,
      emotion,
      nearbyPlaces,
      fallbackResponse,
      detectedIntent,
      contextSummary
    }),
    normalizer: normalizeChatResponse,
    fallbackValue: fallbackResponse
  });

  const normalized = normalizeChatResponse(llmResult.data);
  if (
    shouldForceFallback(normalized, {
      detectedIntent,
      effectivePlace: contextSummary.effective_place,
      originPlace: contextSummary.origin_place,
      targetPlace: contextSummary.target_place,
      placeSource: contextSummary.place_source
    })
  ) {
    return fallbackResponse;
  }

  return normalized;
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
  extractExplicitPlace,
  extractRouteIntent,
  extractRecentPlaceFromHistory,
  resolveConversationContext,
  detectIntent,
  generateChatResponse,
  generateDiary
};

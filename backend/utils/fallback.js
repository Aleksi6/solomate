const DEFAULT_LOCATION = {
  city: "杭州",
  place_name: "西湖附近",
  lat: 30.25,
  lng: 120.15
};

const DEFAULT_CHAT = {
  reply_text: "我在。我们先别急着把路走满，先把下一步理清楚。",
  reply_type: "fallback",
  emotion_detected: "uncertain",
  suggested_action: "choose_safe_place",
  safety_tip: "一个人出行时，尽量优先主路、明亮、人流稳定的区域。",
  next_options: ["附近有什么", "哪里好拍照", "有啥好吃的"],
  task_triggered: "firework_photo_task"
};

function normalizeChatResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};

  return {
    reply_text: input.reply_text || DEFAULT_CHAT.reply_text,
    reply_type: input.reply_type || DEFAULT_CHAT.reply_type,
    emotion_detected: input.emotion_detected || DEFAULT_CHAT.emotion_detected,
    suggested_action: input.suggested_action || DEFAULT_CHAT.suggested_action,
    safety_tip: input.safety_tip || DEFAULT_CHAT.safety_tip,
    next_options: Array.isArray(input.next_options) && input.next_options.length > 0
      ? input.next_options
      : DEFAULT_CHAT.next_options,
    task_triggered: typeof input.task_triggered === "string" ? input.task_triggered : DEFAULT_CHAT.task_triggered
  };
}

function normalizeWeather(weather = {}) {
  const input = weather && typeof weather === "object" ? weather : {};

  return {
    condition: input.condition || "",
    temperature_c: Number.isFinite(Number(input.temperature_c)) ? Number(input.temperature_c) : null,
    rain_probability: Number.isFinite(Number(input.rain_probability)) ? Number(input.rain_probability) : null,
    uv_index: Number.isFinite(Number(input.uv_index)) ? Number(input.uv_index) : null,
    source: input.source || "mock"
  };
}

function pickTopicPlace({ targetPlace = "", effectivePlace = "", currentPlace = "", fallbackPlace = "" } = {}) {
  return targetPlace || effectivePlace || currentPlace || fallbackPlace || "";
}

function shouldPreferCurrentPlace(intent = "", userText = "") {
  return ["food", "weather", "location_status"].includes(intent) || /附近|周边|这边|这里/.test(String(userText || ""));
}

function formatLocalTime(localTime = "") {
  const date = localTime ? new Date(localTime) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildPlaceStoryShape(place = "") {
  const value = String(place || "");

  if (/[江河湖海滩湾港桥]/.test(value)) {
    return `像${value}这种靠水的地方，故事常常和“到达”有关。白天看是城市的边线，到了晚上，灯一亮起来，它又会变成很多人记忆里最容易停下来的那一段风景。`;
  }

  if (/[街巷里坊路弄]/.test(value)) {
    return `${value}这种地方的故事，往往藏在店铺更替和人来人往里。你站在那儿的时候，看到的不只是街景，也是在看一座城市日常生活怎么慢慢长出来。`;
  }

  if (/[园公园山岛林]/.test(value)) {
    return `${value}的故事通常不靠喧闹，而是靠一代代人把散步、发呆、见面这些日常留在那里。它更像城市给人留的一口气。`;
  }

  if (/[馆院寺塔楼城站]/.test(value)) {
    return `${value}这种地方的魅力，常常在建筑和时间叠在一起的时候最明显。你会感觉它不是单纯一个点位，而像一页还在继续写的城市记事。`;
  }

  return `像${value}这种地方，故事往往不只在资料里，也在它怎么被一代代人反复经过、拍照、告别和重逢里。`;
}

function buildWeatherReminder(weather = {}, timeOfDay = "") {
  const normalized = normalizeWeather(weather);
  const tips = [];

  if (normalized.rain_probability !== null && normalized.rain_probability >= 60) {
    tips.push("这会儿雨概率偏高，出门记得带伞。");
  }

  if (normalized.uv_index !== null && normalized.uv_index >= 6) {
    tips.push("紫外线不低，记得防晒和补水。");
  }

  if (normalized.temperature_c !== null && normalized.temperature_c <= 12) {
    tips.push("温度偏低，外套最好别省。");
  } else if (normalized.temperature_c !== null && normalized.temperature_c >= 30) {
    tips.push("温度有点高，尽量别长时间暴晒。");
  }

  if (timeOfDay === "night") {
    tips.push("夜里出门的话，优先走主路，别拐太偏。");
  }

  return tips.join(" ");
}

function fallbackChatResponse(input = {}) {
  const personaLine = input.personaLine || "我在，今天我陪你走。";
  const intent = input.intent || "chat";
  const userText = String(input.userText || "");
  const originPlace = input.originPlace || "";
  const targetPlace = input.targetPlace || "";
  const effectivePlace = input.effectivePlace || "";
  const placeSource = input.placeSource || "";
  const conversationState = input.conversationState && typeof input.conversationState === "object" ? input.conversationState : {};
  const liveContext = input.liveContext && typeof input.liveContext === "object" ? input.liveContext : {};
  const location = input.location && typeof input.location === "object" ? input.location : DEFAULT_LOCATION;
  const actualPlace =
    liveContext.place_name ||
    conversationState.current_place ||
    ((liveContext.source === "browser" && liveContext.latitude != null) ? "当前位置" : "") ||
    location.place_name ||
    "";
  const travelTopicPlace = pickTopicPlace({
    targetPlace,
    effectivePlace,
    currentPlace: conversationState.current_place || "",
    fallbackPlace: location.place_name || DEFAULT_LOCATION.place_name
  });
  const currentTopicPlace = pickTopicPlace({
    targetPlace: actualPlace,
    effectivePlace: conversationState.current_place || "",
    currentPlace: "",
    fallbackPlace: ""
  });
  const topicPlace = shouldPreferCurrentPlace(intent, userText)
    ? currentTopicPlace || travelTopicPlace
    : travelTopicPlace || currentTopicPlace;
  const actualCity = liveContext.city || conversationState.current_city || location.city || "";
  const weather = normalizeWeather(liveContext.weather);
  const weatherReminder = buildWeatherReminder(weather, liveContext.time_of_day || "");
  const weatherSourceNote = weather.source === "mock"
    ? `${actualPlace ? `${actualPlace}这边` : "你这边"}我先按模拟天气提醒你。`
    : `${actualPlace ? `${actualPlace}这边` : "你这边"}我按当前天气信息先提醒你。`;

  if (intent === "identity") {
    return normalizeChatResponse({
      reply_text: `${personaLine} 我不会私下获取你的定位，我只能看到 App 主动传来的位置字段，或者 Demo 里的模拟位置。`,
      reply_type: "identity_explain",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "clarify_location_source",
      safety_tip: "如果你不想用定位，也可以直接用文字告诉我你现在大概在哪。",
      next_options: ["继续聊附近建议", "只用文字描述位置", "换个地方问问"],
      task_triggered: ""
    });
  }

  if (intent === "location_status") {
    const locationSource = liveContext.source || "mock";
    const locationLine =
      locationSource === "browser"
        ? `我当前拿到的实时位置是${actualCity || ""}${actualPlace || ""}。`
        : `我现在没有拿到你设备的实时定位，只能先按${actualCity || ""}${actualPlace || "模拟位置"}来陪你判断。`;

    return normalizeChatResponse({
      reply_text: `${personaLine} ${locationLine}`,
      reply_type: "location_status",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: input.suggested_action || "share_location_status",
      safety_tip: locationSource === "browser"
        ? "如果你已经走动了，可以再发一句“说出当前位置”，我会按新的位置继续。"
        : "如果你愿意开定位或直接用文字告诉我你在哪，我就能接得更准。",
      next_options: ["说出当前位置", "附近有什么", "我想去别的地方"],
      task_triggered: ""
    });
  }

  if (intent === "time") {
    const timeText = formatLocalTime(liveContext.local_time);
    const lateNightTip = liveContext.time_of_day === "night" ? "已经偏晚了，出门的话尽量走主路。" : "";

    return normalizeChatResponse({
      reply_text: `${personaLine} 你这边现在大概是${timeText || "当前本地时间"}。${lateNightTip}`,
      reply_type: "time_status",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: input.suggested_action || "share_time_status",
      safety_tip: lateNightTip || "",
      next_options: ["我要出门", "附近有什么", "有啥好吃的"],
      task_triggered: ""
    });
  }

  if (intent === "route") {
    if (originPlace && targetPlace) {
      return normalizeChatResponse({
        reply_text: `从${originPlace}去${targetPlace}的话，我们先按大方向判断：优先选公共交通或打车到核心区域，再步行到目的地。具体路线到现场可以再用地图确认，我先帮你把选择思路理清楚。`,
        reply_type: "route_advice",
        emotion_detected: input.emotion_detected || "uncertain",
        suggested_action: "plan_route",
        safety_tip: "如果已经是晚上，尽量把换乘次数和步行距离都压短一点。",
        next_options: ["先看省力路线", "先看预算路线", "先看到站后怎么走"],
        task_triggered: ""
      });
    }

    if (targetPlace) {
      return normalizeChatResponse({
        reply_text: `去${targetPlace}的话，我们先别急着卡死一条具体线路。你可以优先看哪种方式更省体力，再决定是公共交通先到核心区域，还是直接打车到更近的位置。`,
        reply_type: "route_advice",
        emotion_detected: input.emotion_detected || "uncertain",
        suggested_action: "plan_route",
        safety_tip: "如果是夜里出发，尽量避开太绕的换乘和偏僻出口。",
        next_options: ["先看省力路线", "先看夜间更安心的走法", "先看到了之后去哪"],
        task_triggered: ""
      });
    }
  }

  if (intent === "weather") {
    return normalizeChatResponse({
      reply_text: `${personaLine} ${weatherSourceNote}${weatherReminder || "这会儿出门的话，先按轻便、好走、方便加减衣物的思路来就行。"} `,
      reply_type: "weather_advice",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "check_weather_and_prepare",
      safety_tip: weatherReminder || "出门前顺手看下包里有没有水、纸巾和充电。 ",
      next_options: ["我要出门", "附近有什么能躲雨", "现在适合去哪"],
      task_triggered: ""
    });
  }

  if (intent === "story" && topicPlace) {
    return normalizeChatResponse({
      reply_text: `${buildPlaceStoryShape(topicPlace)} 你要是愿意，我们还可以继续往下聊它为什么会变成这座城市的记忆点。`,
      reply_type: "story_share",
      emotion_detected: input.emotion_detected || "relaxed",
      suggested_action: input.suggested_action || "share_place_story",
      safety_tip: "",
      next_options: ["讲讲它的来历", "讲讲适合什么时候去", "讲讲附近怎么逛"],
      task_triggered: ""
    });
  }

  if (intent === "food" && topicPlace) {
    const nightHint = liveContext.time_of_day === "night" ? "夜里就别为了吃的走太偏。" : "";
    return normalizeChatResponse({
      reply_text: `${topicPlace}附近可以优先找人多、评价稳定、翻台快的小吃或餐馆。要是你刚到这边，先选街边开阔、进出方便的店，一个人吃也会更放松。你想吃正餐还是小吃？我可以按省力路线帮你挑。`,
      reply_type: "food_advice",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "find_food_nearby",
      safety_tip: nightHint || "一个人找吃的时，优先选明亮、开阔、进出方便的店。",
      next_options: ["想吃正餐", "想吃小吃", "想喝点东西"],
      task_triggered: ""
    });
  }

  if (intent === "food") {
    return normalizeChatResponse({
      reply_text: "如果你现在不想开定位也没关系。你告诉我一个大概地点，比如商圈、地铁站、景点或住的附近，我就能把吃的收得更准一点；如果只是先想个方向，我也可以先按正餐、小吃、咖啡这三类陪你挑。",
      reply_type: "food_advice",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "find_food_nearby",
      safety_tip: liveContext.time_of_day === "night" ? "夜里找吃的别为了绕路走太偏，优先亮一点、进出方便的店。" : "一个人找吃的时，优先选明亮、开阔、进出方便的店。",
      next_options: ["我在地铁站附近", "想吃正餐", "想吃小吃"],
      task_triggered: ""
    });
  }

  if (intent === "photo" && topicPlace) {
    return normalizeChatResponse({
      reply_text: `${topicPlace}如果想拍得更出片，先别急着站最热门的正面机位。找侧一点、层次更开的角度，再把灯光、路面引导线或者一点人流带进画面，会更有旅行现场感。`,
      reply_type: "photo_advice",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "look_for_photo_spot",
      safety_tip: "拍照前先看脚下和身后，别为了构图退到太边上。",
      next_options: ["换个角度试试", "找侧面灯光", "先避开最挤的位置"],
      task_triggered: "firework_photo_task"
    });
  }

  if (intent === "crowd" && topicPlace) {
    return normalizeChatResponse({
      reply_text: `${topicPlace}如果现在太挤，我们先别硬往最中心钻。可以先靠边走、找亮一点的位置缓一缓，等一波人流过去，再决定继续逛还是换个方向。`,
      reply_type: "crowd_support",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "avoid_crowded_spot",
      safety_tip: "人挤的时候尽量把手机和包放在身前，也别站在楼梯口或台阶边太久。",
      next_options: ["先靠边缓一下", "换个方向逛", "找个亮一点的休息点"],
      task_triggered: ""
    });
  }

  if (intent === "place_specific" && targetPlace) {
    return normalizeChatResponse({
      reply_text: `${personaLine} 好，那我们先把目标切到${targetPlace}。这轮就围绕${targetPlace}继续，不用再从头交代。`,
      reply_type: "place_specific",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "continue_place_plan",
      safety_tip: "先把方向定下来，再选更轻松、更稳妥的走法。",
      next_options: ["问拍照点", "问吃什么", "问怎么去"],
      task_triggered: ""
    });
  }

  if (intent === "decision" && topicPlace) {
    return normalizeChatResponse({
      reply_text: `${personaLine} 既然我们当前聊的是${topicPlace}，我就先围绕它给你想下一步，不把默认地点混进来。`,
      reply_type: "comfort_decision",
      emotion_detected: input.emotion_detected || "uncertain",
      suggested_action: "continue_place_plan",
      safety_tip: weatherReminder || "优先选省体力、明亮、方便停留的点位。",
      next_options: ["先看拍照点", "先看吃什么", "先看怎么走"],
      task_triggered: ""
    });
  }

  const knownPlace = topicPlace && placeSource !== "mock" ? `我们现在就先围绕${topicPlace}来聊。` : "";

  return normalizeChatResponse({
    reply_text: `${personaLine} ${knownPlace || "你不用每句话都把背景重说一遍。"} 你想先解决路线、吃饭、拍照，还是今晚怎么走得更安心？`,
    reply_type: "companion_chat",
    emotion_detected: input.emotion_detected || "uncertain",
    suggested_action: "choose_safe_place",
    safety_tip: weatherReminder || "一个人出行时，优先主路、明亮、人流稳定的区域会更安心。",
    next_options: ["怎么去", "有啥好吃的", "哪里好拍照"],
    task_triggered: "firework_photo_task"
  });
}

function normalizePhotoAnalysisResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};
  const taskResult = input.task_result && typeof input.task_result === "object" ? input.task_result : {};

  return {
    scene_summary: input.scene_summary || "画面里有街道、灯光和旅行氛围，适合作为这次行程的记录。",
    safety_observation: input.safety_observation || "从画面判断这里相对明亮，更适合单人短暂停留；夜间仍建议靠近主路和开放店铺。",
    photo_advice: input.photo_advice || "可以把灯光、招牌和街道层次一起放进画面，让旅行现场感更完整。",
    task_result: {
      passed: typeof taskResult.passed === "boolean" ? taskResult.passed : true,
      reward_badge: taskResult.reward_badge || "城市烟火徽章",
      reason: taskResult.reason || "照片符合 SoloMate MVP 的 mock 任务判定。"
    },
    reply_text: input.reply_text || "我看到你眼前的旅行场景了，这张照片可以作为任务和日记素材。"
  };
}

function fallbackPhotoAnalysis(task = {}) {
  const rewardBadge = task.reward_badge || "城市烟火徽章";
  const taskTitle = task.title || "烟火气打卡";

  return normalizePhotoAnalysisResponse({
    task_result: {
      passed: true,
      reward_badge: rewardBadge,
      reason: `照片里有城市街区和生活氛围，符合“${taskTitle}”的 mock 判定。`
    },
    reply_text: `我看到你眼前的城市烟火气了，这张照片可以完成任务，已解锁「${rewardBadge}」。`
  });
}

function normalizeTaskResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};

  return {
    completed_tasks: Array.isArray(input.completed_tasks) ? input.completed_tasks : [],
    badges: Array.isArray(input.badges) ? input.badges : []
  };
}

function fallbackDiary(input = {}) {
  const safeInput = input && typeof input === "object" ? input : {};
  const places = Array.isArray(safeInput.visited_places) && safeInput.visited_places.length > 0
    ? safeInput.visited_places
    : ["老街入口", "夜市街区"];
  const badges = Array.isArray(safeInput.badges) && safeInput.badges.length > 0
    ? safeInput.badges
    : ["城市烟火徽章"];
  const moodHistory = Array.isArray(safeInput.mood_history) && safeInput.mood_history.length > 0
    ? safeInput.mood_history
    : ["uncertain", "relaxed"];

  return {
    diary: `今天你一个人走过了${places.join("、")}。一开始你有点${moodHistory[0]}，但你还是慢慢做出了下一步选择，也把这段路认真记录了下来。`,
    share_caption: `一个人的旅行，也会遇到刚刚好的热闹。今天解锁：${badges.join("、")}。`,
    summary_tags: ["单人旅行", "AI搭子", "城市探索"]
  };
}

function normalizeDiaryResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};
  const fallback = fallbackDiary();

  return {
    diary: input.diary || fallback.diary,
    share_caption: input.share_caption || fallback.share_caption,
    summary_tags: Array.isArray(input.summary_tags) && input.summary_tags.length > 0
      ? input.summary_tags
      : fallback.summary_tags
  };
}

function parseJsonObject(text = "") {
  if (!text || typeof text !== "string") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return null;
    }
  }
}

function fallbackForPath(path = "") {
  if (path.includes("/api/chat")) {
    return normalizeChatResponse();
  }

  if (path.includes("/api/analyze-photo")) {
    return normalizePhotoAnalysisResponse();
  }

  if (path.includes("/api/complete-task")) {
    return normalizeTaskResponse({
      completed_tasks: ["firework_photo_task"],
      badges: ["城市烟火徽章"]
    });
  }

  if (path.includes("/api/generate-diary")) {
    return normalizeDiaryResponse();
  }

  return {
    status: "ok",
    service: "SoloMate mock backend",
    mode: "mock-fallback"
  };
}

function normalizePhotoAnalysisResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};
  const taskResult = input.task_result && typeof input.task_result === "object" ? input.task_result : {};

  return {
    scene_summary: input.scene_summary || "这张照片里有旅行现场感，适合收进今天的记录里。",
    safety_observation: input.safety_observation || "按当前画面判断，先优先停留在更明亮、开阔、容易求助的位置会更安心。",
    photo_advice: input.photo_advice || "可以把主体、环境线索和一点点现场氛围一起放进画面里，照片会更完整。",
    task_result: {
      passed: typeof taskResult.passed === "boolean" ? taskResult.passed : true,
      reward_badge: taskResult.reward_badge || "",
      reason: taskResult.reason || "当前为 Demo mock 判定。"
    },
    reply_text: input.reply_text || "我先把这张照片替你收下来了，它已经可以作为今天的一枚记忆碎片。"
  };
}

function fallbackPhotoAnalysis(task = {}) {
  const rewardBadge = task.reward_badge || "";
  const taskTitle = task.title || "旅行照片记录";

  return normalizePhotoAnalysisResponse({
    task_result: {
      passed: true,
      reward_badge: rewardBadge,
      reason: `当前为 Demo mock 判定，先按「${taskTitle}」给出保守结果。`
    },
    reply_text: rewardBadge
      ? `我先把这张照片收进今天的碎片册里了。当前还没启用真实视觉模型，所以任务结果先按 Demo mock 来判断，这次对应的是「${rewardBadge}」。`
      : "我先把这张照片收进今天的碎片册里了。当前还没启用真实视觉模型，所以这次先按 Demo mock 给你保守判断。"
  });
}

module.exports = {
  DEFAULT_LOCATION,
  normalizeChatResponse,
  fallbackChatResponse,
  normalizePhotoAnalysisResponse,
  fallbackPhotoAnalysis,
  normalizeTaskResponse,
  fallbackDiary,
  normalizeDiaryResponse,
  fallbackForPath,
  parseJsonObject
};

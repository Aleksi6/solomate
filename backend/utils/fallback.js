const DEFAULT_LOCATION = {
  city: "杭州",
  place_name: "西湖附近",
  lat: 30.25,
  lng: 120.15
};

const DEFAULT_CHAT = {
  reply_text: "我在，先别急。我们先选一个人多、灯光亮、容易停留的地方，让这段一个人的旅行慢慢稳下来。",
  reply_type: "fallback",
  emotion_detected: "uncertain",
  suggested_action: "choose_safe_place",
  safety_tip: "夜间单人出行建议优先选择主路、人多、灯光明亮的区域，避免进入偏僻小路。",
  next_options: ["去夜市吃点东西", "找咖啡店休息", "回到酒店附近"],
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

function fallbackChatResponse(input = {}) {
  const placeName = input.placeName || "夜市街区";
  const personaLine = input.personaLine || "我在，今天我陪你走。";

  return normalizeChatResponse({
    reply_text: `${personaLine} 你现在一个人出行，可以先去${placeName}这样人多、灯光亮、容易停留的地方。先吃点东西、缓一下，再决定下一步也来得及。`,
    reply_type: input.reply_type || "comfort_decision",
    emotion_detected: input.emotion_detected || "uncertain",
    suggested_action: input.suggested_action || "go_to_night_market",
    safety_tip: "夜间单人出行建议优先选择主路和开放街区，尽量靠近商铺、地铁站或便利店。",
    next_options: ["去夜市街区", "找咖啡店坐一会儿", "回酒店休息"],
    task_triggered: input.task_triggered || "firework_photo_task"
  });
}

function normalizePhotoAnalysisResponse(partial = {}) {
  const input = partial && typeof partial === "object" ? partial : {};
  const taskResult = input.task_result && typeof input.task_result === "object"
    ? input.task_result
    : {};

  return {
    scene_summary: input.scene_summary || "画面像是城市夜间街区，有灯光、店铺和生活气息，适合短暂停留和观察周围环境。",
    safety_observation: input.safety_observation || "从画面判断这里相对明亮，更适合单人短暂停留；夜间仍建议靠近主路、人流和开放店铺。",
    photo_advice: input.photo_advice || "可以把招牌、街灯和人流放进画面，让城市烟火气更明显，也更适合生成旅行日记素材。",
    task_result: {
      passed: typeof taskResult.passed === "boolean" ? taskResult.passed : true,
      reward_badge: taskResult.reward_badge || "城市烟火徽章",
      reason: taskResult.reason || "照片符合 SoloMate MVP 的 mock 任务判定。"
    },
    reply_text: input.reply_text || "我看到了你眼前的城市烟火气，这张照片可以完成任务。"
  };
}

function fallbackPhotoAnalysis(task = {}) {
  const rewardBadge = task.reward_badge || "城市烟火徽章";
  const taskTitle = task.title || "烟火气打卡";

  return normalizePhotoAnalysisResponse({
    task_result: {
      passed: true,
      reward_badge: rewardBadge,
      reason: `照片包含城市街区与生活氛围，符合“${taskTitle}”的 mock 判定。`
    },
    reply_text: `我看到了你眼前的城市烟火气，这张照片可以完成任务，已解锁「${rewardBadge}」。`
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
    diary: `今天你一个人走过了${places.join("、")}。一开始你有点${moodHistory[0]}，但你还是慢慢做出了下一步选择，完成了城市里的小任务，也解锁了${badges.join("、")}。这不是一段孤单的行程，而是一段被认真记录下来的探索。`,
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

const { readJsonConfig } = require("../utils/json_loader");

const DEFAULT_PLACE = {
  id: "night_market",
  name: "夜市街区",
  type: "food",
  distance: 600,
  safety_level: "high",
  tags: ["吃饭", "人多", "夜间安全", "烟火气"],
  description: "适合单人旅行时短暂停留，吃点东西，观察周围环境。",
  task_id: "firework_photo_task"
};

function getMockPlaces() {
  const places = readJsonConfig("mock_places.json", []);
  return Array.isArray(places) && places.length > 0 ? places : [DEFAULT_PLACE];
}

function normalizePlace(place = {}) {
  return {
    id: place.id || DEFAULT_PLACE.id,
    name: place.name || DEFAULT_PLACE.name,
    type: place.type || DEFAULT_PLACE.type,
    distance: Number.isFinite(Number(place.distance)) ? Number(place.distance) : DEFAULT_PLACE.distance,
    safety_level: place.safety_level || DEFAULT_PLACE.safety_level,
    tags: Array.isArray(place.tags) ? place.tags.filter(Boolean) : DEFAULT_PLACE.tags,
    description: place.description || DEFAULT_PLACE.description,
    task_id: place.task_id || DEFAULT_PLACE.task_id
  };
}

function scorePlace(place, { effectivePlace = "", detectedIntent = "", liveContext = {} } = {}) {
  const normalized = normalizePlace(place);
  const haystack = `${normalized.name} ${(normalized.tags || []).join(" ")} ${normalized.description}`.toLowerCase();
  let score = 0;

  if (effectivePlace && haystack.includes(String(effectivePlace).toLowerCase())) {
    score += 6;
  }

  if (liveContext.place_name && haystack.includes(String(liveContext.place_name).toLowerCase())) {
    score += 3;
  }

  if (detectedIntent === "food" && ["food", "rest"].includes(normalized.type)) {
    score += 5;
  }

  if (detectedIntent === "photo" && ["culture", "view"].includes(normalized.type)) {
    score += 4;
  }

  if (detectedIntent === "crowd" && normalized.safety_level === "high") {
    score += 3;
  }

  if (detectedIntent === "route" && normalized.distance <= 800) {
    score += 2;
  }

  if (normalized.safety_level === "high") {
    score += 2;
  }

  score -= Math.min(normalized.distance, 3000) / 1000;

  return score;
}

function getRelevantNearbyPlaces({ providedPlaces = [], effectivePlace = "", detectedIntent = "", liveContext = {} } = {}) {
  const source = Array.isArray(providedPlaces) && providedPlaces.length > 0 ? providedPlaces : getMockPlaces();

  return source
    .map((place) => ({ place: normalizePlace(place), score: scorePlace(place, { effectivePlace, detectedIntent, liveContext }) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.place)
    .slice(0, 6);
}

module.exports = {
  DEFAULT_PLACE,
  getMockPlaces,
  normalizePlace,
  getRelevantNearbyPlaces
};

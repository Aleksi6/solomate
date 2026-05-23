function normalizeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function inferTimeOfDay(localTime = "") {
  const date = localTime ? new Date(localTime) : new Date();
  const hour = Number.isFinite(date.getHours()) ? date.getHours() : new Date().getHours();

  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function buildMockWeather(timeOfDay = "afternoon") {
  switch (timeOfDay) {
    case "morning":
      return {
        condition: "partly_cloudy",
        temperature_c: 22,
        rain_probability: 15,
        uv_index: 4,
        source: "mock"
      };
    case "noon":
      return {
        condition: "sunny",
        temperature_c: 28,
        rain_probability: 10,
        uv_index: 7,
        source: "mock"
      };
    case "evening":
      return {
        condition: "cloudy",
        temperature_c: 24,
        rain_probability: 25,
        uv_index: 1,
        source: "mock"
      };
    case "night":
      return {
        condition: "cloudy",
        temperature_c: 21,
        rain_probability: 20,
        uv_index: 0,
        source: "mock"
      };
    default:
      return {
        condition: "cloudy",
        temperature_c: 26,
        rain_probability: 20,
        uv_index: 3,
        source: "mock"
      };
  }
}

function resolveWeatherContext({ liveContext = {}, localTime = "" } = {}) {
  const timeOfDay = liveContext.time_of_day || inferTimeOfDay(localTime);
  const input = liveContext.weather && typeof liveContext.weather === "object" ? liveContext.weather : {};
  const hasUsefulWeather =
    typeof input.condition === "string" && input.condition.trim() ||
    input.temperature_c !== undefined ||
    input.rain_probability !== undefined ||
    input.uv_index !== undefined;

  if (hasUsefulWeather) {
    return {
      condition: String(input.condition || "").trim(),
      temperature_c: normalizeNumber(input.temperature_c),
      rain_probability: normalizeNumber(input.rain_probability),
      uv_index: normalizeNumber(input.uv_index),
      source: input.source || "mock"
    };
  }

  const weatherEnable = String(process.env.WEATHER_ENABLE || "false").toLowerCase() === "true";

  if (!weatherEnable) {
    return buildMockWeather(timeOfDay);
  }

  return buildMockWeather(timeOfDay);
}

module.exports = {
  inferTimeOfDay,
  buildMockWeather,
  resolveWeatherContext
};

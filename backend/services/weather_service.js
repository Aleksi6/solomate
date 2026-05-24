function normalizeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getWeatherConfig() {
  const timeoutValue = Number(process.env.WEATHER_TIMEOUT_MS || "8000");

  return {
    enable: String(process.env.WEATHER_ENABLE || "true").toLowerCase() === "true",
    provider: process.env.WEATHER_PROVIDER || "open_meteo",
    timeoutMs: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 8000
  };
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

function buildWeatherSuggestion({ rainProbability = null, uvIndex = null, temperatureC = null, timeOfDay = "" } = {}) {
  const notes = [];

  if (rainProbability !== null && rainProbability >= 50) {
    notes.push("记得带伞");
  }

  if (uvIndex !== null && uvIndex >= 6) {
    notes.push("注意防晒");
  }

  if (temperatureC !== null && temperatureC <= 10) {
    notes.push("外套别省");
  }

  if (timeOfDay === "night") {
    notes.push("顺手想一下回程和更亮的主路");
  } else if (timeOfDay === "noon" || timeOfDay === "evening") {
    notes.push("也可以顺手安排一下吃饭节奏");
  }

  return notes.join("，");
}

function buildMockWeather(timeOfDay = "afternoon", placeName = "", city = "") {
  const coolCity = /北京|长城|山|湖|海/.test(`${placeName}${city}`);
  const warmCity = /重庆|广州|深圳|厦门/.test(`${placeName}${city}`);

  let snapshot;
  switch (timeOfDay) {
    case "morning":
      snapshot = {
        condition: "partly_cloudy",
        temperature_c: coolCity ? 14 : warmCity ? 24 : 20,
        rain_probability: 20,
        uv_index: 3
      };
      break;
    case "noon":
      snapshot = {
        condition: "sunny",
        temperature_c: coolCity ? 18 : warmCity ? 30 : 26,
        rain_probability: 15,
        uv_index: 7
      };
      break;
    case "evening":
      snapshot = {
        condition: "cloudy",
        temperature_c: coolCity ? 13 : warmCity ? 26 : 23,
        rain_probability: 25,
        uv_index: 1
      };
      break;
    case "night":
      snapshot = {
        condition: "cloudy",
        temperature_c: coolCity ? 10 : warmCity ? 24 : 21,
        rain_probability: 20,
        uv_index: 0
      };
      break;
    default:
      snapshot = {
        condition: "cloudy",
        temperature_c: coolCity ? 16 : warmCity ? 28 : 24,
        rain_probability: 20,
        uv_index: 3
      };
  }

  return {
    ok: true,
    source: "mock",
    place_name: placeName || "",
    city: city || "",
    ...snapshot,
    suggestion: buildWeatherSuggestion({
      rainProbability: snapshot.rain_probability,
      uvIndex: snapshot.uv_index,
      temperatureC: snapshot.temperature_c,
      timeOfDay
    }),
    error: ""
  };
}

function normalizeWeatherResponse(input = {}, fallback = {}) {
  const merged = { ...fallback, ...input };
  return {
    ok: merged.ok !== false,
    source: merged.source || "mock",
    place_name: merged.place_name || "",
    city: merged.city || "",
    temperature_c: normalizeNumber(merged.temperature_c),
    condition: String(merged.condition || "").trim(),
    rain_probability: normalizeNumber(merged.rain_probability),
    uv_index: normalizeNumber(merged.uv_index),
    suggestion: String(merged.suggestion || "").trim(),
    error: String(merged.error || "").trim()
  };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`http_${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function pickSearchText({ liveContext = {}, currentPlace = "", currentCity = "", targetPlace = "" } = {}) {
  return (
    String(liveContext.place_name || "").trim() ||
    String(currentPlace || "").trim() ||
    String(currentCity || "").trim() ||
    String(targetPlace || "").trim()
  );
}

async function fetchOpenMeteoWeather({ searchText = "", timeOfDay = "", timeoutMs = 8000 } = {}) {
  if (!searchText) {
    throw new Error("missing_place_text");
  }

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchText)}&count=1&language=zh&format=json`;
  const geoData = await fetchJsonWithTimeout(geoUrl, timeoutMs);
  const place = Array.isArray(geoData?.results) ? geoData.results[0] : null;

  if (!place || place.latitude == null || place.longitude == null) {
    throw new Error("place_not_found");
  }

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    "&current=temperature_2m,weather_code" +
    "&hourly=precipitation_probability,uv_index" +
    "&timezone=auto&forecast_days=1";

  const forecastData = await fetchJsonWithTimeout(forecastUrl, timeoutMs);
  const current = forecastData?.current || {};
  const hourly = forecastData?.hourly || {};
  const firstRain = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability[0] : null;
  const firstUv = Array.isArray(hourly.uv_index) ? hourly.uv_index[0] : null;

  const conditionMap = {
    0: "clear",
    1: "mainly_clear",
    2: "partly_cloudy",
    3: "cloudy",
    45: "fog",
    48: "fog",
    51: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    71: "snow",
    80: "showers",
    95: "thunderstorm"
  };

  const temperatureC = normalizeNumber(current.temperature_2m);
  const rainProbability = normalizeNumber(firstRain);
  const uvIndex = normalizeNumber(firstUv);

  return normalizeWeatherResponse({
    ok: true,
    source: "open_meteo",
    place_name: place.name || searchText,
    city: place.admin1 || place.country || "",
    temperature_c: temperatureC,
    condition: conditionMap[current.weather_code] || "unknown",
    rain_probability: rainProbability,
    uv_index: uvIndex,
    suggestion: buildWeatherSuggestion({
      rainProbability,
      uvIndex,
      temperatureC,
      timeOfDay
    }),
    error: ""
  });
}

function normalizeWeatherForLiveContext(weather = {}) {
  return {
    condition: weather.condition || "",
    temperature_c: normalizeNumber(weather.temperature_c),
    rain_probability: normalizeNumber(weather.rain_probability),
    uv_index: normalizeNumber(weather.uv_index),
    source: weather.source || "mock"
  };
}

function resolveWeatherContext({ liveContext = {}, localTime = "" } = {}) {
  const timeOfDay = liveContext.time_of_day || inferTimeOfDay(localTime);
  const input = liveContext.weather && typeof liveContext.weather === "object" ? liveContext.weather : {};
  const hasUsefulWeather =
    (typeof input.condition === "string" && input.condition.trim()) ||
    input.temperature_c !== undefined ||
    input.rain_probability !== undefined ||
    input.uv_index !== undefined;

  if (hasUsefulWeather) {
    return normalizeWeatherForLiveContext(input);
  }

  return normalizeWeatherForLiveContext(buildMockWeather(timeOfDay, liveContext.place_name || "", liveContext.city || ""));
}

async function enrichWeatherContext({
  liveContext = {},
  currentPlace = "",
  currentCity = "",
  targetPlace = ""
} = {}) {
  const config = getWeatherConfig();
  const timeOfDay = liveContext.time_of_day || inferTimeOfDay(liveContext.local_time || "");
  const fallback = buildMockWeather(timeOfDay, liveContext.place_name || currentPlace || targetPlace || "", liveContext.city || currentCity || "");
  const existing = liveContext.weather && typeof liveContext.weather === "object" ? liveContext.weather : {};
  const hasUsefulWeather =
    (typeof existing.condition === "string" && existing.condition.trim()) ||
    existing.temperature_c !== undefined ||
    existing.rain_probability !== undefined ||
    existing.uv_index !== undefined;

  if (hasUsefulWeather) {
    return normalizeWeatherResponse(existing, fallback);
  }

  if (!config.enable || config.provider !== "open_meteo") {
    return fallback;
  }

  const searchText = pickSearchText({
    liveContext,
    currentPlace,
    currentCity,
    targetPlace
  });

  try {
    return await fetchOpenMeteoWeather({
      searchText,
      timeOfDay,
      timeoutMs: config.timeoutMs
    });
  } catch (error) {
    return normalizeWeatherResponse(
      {
        ...fallback,
        source: "mock",
        error: error?.message || "weather_fetch_failed"
      },
      fallback
    );
  }
}

function getLiveContextStatus() {
  const config = getWeatherConfig();
  return {
    geolocation_recommended: true,
    weather_enable: config.enable,
    weather_has_api_key: false,
    fallback: "mock live_context"
  };
}

function getWeatherStatus() {
  const config = getWeatherConfig();
  return {
    weather_enable: config.enable,
    weather_provider: config.provider,
    requires_api_key: false,
    fallback: "mock weather"
  };
}

module.exports = {
  getWeatherConfig,
  getLiveContextStatus,
  getWeatherStatus,
  inferTimeOfDay,
  buildMockWeather,
  resolveWeatherContext,
  enrichWeatherContext,
  normalizeWeatherForLiveContext
};

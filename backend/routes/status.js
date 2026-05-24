const express = require("express");
const { getLlmStatus } = require("../services/llm_service");
const { getVisionStatus } = require("../services/vision_service");
const { getVoiceStatus } = require("../services/voice_service");
const { getLiveContextStatus, getWeatherStatus } = require("../services/weather_service");

const router = express.Router();

router.get("/llm-status", (req, res) => {
  res.json(getLlmStatus());
});

router.get("/vision-status", (req, res) => {
  res.json(getVisionStatus());
});

router.get("/voice-status", (req, res) => {
  res.json(getVoiceStatus());
});

router.get("/live-context-status", (req, res) => {
  res.json(getLiveContextStatus());
});

router.get("/weather-status", (req, res) => {
  res.json(getWeatherStatus());
});

router.get("/proactive-care-status", (req, res) => {
  res.json({
    enabled: true,
    mode: "foreground_timer",
    max_per_day: 5,
    cooldown_seconds: 180
  });
});

module.exports = router;

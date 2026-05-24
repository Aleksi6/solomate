const express = require("express");
const { getLlmStatus } = require("../services/llm_service");
const { getVisionStatus } = require("../services/vision_service");
const { getVoiceStatus } = require("../services/voice_service");
const { getLiveContextStatus } = require("../services/weather_service");

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

module.exports = router;

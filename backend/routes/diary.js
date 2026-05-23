const express = require("express");
const { generateDiary } = require("../services/agent_service");
const { fallbackDiary, normalizeDiaryResponse } = require("../utils/fallback");

const router = express.Router();

router.post("/generate-diary", (req, res) => {
  try {
    res.json(normalizeDiaryResponse(generateDiary(req.body || {})));
  } catch (error) {
    res.json(normalizeDiaryResponse(fallbackDiary()));
  }
});

module.exports = router;

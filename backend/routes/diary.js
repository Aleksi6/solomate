const express = require("express");
const { generateDiary } = require("../services/agent_service");
const { fallbackDiary, normalizeDiaryResponse } = require("../utils/fallback");

const router = express.Router();

router.post("/generate-diary", async (req, res) => {
  try {
    const response = await generateDiary(req.body || {});
    res.json(normalizeDiaryResponse(response));
  } catch (error) {
    res.json(normalizeDiaryResponse(fallbackDiary()));
  }
});

module.exports = router;

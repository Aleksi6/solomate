const express = require("express");
const { generateDiaryResponse } = require("../services/diary_service");
const { fallbackDiary, normalizeDiaryResponse } = require("../utils/fallback");

const router = express.Router();

router.post("/generate-diary", async (req, res) => {
  try {
    const response = await generateDiaryResponse(req.body || {});
    res.json(normalizeDiaryResponse(response.data));
  } catch (error) {
    console.log("[DIARY] llm_used=false");
    console.log("[DIARY] fallback reason: route_exception");
    res.json(normalizeDiaryResponse(fallbackDiary()));
  }
});

module.exports = router;

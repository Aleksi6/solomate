const express = require("express");
const multer = require("multer");
const { analyzePhoto } = require("../services/vision_service");
const { fallbackPhotoAnalysis, normalizePhotoAnalysisResponse } = require("../utils/fallback");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze-photo", upload.single("image"), async (req, res) => {
  try {
    const response = await analyzePhoto({
      ...(req.body || {}),
      file: req.file || null
    });

    res.json(normalizePhotoAnalysisResponse(response));
  } catch (error) {
    res.json(normalizePhotoAnalysisResponse(fallbackPhotoAnalysis()));
  }
});

module.exports = router;

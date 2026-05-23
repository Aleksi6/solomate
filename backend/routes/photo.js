const express = require("express");
const multer = require("multer");
const { analyzePhotoMock } = require("../services/vision_service");
const { fallbackPhotoAnalysis, normalizePhotoAnalysisResponse } = require("../utils/fallback");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze-photo", upload.single("image"), async (req, res) => {
  try {
    const response = await analyzePhotoMock({
      ...(req.body || {}),
      has_image: Boolean(req.file),
      image_meta: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
          }
        : null
    });

    res.json(normalizePhotoAnalysisResponse(response));
  } catch (error) {
    res.json(normalizePhotoAnalysisResponse(fallbackPhotoAnalysis()));
  }
});

module.exports = router;

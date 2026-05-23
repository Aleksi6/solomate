const express = require("express");
const { generateChatResponse } = require("../services/agent_service");
const { normalizeChatResponse } = require("../utils/fallback");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const response = await generateChatResponse(req.body || {});
    res.json(normalizeChatResponse(response));
  } catch (error) {
    res.json(normalizeChatResponse());
  }
});

module.exports = router;

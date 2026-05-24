const express = require("express");
const { generateChatResponse, generateProactiveCare } = require("../services/agent_service");
const { normalizeChatResponse } = require("../utils/fallback");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const response = await generateChatResponse({
      conversation_id: payload.conversation_id || "",
      user_text: payload.user_text || "",
      persona_id: payload.persona_id || "gentle_friend",
      mode: payload.mode || "chat",
      location: payload.location && typeof payload.location === "object" ? payload.location : {},
      context: payload.context && typeof payload.context === "object" ? payload.context : {},
      live_context: payload.live_context && typeof payload.live_context === "object" ? payload.live_context : {},
      conversation_state: payload.conversation_state && typeof payload.conversation_state === "object" ? payload.conversation_state : {},
      nearby_places: Array.isArray(payload.nearby_places) ? payload.nearby_places : [],
      history: Array.isArray(payload.history) ? payload.history : [],
    });
    res.json(normalizeChatResponse(response));
  } catch (error) {
    res.json(normalizeChatResponse());
  }
});

router.post("/proactive-care", async (req, res) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const response = await generateProactiveCare({
      conversation_id: payload.conversation_id || "",
      persona_id: payload.persona_id || "gentle_friend",
      location: payload.location && typeof payload.location === "object" ? payload.location : {},
      live_context: payload.live_context && typeof payload.live_context === "object" ? payload.live_context : {},
      conversation_state: payload.conversation_state && typeof payload.conversation_state === "object" ? payload.conversation_state : {},
      history: Array.isArray(payload.history) ? payload.history : []
    });
    res.json(response);
  } catch (error) {
    res.json({
      should_send: false,
      message: "",
      reason: "fallback_error",
      cooldown_seconds: 180
    });
  }
});

module.exports = router;

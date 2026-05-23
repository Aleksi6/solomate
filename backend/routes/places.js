const express = require("express");
const { getMockPlaces } = require("../services/agent_service");
const { completeTask } = require("../services/task_service");
const { normalizeTaskResponse } = require("../utils/fallback");

const router = express.Router();

router.get("/mock-places", (req, res) => {
  const places = getMockPlaces();
  res.json(Array.isArray(places) ? places : []);
});

router.post("/complete-task", (req, res) => {
  try {
    const body = req.body || {};
    const passed = body.passed === undefined ? true : body.passed;
    res.json(normalizeTaskResponse(completeTask(body.task_id, passed)));
  } catch (error) {
    res.json(normalizeTaskResponse({
      completed_tasks: ["firework_photo_task"],
      badges: ["城市烟火徽章"]
    }));
  }
});

module.exports = router;

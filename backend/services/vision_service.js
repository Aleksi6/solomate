const { fallbackPhotoAnalysis, normalizePhotoAnalysisResponse } = require("../utils/fallback");
const { getTask } = require("./task_service");

async function analyzePhotoMock(input = {}) {
  const task = getTask(input.task_id || "firework_photo_task");
  return normalizePhotoAnalysisResponse(fallbackPhotoAnalysis(task));
}

module.exports = {
  analyzePhotoMock
};

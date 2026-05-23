const { readJsonConfig, findById } = require("../utils/json_loader");
const { normalizeTaskResponse } = require("../utils/fallback");

const completedTasks = new Set();
const unlockedBadges = new Set();

const DEFAULT_TASK = {
  id: "firework_photo_task",
  title: "烟火气打卡",
  reward_badge: "城市烟火徽章"
};

function getTasks() {
  const tasks = readJsonConfig("tasks.json", []);
  return Array.isArray(tasks) ? tasks : [];
}

function getTask(taskId) {
  return findById(getTasks(), taskId, DEFAULT_TASK.id) || DEFAULT_TASK;
}

function completeTask(taskId, passed) {
  const task = getTask(taskId || DEFAULT_TASK.id);
  const shouldComplete = passed === undefined ? true : passed === true || passed === "true";

  if (shouldComplete) {
    completedTasks.add(task.id || DEFAULT_TASK.id);
    unlockedBadges.add(task.reward_badge || DEFAULT_TASK.reward_badge);
  }

  return normalizeTaskResponse({
    completed_tasks: Array.from(completedTasks),
    badges: Array.from(unlockedBadges)
  });
}

module.exports = {
  getTasks,
  getTask,
  completeTask
};

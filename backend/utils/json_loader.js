const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.resolve(__dirname, "..", "..", "config");

function readJsonConfig(fileName, fallbackValue) {
  try {
    const filePath = path.join(CONFIG_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) {
      return fallbackValue;
    }

    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

function findById(items, id, fallbackId) {
  if (!Array.isArray(items)) {
    return null;
  }

  return (
    items.find((item) => item && item.id === id) ||
    items.find((item) => item && item.id === fallbackId) ||
    items[0] ||
    null
  );
}

module.exports = {
  readJsonConfig,
  findById
};

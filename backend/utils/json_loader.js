const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.resolve(__dirname, "..", "..", "config");
const BACKEND_DIR = path.resolve(__dirname, "..");

let envLoaded = false;

function loadEnvFile() {
  if (envLoaded) {
    return;
  }

  envLoaded = true;

  const envPath = path.join(BACKEND_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(envPath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    envLoaded = true;
  }
}

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

function readPromptFile(fileName, fallbackValue = "") {
  try {
    const filePath = path.join(BACKEND_DIR, "prompts", fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() || fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function getEnvConfig() {
  loadEnvFile();

  const timeoutValue = Number(process.env.LLM_TIMEOUT_MS || "8000");

  return {
    provider: process.env.LLM_PROVIDER || "openai_compatible",
    apiKey: process.env.LLM_API_KEY || "",
    baseUrl: process.env.LLM_BASE_URL || "",
    model: process.env.LLM_MODEL || "",
    timeoutMs: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 8000,
    enable: String(process.env.LLM_ENABLE || "false").toLowerCase() === "true"
  };
}

module.exports = {
  readJsonConfig,
  findById,
  readPromptFile,
  loadEnvFile,
  getEnvConfig
};

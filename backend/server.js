const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chat");
const photoRoutes = require("./routes/photo");
const diaryRoutes = require("./routes/diary");
const placesRoutes = require("./routes/places");
const statusRoutes = require("./routes/status");
const { fallbackForPath } = require("./utils/fallback");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SoloMate mock backend",
    mode: "mock-fallback",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", chatRoutes);
app.use("/api", photoRoutes);
app.use("/api", diaryRoutes);
app.use("/api", placesRoutes);
app.use("/api", statusRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "not_found",
    message: "SoloMate backend did not find this API path."
  });
});

app.use((err, req, res, next) => {
  console.error("[SoloMate backend error]", err);
  res.status(200).json(fallbackForPath(req.path || req.originalUrl || ""));
});

app.listen(PORT, () => {
  console.log(`SoloMate backend is running at http://localhost:${PORT}`);
});

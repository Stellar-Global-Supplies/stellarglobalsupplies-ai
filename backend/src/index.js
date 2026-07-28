import "newrelic";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./lib/db.js";

import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import fileRoutes from "./routes/files.js";
import imageRoutes from "./routes/image.js";
import searchRoutes from "./routes/search.js";
import entRoutes from "./routes/ent.js";
import modelsRoutes from "./routes/models.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (Render, Cloudflare, etc.) for correct IP detection
app.set("trust proxy", 1);

// Security
app.use(helmet({ contentSecurityPolicy: false }));
// Render's fromService returns just the hostname (e.g. "gemini-clone-ui") without protocol or domain.
// Default to localhost for dev, and accept all onrender.com subdomains for production.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "https://ai.stellarglobalsupplies.com",  // Custom domain
  "https://www.ai.stellarglobalsupplies.com",  // WWW variant
];

// Add Render domain if FRONTEND_URL is set
if (FRONTEND_URL.includes("onrender.com")) {
  allowedOrigins.push(FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".onrender.com")) {
      return callback(null, true);
    }
    console.log(`❌ CORS blocked origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use("/api/", limiter);

// Serve frontend static files with error handling
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Docker copies frontend build to /app/public, but server is in /app/src/
// So we need to go up one level from src to find public
const publicPath = path.join(__dirname, "..", "public");

console.log("📁 Serving static files from:", publicPath);

app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    console.log("📄 Serving file:", filePath);
  }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ent", entRoutes);
app.use("/api/models", modelsRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// SPA fallback — serve index.html for all non-API, non-static routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  // Don't serve index.html for asset requests - let them 404 properly
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$/)) {
    console.log("⚠️  Asset not found:", req.path);
    return res.status(404).json({ error: "Asset not found" });
  }
  console.log("📄 Serving SPA:", req.path);
  res.sendFile("public/index.html", { root: "." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Init DB then start
initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}).catch((err) => {
  console.error("DB init failed", err);
  process.exit(1);
});

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

// Security
app.use(helmet({ contentSecurityPolicy: false }));
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOrigin = frontendUrl.startsWith("http") ? frontendUrl : `https://${frontendUrl}`;
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ent", entRoutes);
app.use("/api/models", modelsRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Init DB then start
initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
}).catch((err) => {
  console.error("DB init failed", err);
  process.exit(1);
});

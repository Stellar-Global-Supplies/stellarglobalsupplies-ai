import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { tavily } from "@tavily/core";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    const tvly = tavily({ apiKey: process.env.BRAVE_API_KEY });
    const response = await tvly.search(q, { maxResults: 5 });

    const results = (response.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.content,
    }));

    // Format as context string for LLM
    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`)
      .join("\n\n");

    res.json({ results, context });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

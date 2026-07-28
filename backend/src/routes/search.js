import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5&text_decorations=false`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_API_KEY,
        },
      }
    );

    if (!response.ok) throw new Error(`Brave API ${response.status}`);

    const data = await response.json();
    const results = (data.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
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

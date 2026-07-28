import { Router } from "express";
import Groq from "groq-sdk";
import { pool } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const IMAGE_TRIGGER_REGEX =
  /\b(generate|create|draw|make|produce|render|show me)\s+(an?\s+)?(image|picture|photo|illustration|artwork|painting|drawing)\b/i;

// ── Conversations ─────────────────────────────────────────────
router.get("/conversations", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id,title,created_at,updated_at FROM conversations WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50",
    [req.user.id]
  );
  res.json(rows);
});

router.post("/conversations", requireAuth, async (req, res) => {
  const { title = "New Chat" } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO conversations(user_id,title) VALUES($1,$2) RETURNING *",
    [req.user.id, title]
  );
  res.json(rows[0]);
});

router.delete("/conversations/:id", requireAuth, async (req, res) => {
  await pool.query(
    "DELETE FROM conversations WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

// ── Messages ─────────────────────────────────────────────────
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const { rows: [conv] } = await pool.query(
    "SELECT id FROM conversations WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  if (!conv) return res.status(404).json({ error: "Not found" });

  const { rows } = await pool.query(
    "SELECT id,role,content,metadata,created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
    [req.params.id]
  );
  res.json(rows);
});

// ── Send message (streaming SSE) ─────────────────────────────
router.post("/conversations/:id/send", requireAuth, async (req, res) => {
  const {
    content,
    model = "llama-3.3-70b-versatile",
    fileContext,
    webContext,
    entContext,
    systemPrompt,
  } = req.body;

  // Verify conversation ownership
  const { rows: [conv] } = await pool.query(
    "SELECT id,title FROM conversations WHERE id=$1 AND user_id=$2",
    [req.params.id, req.user.id]
  );
  if (!conv) return res.status(404).json({ error: "Not found" });

  // Check if should generate image
  const shouldImage = IMAGE_TRIGGER_REGEX.test(content);
  if (shouldImage) {
    // Signal frontend to switch to image generation
    await pool.query(
      "INSERT INTO messages(conversation_id,role,content,metadata) VALUES($1,$2,$3,$4)",
      [conv.id, "user", content, JSON.stringify({ type: "text" })]
    );
    return res.json({ action: "generate_image", prompt: content });
  }

  // Save user message
  await pool.query(
    "INSERT INTO messages(conversation_id,role,content,metadata) VALUES($1,$2,$3,$4)",
    [conv.id, "user", content, JSON.stringify({ fileContext: !!fileContext })]
  );

  // Build system prompt
  const parts = [
    systemPrompt ||
      "You are a helpful AI assistant. Be concise, accurate, and thoughtful.",
  ];
  if (webContext) parts.push(`\n\n[WEB SEARCH RESULTS]\n${webContext}`);
  if (entContext) parts.push(`\n\n[ENTERPRISE DATA]\n${entContext}`);
  if (fileContext) parts.push(`\n\n[UPLOADED FILE CONTENT]\n${fileContext}`);

  // Get recent history
  const { rows: history } = await pool.query(
    "SELECT role,content FROM messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 20",
    [conv.id]
  );
  const messages = [
    ...history.reverse().slice(0, -1), // exclude the message we just inserted
    { role: "user", content },
  ];

  // Stream SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullContent = "";
  try {
    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: parts.join("") },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Save assistant message
    await pool.query(
      "INSERT INTO messages(conversation_id,role,content,metadata) VALUES($1,$2,$3,$4)",
      [conv.id, "assistant", fullContent, JSON.stringify({ model })]
    );

    // Auto-title conversation on first real exchange
    if (conv.title === "New Chat") {
      const title = content.slice(0, 60).replace(/\n/g, " ");
      await pool.query(
        "UPDATE conversations SET title=$1, updated_at=NOW() WHERE id=$2",
        [title, conv.id]
      );
    } else {
      await pool.query("UPDATE conversations SET updated_at=NOW() WHERE id=$1", [conv.id]);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error("Groq stream error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;

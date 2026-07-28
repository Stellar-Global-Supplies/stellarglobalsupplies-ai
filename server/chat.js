import { Router } from 'express';
import { authMiddleware } from './auth.js';
import { query } from './db.js';
import { parseFile } from './fileParser.js';

export const chatRouter = Router();

chatRouter.use(authMiddleware);

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
  { id: 'llama3-70b-8192', label: 'Llama 3 70B 8192' },
  { id: 'llama3-8b-8192', label: 'Llama 3 8B 8192' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  { id: 'gemma2-9b-it-precision', label: 'Gemma 2 9B Precision' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
];

// List available models
chatRouter.get('/models', (req, res) => {
  res.json(GROQ_MODELS);
});

// Non-streaming chat completion (used internally)
async function groqChat(model, messages, options = {}) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Groq error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

// Streaming chat endpoint
chatRouter.post('/stream', async (req, res) => {
  try {
    const { conversationId, model, messages, useWeb, useEntData, attachments } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const selectedModel = model || 'llama-3.3-70b-versatile';
    let contextMessages = [...messages];

    // Build system prompt with tool context
    const systemParts = ['You are a helpful AI assistant. Answer clearly and concisely. Use markdown for formatting.'];

    // Attach file contents to the latest user message
    if (attachments && attachments.length > 0) {
      const fileTexts = await Promise.all(
        attachments.map(async (att) => {
          if (att.content) return `\n\n[Attached file: ${att.name}]\n${att.content}`;
          return '';
        })
      );
      const fileContext = fileTexts.filter(Boolean).join('\n\n');
      if (fileContext) {
        const lastUserIdx = [...contextMessages].reverse().findIndex((m) => m.role === 'user');
        if (lastUserIdx !== -1) {
          const actualIdx = contextMessages.length - 1 - lastUserIdx;
          contextMessages[actualIdx] = {
            ...contextMessages[actualIdx],
            content: contextMessages[actualIdx].content + fileContext,
          };
        }
      }
    }

    // Web search context
    if (useWeb) {
      const lastUserMsg = [...contextMessages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        const searchResults = await braveSearch(lastUserMsg.content);
        if (searchResults) {
          systemParts.push(`\n\nWeb search results (use these to inform your answer, cite sources):\n${searchResults}`);
        }
      }
    }

    // Enterprise data context
    if (useEntData) {
      const lastUserMsg = [...contextMessages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        const entData = await queryEntData(lastUserMsg.content);
        if (entData) {
          systemParts.push(`\n\nEnterprise data (from connected database views):\n${entData}`);
        }
      }
    }

    contextMessages = [{ role: 'system', content: systemParts.join('\n') }, ...contextMessages];

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
    }

    // Stream from Groq
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: contextMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Groq error: ${text}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch {
          // ignore parse errors for keepalive lines
        }
      }
    }

    // Persist messages if conversationId provided
    if (conversationId) {
      try {
        const lastUser = [...messages].reverse().find((m) => m.role === 'user');
        if (lastUser) {
          await query(
            `INSERT INTO messages (conversation_id, role, content, attachments, model)
             VALUES ($1, 'user', $2, $3, $4)`,
            [conversationId, lastUser.content, JSON.stringify(attachments || []), selectedModel]
          );
        }
        await query(
          `INSERT INTO messages (conversation_id, role, content, model)
           VALUES ($1, 'assistant', $2, $3)`,
          [conversationId, fullContent, selectedModel]
        );
        await query('UPDATE conversations SET updated_at = now() WHERE id = $1', [conversationId]);
      } catch (persistErr) {
        console.error('[chat] persist error:', persistErr);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[chat] stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed: ' + err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// Brave web search
async function braveSearch(queryText) {
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
  if (!BRAVE_API_KEY) return null;
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(queryText)}&count=5`;
    const resp = await fetch(url, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const results = (data.web?.results || []).slice(0, 5).map((r, i) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description || ''}`
    ).join('\n\n');
    return results || null;
  } catch (err) {
    console.error('[chat] brave search error:', err);
    return null;
  }
}

// Query enterprise data views in Neon
async function queryEntData(queryText) {
  try {
    // List available views
    const { rows: views } = await query(`
      SELECT table_name FROM information_schema.views
      WHERE table_schema = 'public' AND table_name NOT IN ('conversations', 'messages', 'users')
      ORDER BY table_name
    `);
    if (views.length === 0) return null;

    // For each view, fetch a sample of rows
    const chunks = [];
    for (const v of views.slice(0, 5)) {
      try {
        const { rows: sampleRows } = await query(`SELECT * FROM "${v.table_name}" LIMIT 20`);
        if (sampleRows.length > 0) {
          const cols = Object.keys(sampleRows[0]);
          const header = cols.join(' | ');
          const body = sampleRows.map((r) => cols.map((c) => String(r[c] ?? '')).join(' | ')).join('\n');
          chunks.push(`### View: ${v.table_name}\n${header}\n${body}`);
        }
      } catch (e) {
        // skip views we can't read
      }
    }
    return chunks.length > 0 ? chunks.join('\n\n') : null;
  } catch (err) {
    console.error('[chat] ent data error:', err);
    return null;
  }
}

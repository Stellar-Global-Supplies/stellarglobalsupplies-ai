import { Router } from 'express';
import { authMiddleware } from './auth.js';
import { query } from './db.js';

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware);

// List conversations
conversationsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, title, model, created_at, updated_at FROM conversations
       WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[conv] list error:', err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// Create conversation
conversationsRouter.post('/', async (req, res) => {
  try {
    const { title, model } = req.body;
    const { rows } = await query(
      `INSERT INTO conversations (user_id, title, model) VALUES ($1, $2, $3)
       RETURNING id, title, model, created_at, updated_at`,
      [req.userId, title || 'New chat', model || 'llama-3.3-70b-versatile']
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[conv] create error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversation with messages
conversationsRouter.get('/:id', async (req, res) => {
  try {
    const { rows: convRows } = await query(
      'SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (convRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const { rows: msgRows } = await query(
      'SELECT id, role, content, attachments, model, image_url, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ ...convRows[0], messages: msgRows });
  } catch (err) {
    console.error('[conv] get error:', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Update conversation
conversationsRouter.patch('/:id', async (req, res) => {
  try {
    const { title, model } = req.body;
    const sets = [];
    const vals = [];
    let idx = 2;
    if (title !== undefined) { sets.push(`title = $${idx}`); vals.push(title); idx++; }
    if (model !== undefined) { sets.push(`model = $${idx}`); vals.push(model); idx++; }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    sets.push('updated_at = now()');
    const { rows } = await query(
      `UPDATE conversations SET ${sets.join(', ')} WHERE id = $1 AND user_id = $${idx} RETURNING id, title, model, created_at, updated_at`,
      [req.params.id, ...vals, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[conv] update error:', err);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation
conversationsRouter.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[conv] delete error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Add message
conversationsRouter.post('/:id/messages', async (req, res) => {
  try {
    const { role, content, attachments, model, image_url } = req.body;
    if (!role || !content) return res.status(400).json({ error: 'role and content required' });
    const { rows } = await query(
      `INSERT INTO messages (conversation_id, role, content, attachments, model, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role, content, attachments, model, image_url, created_at`,
      [req.params.id, role, content, JSON.stringify(attachments || []), model || null, image_url || null]
    );
    await query('UPDATE conversations SET updated_at = now() WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[conv] add message error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

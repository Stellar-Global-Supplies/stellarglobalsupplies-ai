import { Router } from 'express';
import { authMiddleware } from './auth.js';
import { query } from './db.js';

export const entDataRouter = Router();

entDataRouter.use(authMiddleware);

// List available views
entDataRouter.get('/views', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT table_name as name FROM information_schema.views
      WHERE table_schema = 'public' AND table_name NOT IN ('conversations', 'messages', 'users')
      ORDER BY table_name
    `);
    res.json(rows);
  } catch (err) {
    console.error('[entdata] list views error:', err);
    res.status(500).json({ error: 'Failed to list views' });
  }
});

// Preview a view
entDataRouter.get('/views/:name', async (req, res) => {
  try {
    const viewName = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    const { rows } = await query(`SELECT * FROM "${viewName}" LIMIT 50`);
    res.json({ name: viewName, rows });
  } catch (err) {
    console.error('[entdata] preview error:', err);
    res.status(500).json({ error: 'Failed to query view' });
  }
});

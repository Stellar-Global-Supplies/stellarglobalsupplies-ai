import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from './auth.js';
import { parseFile } from './fileParser.js';

export const filesRouter = Router();

filesRouter.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

filesRouter.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const text = await parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    const truncated = text.length > 50000 ? text.slice(0, 50000) + '\n...[truncated]' : text;
    res.json({
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      content: truncated,
    });
  } catch (err) {
    console.error('[files] parse error:', err);
    res.status(500).json({ error: 'File parsing failed: ' + err.message });
  }
});

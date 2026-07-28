import { Router } from 'express';
import { authMiddleware } from './auth.js';

export const imageRouter = Router();

imageRouter.use(authMiddleware);

export const IMAGE_MODELS = [
  { id: 'stabilityai/stable-diffusion-3.5-large', label: 'Stable Diffusion 3.5 Large' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', label: 'Stable Diffusion XL' },
  { id: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1 Schnell' },
  { id: 'black-forest-labs/FLUX.1-dev', label: 'FLUX.1 Dev' },
];

imageRouter.get('/models', (req, res) => {
  res.json(IMAGE_MODELS);
});

imageRouter.post('/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const selectedModel = model || 'black-forest-labs/FLUX.1-schnell';
    const HF_TOKEN = process.env.HF_TOKEN || '';

    const resp = await fetch(`https://api-inference.huggingface.co/models/${selectedModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 503) {
        return res.status(503).json({ error: 'Model is loading, please retry in a few seconds' });
      }
      return res.status(resp.status).json({ error: `Image generation failed: ${text}` });
    }

    const imageBuffer = Buffer.from(await resp.arrayBuffer());
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    res.json({ image: dataUrl, model: selectedModel });
  } catch (err) {
    console.error('[image] generate error:', err);
    res.status(500).json({ error: 'Image generation failed: ' + err.message });
  }
});

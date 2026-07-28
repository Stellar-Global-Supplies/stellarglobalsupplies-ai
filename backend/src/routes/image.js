import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Map model IDs to their Gradio HuggingFace Space endpoints
const MODEL_ENDPOINTS = {
  "stabilityai/stable-diffusion-3.5-large": {
    url: "https://stabilityai-stable-diffusion-3-5-large.hf.space",
    fn_index: 0,
  },
  "black-forest-labs/FLUX.1-schnell": {
    url: "https://black-forest-labs-flux-1-schnell.hf.space",
    fn_index: 0,
  },
  "stabilityai/stable-diffusion-xl-base-1.0": {
    url: "https://stabilityai-stable-diffusion-xl.hf.space",
    fn_index: 0,
  },
};

router.post("/generate", requireAuth, async (req, res) => {
  const {
    prompt,
    model = "black-forest-labs/FLUX.1-schnell",
    negative_prompt = "",
    width = 1024,
    height = 1024,
    steps = 4,
    guidance = 3.5,
  } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const endpoint = MODEL_ENDPOINTS[model] || MODEL_ENDPOINTS["black-forest-labs/FLUX.1-schnell"];

  try {
    // Gradio API v0 — predict endpoint
    const predictRes = await fetch(`${endpoint.url}/run/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fn_index: endpoint.fn_index,
        data: [prompt, negative_prompt, guidance, steps, 42],
      }),
    });

    if (!predictRes.ok) {
      const text = await predictRes.text();
      throw new Error(`Gradio error ${predictRes.status}: ${text.slice(0, 200)}`);
    }

    const result = await predictRes.json();
    // Gradio returns base64 data or a URL path
    const imageData = result.data?.[0];

    if (!imageData) throw new Error("No image returned from Gradio");

    // imageData could be { name, data, is_file } or a base64 string
    if (typeof imageData === "string" && imageData.startsWith("data:")) {
      return res.json({ image: imageData, type: "base64" });
    }
    if (imageData?.data) {
      return res.json({ image: `data:image/png;base64,${imageData.data}`, type: "base64" });
    }
    if (imageData?.name) {
      const fileUrl = `${endpoint.url}/file=${imageData.name}`;
      return res.json({ image: fileUrl, type: "url" });
    }

    throw new Error("Unexpected image response format");
  } catch (err) {
    console.error("Image gen error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Curated Groq models with display names
const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile",    name: "Llama 3.3 70B",        context: "128k", speed: "fast"   },
  { id: "llama-3.1-8b-instant",       name: "Llama 3.1 8B Instant", context: "128k", speed: "faster" },
  { id: "mixtral-8x7b-32768",         name: "Mixtral 8×7B",         context: "32k",  speed: "fast"   },
  { id: "gemma2-9b-it",               name: "Gemma 2 9B",           context: "8k",   speed: "fast"   },
  { id: "llama-3.3-70b-specdec",      name: "Llama 3.3 70B SpecDec",context: "8k",   speed: "fastest"},
];

// Image generation models (Gradio spaces)
const IMAGE_MODELS = [
  { id: "stabilityai/stable-diffusion-3.5-large",    name: "SD 3.5 Large"   },
  { id: "black-forest-labs/FLUX.1-schnell",          name: "FLUX.1 Schnell" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0",  name: "SDXL Base"      },
];

router.get("/", requireAuth, (_req, res) => {
  res.json({ llm: GROQ_MODELS, image: IMAGE_MODELS });
});

export default router;

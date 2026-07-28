# Stellar AI — Full Stack AI Chat App
### Powered by Stellar Global Supplies · Gemini-style interface

## Architecture

```
gemini-clone/
├── frontend/          # React + Vite (Gemini-style UI)
├── backend/           # Node.js + Express API
├── infra/             # Terraform + Docker
└── .github/workflows/ # CI/CD to Render via Docker
```

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express |
| Auth | Neon Auth (JWT, login-only) |
| Database | Neon Postgres (chat history) |
| LLM | Groq API (model selector) |
| Image Gen | Gradio (free Stable Diffusion) |
| Web Search | Brave Search API |
| Ent Data | Read-only Postgres/REST toggle |
| File Parse | multer + xlsx/mammoth/csv-parse |
| Deploy | Render (Docker) |

## Environment Variables
See `.env.example` for all required keys.

## Local Development
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Docker Deploy (Render)
Push to main → GitHub Actions builds & deploys to Render.

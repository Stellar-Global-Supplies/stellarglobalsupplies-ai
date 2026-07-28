# Stellar AI

A Stellar AI assistant with Groq-powered chat, file attachments, web search, enterprise data access, and image generation — backed by a Neon Postgres database.

## Features

- **Login-only auth** — no sign-up page; users are created via a CLI script
- **Groq chat** — select from multiple Groq models, stream responses in real time
- **File attachments** — upload CSV, XLSX, DOCX, PDF, and text files; contents are parsed and fed into the conversation
- **Web search toggle** — uses Brave Search API to inject fresh web results into responses
- **Enterprise data toggle** — queries read-only views from your Neon database and includes the data in responses
- **Image generation** — generate images using free Hugging Face Inference API models (FLUX, Stable Diffusion)
- **Chat history** — all conversations and messages persist in Neon, scoped per user
- **Stellar AI UI** — clean gradient accents (blue/teal), dark/light theme

## Prerequisites

1. A [Neon](https://neon.tech) database project — get the connection string
2. A [Groq](https://groq.com) API key
3. A [Brave Search](https://brave.com/search/api/) API key (optional, for web search)
4. A [Hugging Face](https://huggingface.co) token (optional, for image generation; some models work without it)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEON_CONNECTION_STRING` | Yes | Neon Postgres connection string |
| `JWT_SECRET` | Yes | Secret for signing auth tokens (auto-generated on Render) |
| `GROQ_API_KEY` | Yes | Groq API key for chat |
| `BRAVE_API_KEY` | No | Brave Search API key for web search toggle |
| `HF_TOKEN` | No | Hugging Face token for image generation |
| `PORT` | No | Server port (defaults to 3001) |

## Local Development

```bash
npm install
```

Create a `.env` file in the project root:

```
NEON_CONNECTION_STRING=postgres://...
JWT_SECRET=your-secret
GROQ_API_KEY=gsk_...
BRAVE_API_KEY=...
HF_TOKEN=hf_...
```

Create a login user:

```bash
node server/scripts/create-user.js you@example.com yourpassword "Your Name"
```

Run the dev server (frontend + backend):

```bash
npm run dev        # frontend on :5173 (proxies /api to :3001)
npm run server     # backend on :3001 (in a separate terminal)
```

## Deploy to Render

### Option A: Using render.yaml (recommended)

1. Push this project to a GitHub repo
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect your GitHub repo
4. Render will detect `render.yaml` and create the service
5. Fill in the environment variables (`NEON_CONNECTION_STRING`, `GROQ_API_KEY`, etc.) when prompted

### Option B: Manual setup

1. Go to Render → New → Web Service
2. Connect your repo
3. Set:
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Health Check Path**: `/api/health`
4. Add all environment variables
5. Deploy

### After deployment

Create your first login user by running locally (with the same `NEON_CONNECTION_STRING`):

```bash
NEON_CONNECTION_STRING=your-neon-string node server/scripts/create-user.js ceo@company.com password123 "CEO"
```

## Enterprise Data Views

To expose enterprise data, create views in your Neon database's `public` schema. Any view that is NOT `conversations`, `messages`, or `users` will be automatically available when the "Ent data" toggle is on. The assistant samples up to 20 rows from each view and includes them as context.

Example:

```sql
CREATE VIEW sales_summary AS
  SELECT region, SUM(amount) as total, COUNT(*) as orders
  FROM sales GROUP BY region;
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, lucide-react
- **Backend**: Node.js, Express
- **Database**: Neon (serverless Postgres)
- **AI**: Groq API (chat), Hugging Face Inference API (images)
- **Search**: Brave Search API
- **Auth**: JWT + bcrypt
- **Deploy**: Docker on Render

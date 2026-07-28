# Stellar AI — Deployment Guide

## Overview

Two services deploy to Render via Docker:
- **stellar-ai-api** — Node.js backend on port 4000
- **stellar-ai-ui** — React frontend served by Nginx on port 80

```
GitHub → GitHub Actions → GHCR (Docker images) → Render
```

---

## Prerequisites

Make sure you have accounts and keys ready before starting:

| Service | What you need | Where to get it |
|---------|--------------|-----------------|
| GitHub | Repo access | github.com |
| Render | Free or Starter account | render.com |
| Neon | Postgres database | neon.tech |
| Groq | API key | console.groq.com |
| Brave Search | API key | api.search.brave.com |

---

## Step 1 — Set up Neon Database

1. Go to **neon.tech** → Create account → New project → name it `stellar-ai`
2. Choose region closest to you (US East recommended for Render Oregon)
3. Once created, click **Connection Details**
4. Copy the connection string — it looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this — you will use it as `DATABASE_URL`

> The schema (tables) is created automatically on first backend boot. Nothing to run manually.

---

## Step 2 — Get your API Keys

**Groq (LLM)**
1. Go to **console.groq.com** → Sign up → API Keys → Create API Key
2. Save as `GROQ_API_KEY` (starts with `gsk_`)

**Brave Search**
1. Go to **api.search.brave.com** → Sign up for free plan
2. Dashboard → Create Subscription → Copy API Key
3. Save as `BRAVE_API_KEY` (starts with `BSA`)

**Enterprise DB (optional)**
- If you have a read-only Postgres for internal data, save it as `ENT_DATABASE_URL`
- If not, leave blank — the toggle will show "not configured" gracefully

---

## Step 3 — Push code to GitHub

```bash
# Extract the archive
tar -xzf stellar-ai.tar.gz
cd stellar-ai

# Initialise git
git init
git add .
git commit -m "Initial commit — Stellar AI"

# Create a new repo on GitHub (github.com/new), then:
git remote add origin https://github.com/YOUR_ORG/stellar-ai.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these one by one:

| Secret name | Value |
|-------------|-------|
| `RENDER_API_KEY` | Get from Render → Account Settings → API Keys → Create API Key |
| `RENDER_BACKEND_SERVICE_ID` | You get this in Step 6 after first Render deploy |
| `RENDER_FRONTEND_SERVICE_ID` | You get this in Step 6 after first Render deploy |
| `VITE_API_URL` | `https://stellar-ai-api.onrender.com/api` (use your actual backend URL) |

> You can add `RENDER_BACKEND_SERVICE_ID` and `RENDER_FRONTEND_SERVICE_ID` after Step 6. The first deploy is triggered manually anyway.

---

## Step 5 — First deploy via Render Blueprint

This is the easiest path for the first deploy.

1. Go to **dashboard.render.com**
2. Click **New** → **Blueprint**
3. Connect your GitHub account if not already connected
4. Select your `stellar-ai` repo
5. Render will detect `render.yaml` automatically
6. Click **Apply**

Render will now create two services: `stellar-ai-api` and `stellar-ai-ui`

> The first build takes 3–5 minutes. You'll see build logs in real time.

---

## Step 6 — Set environment variables in Render

The blueprint creates the services but you need to add the secret env vars manually (they are marked `sync: false` in render.yaml for security).

**For stellar-ai-api (backend):**

1. Go to Render Dashboard → click **stellar-ai-api** → **Environment**
2. Add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string from Step 1 |
| `GROQ_API_KEY` | From Step 2 |
| `BRAVE_API_KEY` | From Step 2 |
| `ENT_DATABASE_URL` | Your read-only DB string, or leave blank |
| `ADMIN_KEY` | Any strong random string — e.g. `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://stellar-ai-ui.onrender.com` (your frontend URL) |

3. Click **Save Changes** — Render will redeploy automatically

**For stellar-ai-ui (frontend):**

1. Go to Render Dashboard → click **stellar-ai-ui** → **Environment**
2. Add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://stellar-ai-api.onrender.com/api` |

3. Click **Save Changes** — triggers a redeploy

---

## Step 7 — Get Render Service IDs

You need these for GitHub Actions to trigger deploys automatically.

1. In Render Dashboard → click **stellar-ai-api**
2. Look at the URL: `https://dashboard.render.com/web/srv-XXXXXXXXXX`
3. Copy `srv-XXXXXXXXXX` — that's your `RENDER_BACKEND_SERVICE_ID`
4. Do the same for **stellar-ai-ui** → copy its `srv-XXXXXXXXXX`

Now go back to GitHub → Settings → Secrets and add:
- `RENDER_BACKEND_SERVICE_ID` = `srv-XXXXXXXXXX` (backend)
- `RENDER_FRONTEND_SERVICE_ID` = `srv-XXXXXXXXXX` (frontend)

---

## Step 8 — Create the first user

There is no signup page by design. Users are created via a one-time admin API call.

```bash
curl -X POST https://stellar-ai-api.onrender.com/api/auth/admin/create-user \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@stellarglobalsupplies.com",
    "password": "ChooseAStrongPassword!",
    "display_name": "CEO"
  }'
```

Replace `YOUR_ADMIN_KEY` with the value you set in Step 6.

You can run this for each team member who needs access:

```bash
curl -X POST https://stellar-ai-api.onrender.com/api/auth/admin/create-user \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "ops@stellarglobalsupplies.com", "password": "Password123!", "display_name": "Ops Team"}'
```

---

## Step 9 — Verify the deployment

1. Open `https://stellar-ai-ui.onrender.com` in a browser
2. You should see the Stellar AI login page
3. Log in with the credentials you created in Step 8
4. Test a chat message
5. Test the **Web** toggle — asks a question and check it searches Brave
6. Upload a CSV or Excel file and ask a question about it
7. Ask "generate an image of stainless steel pipes" — image panel should open

**Health check:** `https://stellar-ai-api.onrender.com/health` should return `{"status":"ok"}`

---

## Step 10 — Ongoing deploys via GitHub Actions

From now on, every push to `main` automatically:

1. Builds both Docker images
2. Pushes them to GitHub Container Registry (GHCR)
3. Triggers a Render redeploy for both services

```bash
# Make a change, then:
git add .
git commit -m "your change"
git push origin main
# GitHub Actions takes it from here (~4 min build + deploy)
```

Monitor at: **github.com/YOUR_ORG/stellar-ai/actions**

---

## Terraform (optional — Infrastructure as Code)

If you want to manage Render services via Terraform instead of the dashboard:

```bash
cd infra

# Install Terraform (if not installed)
brew install terraform   # macOS
# or: https://developer.hashicorp.com/terraform/downloads

# Copy and fill in your values
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your keys

# Initialise and apply
terraform init
terraform plan
terraform apply
```

This creates both Render services with all env vars set. Useful if you want to version-control your infrastructure or recreate the whole stack from scratch.

---

## Troubleshooting

**Backend fails to start**
- Check Render logs → most likely `DATABASE_URL` is missing or wrong
- Verify your Neon connection string includes `?sslmode=require` at the end

**Login says "Invalid credentials"**
- Make sure you ran the create-user curl in Step 8
- Double-check `ADMIN_KEY` matches what you set in Render env vars

**Web search returns no results**
- Check `BRAVE_API_KEY` is set correctly in Render env vars
- Brave free tier allows 2,000 queries/month

**Image generation fails**
- Gradio free spaces can be slow or occasionally down
- Try a different image model from the dropdown (FLUX.1 Schnell is fastest)
- Free spaces sometimes sleep — the first request may time out, retry once

**Frontend shows blank page**
- Check `VITE_API_URL` in the frontend service env vars — must point to the backend URL
- Make sure it does NOT have a trailing slash

**Ent Data shows "not configured"**
- `ENT_DATABASE_URL` is not set — add it in Render backend env vars
- Must be a Postgres connection string with read-only credentials

**Render free tier sleeps after 15 min of inactivity**
- Upgrade to Starter ($7/month) for always-on
- Or use UptimeRobot (free) to ping `/health` every 10 min

---

## Environment Variable Reference

### Backend (stellar-ai-api)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `JWT_SECRET` | ✅ | Auto-generated by Render Blueprint |
| `JWT_EXPIRES_IN` | ✅ | Token lifetime, default `7d` |
| `GROQ_API_KEY` | ✅ | Groq LLM API key |
| `BRAVE_API_KEY` | ✅ | Brave Search API key |
| `ADMIN_KEY` | ✅ | Used to create users via curl |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `ENT_DATABASE_URL` | ❌ | Read-only enterprise Postgres |
| `PORT` | ❌ | Defaults to 4000 |

### Frontend (stellar-ai-ui)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL (no trailing slash) |

---

## URLs after deployment

| | URL |
|-|-----|
| App | `https://stellar-ai-ui.onrender.com` |
| API | `https://stellar-ai-api.onrender.com` |
| Health | `https://stellar-ai-api.onrender.com/health` |
| Actions | `https://github.com/YOUR_ORG/stellar-ai/actions` |
| Render Dashboard | `https://dashboard.render.com` |
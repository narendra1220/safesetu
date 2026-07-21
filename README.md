# SafeSetu

One-click security scanner for AI-built apps. Ship only when it's safe.

## What it does

SafeSetu scans your GitHub repositories for the security mistakes that AI coding tools (Cursor, Lovable, Bolt, v0, Replit) commonly introduce. Five targeted checks, a 0-100 score, and copy-paste fix prompts — no config, no false-positive fatigue.

### Security checks

| Rule | What it catches |
|---|---|
| **Exposed Secrets** | Hardcoded `service_role`, `sk_live`, AWS keys, PATs in client bundles |
| **Missing RLS** | Supabase tables with `USING(true)` or no row-level security |
| **Unauthenticated Routes** | API handlers that skip auth (BOLA/IDOR risk) |
| **Unverified Webhooks** | Payment/webhook handlers without signature verification |
| **Client-Writable Fields** | Client code writing to `role`, `subscription`, `admin` fields |

### Score verdicts

- **80-100** — Ship it
- **50-79** — Fix first
- **0-49** — Do not ship

## Tech stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** Auth.js v5 (GitHub OAuth + email magic link)
- **Database:** SQLite (local dev via Prisma + better-sqlite3)
- **Scan Engine:** FastAPI (Python), regex-based detection + local LLM enrichment (Ollama)

## Project structure

```
safesetu/
├── src/                    # Next.js app
│   ├── app/                # App Router pages and API routes
│   ├── components/         # Shared UI components
│   └── lib/                # Auth, DB, scanner client, utilities
├── scan-engine/            # FastAPI service
│   ├── scanner/            # Rule engine, LLM enricher, scorer
│   │   └── rules/          # Individual security rules (Python)
│   └── main.py             # FastAPI app entry
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

## Local development

### Prerequisites

- Node.js >= 20
- Python >= 3.11
- Ollama (optional, for LLM-enriched findings)

### Setup

```bash
# Install frontend dependencies
npm install

# Generate Prisma client and create DB
npx prisma generate
npx prisma db push

# Copy env and fill in GitHub OAuth credentials
cp .env.example .env

# Start the dev server
npx next dev
```

### Scan engine

```bash
cd scan-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the scan engine
uvicorn main:app --port 8000 --reload
```

### Docker

```bash
docker compose up --build
```

The web app runs on port 3000, scan engine on port 8000.

### Optional: LLM enrichment

```bash
# Install and start Ollama
ollama serve

# Pull a model
ollama pull qwen2.5:0.5b

# Set in scan-engine/.env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

With Ollama running, the scan engine validates findings, rewrites descriptions in plain English, and generates fix prompts with suggested diffs.

## Environment variables

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Auth.js secret (generate with `openssl rand -base64 33`) |
| `GITHUB_ID` | GitHub OAuth app client ID |
| `GITHUB_SECRET` | GitHub OAuth app client secret |
| `DATABASE_URL` | SQLite path (`file:./dev.db`) |
| `SCAN_ENGINE_URL` | FastAPI scan engine URL (`http://localhost:8000`) |

## License

MIT

# YouTube News Aggregator

Pulls the latest videos from a Malaysian YouTube news channel, translates the Chinese titles to English via Gemini, stores them in Supabase, and displays them on a React dashboard.

```
YouTube RSS feed
      │
      ▼
  job.py  ──► Gemini (translation) ──► Supabase (headlines table)
                                              │
                                              ▼
                                     React frontend (Vercel)
```

GitHub Actions runs `job.py` daily at midnight UTC. The frontend reads directly from Supabase.

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- A [Supabase](https://supabase.com) project with the `headlines` table created (see `supabase/migrations/`)
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

---

## Local setup

### 1. Clone and configure environment

```bash
git clone <your-repo-url>
cd news-aggregrator
```

Copy the env templates and fill in your keys:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

| File | Keys needed |
|------|-------------|
| `.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY` |
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

> `SUPABASE_URL` is the same in both files.  
> Use the **service_role** key in `.env` (backend) and the **anon** key in `frontend/.env` (browser).

### 2. Create the Supabase table

Run the migration SQL in your Supabase dashboard (SQL editor):

```
supabase/migrations/20260505000000_create_headlines.sql
```

### 3. Run the backend job

```bash
pip install -r requirements.txt
python job.py
```

This fetches the 5 latest videos, translates their titles, and upserts them into Supabase. You should see output like:

```
Inserted/updated: abc123 | 安华：... -> Anwar: ...
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deployment

### Frontend → Vercel (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Under **Root Directory**, set it to `frontend`.
4. Framework preset will auto-detect as **Vite**.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**.

Every push to `main` will trigger a re-deploy automatically.

### Backend job → GitHub Actions

The job runs daily via `.github/workflows/job.yml`. Add these secrets to your GitHub repo:

**Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your service_role key |
| `GEMINI_API_KEY` | Your Gemini API key |

You can also trigger it manually from the **Actions** tab → **Daily Translation Job** → **Run workflow**.

---

## Folder structure

```
├── job.py                          # Daily RSS + translation job
├── requirements.txt                # Python dependencies (pinned)
├── .env.example                    # Backend env template
├── .github/
│   └── workflows/job.yml           # GitHub Actions schedule
├── supabase/
│   └── migrations/                 # SQL to recreate the DB schema
└── frontend/
    ├── index.html                  # Vite entry point
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                 # Supabase query + layout
    │   └── components/
    │       └── HeadlineCard.tsx    # Single video card
    └── .env.example                # Frontend env template
```

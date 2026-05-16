# NewsLingo

> 中英双语时事 · Chinese & English bilingual news  
> **Live: [newslingo.chiawei.me](https://newslingo.chiawei.me/)**

Read Chinese news alongside English translations — follow current events while picking up natural English phrasing. Headlines from **联合早报 (Zaobao)** and **Astro 本地圈** are scraped every 3 hours, translated by Claude, and organised into International / Singapore / Malaysia tabs.

The translation pipeline self-improves: a quality-assessment step scores each batch, distils rules from mistakes, and feeds them back into the next translation run. **Top Stories** summarises the past 7 days into must-know topic clusters, updated daily.

<table>
  <tr>
    <td><img src="docs/screenshot-feed.jpeg" alt="News feed" width="200"/></td>
    <td><img src="docs/screenshot-about.jpeg" alt="About drawer" width="200"/></td>
    <td><img src="docs/screenshot-inside-ai.jpeg" alt="Inside AI drawer" width="200"/></td>
  </tr>
  <tr>
    <td align="center"><sub>News feed</sub></td>
    <td align="center"><sub>About</sub></td>
    <td align="center"><sub>Inside AI</sub></td>
  </tr>
</table>

---

## Features

| Feature | How to access |
|---|---|
| Bilingual headlines | Main feed — tap any card |
| Top Stories | ✦ icon in header — must-know topics, EN \| 中 toggle |
| Translation Quiz | Pencil icon — type an EN translation, scored by semantic similarity |
| Word definitions | Tap any English word in a headline |
| Read aloud | Speaker icon on each card |
| Search | Search icon in header — full-text across both titles |
| Share | Share icon on each card |
| Inside AI | ··· → Inside AI — distilled translation rules from past failures |
| Dark mode / font size | ··· → Preferences |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Chakra UI, Vite — deployed on Vercel |
| Translation scoring | Transformers.js (`all-MiniLM-L6-v2`) — in-browser semantic similarity for quiz |
| Backend | Python + `uv` |
| AI | Claude Sonnet 4.6 (translate, assess, distil, summarise) · Claude Haiku 4.5 (EN→ZH in Top Stories) |
| Database | Supabase (Postgres) |
| Observability | Langfuse Cloud — token counts, cost, latency, translation quality scores |
| Jobs | GitHub Actions — aggregation every 3h, Top Stories daily at 09:00 SGT |

---

## How it works

```mermaid
flowchart LR
    subgraph src["Sources"]
        ZB["🗞️ 联合早报\nSitemap"]
        YT["📺 Astro 本地圈\nYouTube API"]
    end

    subgraph agg["job.py · every 3 hours"]
        TR["Translate\nSonnet"]
        AS["Assess 1–5\nSonnet"]
        DR["Distil rules\nSonnet"]
        TR --> AS --> DR
    end

    DB[("Supabase")]

    subgraph daily["weekly_summary.py · daily 09:00 SGT"]
        P1["Generate topics\nSonnet"]
        P2["Fact-check\nSonnet"]
        P3["EN→ZH\nHaiku"]
        P1 --> P2 --> P3
    end

    FE["🌐 Frontend\nVercel"]

    ZB & YT --> TR
    DR --> DB
    AS --> DB
    DB --> P1
    P3 --> DB
    DB --> FE
```

**Aggregation (`job.py`):** scrapes Zaobao sitemaps and the Astro YouTube uploads playlist, translates headlines with Claude Sonnet, scores each translation 1–5 (quality gate, retry on failure), then distils the failures into rules that improve the next run.

**Top Stories (`weekly_summary.py`):** three-pass pipeline — Pass 1 generates 8–10 topic clusters, Pass 2 fact-checks every specific claim against source headlines and corrects tense, Pass 3 (Haiku) translates titles and summaries into Simplified Chinese. Pass 1 and 2 share a prompt-cached headlines block for lower cost.

---

## APIs & Services

| API | Purpose |
|---|---|
| [Anthropic Claude](https://anthropic.com) | Translation, assessment, distillation, Top Stories summary |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | Fetch Astro 本地圈 uploads |
| [Supabase](https://supabase.com) | Database + REST API |
| [Langfuse](https://langfuse.com) | LLM observability — cost, latency, translation quality scores |
| [ipapi.co](https://ipapi.co) | Visitor geolocation for analytics |
| [Free Dictionary API](https://dictionaryapi.dev) | Word definitions on tap |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Read-aloud (browser built-in) |
| [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) | In-browser quiz scoring (lazy-loaded) |

---

## Development

**Prerequisites:** Python 3.12+, Node 18+, `uv` ([install](https://docs.astral.sh/uv/))

Copy `.env.example` → `.env` and `frontend/.env.example` → `frontend/.env` and fill in your Supabase, Anthropic, YouTube, and Langfuse keys.

```bash
# Backend
uv sync
uv run job.py                # run one aggregation cycle
uv run weekly_summary.py     # run Top Stories summary
uv run pytest -v             # run tests

# Frontend
cd frontend
npm install
npm run dev
```

Tests cover: URL→category mapping, scraper output schema, Claude JSON parsing, architectural invariants (no-prefill, classify routing, sitemap regex, Shorts exclusion), Top Stories three-pass pipeline (Chinese quality, prompt caching structure, Haiku model for Pass 3), and translation assessment logic.

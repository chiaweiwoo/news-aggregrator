# NewsLingo

> 中英双语时事 · Chinese & English bilingual news

A personal learning tool that aggregates Chinese-language news from Malaysian and Singaporean media, translates headlines into English, and classifies them by category — so you can read news you already understand while picking up the proper English terminology used in journalism.

<img src="docs/screenshot.png" alt="NewsLingo mobile screenshot" width="320" />

---

## Features

- **Bilingual headlines** — Chinese original alongside English translation
- **Category tabs** — International, Malaysia, and Singapore feeds
- **Date-grouped feed** — chronological, latest first, grouped by date
- **Infinite scroll** — loads more as you scroll, no button needed
- **Mobile-first** — designed for phone reading
- **Auto-updated** — job runs every 3 hours SGT, fetches only new content since last run
- **Translation quality gate** — translations are assessed before being saved; bad ones are rejected

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React, TypeScript, Chakra UI, React Query, Vite |
| Backend | Python, Anthropic Claude Haiku (translate + classify + assess) |
| Database | Supabase (Postgres) |
| Sources | YouTube Data API v3, Zaobao sitemap scraper |
| Hosting | Vercel (frontend), GitHub Actions (scheduled job) |

---

## Architecture

```
 Astro 本地圈 (YouTube API)       联合早报 (Zaobao sitemap)
        │  new videos only                │  new articles only
        │  since last published_at        │  parallel fetch (10 workers)
        └──────────────┬──────────────────┘
                       ▼
                    job.py
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    translate (Haiku)       translate (Haiku)
    + classify              + classify
    MY/Intl                 SG/Intl
           └───────────┬───────────┘
                       ▼
               assess (Haiku)
               quality gate
                       │
                  pass / reject
                       │
                  Supabase
                (headlines table)
                       │
              React Frontend ──► Vercel
```

The job runs every 3 hours (SGT) via GitHub Actions. Each source is fetched incrementally — only articles published after the last stored entry are retrieved. Translations pass through a quality assessment step before being written to the database.

---

## Sources

| Channel | Country | Category |
|---------|---------|----------|
| Astro 本地圈 | Malaysia | Malaysia / International |
| 联合早报 | Singapore | Singapore / International |

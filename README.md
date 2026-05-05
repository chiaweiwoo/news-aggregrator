# NewsLingo

> 中英双语时事 · Chinese & English bilingual news

A personal learning tool that aggregates Chinese-language news from Malaysian media, translates headlines into Malaysian English, and classifies them by category — so you can read news you already understand while picking up the proper English terminology used in journalism.

<img src="docs/screenshot.png" alt="NewsLingo mobile screenshot" width="320" />

---

## Features

- **Bilingual headlines** — Chinese original alongside Malaysian English translation
- **Category tabs** — International and Malaysia news in separate feeds
- **Date-grouped feed** — chronological, latest first, grouped by date
- **Infinite scroll** — loads more as you scroll, no button needed
- **Mobile-first** — designed for phone reading
- **Auto-updated** — job runs every 6 hours, fetches only new videos since last run

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | React, TypeScript, Chakra UI, React Query, Vite |
| Backend | Python, Anthropic Claude Haiku (translate + classify) |
| Database | Supabase (Postgres) |
| Video source | YouTube Data API v3 |
| Hosting | Vercel (frontend), GitHub Actions (scheduled job) |

---

## Architecture

```
YouTube Data API
      │  (new videos only, via publishedAfter)
      ▼
   job.py
      │  (batch translate + classify)
      ▼
 Claude Haiku
      │  (title_en + category)
      ▼
  Supabase
      │  (headlines table)
      ▼
React Frontend  ──►  Vercel
```

The job runs every 6 hours via GitHub Actions. It queries the latest `published_at` in the database and passes it as `publishedAfter` to the YouTube API — only genuinely new videos are fetched each run. If nothing new is found, the Claude API call is skipped entirely.

---

*Source: Astro 本地圈 (Malaysia)*

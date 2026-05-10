# Archived Migrations

These scripts were one-time operations run during early development. They are kept
for historical reference only — **do not re-run them**.

| Script | Purpose | Applied |
|---|---|---|
| `migrate.py` | Added `source_url` column; renamed `job_runs` columns `videos_*` → `items_*`; backfilled YouTube source URLs | May 2026 |
| `migrate2.py` | Added `UNIQUE(source_url)` constraint to `headlines` | May 2026 |

The current canonical schema lives at `supabase/migrations/schema.sql`.

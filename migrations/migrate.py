"""
One-time DB migration helper.

Step 1 — run the DDL SQL below in Supabase SQL Editor (no password needed):
  Dashboard → SQL Editor → paste → Run

Step 2 — run this script to backfill source_url for existing YouTube rows:
  uv run python migrate.py
"""

import os
import sys
sys.stdout.reconfigure(encoding="utf-8")
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env", override=True)

SUPABASE_URL        = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    sys.exit(1)

DDL_SQL = """
-- ── PASTE THIS IN SUPABASE SQL EDITOR FIRST ──────────────────────────────────

-- 1. Add source_url column
ALTER TABLE headlines ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 2. Rename job_runs columns (videos_* → items_*)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_runs' AND column_name = 'videos_found'
    ) THEN
        ALTER TABLE job_runs RENAME COLUMN videos_found     TO items_found;
        ALTER TABLE job_runs RENAME COLUMN videos_processed TO items_processed;
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
"""

print(DDL_SQL)
input("Paste the SQL above into Supabase SQL Editor and run it. Press Enter when done...")

# ── Backfill source_url for existing YouTube rows ─────────────────────────────

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("\nFetching rows with missing source_url...")
result = (
    supabase.table("headlines")
    .select("id, channel")
    .is_("source_url", "null")
    .execute()
)
rows = result.data
print(f"Found {len(rows)} rows to backfill")

updated = 0
for row in rows:
    source_url = f"https://www.youtube.com/watch?v={row['id']}"
    supabase.table("headlines").update({"source_url": source_url}).eq("id", row["id"]).execute()
    updated += 1
    if updated % 50 == 0:
        print(f"  {updated}/{len(rows)} updated...")

print(f"\nBackfill complete — {updated} rows updated.")

# ── Verify ────────────────────────────────────────────────────────────────────
r1 = supabase.table("headlines").select("id", count="exact").not_.is_("source_url", "null").execute()
r2 = supabase.table("headlines").select("id", count="exact").is_("source_url", "null").execute()
print(f"headlines with source_url   : {r1.count}")
print(f"headlines without source_url: {r2.count}")

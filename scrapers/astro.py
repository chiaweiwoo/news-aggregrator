"""
Astro 本地圈 (YouTube) scraper.
Fetches videos from the channel incrementally since a given datetime.
Returns rows matching the headlines DB schema — title_en and category are
left None and filled by the caller (job.py).
"""

import re
import html
import json
import urllib.request
from datetime import datetime, timedelta, timezone

CHANNEL_ID = "UCURes72wqcEpid6EKNXWfxw"  # Astro 本地圈 (Malaysia)
CHANNEL    = "Astro 本地圈"
YOUTUBE_SEARCH_URL = (
    "https://www.googleapis.com/youtube/v3/search"
    "?part=snippet&channelId={channel_id}&maxResults=50"
    "&order=date&type=video&key={api_key}"
)
SOURCE_URL_PREFIX = "https://www.youtube.com/watch?v="
DEFAULT_LOOKBACK_HOURS = 120  # 5 days — ensures first repull after data reset has sufficient coverage


def scrape(since_dt: datetime | None, youtube_api_key: str) -> list[dict]:
    """
    Fetch YouTube videos published after since_dt.
    since_dt=None  → last DEFAULT_LOOKBACK_HOURS hours (first run).
    Returns list of rows; title_en and category are None (filled by job.py).
    """
    if since_dt is None:
        published_after = (
            datetime.now(timezone.utc) - timedelta(hours=DEFAULT_LOOKBACK_HOURS)
        ).strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        published_after = (since_dt + timedelta(seconds=1)).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

    items = _fetch_all_since(published_after, youtube_api_key)
    return [_item_to_row(item) for item in items]


# ── Internal ─────────────────────────────────────────────────────────────────

def _fetch_all_since(published_after: str, api_key: str) -> list:
    items = []
    next_page_token = None
    base_url = (
        YOUTUBE_SEARCH_URL.format(channel_id=CHANNEL_ID, api_key=api_key)
        + f"&publishedAfter={published_after}"
    )
    while True:
        url = base_url + (f"&pageToken={next_page_token}" if next_page_token else "")
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read())
        items.extend(data.get("items", []))
        next_page_token = data.get("nextPageToken")
        print(f"[astro] fetched {len(items)} videos so far...", flush=True)
        if not next_page_token:
            break
    return items


def _clean_title(raw: str) -> str:
    title = html.unescape(raw)
    title = re.sub(r"\s*\|.*$", "", title).strip()
    title = re.sub(r"\s*#\S+", "", title).strip()
    return title


def _item_to_row(item: dict) -> dict:
    video_id = item["id"]["videoId"]
    snippet = item["snippet"]
    return {
        "id":            video_id,
        "title_zh":      _clean_title(snippet["title"]),
        "title_en":      None,
        "thumbnail_url": snippet["thumbnails"]["high"]["url"],
        "published_at":  snippet["publishedAt"],
        "channel":       snippet["channelTitle"],
        "category":      None,
        "source_url":    SOURCE_URL_PREFIX + video_id,
    }

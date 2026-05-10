"""
Unit tests for scrapers/astro.py

Key invariants tested:
  1. YouTube API JSON is correctly converted to row schema.
  2. category is left None (filled by job.py LLM classification).
  3. title_en is left None (filled by job.py translation).
  4. Title cleaning strips channel suffix and hashtags.
  5. DEFAULT_LOOKBACK_HOURS >= 120 (5 days) for sufficient initial repull coverage.
"""

import pytest
from scrapers.astro import _item_to_row, _clean_title, DEFAULT_LOOKBACK_HOURS


def _make_youtube_item(
    video_id: str = "abc123xyz",
    title: str = "今日新闻 | Astro 本地圈",
    published_at: str = "2025-05-10T10:00:00Z",
    channel_title: str = "Astro 本地圈",
    thumbnail: str = "https://i.ytimg.com/vi/abc123xyz/hqdefault.jpg",
) -> dict:
    return {
        "id": {"videoId": video_id},
        "snippet": {
            "title": title,
            "publishedAt": published_at,
            "channelTitle": channel_title,
            "thumbnails": {"high": {"url": thumbnail}},
        },
    }


class TestItemToRow:
    def test_id_is_video_id(self):
        row = _item_to_row(_make_youtube_item(video_id="TESTVID01"))
        assert row["id"] == "TESTVID01"

    def test_source_url_contains_video_id(self):
        row = _item_to_row(_make_youtube_item(video_id="TESTVID01"))
        assert "TESTVID01" in row["source_url"]
        assert "youtube.com/watch" in row["source_url"]

    def test_category_is_none(self):
        # INVARIANT: Astro category is set by the LLM in job.py, never by the scraper
        row = _item_to_row(_make_youtube_item())
        assert row["category"] is None

    def test_title_en_is_none(self):
        # translation happens in job.py
        row = _item_to_row(_make_youtube_item())
        assert row["title_en"] is None

    def test_published_at_preserved(self):
        row = _item_to_row(_make_youtube_item(published_at="2025-01-15T08:30:00Z"))
        assert row["published_at"] == "2025-01-15T08:30:00Z"

    def test_thumbnail_url(self):
        row = _item_to_row(_make_youtube_item(thumbnail="https://example.com/thumb.jpg"))
        assert row["thumbnail_url"] == "https://example.com/thumb.jpg"

    def test_channel_name_from_snippet(self):
        row = _item_to_row(_make_youtube_item(channel_title="Astro 本地圈"))
        assert row["channel"] == "Astro 本地圈"


class TestCleanTitle:
    def test_strips_channel_suffix(self):
        assert _clean_title("今日新闻 | Astro 本地圈") == "今日新闻"

    def test_strips_hashtags(self):
        assert _clean_title("今日新闻 #新加坡 #马来西亚") == "今日新闻"

    def test_strips_both(self):
        assert _clean_title("头条 | 本地圈 #breaking") == "头条"

    def test_no_suffix_unchanged(self):
        assert _clean_title("首相宣布新政策") == "首相宣布新政策"

    def test_html_entities_decoded(self):
        # YouTube API encodes &amp; in titles
        assert "&amp;" not in _clean_title("AT&amp;T宣布裁员")
        assert "AT&T" in _clean_title("AT&amp;T宣布裁员")


class TestLookbackHours:
    def test_lookback_at_least_5_days(self):
        # First repull after data reset must cover enough history
        assert DEFAULT_LOOKBACK_HOURS >= 120, (
            f"DEFAULT_LOOKBACK_HOURS={DEFAULT_LOOKBACK_HOURS} is too short — "
            "must be at least 120 hours (5 days) for sufficient first-run coverage"
        )

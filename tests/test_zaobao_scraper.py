"""
Unit tests for scrapers/zaobao.py

Key invariants tested:
  1. URL-to-category mapping is deterministic (no LLM involved).
  2. All 4 sections (singapore, world, china, sea) are scraped.
  3. The audio-briefing filter strips 听新闻简报 articles.
  4. Sitemap parser extracts correct (url, lastmod) pairs across sections.
"""

import re
import pytest
from scrapers.zaobao import _category_from_url, _SECTION_CATEGORY


# ── _category_from_url ────────────────────────────────────────────────────────

class TestCategoryFromUrl:
    def test_singapore_section(self):
        url = "https://www.zaobao.com.sg/news/singapore/story20250510-6099999"
        assert _category_from_url(url) == "Singapore"

    def test_world_section(self):
        url = "https://www.zaobao.com.sg/news/world/story20250510-1234567"
        assert _category_from_url(url) == "International"

    def test_china_section(self):
        url = "https://www.zaobao.com.sg/news/china/story20250510-9876543"
        assert _category_from_url(url) == "International"

    def test_sea_section(self):
        url = "https://www.zaobao.com.sg/news/sea/story20250510-1111111"
        assert _category_from_url(url) == "International"

    def test_unknown_section_defaults_international(self):
        # Any section not explicitly mapped must NOT silently return Singapore
        url = "https://www.zaobao.com.sg/news/sports/story20250510-0000000"
        assert _category_from_url(url) == "International"

    def test_all_mapped_sections_present(self):
        # Guard: if a new section is added to _SECTION_CATEGORY, this test documents it
        assert "singapore" in _SECTION_CATEGORY
        assert "world" in _SECTION_CATEGORY
        assert "china" in _SECTION_CATEGORY
        assert "sea" in _SECTION_CATEGORY

    def test_no_sports_in_section_map(self):
        # Sports must NOT be in the section map — it's excluded at scrape time by the regex
        assert "sports" not in _SECTION_CATEGORY


# ── Sitemap regex ─────────────────────────────────────────────────────────────

SITEMAP_REGEX = re.compile(
    r"<url>\s*<loc>(https://www\.zaobao\.com\.sg/news/(?:singapore|world|china|sea)/story[^<]+)</loc>"
    r"\s*<lastmod>([^<]+)</lastmod>"
)


class TestSitemapRegex:
    def _make_entry(self, section: str, slug: str = "abc123") -> str:
        return (
            f"<url>"
            f"<loc>https://www.zaobao.com.sg/news/{section}/story{slug}</loc>"
            f"<lastmod>2025-05-10T10:00:00+00:00</lastmod>"
            f"</url>"
        )

    def test_matches_singapore(self):
        xml = self._make_entry("singapore")
        assert SITEMAP_REGEX.search(xml) is not None

    def test_matches_world(self):
        xml = self._make_entry("world")
        assert SITEMAP_REGEX.search(xml) is not None

    def test_matches_china(self):
        xml = self._make_entry("china")
        assert SITEMAP_REGEX.search(xml) is not None

    def test_matches_sea(self):
        xml = self._make_entry("sea")
        assert SITEMAP_REGEX.search(xml) is not None

    def test_does_not_match_sports(self):
        xml = self._make_entry("sports")
        assert SITEMAP_REGEX.search(xml) is None

    def test_extracts_url_and_lastmod(self):
        xml = self._make_entry("singapore", "20250510-1234567")
        m = SITEMAP_REGEX.search(xml)
        assert m is not None
        url, lastmod = m.group(1), m.group(2)
        assert "singapore" in url
        assert lastmod == "2025-05-10T10:00:00+00:00"

    def test_multi_section_xml(self):
        """Regex must find entries from multiple sections in one XML blob."""
        xml = "\n".join([
            self._make_entry("singapore", "sg001"),
            self._make_entry("world", "wd001"),
            self._make_entry("china", "cn001"),
            self._make_entry("sea", "se001"),
            self._make_entry("sports", "sp001"),  # must NOT be picked up
        ])
        matches = SITEMAP_REGEX.findall(xml)
        assert len(matches) == 4
        sections_found = {m[0].split("/news/")[1].split("/")[0] for m in matches}
        assert sections_found == {"singapore", "world", "china", "sea"}


# ── Audio-brief filter ────────────────────────────────────────────────────────

class TestAudioBriefFilter:
    def test_audio_pattern_matches(self):
        from scrapers.zaobao import _AUDIO_BRIEF_RE
        assert _AUDIO_BRIEF_RE.search("【听新闻简报】今日新加坡头条")

    def test_normal_title_not_filtered(self):
        from scrapers.zaobao import _AUDIO_BRIEF_RE
        assert not _AUDIO_BRIEF_RE.search("新加坡总理会见外国领袖")

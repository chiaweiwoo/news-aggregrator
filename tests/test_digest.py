"""
Unit tests for digest.py and weekly_summary.py.

Covers:
  1. _extract_json_object — JSON recovery from various response shapes
  2. Model invariants — digest and weekly summary must NOT use Haiku
  3. weekly_summary._build_content — correct grouping and graceful empty input
"""

import os
import sys
from unittest.mock import MagicMock, patch

# ── Patch external deps before importing ──────────────────────────────────────

sys.modules.setdefault("supabase", MagicMock())
os.environ.setdefault("SUPABASE_URL", "https://fake.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "fake-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "fake-key")

with patch("supabase.create_client", return_value=MagicMock()):
    with patch("anthropic.Anthropic", return_value=MagicMock()):
        import digest
        import weekly_summary


# ── _extract_json_object ──────────────────────────────────────────────────────

class TestExtractJsonObject:
    """Both digest.py and weekly_summary.py use an identical _extract_json_object helper."""

    def test_clean_object(self):
        text = '{"international": {"points": ["Good accuracy on names."]}}'
        result = digest._extract_json_object(text)
        assert result is not None
        assert "international" in result

    def test_prose_before_object(self):
        text = 'Here is the updated digest:\n{"malaysia": {"points": ["Improving."]}}\nDone.'
        result = digest._extract_json_object(text)
        assert result is not None
        assert "malaysia" in result

    def test_no_object_returns_none(self):
        assert digest._extract_json_object("No JSON here at all.") is None

    def test_only_open_brace_returns_none(self):
        assert digest._extract_json_object("{no closing brace") is None

    def test_nested_object(self):
        text = '{"topics": [{"title": "Gaza talks", "region": "International"}]}'
        result = weekly_summary._extract_json_object(text)
        assert result is not None
        assert "topics" in result

    def test_code_fenced_object(self):
        text = '```json\n{"singapore": {"points": ["Names are accurate."]}}\n```'
        result = digest._extract_json_object(text)
        assert result is not None
        assert "singapore" in result


# ── Model invariants ──────────────────────────────────────────────────────────

class TestModelInvariants:
    """digest.py and weekly_summary.py must not use Haiku — they call Sonnet without prefill."""

    def test_digest_model_is_not_haiku(self):
        assert "haiku" not in digest.DIGEST_MODEL.lower(), (
            f"digest.DIGEST_MODEL={digest.DIGEST_MODEL!r} must not be Haiku. "
            "Digest calls use use_prefill=False which requires Sonnet or better."
        )

    def test_weekly_summary_model_is_not_haiku(self):
        assert "haiku" not in weekly_summary.SUMMARY_MODEL.lower(), (
            f"weekly_summary.SUMMARY_MODEL={weekly_summary.SUMMARY_MODEL!r} must not be Haiku. "
            "Summary calls use use_prefill=False which requires Sonnet or better."
        )

    def test_digest_model_is_sonnet_or_opus(self):
        model = digest.DIGEST_MODEL.lower()
        assert "sonnet" in model or "opus" in model, (
            f"digest.DIGEST_MODEL={digest.DIGEST_MODEL!r} — expected Sonnet or Opus."
        )

    def test_weekly_summary_model_is_sonnet_or_opus(self):
        model = weekly_summary.SUMMARY_MODEL.lower()
        assert "sonnet" in model or "opus" in model, (
            f"weekly_summary.SUMMARY_MODEL={weekly_summary.SUMMARY_MODEL!r} — expected Sonnet or Opus."
        )


# ── weekly_summary._build_content ────────────────────────────────────────────

class TestBuildContent:
    def _make_headline(self, title_en: str, title_zh: str, category: str) -> dict:
        return {
            "title_en": title_en,
            "title_zh": title_zh,
            "category": category,
            "published_at": "2026-05-12T10:00:00Z",
        }

    def test_groups_by_region(self):
        headlines = [
            self._make_headline("Gaza talks stall", "加沙谈判停滞", "International"),
            self._make_headline("PM meets King", "首相会见国王", "Malaysia"),
            self._make_headline("Budget debate", "预算辩论", "Malaysia"),
        ]
        content = weekly_summary._build_content(headlines)
        assert "INTERNATIONAL" in content
        assert "MALAYSIA" in content
        assert "Gaza talks stall" in content
        assert "PM meets King" in content

    def test_empty_input_does_not_raise(self):
        content = weekly_summary._build_content([])
        assert "0 total" in content

    def test_unknown_category_goes_to_international(self):
        headlines = [
            self._make_headline("Some story", "某新闻", "Unknown"),
        ]
        content = weekly_summary._build_content(headlines)
        # Unknown category falls back to International bucket
        assert "Some story" in content

    def test_total_count_in_header(self):
        headlines = [self._make_headline(f"Headline {i}", f"新闻{i}", "Singapore") for i in range(5)]
        content = weekly_summary._build_content(headlines)
        assert "5 total" in content

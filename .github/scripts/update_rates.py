"""
update_rates.py — fetch Anthropic pricing page, extract model prices via Claude,
rewrite pricing.py if anything changed.

Usage:
    python .github/scripts/update_rates.py

Env vars required:
    ANTHROPIC_API_KEY  — already in repo secrets
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

import anthropic
import urllib.request

PRICING_FILE = "pricing.py"
PRICING_URL  = "https://www.anthropic.com/pricing"
MODEL        = "claude-haiku-4-5-20251001"

# Models we care about — must match keys in pricing.py exactly.
TRACKED_MODELS = [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-7",
]

EXTRACT_SYSTEM = (
    "You are a pricing data extractor. "
    "You will receive raw HTML from the Anthropic pricing page. "
    "Extract the API input and output prices (USD per 1 million tokens) for these exact models: "
    + ", ".join(TRACKED_MODELS)
    + ". "
    "Return ONLY a JSON object with this exact structure — no markdown, no explanation:\n"
    '{"claude-haiku-4-5-20251001": {"input": 1.00, "output": 5.00}, '
    '"claude-sonnet-4-6": {"input": 3.00, "output": 15.00}, '
    '"claude-opus-4-7": {"input": 5.00, "output": 25.00}}\n'
    "Use the exact model ID strings above as keys. "
    "Values must be floats representing USD per 1M tokens. "
    "If a model is not found on the page, omit it from the output — do not guess. "
    "Return ONLY the JSON object."
)


def fetch_pricing_html() -> str:
    print(f"[update-rates] fetching {PRICING_URL}", flush=True)
    req = urllib.request.Request(
        PRICING_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; pricing-bot/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    print(f"[update-rates] fetched {len(html):,} bytes", flush=True)
    return html


def extract_prices_via_claude(html: str) -> dict[str, dict[str, float]]:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Trim HTML to keep tokens manageable — pricing content is near the top.
    truncated = html[:60_000]

    print(f"[update-rates] calling Claude {MODEL} to extract prices", flush=True)
    msg = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=EXTRACT_SYSTEM,
        messages=[{"role": "user", "content": f"HTML:\n{truncated}"}],
    )
    body = msg.content[0].text.strip() if msg.content else ""
    print(f"[update-rates] Claude response: {body[:300]}", flush=True)

    # Best-effort JSON extraction
    first = body.find("{")
    last  = body.rfind("}")
    if first == -1 or last == -1 or last <= first:
        raise ValueError(f"[update-rates] no JSON object in Claude response: {body[:400]!r}")

    parsed = json.loads(body[first : last + 1])
    if not isinstance(parsed, dict):
        raise ValueError(f"[update-rates] expected dict, got {type(parsed)}")

    # Validate shape
    result: dict[str, dict[str, float]] = {}
    for model_id, prices in parsed.items():
        if model_id not in TRACKED_MODELS:
            print(f"[update-rates] ignoring unknown model in response: {model_id!r}", flush=True)
            continue
        if not isinstance(prices, dict) or "input" not in prices or "output" not in prices:
            print(f"[update-rates] skipping malformed entry for {model_id!r}", flush=True)
            continue
        result[model_id] = {
            "input":  float(prices["input"]),
            "output": float(prices["output"]),
        }

    if not result:
        raise ValueError("[update-rates] Claude returned no usable pricing data")

    return result


def read_current_prices() -> dict[str, dict[str, float]]:
    """Parse the PRICING dict out of pricing.py without importing it."""
    with open(PRICING_FILE, encoding="utf-8") as f:
        source = f.read()

    # Extract each model line: "model-id": {"input": X, "output": Y}
    pattern = r'"(claude-[^"]+)":\s*\{"input":\s*([\d.]+),\s*"output":\s*([\d.]+)\}'
    current: dict[str, dict[str, float]] = {}
    for m in re.finditer(pattern, source):
        model_id, inp, out = m.group(1), float(m.group(2)), float(m.group(3))
        if model_id in TRACKED_MODELS:
            current[model_id] = {"input": inp, "output": out}
    return current


def prices_changed(
    current: dict[str, dict[str, float]],
    fetched: dict[str, dict[str, float]],
) -> bool:
    for model_id in fetched:
        if model_id not in current:
            print(f"[update-rates] new model detected: {model_id}", flush=True)
            return True
        for key in ("input", "output"):
            if abs(current[model_id][key] - fetched[model_id][key]) > 1e-9:
                print(
                    f"[update-rates] price change: {model_id} {key}: "
                    f"{current[model_id][key]} → {fetched[model_id][key]}",
                    flush=True,
                )
                return True
    return False


def rewrite_pricing_file(
    fetched: dict[str, dict[str, float]],
    today: str,
) -> None:
    with open(PRICING_FILE, encoding="utf-8") as f:
        source = f.read()

    # Update the "last verified" comment
    source = re.sub(
        r"(Current prices last verified:)\s*[\d\-]+",
        rf"\1 {today[:7]}",  # YYYY-MM
        source,
    )

    # Update each tracked model line in the PRICING dict.
    # Matches: "model-id":         {"input": X.XX,  "output": Y.YY},
    for model_id, prices in fetched.items():
        inp = prices["input"]
        out = prices["output"]

        def fmt(v: float) -> str:
            # Preserve clean representation: 1.0 → "1.00", 3.5 → "3.50"
            return f"{v:.2f}"

        # Replace the line for this model, preserving surrounding whitespace/alignment
        source = re.sub(
            rf'("{re.escape(model_id)}":\s*\{{"input":\s*)[\d.]+(\s*,\s*"output":\s*)[\d.]+(\s*\}})',
            rf'"\g<0>'[1:-1],  # reconstruct from groups below
            source,
        )
        # Simpler targeted replacement that handles alignment padding:
        source = re.sub(
            rf'("{re.escape(model_id)}")\s*:\s*\{{"input":\s*[\d.]+\s*,\s*"output":\s*[\d.]+\s*\}}',
            lambda m, i=inp, o=out, mid=model_id: (
                f'"{mid}": {{"input": {fmt(i)},  "output": {fmt(o)}}}'
            ),
            source,
        )

    with open(PRICING_FILE, "w", encoding="utf-8", newline="\n") as f:
        f.write(source)

    print(f"[update-rates] {PRICING_FILE} rewritten", flush=True)


def main() -> None:
    print("[update-rates] starting", flush=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        html   = fetch_pricing_html()
        fetched = extract_prices_via_claude(html)
        current = read_current_prices()

        print(f"[update-rates] current:  {current}", flush=True)
        print(f"[update-rates] fetched:  {fetched}", flush=True)

        if not prices_changed(current, fetched):
            print("[update-rates] no price changes detected — nothing to do", flush=True)
            sys.exit(0)

        rewrite_pricing_file(fetched, today)
        print("[update-rates] done — pricing.py updated", flush=True)
        # Signal to the workflow that a commit is needed
        sys.exit(42)

    except Exception as e:
        # Non-fatal — don't break CI over a pricing fetch failure
        print(f"[update-rates] ERROR (non-fatal): {e}", flush=True)
        sys.exit(0)


if __name__ == "__main__":
    main()

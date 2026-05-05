import os
import feedparser
import re
from supabase import create_client
from dotenv import load_dotenv
from google import genai
from datetime import datetime, timezone

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

CHANNEL_ID = "UCURes72wqcEpid6EKNXWfxw"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

feed = feedparser.parse(FEED_URL)

for entry in feed.entries[:5]:
    title_zh = re.sub(r'\s*\|.*$', '', entry.title).strip()
    video_id = entry.yt_videoid
    thumbnail_url = entry.media_thumbnail[0]["url"]
    published_at = entry.published
    channel = entry.author

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=f"Translate this Chinese headline to English: {title_zh}"
    )
    title_en = response.text.strip()

    supabase.table("headlines").upsert({
        "id": video_id,
        "title_zh": title_zh,
        "title_en": title_en,
        "thumbnail_url": thumbnail_url,
        "published_at": published_at,
        "channel": channel,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    print(f"Inserted/updated: {video_id} | {title_zh} -> {title_en}")

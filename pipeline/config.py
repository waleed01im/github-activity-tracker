import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

GITHUB_API = "https://api.github.com"

REPOS = [
    "facebook/react",
    "vuejs/core",
    "vercel/next.js",
    "expressjs/express",
    "fastapi/fastapi",
    "supabase/supabase",
]

def check_config():
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN missing in .env")
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL missing in .env")
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY missing in .env")
import os
from dotenv import load_dotenv

import json
from pathlib import Path

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GITHUB_API = os.getenv("GITHUB_API")

REPOS_FILE = Path(__file__).parent.parent / "data" / "selected_repos.json"


def load_repos():
    data = json.loads(REPOS_FILE.read_text(encoding="utf-8"))
    return [name for names in data.values() for name in names]


REPOS = load_repos()

def check_config():
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN missing in .env")
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL missing in .env")
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY missing in .env")
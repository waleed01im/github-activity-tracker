import json
from datetime import datetime, timezone
from pathlib import Path

RAW_STORE_DIR = Path("data/raw")

def save_raw_data(repo_name, data):
    RAW_STORE_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    path = RAW_STORE_DIR / f"{repo_name.replace('/', '_')}_{stamp}.json"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")

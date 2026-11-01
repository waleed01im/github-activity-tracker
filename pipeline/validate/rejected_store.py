import json
from datetime import datetime, timezone
from pathlib import Path

REJECTED_DIR = Path("data/rejected")


def save_rejected(record, reason, source):
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    path = REJECTED_DIR / f"rejected_{now.strftime('%Y%m%d')}.jsonl"
    entry = {
        "rejected_at": now.isoformat(),
        "source": source,
        "reason": reason,
        "record": record,
    }
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")
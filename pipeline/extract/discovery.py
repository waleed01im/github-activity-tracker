import json
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

from pipeline.config import GITHUB_API, check_config
from pipeline.extract.github_client import HEADERS

CATEGORIES = {
    "frontend": ["react", "vue", "angular", "svelte", "tailwindcss"],
    "backend": ["express", "fastapi", "django", "flask", "spring"],
    "database": ["postgres", "mysql", "mongodb", "redis", "sqlite"],
    "deployment": ["docker", "kubernetes", "terraform", "ansible", "nginx"],
}

OUT_FILE = Path("data/discovered_repos.json")

EXCLUDE_TOPICS = ["ai", "llm", "chatgpt", "claude"]

BAD_WORDS = [
    "ai", "llm", "llms", "agent", "agents", "claude", "gpt", "chatgpt",
    "openai", "copilot", "skill", "skills",
    "awesome", "tutorial", "roadmap", "interview", "course", "curriculum",
    "beginners", "cheatsheet", "learn", "example", "examples", "template", "templates",
]
BAD_RE = re.compile(r"\b(" + "|".join(BAD_WORDS) + r")\b")

GOOD_WORDS = [
    "framework", "library", "orm", "database", "engine", "runtime", "toolkit",
    "compiler", "bundler", "cache", "orchestration", "container", "proxy", "store",
]
GOOD_RE = re.compile(r"\b(" + "|".join(GOOD_WORDS) + r")\b")

def search(topic, pushed_after, per_page=30):
    excluded = " ".join(f"-topic:{t}" for t in EXCLUDE_TOPICS)
    query = f"topic:{topic} {excluded} archived:false stars:>1000 pushed:>{pushed_after}"
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": per_page,
    }
    response = requests.get(
        f"{GITHUB_API}/search/repositories",
        headers=HEADERS,
        params=params,
        timeout=30,
    )
    response.raise_for_status()
    return response.json().get("items", [])


def is_junk(item):
    text = " ".join([
        item["full_name"],
        item.get("description") or "",
        " ".join(item.get("topics") or []),
    ]).lower()
    if BAD_RE.search(text):
        return True
    return not GOOD_RE.search(text)


if __name__ == "__main__":
    results = {}
    check_config()
    pushed_after = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")

    for category, topics in CATEGORIES.items():
        repos = {}
        for topic in topics:
            for item in search(topic, pushed_after):
                if not is_junk(item):
                    repos[item["full_name"]] = item
            time.sleep(2)  #to avoid rate limit 

        top = sorted(repos.values(), key=lambda x: x["stargazers_count"], reverse=True)[:15]
        results[category] = [
            {
                "full_name": r["full_name"],
                "stargazers_count": r["stargazers_count"],
                "language": r["language"],
                "description": (r.get("description") or "")[:100],
            }
            for r in top
        ]

        print(f"\n    # {category}")
        for r in top:
            print(f'    "{r["full_name"]}",  # {r["stargazers_count"]} stars, {r["language"]}')

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nSaved to {OUT_FILE}")
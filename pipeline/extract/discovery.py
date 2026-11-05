import time
from datetime import datetime, timedelta, timezone

import json
from pathlib import Path

import requests

from pipeline.config import GITHUB_API, check_config
from pipeline.extract.github_client import HEADERS  

CATEGORIES = {
    "frontend": ["react", "vue", "angular", "svelte", "tailwindcss"],
    "backend": ["express", "fastapi", "django", "flask", "spring"],
    "database": ["postgres", "mysql", "mongodb", "redis", "sqlite"],
    "deployment": ["docker", "kubernetes", "aws", "azure", "gcp"],
}

OUT_FILE = Path("data/discovered_repos.json")

SKIP_WORDS = ["awesome", "tutorial", "roadmap", "interview", "course",
    "cheatsheet", "learn", "example", "template",]

def search(topic, pushed_after, per_page=20):
    query = f"topic:{topic} archived:false stars:>1000 pushed:>{pushed_after}"
    params = {
        "q" : query,
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
    name = item["full_name"].lower()
    return any(word in name for word in SKIP_WORDS)


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
            time.sleep(2)  # To avoid hitting rate limits
                 
        top = sorted(repos.values(), key=lambda x: x["stargazers_count"], reverse=True)[:12] 
        results[category] = [
            {
                "full_name": r["full_name"],
                "stargazers_count": r["stargazers_count"],
                "language": r["language"],
            }
            for r in top
        ]

        print(f"\n    # {category}")
        for r in top:
            print(f'    "{r["full_name"]}",  # {r["stargazers_count"]} stars, {r["language"]}')   

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nSaved to {OUT_FILE}")
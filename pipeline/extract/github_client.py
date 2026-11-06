import sys
import time
from datetime import datetime, timedelta, timezone

import requests

from pipeline.config import GITHUB_API, GITHUB_TOKEN, REPOS, check_config
from pipeline.extract.raw_store import save_raw_data

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
}


def get_with_retry(url, params=None, retries=3):
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        except (requests.ConnectionError, requests.Timeout) as e:
            error = e
        else:
            if response.status_code < 500 and response.status_code != 429:
                response.raise_for_status()
                return response
            error = f"status {response.status_code}"

        if attempt == retries:
            raise RuntimeError(f"Failed after {retries} tries: {error}")

        wait = 2 ** attempt
        print(f"Retry {attempt}/{retries} in {wait}s: {error}")
        time.sleep(wait)


def fetch_repo(full_name):
    url = f"{GITHUB_API}/repos/{full_name}"
    return get_with_retry(url).json()


def fetch_paginated(url, params=None, max_pages=10):
    params = {"per_page": 100, **(params or {})}
    items = []
    pages = 0

    while url and pages < max_pages:
        response = get_with_retry(url, params)
        items.extend(response.json())
        url = response.links.get("next", {}).get("url")
        params = None
        pages += 1

    return items


def fetch_events(full_name):
    return fetch_paginated(f"{GITHUB_API}/repos/{full_name}/events", max_pages=10)


def fetch_commits(full_name, since, max_pages=10):
    return fetch_paginated(
        f"{GITHUB_API}/repos/{full_name}/commits", {"since": since}, max_pages,
    )


def fetch_pulls(full_name, since, max_pages=10):
    pulls = fetch_paginated(
        f"{GITHUB_API}/repos/{full_name}/pulls",
        {"state": "all", "sort": "updated", "direction": "desc"},
        max_pages,
    )
    return [p for p in pulls if p["updated_at"] >= since]


def fetch_issues(full_name, since, max_pages=10):
    return fetch_paginated(
        f"{GITHUB_API}/repos/{full_name}/issues",
        {"state": "all", "since": since},
        max_pages,
    )


if __name__ == "__main__":
    check_config()
    failed = []

    days = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    if days <= 7:
        max_pages = 10
    elif days <= 30:
        max_pages = 30
    else:
        max_pages = 50

    for name in REPOS:
        try:
            repo = fetch_repo(name)
            events = fetch_events(name)
            commits = fetch_commits(name, since, max_pages)
            pulls = fetch_pulls(name, since, max_pages)
            issues = fetch_issues(name, since, max_pages)

            save_raw_data(f"{name}_repo", repo)
            save_raw_data(f"{name}_events", events)
            save_raw_data(f"{name}_commits", commits)
            save_raw_data(f"{name}_pulls", pulls)
            save_raw_data(f"{name}_issues", issues)

            print(
                name, repo["stargazers_count"], "stars,",
                len(events), "events,",
                len(commits), "commits,",
                len(pulls), "PRs,",
                len(issues), "issues",
            )
        except Exception as e:
            print(f"FAILED {name}: {e}")
            failed.append(name)

    if failed:
        print("Failed repos:", failed)
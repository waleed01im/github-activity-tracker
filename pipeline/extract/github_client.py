import requests

from pipeline.config import GITHUB_API, GITHUB_TOKEN, REPOS, check_config

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
}

def fetch_repo(full_name):
    url = f"{GITHUB_API}/repos/{full_name}"
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    check_config()
    for name in REPOS:
        repo = fetch_repo(name)
        print(name, repo["stargazers_count"], "stars")
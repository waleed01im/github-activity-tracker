import pandas as pd
import json
from pathlib import Path
from pipeline.config import REPOS

RAW_DIR = Path("data/raw")

def load_latest(name):
    prefix = name.replace("/", "_")
    files = sorted(RAW_DIR.glob(f"{prefix}_*.json"))
    if not files:
        raise FileNotFoundError(f"No raw file for {name}")
    return json.loads(files[-1].read_text(encoding="utf-8"))


def flatten_repo(repo):
    return {
        "id": repo.get("id"),
        "full_name": repo.get("full_name"),
        "language": repo.get("language"),
        "stars": repo.get("stargazers_count"),
        "forks": repo.get("forks_count"),
        "open_issues": repo.get("open_issues_count"),
        "created_at": repo.get("created_at"),
    }


def flatten_events(events, repo_id):
    if not events:
        return pd.DataFrame()

    df = pd.json_normalize(events)

    return pd.DataFrame({
        "id": df["id"],
        "repo_id": repo_id,
        "type": df["type"],
        "actor_login": df["actor.login"],
        "action": df.get("payload.action"),
        "created_at": df["created_at"],
    })

def flatten_commits(commits, repo_id):
    if not commits:
        return pd.DataFrame()

    df = pd.json_normalize(commits)

    return pd.DataFrame({
        "sha": df["sha"],
        "repo_id": repo_id,
        "author_login": df.get("author.login"),
        "author_name": df.get("commit.author.name"),
        "committed_at": df.get("commit.author.date"),
    })

def flatten_pulls(pulls, repo_id):
    if not pulls:
        return pd.DataFrame()

    df = pd.json_normalize(pulls)

    return pd.DataFrame({
        "id": df["id"],
        "repo_id": repo_id,
        "number": df["number"],
        "title": df["title"],
        "state": df["state"],
        "user_login": df.get("user.login"),
        "created_at": df["created_at"],
        "updated_at": df["updated_at"],
        "closed_at": df["closed_at"],
        "merged_at": df["merged_at"],
    })

def flatten_issues(issues, repo_id):
    real_issues = [i for i in issues if "pull_request" not in i]
    if not real_issues:
        return pd.DataFrame()

    df = pd.json_normalize(real_issues)

    return pd.DataFrame({
        "id": df["id"],
        "repo_id": repo_id,
        "number": df["number"],
        "title": df["title"],
        "state": df["state"],
        "user_login": df.get("user.login"),
        "comments": df["comments"],
        "created_at": df["created_at"],
        "updated_at": df["updated_at"],
        "closed_at": df["closed_at"],
    })



if __name__ == "__main__":
    for name in REPOS:
        try:
            repo_row = flatten_repo(load_latest(f"{name}_repo"))
            repo_id = repo_row["id"]

            events_df = flatten_events(load_latest(f"{name}_events"), repo_id)
            commits_df = flatten_commits(load_latest(f"{name}_commits"), repo_id)
            pulls_df = flatten_pulls(load_latest(f"{name}_pulls"), repo_id)
            issues_df = flatten_issues(load_latest(f"{name}_issues"), repo_id)

            print(
                name,
                "| events", len(events_df),
                "| commits", len(commits_df),
                "| PRs", len(pulls_df),
                "| issues", len(issues_df),
            )
        except Exception as e:
            print(f"FAILED {name}: {e}")
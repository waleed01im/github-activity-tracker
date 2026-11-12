import sys
from datetime import datetime, timedelta, timezone

from pipeline.config import REPOS, check_config
from pipeline.extract.github_client import (
    fetch_commits, fetch_events, fetch_issues, fetch_pulls, fetch_repo,
)
from pipeline.extract.raw_store import save_raw_data
from pipeline.load.loader import upsert_rows
from pipeline.load.supabase_client import get_client
from pipeline.transform.flatten import (
    flatten_commits, flatten_events, flatten_issues, flatten_pulls, flatten_repo,
)
from pipeline.validate.models import (
    CommitModel, EventModel, IssueModel, PullRequestModel, RepoModel,
)
from pipeline.validate.validator import validate_df


def run_repo(client, name, since, max_pages):
    # 1. EXTRACT
    repo_raw = fetch_repo(name)
    events_raw = fetch_events(name)
    commits_raw = fetch_commits(name, since, max_pages)
    pulls_raw = fetch_pulls(name, since, max_pages)
    issues_raw = fetch_issues(name, since, max_pages)

    save_raw_data(f"{name}_repo", repo_raw)
    save_raw_data(f"{name}_events", events_raw)
    save_raw_data(f"{name}_commits", commits_raw)
    save_raw_data(f"{name}_pulls", pulls_raw)
    save_raw_data(f"{name}_issues", issues_raw)

    # 2. TRANSFORM
    repo_row = flatten_repo(repo_raw)
    repo_id = repo_row["id"]
    events_df = flatten_events(events_raw, repo_id)
    commits_df = flatten_commits(commits_raw, repo_id)
    pulls_df = flatten_pulls(pulls_raw, repo_id)
    issues_df = flatten_issues(issues_raw, repo_id)

    # 3. VALIDATE
    repo_ok = RepoModel(**repo_row).model_dump(mode="json")
    events, e_bad = validate_df(events_df, EventModel, name)
    commits, c_bad = validate_df(commits_df, CommitModel, name)
    pulls, p_bad = validate_df(pulls_df, PullRequestModel, name)
    issues, i_bad = validate_df(issues_df, IssueModel, name)

    # 4. LOAD 
    upsert_rows(client, "repos", [repo_ok], "id", update=True)
    n_e = upsert_rows(client, "events", events, "id", update=False)
    n_c = upsert_rows(client, "commits", commits, "sha", update=False)
    n_p = upsert_rows(client, "pull_requests", pulls, "id", update=True)
    n_i = upsert_rows(client, "issues", issues, "id", update=True)

    print(
        f"{name} | loaded: events {n_e}, commits {n_c}, PRs {n_p}, issues {n_i}"
        f" | rejected: {e_bad + c_bad + p_bad + i_bad}"
    )

def _max_pages(days):
    if days <= 7:
        max_pages = 10
    elif days <= 30:
        max_pages = 30
    else:
        max_pages = 50
    return max_pages

def run_etl(client, days):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    max_pages = _max_pages(days)

    failed = []
    
    for name in REPOS:
        try:
            run_repo(client, name, since, max_pages)
        except Exception as e:
            print(f"FAILED {name}: {e}")
            failed.append(name)
    return failed
        

def main():
    check_config()

    days = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    failed = run_etl(get_client(), days)

    if failed:
        print("Failed repos:", failed)
        sys.exit(1)
    


if __name__ == "__main__":
    main()
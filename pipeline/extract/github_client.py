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

GRAPHQL_URL = "https://api.github.com/graphql"


def get_with_retry(url, params=None, retries=3):
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        except requests.RequestException as e:
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


def post_graphql(query, variables, retries=3):
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(
                GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers=HEADERS,
                timeout=60,
            )
        except requests.RequestException as e:
            error = str(e)
        else:
            if r.status_code == 200:
                data = r.json()
                if "errors" in data:
                    raise Exception(f"GraphQL Errors: {data['errors']}")
                return data
            if r.status_code < 500 and r.status_code not in (403, 429):
                raise Exception(f"GraphQL Error: {r.text}")
            error = f"status {r.status_code}"

        if attempt == retries:
            raise RuntimeError(f"GraphQL failed after {retries} tries: {error}")

        wait = 5 * attempt
        print(f"GraphQL retry {attempt}/{retries} in {wait}s: {error}")
        time.sleep(wait)


def fetch_events(full_name):
    params = {"per_page": 100}
    items = []
    pages = 0
    url = f"{GITHUB_API}/repos/{full_name}/events"

    while url and pages < 10:
        response = get_with_retry(url, params)
        items.extend(response.json())
        url = response.links.get("next", {}).get("url")
        params = None
        pages += 1
    return items


def fetch_graphql_data(full_name, since, max_pages=50):
    owner, name = full_name.split("/")

    query = """
    query($owner: String!, $name: String!, $prCursor: String, $issueCursor: String, $fetchPRs: Boolean!, $fetchIssues: Boolean!) {
      repository(owner: $owner, name: $name) {
        databaseId
        nameWithOwner
        stargazerCount
        forkCount
        createdAt
        primaryLanguage { name }
        issuesCount: issues { totalCount }

        pullRequests(first: 100, after: $prCursor, states: [OPEN, CLOSED, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) @include(if: $fetchPRs) {
          pageInfo { hasNextPage endCursor }
          nodes {
            databaseId number title state createdAt updatedAt closedAt mergedAt
            author { login }
          }
        }
        issues(first: 100, after: $issueCursor, states: [OPEN, CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) @include(if: $fetchIssues) {
          pageInfo { hasNextPage endCursor }
          nodes {
            databaseId number title state createdAt updatedAt closedAt
            author { login }
            comments { totalCount }
          }
        }
      }
    }
    """

    variables = {
        "owner": owner, "name": name,
        "prCursor": None, "issueCursor": None,
        "fetchPRs": True, "fetchIssues": True,
    }

    all_prs = []
    all_issues = []
    repo_raw = {}
    commits_raw = []

    pages_fetched = 0

    while pages_fetched < max_pages and (variables["fetchPRs"] or variables["fetchIssues"]):
        data = post_graphql(query, variables)

        repo_data = data["data"]["repository"]
        if not repo_data:
            raise Exception("Repository not found or access denied.")

        if pages_fetched == 0:
            repo_raw = {
                "id": repo_data.get("databaseId"),
                "full_name": repo_data.get("nameWithOwner"),
                "stargazers_count": repo_data.get("stargazerCount"),
                "forks_count": repo_data.get("forkCount"),
                "open_issues_count": repo_data.get("issuesCount", {}).get("totalCount"),
                "created_at": repo_data.get("createdAt"),
                "language": repo_data.get("primaryLanguage", {}).get("name") if repo_data.get("primaryLanguage") else None,
            }

        if variables["fetchPRs"]:
            pr_data = repo_data.get("pullRequests", {})
            nodes = pr_data.get("nodes", [])
            for pr in nodes:
                if pr.get("updatedAt") and pr["updatedAt"] < since:
                    continue
                author_login = pr["author"]["login"] if pr.get("author") else "Unknown"
                all_prs.append({
                    "id": pr.get("databaseId"),
                    "number": pr.get("number"),
                    "title": pr.get("title"),
                    "state": str(pr.get("state", "")).lower(),
                    "user": {"login": author_login},
                    "created_at": pr.get("createdAt"),
                    "updated_at": pr.get("updatedAt"),
                    "closed_at": pr.get("closedAt"),
                    "merged_at": pr.get("mergedAt"),
                })
            variables["prCursor"] = pr_data.get("pageInfo", {}).get("endCursor")
            variables["fetchPRs"] = pr_data.get("pageInfo", {}).get("hasNextPage", False)
            # UPDATED_AT DESC order: aakhri node since se purana ho to aage sab purane hain
            if nodes and nodes[-1].get("updatedAt") and nodes[-1]["updatedAt"] < since:
                variables["fetchPRs"] = False

        if variables["fetchIssues"]:
            issue_data = repo_data.get("issues", {})
            nodes = issue_data.get("nodes", [])
            for issue in nodes:
                if issue.get("updatedAt") and issue["updatedAt"] < since:
                    continue
                author_login = issue["author"]["login"] if issue.get("author") else "Unknown"
                all_issues.append({
                    "id": issue.get("databaseId"),
                    "number": issue.get("number"),
                    "title": issue.get("title"),
                    "state": str(issue.get("state", "")).lower(),
                    "user": {"login": author_login},
                    "comments": issue.get("comments", {}).get("totalCount", 0),
                    "created_at": issue.get("createdAt"),
                    "updated_at": issue.get("updatedAt"),
                    "closed_at": issue.get("closedAt"),
                })
            variables["issueCursor"] = issue_data.get("pageInfo", {}).get("endCursor")
            variables["fetchIssues"] = issue_data.get("pageInfo", {}).get("hasNextPage", False)
            if nodes and nodes[-1].get("updatedAt") and nodes[-1]["updatedAt"] < since:
                variables["fetchIssues"] = False

        pages_fetched += 1
        time.sleep(0.3)

    return repo_raw, commits_raw, all_prs, all_issues


COMMITS_QUERY = """
query($owner: String!, $name: String!, $since: GitTimestamp!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(since: $since, first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              oid
              message
              committedDate
              author { name user { login } }
            }
          }
        }
      }
    }
  }
}
"""


def fetch_all_commits(full_name, since, max_pages=50):
    owner, name = full_name.split("/")
    cursor = None
    out = []

    for _ in range(max_pages):
        variables = {"owner": owner, "name": name, "since": since, "cursor": cursor}
        data = post_graphql(COMMITS_QUERY, variables)

        ref = data["data"]["repository"]["defaultBranchRef"]
        if not ref:
            break
        history = ref["target"]["history"]

        for c in history["nodes"]:
            user = c["author"]["user"] if c.get("author") and c["author"].get("user") else None
            out.append({
                "sha": c.get("oid"),
                "commit": {
                    "message": c.get("message"),
                    "author": {
                        "name": c["author"]["name"] if c.get("author") else "Unknown",
                        "date": c.get("committedDate"),
                    },
                },
                "author": {"login": user["login"] if user else "Unknown"},
            })

        if not history["pageInfo"]["hasNextPage"]:
            break
        cursor = history["pageInfo"]["endCursor"]
        time.sleep(0.3)

    return out


if __name__ == "__main__":
    check_config()
    failed = []

    days = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    for name in REPOS:
        try:
            print(f"Fetching {name}...")

            repo, _, pulls, issues = fetch_graphql_data(name, since)
            commits = fetch_all_commits(name, since)
            events = fetch_events(name)

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
                len(issues), "issues"
            )

            time.sleep(1)

        except Exception as e:
            print(f"FAILED {name}: {e}")
            failed.append(name)

    if failed:
        print("Failed repos:", failed)
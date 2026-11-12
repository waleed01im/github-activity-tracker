import json
from pathlib import Path

import pandas as pd

from pipeline.config import REPOS_FILE
from pipeline.load.supabase_client import get_client

DAYS = 60
OUT_FILE = Path("data/dashboard_stats.json")
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
EVENT_NAMES = {
    "WatchEvent": "Stars",
    "PushEvent": "Push",
    "PullRequestEvent": "PRs",
    "IssuesEvent": "Issues",
}
MERGE_BINS = [0, 1, 6, 24, 72, 168, float("inf")]
MERGE_LABELS = ["<1h", "1-6h", "6-24h", "1-3d", "3-7d", "7d+"]


def load_table(client, name, page=1000):
    rows, start = [], 0
    while True:
        chunk = client.table(name).select("*").range(start, start + page - 1).execute().data
        rows.extend(chunk)
        if len(chunk) < page:
            break
        start += page
    return pd.DataFrame(rows)


def pct(recent, before):
    if before == 0:
        return 0
    return int(round((recent - before) / before * 100))


def trim_weeks(weekly, now):
    weekly = weekly[weekly.index < now.normalize()]  # abhi ka adhoora hafta 
    return weekly.iloc[1:].tail(8)                   # pehla adhoora hafta 


def build_stats(client):
    now = pd.Timestamp.now(tz="UTC")
    cutoff = now - pd.Timedelta(days=DAYS)
    d28 = now - pd.Timedelta(days=28)
    d56 = now - pd.Timedelta(days=56)

    repos = load_table(client, "repos")
    commits = load_table(client, "commits")
    prs = load_table(client, "pull_requests")
    events = load_table(client, "events")
    
    # Issues table load karein (agar mojood ho)
    try:
        issues = load_table(client, "issues")
    except Exception:
        issues = pd.DataFrame()

    # ---- Cleaning ----
    commits["committed_at"] = pd.to_datetime(commits["committed_at"], utc=True)
    commits = commits[commits["committed_at"] >= cutoff].copy()
    prs["created_at"] = pd.to_datetime(prs["created_at"], utc=True)
    prs["merged_at"] = pd.to_datetime(prs["merged_at"], utc=True)

    names = repos.set_index("id")["full_name"]
    cat_json = json.loads(REPOS_FILE.read_text(encoding="utf-8"))
    cat_of = {n: cat for cat, items in cat_json.items() for n in items}

    commits["full_name"] = commits["repo_id"].map(names)
    commits["label"] = commits["full_name"].str.split("/").str[1]
    commits["category"] = commits["full_name"].map(cat_of).fillna("other")

    is_bot = commits["author_login"].fillna("").str.contains(r"\[bot\]|^claude$", case=False, regex=True)
    humans = commits[~is_bot]
    prs_window = prs[prs["created_at"] >= cutoff]

    # ---- KPI cards ----
    commits_weekly = trim_weeks(commits.groupby(pd.Grouper(key="committed_at", freq="W-SUN")).size(), now)
    prs_weekly = trim_weeks(prs_window.groupby(pd.Grouper(key="created_at", freq="W-SUN")).size(), now)
    authors_weekly = trim_weeks(humans.groupby(pd.Grouper(key="committed_at", freq="W-SUN"))["author_login"].nunique(), now)

    recent_authors = humans[humans["committed_at"] >= d28]["author_login"].nunique()
    before_authors = humans[(humans["committed_at"] >= d56) & (humans["committed_at"] < d28)]["author_login"].nunique()

    kpis = [
        {
            "label": "Total Commits",
            "value": int(len(commits)),
            "change": pct((commits["committed_at"] >= d28).sum(),
                          ((commits["committed_at"] >= d56) & (commits["committed_at"] < d28)).sum()),
            "trend": commits_weekly.tolist(),
            "color": "#6366f1",
        },
        {
            "label": "Total PRs",
            "value": int(len(prs_window)),
            "change": pct((prs_window["created_at"] >= d28).sum(),
                          ((prs_window["created_at"] >= d56) & (prs_window["created_at"] < d28)).sum()),
            "trend": prs_weekly.tolist(),
            "color": "#14b8a6",
        },
        {
            "label": "Total Stars",
            "value": int(repos["stars"].fillna(0).sum()),
            "change": None,
            "trend": [],
            "color": "#a78bfa",
        },
        {
            "label": "Contributors",
            "value": int(humans["author_login"].nunique()),
            "change": pct(recent_authors, before_authors),
            "trend": authors_weekly.tolist(),
            "color": "#4338ca",
        },
    ]

    # ---- donuts (Dashboard Charts) ----
    counts = commits["label"].value_counts()
    commits_per_repo = [{"name": n, "value": int(v)} for n, v in counts.head(3).items()]
    others = int(counts.iloc[3:].sum())
    if others:
        commits_per_repo.append({"name": "Others", "value": others})

    categories = [{"name": c.title(), "value": int(v)} for c, v in commits["category"].value_counts().items()]

    ev_all = events["type"].map(EVENT_NAMES).fillna("Others").value_counts()
    event_items = [{"name": n, "value": int(v)} for n, v in ev_all.head(4).items()]
    all_events = [{"name": n, "value": int(v)} for n, v in ev_all.items()]

    # ---- Repositories Page ke liye POORA data (Real Stars & Forks) ----
    repo_stars_map = repos.set_index("id")["stars"].fillna(0).to_dict()
    repo_forks_map = repos.set_index("id")["forks"].fillna(0).to_dict() if "forks" in repos.columns else {}

    commits["repo_stars"] = commits["repo_id"].map(repo_stars_map).fillna(0)
    if repo_forks_map:
        commits["repo_forks"] = commits["repo_id"].map(repo_forks_map).fillna(0)

    all_repositories = []
    for label, val in counts.items():
        row = commits[commits["label"] == label].iloc[0]
        all_repositories.append({
            "name": label,
            "value": int(val),
            "stars": int(row["repo_stars"]),
            "forks": int(row["repo_forks"]) if "repo_forks" in row else 0
        })

    # ---- trend aur bars ----
    weekly_trend = {
        "labels": ["W" + str(d.isocalendar().week) for d in commits_weekly.index],
        "values": commits_weekly.tolist(),
    }

    local = commits["committed_at"].dt.tz_convert("Asia/Karachi")
    by_day = local.dt.day_name().value_counts().reindex(WEEKDAYS).fillna(0).astype(int)
    by_hour = local.dt.hour.value_counts().reindex(range(24)).fillna(0).astype(int)
    weekday = {"labels": [d[:3] for d in WEEKDAYS], "values": by_day.tolist()}
    hours = {"labels": [str(h) for h in range(24)], "values": by_hour.tolist()}

    # ---- contributors (REAL DATA) ----
    pr_author_col = "author_login" if "author_login" in prs.columns else "user_login"
    pr_counts = prs[pr_author_col].value_counts().to_dict() if pr_author_col in prs.columns else {}

    issue_counts = {}
    if not issues.empty:
        issue_author_col = "author_login" if "author_login" in issues.columns else "user_login"
        if issue_author_col in issues.columns:
            issue_counts = issues[issue_author_col].value_counts().to_dict()

    top_all = humans["author_login"].dropna().value_counts()
    
    contributors = []
    for n, v in top_all.head(4).items():
        contributors.append({
            "login": n,
            "commits": int(v),
            "prs": int(pr_counts.get(n, 0)),
            "issues": int(issue_counts.get(n, 0))
        })
        
    all_contributors = []
    for n, v in top_all.head(50).items():
        all_contributors.append({
            "login": n,
            "commits": int(v),
            "prs": int(pr_counts.get(n, 0)),
            "issues": int(issue_counts.get(n, 0))
        })

    # ---- PR merge time ----
    merged = prs[prs["merged_at"].notna() & (prs["merged_at"] >= cutoff)]
    merge_hours = (merged["merged_at"] - merged["created_at"]).dt.total_seconds() / 3600
    bins = pd.cut(merge_hours, bins=MERGE_BINS, labels=MERGE_LABELS, right=False)
    merge_counts = bins.value_counts().reindex(MERGE_LABELS).fillna(0).astype(int)
    median = (str(round(float(merge_hours.median()), 1)) + "h") if len(merge_hours) else "-"

    # ---- Recent PRs & Commits for Pages ----
    recent_prs_df = prs_window.sort_values("created_at", ascending=False).head(20)
    recent_prs = [
        {
            "title": str(row.get("title", "No Title")),
            "author": str(row.get("author_login", row.get("user_login", "Unknown"))),
            "status": str(row.get("state", "open")).capitalize(),
            "time": row["created_at"].strftime("%Y-%m-%d %H:%M")
        } for _, row in recent_prs_df.iterrows()
    ]

    recent_commits_df = commits.sort_values("committed_at", ascending=False).head(20)
    recent_commits = [
        {
            "msg": str(row.get("message", "No commit message")),
            "author": str(row.get("author_login", "Unknown")),
            "repo": str(row.get("label", "Unknown")),
            "time": row["committed_at"].strftime("%Y-%m-%d %H:%M")
        } for _, row in recent_commits_df.iterrows()
    ]

    return {
        "updatedAt": now.isoformat(),
        "kpis": kpis,
        "commitsPerRepo": commits_per_repo,        
        "allRepositories": all_repositories,       
        "categories": categories,
        "weeklyTrend": weekly_trend,
        "weekday": weekday,
        "hours": hours,
        "contributors": contributors,              
        "allContributors": all_contributors,       
        "events": event_items,                     
        "allEvents": all_events,                   
        "recentPRs": recent_prs,                   
        "recentCommits": recent_commits,           
        "mergeTime": {"median": median, "labels": MERGE_LABELS, "values": merge_counts.tolist()},
    }


def save_to_supabase(client, stats):
    client.table("dashboard_stats").upsert(
        {"id": 1, "data": stats, "updated_at": stats["updatedAt"]}
    ).execute()


if __name__ == "__main__":
    client = get_client()
    stats = build_stats(client)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print("Saved", OUT_FILE)

    save_to_supabase(client, stats)
    print("Uploaded to Supabase")
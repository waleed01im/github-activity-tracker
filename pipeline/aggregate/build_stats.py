import json
import math
import time
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
    "ForkEvent": "Forks",
    "CreateEvent": "Created",
    "DeleteEvent": "Deleted",
    "ReleaseEvent": "Releases",
    "IssueCommentEvent": "Issue Comments",
    "PullRequestReviewEvent": "PR Reviews",
    "PullRequestReviewCommentEvent": "PR Review Comments",
    "CommitCommentEvent": "Commit Comments",
    "GollumEvent": "Wiki Edits",
    "MemberEvent": "Members",
    "PublicEvent": "Public",

}
MERGE_BINS = [0, 1, 6, 24, 72, 168, float("inf")]
MERGE_LABELS = ["<1h", "1-6h", "6-24h", "1-3d", "3-7d", "7d+"]

def load_table(client, name, cutoff_date=None, repo_id=None, page=1000):
    t0 = time.time()
    rows, start = [], 0
    order_col = "sha" if name == "commits" else "id"   
    while True:
        query = client.table(name).select("*")

        if cutoff_date:
            date_col = "committed_at" if name == "commits" else ("created_at" if name in ["pull_requests", "issues"] else None)
            if date_col:
                query = query.gte(date_col, cutoff_date.isoformat())

        if repo_id and name != "repos":
            query = query.eq("repo_id", repo_id)

        chunk = query.order(order_col).range(start, start + page - 1).execute().data
        rows.extend(chunk)

        if len(chunk) < page:
            break
        start += page

    print(f"{name}: {len(rows)} rows in {time.time() - t0:.1f}s")
    return pd.DataFrame(rows)

def pct(recent, before):
    if before == 0:
        return 0
    return int(round((recent - before) / before * 100))


def trim_weeks(weekly, now):
    weekly = weekly[weekly.index < now.normalize()]  # abhi ka adhoora hafta 
    return weekly.iloc[1:].tail(8)                   # pehla adhoora hafta 



def build_stats(client, days=60, target_repo=None):
    now = pd.Timestamp.now(tz="UTC")
    cutoff = now - pd.Timedelta(days=days)

    d28 = now - pd.Timedelta(days=28)
    d56 = now - pd.Timedelta(days=56)

    repos = load_table(client, "repos")
    
    repo_id = None
    if target_repo and target_repo != "All":
        match = repos[repos['full_name'].str.contains(target_repo, case=False, na=False)]
        if not match.empty:
            repo_id = match.iloc[0]['id']

    commits = load_table(client, "commits", cutoff_date=cutoff, repo_id=repo_id)
    prs = load_table(client, "pull_requests", cutoff_date=cutoff, repo_id=repo_id)
    events = load_table(client, "events", cutoff_date=cutoff, repo_id=repo_id) 

    try:
        issues = load_table(client, "issues", cutoff_date=cutoff, repo_id=repo_id)
    except Exception:
        issues = pd.DataFrame()
        
    # ... (Baqi ka aapka code waisa hi rahega)

    # ---- Dynamic Repo Filtering  ----
    if target_repo and target_repo != "All":
        # Repo ID find karein
        repo_match = repos[repos['full_name'].str.contains(target_repo, case=False, na=False)]
        if not repo_match.empty:
            rid = repo_match.iloc[0]['id']
            # Sirf us repo ka data rakhein
            commits = commits[commits['repo_id'] == rid]
            prs = prs[prs['repo_id'] == rid]
            events = events[events['repo_id'] == rid]
            if not issues.empty:
                issues = issues[issues['repo_id'] == rid]
            repos = repos[repos['id'] == rid] 


    # ---- Cleaning ----
    commits["committed_at"] = pd.to_datetime(commits["committed_at"], utc=True)
    all_commits = commits.copy()
    commits = commits[commits["committed_at"] >= cutoff].copy()
    prs["created_at"] = pd.to_datetime(prs["created_at"], utc=True)
    prs["merged_at"] = pd.to_datetime(prs["merged_at"], utc=True)

    def clean_event_name(e):
        if pd.isna(e): return "Unknown"
        if e in EVENT_NAMES: return EVENT_NAMES[e]
        return str(e).replace("Event", "")

    ev_all = events["type"].apply(clean_event_name).value_counts()
    
    top_3_events = ev_all.head(3)
    event_items = [{"name": n, "value": int(v)} for n, v in top_3_events.items()]
    others_sum = int(ev_all.iloc[3:].sum())
    if others_sum > 0:
        event_items.append({"name": "Others", "value": others_sum})

    all_events = [{"name": n, "value": int(v)} for n, v in ev_all.items()]

    if not issues.empty:
        issues["created_at"] = pd.to_datetime(issues["created_at"], utc=True)
        issues_window = issues[issues["created_at"] >= cutoff]
    else:
        issues_window = pd.DataFrame()

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

    def weekly_counts(df, col):
        if df.empty:
            return commits_weekly * 0
        series = df.groupby(pd.Grouper(key=col, freq="W-SUN")).size()
        return series.reindex(commits_weekly.index, fill_value=0).fillna(0).astype(int)

    prs_aligned = weekly_counts(prs_window, "created_at")
    issues_aligned = weekly_counts(issues_window, "created_at")

    recent_authors = humans[humans["committed_at"] >= d28]["author_login"].nunique()
    before_authors = humans[(humans["committed_at"] >= d56) & (humans["committed_at"] < d28)]["author_login"].nunique()

    kpis = [
        {
            "label": "Total Stars",
            "value": int(repos["stars"].fillna(0).sum()),
            "change": None,
            "trend": [],
            "color": "#a78bfa",
        },
        {
            "label": "Total Forks",
            "value": int(repos["forks"].fillna(0).sum()) if "forks" in repos.columns else 0,
            "change": None,
            "trend": [],
            "color": "#f59e0b",
        },
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
            "label": "Contributors",
            "value": int(humans["author_login"].nunique()),
            "change": pct(recent_authors, before_authors),
            "trend": authors_weekly.tolist(),
            "color": "#4338ca",
        },
        
    ]

    # ---- Categories ----
    counts = commits["label"].value_counts()
    categories = [{"name": c.title(), "value": int(v)} for c, v in commits["category"].value_counts().items()]

    # ---- PR Status Distribution ----
    merged_count = int(prs_window["merged_at"].notna().sum())
    open_count = int(len(prs_window[(prs_window["merged_at"].isna()) & (prs_window["state"] == "open")]))
    closed_count = int(len(prs_window[(prs_window["merged_at"].isna()) & (prs_window["state"] == "closed")]))
    
    pr_status_distribution = [
        {"name": "Merged", "value": merged_count},
        {"name": "Open", "value": open_count},
        {"name": "Closed", "value": closed_count}
    ]

    # ---- Repositories & Scatter Plot Data ----
    repo_stars_map = repos.set_index("id")["stars"].fillna(0).to_dict()
    repo_forks_map = repos.set_index("id")["forks"].fillna(0).to_dict() if "forks" in repos.columns else {}

    commits["repo_stars"] = commits["repo_id"].map(repo_stars_map).fillna(0)
    if repo_forks_map:
        commits["repo_forks"] = commits["repo_id"].map(repo_forks_map).fillna(0)

    all_repositories = []
    repo_engagement = []

    for label, val in counts.items():
        row = commits[commits["label"] == label].iloc[0]
        stars = int(row["repo_stars"])
        forks = int(row["repo_forks"]) if "repo_forks" in row else 0
        
        all_repositories.append({
            "name": label,
            "value": int(val),
            "stars": stars,
            "forks": forks
        })
        
        bubble_size = math.sqrt(val) * 2 if val > 0 else 5
        repo_engagement.append({
            "name": label,
            "x": stars,
            "y": forks,
            "r": bubble_size,
            "commits": int(val)
        })

    # ---- Trend aur Bars (Weekday & Hours) ----
    local = commits["committed_at"].dt.tz_convert("Asia/Karachi")
    by_day = local.dt.day_name().value_counts().reindex(WEEKDAYS).fillna(0).astype(int)
    by_hour = local.dt.hour.value_counts().reindex(range(24)).fillna(0).astype(int)
    weekday = {"labels": [d[:3] for d in WEEKDAYS], "values": by_day.tolist()}
    hours = {"labels": [str(h) for h in range(24)], "values": by_hour.tolist()}

    # ---- Contributors ----
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
    # ---- Top Languages Calculation ----
    if "language" in repos.columns:
        lang_counts = repos["language"].value_counts().head(5)
        top_languages = [{"name": lang, "value": int(count)} for lang, count in lang_counts.items() if pd.notna(lang)]
    else:
        top_languages = []


    # ---- Heatmap Data (Last 365 Days) ----
    heatmap_cutoff = now - pd.Timedelta(days=365)
    heatmap_commits = all_commits[all_commits["committed_at"] >= heatmap_cutoff].copy()
    heatmap_commits["date"] = (heatmap_commits["committed_at"].dt.tz_convert("Asia/Karachi").dt.strftime("%Y-%m-%d"))
    heatmap_list = [{"date": k, "count": int(v)} for k, v in heatmap_commits["date"].value_counts().items()]
    # ---- FINAL RETURN ----
    return {
        "updatedAt": now.isoformat(),
        "kpis": kpis,
        "allRepositories": all_repositories,       
        "categories": categories,
        "heatmap": heatmap_list,
        "weeklyActivity": {
            "labels": ["W" + str(d.isocalendar().week) for d in commits_weekly.index],
            "datasets": [
                {"label": "Commits", "data": [int(x) for x in commits_weekly.tolist()], "color": "#6366f1"},
                {"label": "PRs", "data": [int(x) for x in prs_aligned.tolist()], "color": "#14b8a6"},
                {"label": "Issues", "data": [int(x) for x in issues_aligned.tolist()], "color": "#f59e0b"},
                {"label": "Active Contributors", "data": [int(x) for x in authors_weekly.tolist()], "color": "#a855f7"} 
            ],
        },
        "topLanguages": top_languages,
        "prStatus": pr_status_distribution,
        "repoEngagement": repo_engagement,
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
    stats = build_stats(client, days=365)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print("Saved", OUT_FILE)

    save_to_supabase(client, stats)
    print("Uploaded to Supabase")

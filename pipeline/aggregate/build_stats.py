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

    # ---- donuts ----
    counts = commits["label"].value_counts()
    commits_per_repo = [{"name": n, "value": int(v)} for n, v in counts.head(3).items()]
    others = int(counts.iloc[3:].sum())
    if others:
        commits_per_repo.append({"name": "Others", "value": others})

    categories = [{"name": c.title(), "value": int(v)} for c, v in commits["category"].value_counts().items()]

    ev = events["type"].map(EVENT_NAMES).fillna("Others").value_counts().head(4)
    event_items = [{"name": n, "value": int(v)} for n, v in ev.items()]

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

    # ---- contributors ----
    top = humans["author_login"].dropna().value_counts().head(4)
    contributors = [{"login": n, "commits": int(v)} for n, v in top.items()]

    # ---- PR merge time ----
    merged = prs[prs["merged_at"].notna() & (prs["merged_at"] >= cutoff)]
    merge_hours = (merged["merged_at"] - merged["created_at"]).dt.total_seconds() / 3600
    bins = pd.cut(merge_hours, bins=MERGE_BINS, labels=MERGE_LABELS, right=False)
    merge_counts = bins.value_counts().reindex(MERGE_LABELS).fillna(0).astype(int)
    median = (str(round(float(merge_hours.median()), 1)) + "h") if len(merge_hours) else "-"

    return {
        "updatedAt": now.isoformat(),
        "kpis": kpis,
        "commitsPerRepo": commits_per_repo,
        "categories": categories,
        "weeklyTrend": weekly_trend,
        "weekday": weekday,
        "hours": hours,
        "contributors": contributors,
        "events": event_items,
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
from pydantic import ValidationError

from pipeline.validate.rejected_store import save_rejected


def validate_df(df, model, source):
    good = []
    bad = 0
    if df.empty:
        return good, bad

    records = df.astype(object).where(df.notna(), None).to_dict("records")

    for rec in records:
        try:
            good.append(model(**rec).model_dump(mode="json"))
        except ValidationError as e:
            save_rejected(rec, str(e), source)
            bad += 1

    return good, bad


if __name__ == "__main__":
    from pipeline.config import REPOS
    from pipeline.transform.flatten import (
        flatten_commits, flatten_events, flatten_issues,
        flatten_pulls, flatten_repo, load_latest,
    )
    from pipeline.validate.models import (
        CommitModel, EventModel, IssueModel, PullRequestModel,
    )

    for name in REPOS:
        repo_id = flatten_repo(load_latest(f"{name}_repo"))["id"]
        events = flatten_events(load_latest(f"{name}_events"))
        commits = flatten_commits(load_latest(f"{name}_commits"), repo_id)
        pulls = flatten_pulls(load_latest(f"{name}_pulls"), repo_id)
        issues = flatten_issues(load_latest(f"{name}_issues"), repo_id)

        _, e_bad = validate_df(events, EventModel, name)
        _, c_bad = validate_df(commits, CommitModel, name)
        _, p_bad = validate_df(pulls, PullRequestModel, name)
        _, i_bad = validate_df(issues, IssueModel, name)

        print(name, "| rejected: events", e_bad, "commits", c_bad, "PRs", p_bad, "issues", i_bad)
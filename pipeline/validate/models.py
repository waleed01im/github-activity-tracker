from datetime import datetime
from pydantic import BaseModel


class RepoModel(BaseModel):
    id: int
    full_name: str
    language: str | None = None
    stars: int | None = None
    forks: int | None = None
    open_issues: int | None = None
    created_at: datetime | None = None


class EventModel(BaseModel):
    id: str
    repo_id: int
    type: str
    actor_login: str | None = None
    action: str | None = None
    commit_count: int | None = None
    created_at: datetime


class CommitModel(BaseModel):
    sha: str
    repo_id: int
    author_login: str | None = None
    author_name: str | None = None
    committed_at: datetime


class PullRequestModel(BaseModel):
    id: int
    repo_id: int
    number: int
    title: str | None = None
    state: str
    user_login: str | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    merged_at: datetime | None = None


class IssueModel(BaseModel):
    id: int
    repo_id: int
    number: int
    title: str | None = None
    state: str
    user_login: str | None = None
    comments: int | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
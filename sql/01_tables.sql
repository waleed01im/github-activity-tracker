--repos
create table if not exists repos (
  id          bigint primary key,
  full_name   text not null unique,
  language    text,
  stars       integer,
  forks       integer,
  open_issues integer,
  created_at  timestamptz,
  fetched_at  timestamptz default now()
);

--events 
create table if not exists events (
  id           text primary key,
  repo_id      bigint references repos(id),
  type         text not null,
  actor_login  text,
  commit_count integer,
  action       text,
  created_at   timestamptz not null
);

--commits
create table if not exists commits (
  sha          text primary key,
  repo_id      bigint references repos(id),
  author_login text,
  author_name  text,
  committed_at timestamptz not null
);

--pull_requests
create table if not exists pull_requests (
  id          bigint primary key,
  repo_id     bigint references repos(id),
  number      integer,
  title       text,
  state       text,
  user_login  text,
  created_at  timestamptz,
  updated_at  timestamptz,
  closed_at   timestamptz,
  merged_at   timestamptz
);

--issues
create table if not exists issues (
  id          bigint primary key,
  repo_id     bigint references repos(id),
  number      integer,
  title       text,
  state       text,
  user_login  text,
  comments    integer,
  created_at  timestamptz,
  updated_at  timestamptz,
  closed_at   timestamptz
);

-- dashboard_stats
create table if not exists dashboard_stats (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);


-- indexes
create index if not exists idx_events_repo      on events (repo_id);
create index if not exists idx_events_created   on events (created_at);
create index if not exists idx_commits_repo     on commits (repo_id);
create index if not exists idx_commits_time     on commits (committed_at);
create index if not exists idx_prs_repo         on pull_requests (repo_id);
create index if not exists idx_issues_repo      on issues (repo_id);


drop policy if exists "public read" on repos;
drop policy if exists "public read" on events;
drop policy if exists "public read" on commits;
drop policy if exists "public read" on pull_requests;
drop policy if exists "public read" on issues;

create policy "public read" on repos         for select using (true);
create policy "public read" on events        for select using (true);
create policy "public read" on commits       for select using (true);
create policy "public read" on pull_requests for select using (true);
create policy "public read" on issues        for select using (true);
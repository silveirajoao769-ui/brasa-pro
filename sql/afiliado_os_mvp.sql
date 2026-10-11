-- Afiliado OS MVP, isolated from Brasa Pro data. Review on a dedicated Supabase project.
-- No Brasa tables, subscriptions, users, payment orders or policies are dropped/changed.
create extension if not exists pgcrypto;

create table if not exists public.aos_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  preference text not null default 'affiliate' check (preference in ('affiliate','mentor')),
  created_at timestamptz not null default now()
);

create table if not exists public.aos_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null check (char_length(product_name) between 1 and 120),
  platform text not null check (char_length(platform) between 1 and 70),
  channel text not null check (char_length(channel) between 1 and 70),
  affiliate_url text not null check (char_length(affiliate_url) between 8 and 2048),
  spent_cents bigint not null default 0 check (spent_cents >= 0),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists aos_campaigns_user_created_idx on public.aos_campaigns(user_id, created_at desc);

create table if not exists public.aos_commissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  constraint aos_commissions_campaign_owner_fk foreign key (campaign_id,user_id)
    references public.aos_campaigns(id,user_id) on delete cascade
);

create index if not exists aos_commissions_user_created_idx on public.aos_commissions(user_id,created_at desc);

create table if not exists public.aos_cohorts (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 100),
  invite_code uuid not null unique,
  created_at timestamptz not null default now()
);

create index if not exists aos_cohorts_mentor_idx on public.aos_cohorts(mentor_id);

create table if not exists public.aos_join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invite_code uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id,invite_code)
);

create index if not exists aos_requests_code_idx on public.aos_join_requests(invite_code);

create table if not exists public.aos_enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.aos_cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cohort_id,user_id)
);

create index if not exists aos_enrollments_user_idx on public.aos_enrollments(user_id);

create table if not exists public.aos_tasks (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.aos_cohorts(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '' check (char_length(description) <= 1500),
  due_at date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (cohort_id,student_id) references public.aos_enrollments(cohort_id,user_id) on delete cascade
);

create index if not exists aos_tasks_student_idx on public.aos_tasks(student_id,created_at desc);
create index if not exists aos_tasks_mentor_idx on public.aos_tasks(mentor_id,created_at desc);

alter table public.aos_profiles enable row level security;
alter table public.aos_campaigns enable row level security;
alter table public.aos_commissions enable row level security;
alter table public.aos_cohorts enable row level security;
alter table public.aos_join_requests enable row level security;
alter table public.aos_enrollments enable row level security;
alter table public.aos_tasks enable row level security;

-- Explicit grants and ownership checks. There is NO anon table access.
revoke all on public.aos_profiles, public.aos_campaigns, public.aos_commissions,
  public.aos_cohorts, public.aos_join_requests, public.aos_enrollments, public.aos_tasks
  from anon, authenticated;

grant select, insert, update on public.aos_profiles to authenticated;
grant select, insert, update, delete on public.aos_campaigns to authenticated;
grant select, insert, update, delete on public.aos_commissions to authenticated;
grant select, insert, update, delete on public.aos_cohorts to authenticated;
grant select, insert, delete on public.aos_join_requests to authenticated;
grant select, insert, delete on public.aos_enrollments to authenticated;
grant select, insert on public.aos_tasks to authenticated;
grant update(completed_at) on public.aos_tasks to authenticated;

create policy aos_profiles_read on public.aos_profiles
 for select to authenticated using (
  (select auth.uid())=user_id or exists (
    select 1 from public.aos_enrollments e
    join public.aos_cohorts c on c.id=e.cohort_id
    where e.user_id=aos_profiles.user_id and c.mentor_id=(select auth.uid())
  )
 );
create policy aos_profiles_insert on public.aos_profiles
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy aos_profiles_update on public.aos_profiles
 for update to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create policy aos_campaigns_read on public.aos_campaigns
 for select to authenticated using ((select auth.uid())=user_id);
create policy aos_campaigns_insert on public.aos_campaigns
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy aos_campaigns_update on public.aos_campaigns
 for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy aos_campaigns_delete on public.aos_campaigns
 for delete to authenticated using ((select auth.uid())=user_id);

create policy aos_commissions_read on public.aos_commissions
 for select to authenticated using ((select auth.uid())=user_id);
create policy aos_commissions_insert on public.aos_commissions
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy aos_commissions_update on public.aos_commissions
 for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy aos_commissions_delete on public.aos_commissions
 for delete to authenticated using ((select auth.uid())=user_id);

create policy aos_cohorts_read on public.aos_cohorts
 for select to authenticated using ((select auth.uid())=mentor_id);
create policy aos_cohorts_insert on public.aos_cohorts
 for insert to authenticated with check ((select auth.uid())=mentor_id);
create policy aos_cohorts_update on public.aos_cohorts
 for update to authenticated using ((select auth.uid())=mentor_id) with check ((select auth.uid())=mentor_id);
create policy aos_cohorts_delete on public.aos_cohorts
 for delete to authenticated using ((select auth.uid())=mentor_id);

create policy aos_requests_read on public.aos_join_requests
 for select to authenticated using (
  (select auth.uid())=user_id or exists (
    select 1 from public.aos_cohorts c
    where c.invite_code=aos_join_requests.invite_code and c.mentor_id=(select auth.uid())
  )
 );
create policy aos_requests_insert on public.aos_join_requests
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy aos_requests_delete on public.aos_join_requests
 for delete to authenticated using (
  (select auth.uid())=user_id or exists (
    select 1 from public.aos_cohorts c
    where c.invite_code=aos_join_requests.invite_code and c.mentor_id=(select auth.uid())
  )
 );

create policy aos_enrollments_read on public.aos_enrollments
 for select to authenticated using (
  (select auth.uid())=user_id or exists (
    select 1 from public.aos_cohorts c
    where c.id=aos_enrollments.cohort_id and c.mentor_id=(select auth.uid())
  )
 );
create policy aos_enrollments_insert on public.aos_enrollments
 for insert to authenticated with check (
  exists (
    select 1 from public.aos_cohorts c
    where c.id=aos_enrollments.cohort_id and c.mentor_id=(select auth.uid())
  )
 );
create policy aos_enrollments_delete on public.aos_enrollments
 for delete to authenticated using (
  (select auth.uid())=user_id or exists (
    select 1 from public.aos_cohorts c
    where c.id=aos_enrollments.cohort_id and c.mentor_id=(select auth.uid())
  )
 );

create policy aos_tasks_read on public.aos_tasks
 for select to authenticated using (
  (select auth.uid())=student_id or (
    (select auth.uid())=mentor_id and exists (
      select 1 from public.aos_cohorts c where c.id=aos_tasks.cohort_id and c.mentor_id=(select auth.uid())
    )
  )
 );
create policy aos_tasks_insert on public.aos_tasks
 for insert to authenticated with check (
  (select auth.uid())=mentor_id and exists (
    select 1 from public.aos_cohorts c where c.id=aos_tasks.cohort_id and c.mentor_id=(select auth.uid())
  ) and exists (
    select 1 from public.aos_enrollments e where e.cohort_id=aos_tasks.cohort_id and e.user_id=aos_tasks.student_id
  )
 );
create policy aos_tasks_complete on public.aos_tasks
 for update to authenticated
 using ((select auth.uid())=student_id)
 with check ((select auth.uid())=student_id);

-- Important: RLS is essential but not a substitute for an actual staging database,
-- role impersonation tests, billing isolation, and privacy review.

create table
public.sites (
  id bigint generated by default as identity,
  name text not null,
  urls text[] not null,
  created_at timestamp with time zone not null default now(),
  "queryParamsToRemove" text[] null,
  logo_url text not null,
  blacklisted_paths text[] not null default '{/}'::text[],
  constraint sites_pkey primary key (id)
) tablespace pg_default;

create table
public.links (
  id bigint generated by default as identity,
  created_at timestamp with time zone not null default now(),
  user_id uuid not null default auth.uid (),
  url text not null,
  title text not null,
  site_id bigint not null,
  constraint links_pkey primary key (id),
  constraint links_site_id_fkey foreign key (site_id) references sites (id) on update restrict on delete restrict,
  constraint links_user_id_fkey foreign key (user_id) references auth.users (id) on delete restrict
) tablespace pg_default;

-- create Job Status enum with values new, applied, archived
create type public."Job Status" as enum ('new', 'applied', 'archived');
create table
public.jobs (
  id bigint generated by default as identity,
  user_id uuid not null default auth.uid (),
  "externalId" text not null,
  "externalUrl" text not null,
  "siteId" bigint not null,
  title text not null,
  "companyName" text not null,
  "companyLogo" text null,
  location text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  salary text null,
  tags text[] null,
  "jobType" text null,
  status public."Job Status" not null default 'new'::"Job Status",
  constraint jobs_pkey primary key (id),
  constraint jobs_externalId_key unique ("externalId"),
  constraint jobs_user_id_fkey foreign key (user_id) references auth.users (id) on delete restrict,
  constraint jobs_siteId_fkey foreign key ("siteId") references sites (id) on update restrict on delete restrict
) tablespace pg_default;
create index jobs_user_id_updated_at_id_status_idx on public.jobs (user_id, updated_at desc, id desc, status);

alter table public.sites enable row level security;
alter table public.jobs enable row level security;
alter table public.links enable row level security;

-- row level security
create policy "enable select for authenticated users only" 
on public.sites 
as permissive 
for select 
to authenticated 
using (true);

create policy "enable all for users based on user_id" 
on public.links 
as permissive 
for all 
to authenticated 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

create policy "enable all for users based on user_id" 
on public.jobs 
as permissive 
for all 
to authenticated 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);

-- create custom DB functions
create or replace function list_jobs(jobs_status "Job Status", jobs_after text, jobs_page_size integer)
returns setof jobs as $$
declare
  after_id integer;
  after_updated_at timestamp;
begin
  if jobs_after is not null then
    after_id := split_part(jobs_after, '!', 1)::integer;
    after_updated_at := split_part(jobs_after, '!', 2)::timestamp;
    return query
    select *
    from jobs
    where status = jobs_status and (updated_at, id) < (after_updated_at, after_id)
    order by updated_at desc, id desc
    limit jobs_page_size;
  else
    return query
    select *
    from jobs
    where status = jobs_status
    order by updated_at desc, id desc
    limit jobs_page_size;
  end if;
end; $$
language plpgsql;
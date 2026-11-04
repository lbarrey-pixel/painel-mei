-- Imita o que o Supabase já tem: schema auth, papéis anon/authenticated e auth.jwt().
-- Só para rodar a migration num Postgres comum (CI e desenvolvimento local).
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb
$$;

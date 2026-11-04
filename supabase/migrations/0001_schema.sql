-- Painel MEI: cadastro de clientes, regra da rotina mensal e lista de e-mails com acesso.
-- Toda escrita vem do navegador com a chave anon + sessão do usuário, então a segurança
-- está inteira nas policies abaixo: só quem está em allowed_emails lê ou grava.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type atividade as enum ('comercio', 'servicos', 'comercio_servicos', 'outra');
create type canal_envio as enum ('whatsapp_web', 'meta_api');
create type frequencia as enum ('mensal', 'personalizada');

-- ---------------------------------------------------------------------------
-- Funções de apoio
-- ---------------------------------------------------------------------------

-- Dígitos verificadores do CNPJ (módulo 11). Rejeita sequências repetidas.
create or replace function cnpj_valido(cnpj text)
returns boolean
language plpgsql
immutable
as $$
declare
  d int[];
  p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  soma int;
  dv1 int;
  dv2 int;
begin
  if cnpj !~ '^\d{14}$' or cnpj ~ '^(\d)\1{13}$' then
    return false;
  end if;
  select array_agg(c::int order by o) into d from regexp_split_to_table(cnpj, '') with ordinality as t(c, o);
  soma := 0;
  for i in 1..12 loop soma := soma + d[i] * p1[i]; end loop;
  dv1 := case when soma % 11 < 2 then 0 else 11 - soma % 11 end;
  soma := 0;
  for i in 1..13 loop soma := soma + d[i] * p2[i]; end loop;
  dv2 := case when soma % 11 < 2 then 0 else 11 - soma % 11 end;
  return d[13] = dv1 and d[14] = dv2;
end;
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

-- Quem pode entrar no painel. O login é Google OAuth; o e-mail precisa estar aqui.
create table allowed_emails (
  email text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  added_by text,
  created_at timestamptz not null default now()
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  codigo text,
  nome text not null check (length(trim(nome)) > 0),
  cnpj text not null unique check (cnpj_valido(cnpj)),
  telefone text not null check (length(trim(telefone)) > 0),
  atividade atividade not null default 'outra',
  ativo boolean not null default true,
  pausado boolean not null default false,
  debito_automatico boolean not null default false,
  frequencia frequencia not null default 'mensal',
  frequencia_config jsonb,
  -- Exceções por cliente; null = usa config_geral.
  dia_aviso_override smallint check (dia_aviso_override between 1 and 28),
  margem_atraso_override smallint check (margem_atraso_override >= 0),
  mensagem_template_override text,
  canal_envio_override canal_envio,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_codigo_idx on clientes (codigo);

create trigger clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

-- Uma linha só: id é sempre true.
create table config_geral (
  id boolean primary key default true check (id),
  dia_aviso_padrao smallint not null default 15 check (dia_aviso_padrao between 1 and 28),
  margem_atraso_dias smallint not null default 3 check (margem_atraso_dias >= 0),
  mensagem_template_padrao text not null,
  canal_envio_padrao canal_envio not null default 'whatsapp_web',
  updated_at timestamptz not null default now()
);

create trigger config_geral_updated_at
  before update on config_geral
  for each row execute function set_updated_at();

insert into config_geral (mensagem_template_padrao) values (
  'Olá {nome}! Sua guia DAS-MEI de {competencia} já está disponível. Vencimento: {vencimento}. Valor: {valor}.'
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- security definer para ler allowed_emails mesmo antes de o usuário ter permissão nela.
create or replace function tem_acesso()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function tem_acesso() from public;
grant execute on function tem_acesso() to authenticated;

alter table allowed_emails enable row level security;
alter table clientes enable row level security;
alter table config_geral enable row level security;

-- O usuário precisa saber se o próprio e-mail está liberado (middleware consulta pelo e-mail).
create policy allowed_emails_ler_proprio on allowed_emails
  for select to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')) or tem_acesso());

create policy allowed_emails_gerir on allowed_emails
  for all to authenticated
  using (tem_acesso()) with check (tem_acesso());

create policy clientes_acesso on clientes
  for all to authenticated
  using (tem_acesso()) with check (tem_acesso());

-- Config só muda, nunca cria nem apaga.
create policy config_geral_ler on config_geral
  for select to authenticated using (tem_acesso());

create policy config_geral_alterar on config_geral
  for update to authenticated using (tem_acesso()) with check (tem_acesso());

-- anon não vê nada; o painel sempre exige sessão.
revoke all on allowed_emails, clientes, config_geral from anon;
grant select, insert, update, delete on allowed_emails, clientes to authenticated;
grant select, update on config_geral to authenticated;

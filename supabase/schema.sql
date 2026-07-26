-- BraZap - schema (consolidado, reflete o estado real do projeto Supabase
-- em producao em 2026-07-26). Multi-tenant desde o inicio: toda tabela de
-- dominio carrega tenant_id e tem RLS habilitado.
--
-- IMPORTANTE: o webhook e algumas rotas de servidor rodam com a service
-- role (que ignora RLS) -- o isolamento por tenant nesses casos e feito
-- manualmente no codigo (ver lib/tenant.ts, lib/messages.ts). RLS aqui
-- protege o acesso feito pelo frontend/rotas com a anon key (agentes
-- logados e superadmins).

create extension if not exists "uuid-ossp";

-- Empresa cliente do BraZap (ex: AuraComex)
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Config do WhatsApp Cloud API de cada tenant.
-- access_token_encrypted fica hoje em texto puro -- TODO: migrar pra
-- Supabase Vault antes de guardar um token real de producao la.
create table tenant_whatsapp_config (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  waba_id text not null,
  phone_number_id text not null unique,
  access_token_encrypted text,
  created_at timestamptz not null default now()
);

-- Agentes (equipe que atende). Vinculado ao auth.users do Supabase Auth.
create table memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null default 'agent', -- agent | admin
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- Superadmins da plataforma BraZap (enxergam/gerenciam todos os tenants).
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Contato do WhatsApp (quem manda/recebe mensagem), por tenant.
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  wa_id text not null, -- numero de telefone no formato da Meta
  name text,
  created_at timestamptz not null default now(),
  unique (tenant_id, wa_id)
);

-- Conversa = janela de atendimento com um contato.
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

-- Historico de mensagens.
create table messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  wa_message_id text,
  body text,
  status text, -- sent | delivered | read | failed | received (mensagens de saida/entrada)
  created_at timestamptz not null default now()
);

-- Regras simples de resposta automatica: se a mensagem recebida contiver
-- `keyword` (case-insensitive), o webhook dispara `reply_body` de volta
-- automaticamente. Fase inicial de automacao -- sem builder visual ainda.
create table automation_rules (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  keyword text not null,
  reply_body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Helper: tenants que o usuario logado pode acessar.
create or replace function auth_tenant_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select tenant_id from memberships where user_id = auth.uid();
$$;

revoke execute on function auth_tenant_ids() from public;
revoke execute on function auth_tenant_ids() from anon;
grant execute on function auth_tenant_ids() to authenticated;

-- Helper: o usuario logado e superadmin da plataforma?
create or replace function is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

revoke execute on function is_platform_admin() from public;
revoke execute on function is_platform_admin() from anon;
grant execute on function is_platform_admin() to authenticated;

alter table tenants enable row level security;
alter table tenant_whatsapp_config enable row level security;
alter table memberships enable row level security;
alter table platform_admins enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table automation_rules enable row level security;

create policy "self can check own admin status" on platform_admins
  for select using (user_id = auth.uid());

create policy "member or admin can read tenants" on tenants
  for select using (id in (select auth_tenant_ids()) or is_platform_admin());

create policy "admin can manage tenants" on tenants
  for all using (is_platform_admin());

create policy "member or admin can read tenant config" on tenant_whatsapp_config
  for select using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

create policy "admin can manage tenant config" on tenant_whatsapp_config
  for all using (is_platform_admin());

create policy "member or admin can read memberships" on memberships
  for select using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

create policy "admin can manage memberships" on memberships
  for all using (is_platform_admin());

create policy "member or admin can access contacts" on contacts
  for all using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

create policy "member or admin can access conversations" on conversations
  for all using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

create policy "member or admin can access messages" on messages
  for all using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

create policy "member or admin can manage automation rules" on automation_rules
  for all using (tenant_id in (select auth_tenant_ids()) or is_platform_admin());

-- Realtime: front-end escuta INSERTs em messages pra atualizar a tela de
-- conversa sozinha.
alter publication supabase_realtime add table messages;

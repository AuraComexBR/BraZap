-- BraZap - schema inicial (draft)
-- Multi-tenant desde o inicio: toda tabela de dominio carrega tenant_id e
-- tem RLS habilitado, isolando um cliente do BraZap do outro no nivel do
-- banco (nao so na logica da aplicacao).
--
-- IMPORTANTE: este schema roda com service role no webhook (que ignora
-- RLS por design), entao o isolamento por tenant no webhook precisa ser
-- garantido manualmente no codigo (ver lib/tenant.ts). RLS aqui protege o
-- acesso feito pelo frontend com a anon key (agentes logados).

create extension if not exists "uuid-ossp";

-- Empresa cliente do BraZap (ex: AuraComex)
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Config do WhatsApp Cloud API de cada tenant.
-- access_token fica cifrado -- TODO: avaliar Supabase Vault em vez de
-- coluna em texto puro antes de guardar token real aqui.
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
  status text, -- sent | delivered | read | failed (mensagens de saida)
  created_at timestamptz not null default now()
);

-- Helper: tenants que o usuario logado pode acessar.
create or replace function auth_tenant_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select tenant_id from memberships where user_id = auth.uid();
$$;

alter table tenants enable row level security;
alter table tenant_whatsapp_config enable row level security;
alter table memberships enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "member can read own tenant" on tenants
  for select using (id in (select auth_tenant_ids()));

create policy "member can read own tenant config" on tenant_whatsapp_config
  for select using (tenant_id in (select auth_tenant_ids()));

create policy "member can read own memberships" on memberships
  for select using (tenant_id in (select auth_tenant_ids()));

create policy "member can access own tenant contacts" on contacts
  for all using (tenant_id in (select auth_tenant_ids()));

create policy "member can access own tenant conversations" on conversations
  for all using (tenant_id in (select auth_tenant_ids()));

create policy "member can access own tenant messages" on messages
  for all using (tenant_id in (select auth_tenant_ids()));

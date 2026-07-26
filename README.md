# BraZap

Plataforma de atendimento via WhatsApp Business Cloud API (Meta), multi-tenant. Inspirada na Huggy — inbox compartilhado, histórico de conversas, e evoluindo para automações, templates e integrações.

AuraComex é o primeiro tenant (cliente), usado como dogfooding pelo dono do produto.

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + RLS multi-tenant + Realtime)
- Deploy: Vercel

## Setup local

1. `npm install`
2. Copiar `.env.example` para `.env.local` e preencher as variáveis (Supabase e Meta).
3. Rodar o schema em `supabase/schema.sql` no projeto Supabase.
4. `npm run dev`

## Webhook da Meta

Rota: `app/api/whatsapp/webhook/route.ts`. Ao cadastrar o webhook no painel do App (Meta for Developers), a URL de callback é `https://<seu-dominio>/api/whatsapp/webhook`, e o "Verify Token" deve ser o mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`.

## Estado atual

MVP em desenvolvimento: inbox compartilhado básico + histórico de conversas. Ver decisões e roadmap completo no documento de planejamento mantido separadamente pelo dono do produto.

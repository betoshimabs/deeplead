<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ⚠️ SUPABASE — LEIA ANTES DE QUALQUER OPERAÇÃO DE BANCO DE DADOS

## Projeto Supabase: DeepLead

| Campo | Valor |
|---|---|
| **Project Name** | DeepLead |
| **Project ID** | `tvcfzqcwdldryiqtcjob` |
| **Project URL** | `https://tvcfzqcwdldryiqtcjob.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/tvcfzqcwdldryiqtcjob |

> [!CAUTION]
> **NÃO** consulte, acesse ou modifique NENHUM outro projeto Supabase que não seja o ID `tvcfzqcwdldryiqtcjob`.
> Antes de qualquer operação de banco, confirme que o `project_id` é `tvcfzqcwdldryiqtcjob`.

## Workflow preferencial: Supabase CLI

**Todas as operações de banco de dados devem usar o Supabase CLI** (via MCP `supabase-mcp-server`), não o SDK client-side diretamente.

### Operações DDL (estrutura)
- Sempre use `apply_migration` — **nunca** `execute_sql` para DDL
- Migrations são versionadas e rastreáveis

### Operações de consulta/debug
- Use `execute_sql` para queries de leitura e dados
- Use `get_logs` para debug de erros

### Regra de ouro
1. `list_tables` → entender estrutura existente antes de qualquer mudança
2. `get_advisors` (security + performance) → após qualquer DDL
3. `apply_migration` → para todas as alterações de schema

## Variáveis de Ambiente

As chaves estão em `.env.local` (nunca commitado):
- `NEXT_PUBLIC_SUPABASE_URL` — URL pública (safe para client)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (safe para client)
- `SUPABASE_SECRET_KEY` — secret key (**somente server-side/edge functions**)

---

# 🗂️ ORGANIZAÇÃO DE SCHEMAS — REGRAS OBRIGATÓRIAS

## Mapa de Schemas

O banco de dados usa **schemas PostgreSQL dedicados por domínio**. A `public` fica reservada apenas para extensões. **Nunca crie tabelas de aplicação na `public`.**

| Schema | Domínio | Tabelas principais |
|---|---|---|
| `public` | Extensões apenas | `pgcrypto`, `pg_stat_statements` — sem tabelas de app |
| `core` | Plataforma / Multi-tenancy | `users`, `businesses`, `business_members`, `plans`, `subscriptions` |
| `crm` | Módulo CRM | `leads`, `lead_activities`, `lead_score_history`, `lead_imports`, `pipeline_configs` |
| `real_estate` | Segmento Imobiliário | `lead_profiles`, `properties`, `lead_property_interests` |
| `messaging` | Comunicação | `conversations`, `messages`, `message_templates` |
| `campaigns` | Marketing | `campaigns`, `campaign_recipients`, `campaign_events` |
| `scheduling` | Agenda | `events`, `event_attendees` |
| `ai` | Camada de IA | `ai_insights`, `ai_chat_sessions`, `scoring_rules`, `prompt_templates` |
| `integrations` | Canais externos | `channels`, `webhook_logs`, `api_credentials` |
| `analytics` | Relatórios | Views e materialized views sobre os outros schemas |

### Regras de naming
- Schemas: `snake_case`, singular de domínio (`crm`, não `crms`)
- Tabelas: `snake_case`, plural (`leads`, `properties`)
- Colunas: `snake_case` (`business_id`, `created_at`)
- PKs: sempre `id uuid DEFAULT gen_random_uuid()`
- FKs: `{entidade}_id` (ex: `lead_id`, `business_id`)
- Timestamps: `created_at` e `updated_at` em toda tabela (default `now()`, updated_at via trigger)

### Padrão de criação de schema

```sql
-- Ao criar um novo schema, sempre incluir os grants:
CREATE SCHEMA IF NOT EXISTS nome_schema;
GRANT USAGE ON SCHEMA nome_schema TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA nome_schema TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA nome_schema
  GRANT ALL ON TABLES TO authenticated;
```

---

# 🔒 RLS (ROW LEVEL SECURITY) — REGRAS OBRIGATÓRIAS

## Princípio fundamental

> [!CAUTION]
> **RLS deve estar habilitado em TODA tabela, sem exceção.**
> RLS habilitado sem policies = DENY ALL por padrão — isto é seguro e intencional.
> Nunca desabilite RLS em produção.

## Habilitação obrigatória

```sql
-- Sempre incluir ao criar qualquer tabela:
ALTER TABLE schema.tabela ENABLE ROW LEVEL SECURITY;
```

## Padrão de isolamento por negócio (multi-tenancy)

Todo dado de negócio tem `business_id`. A policy base é:

```sql
-- Usuário só acessa dados do(s) negócio(s) ao qual pertence
CREATE POLICY "tenant_isolation" ON crm.leads
  FOR ALL TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM core.business_members
      WHERE user_id = auth.uid()
    )
  );
```

## Camadas de acesso

| Role | Nível | O que acessa |
|---|---|---|
| `anon` | Público | Apenas formulários de captura (sem dados internos) |
| `authenticated` / gestor | Negócio | Todos os dados do seu negócio |
| `authenticated` / colaborador | Restrito | Apenas leads/conversas atribuídos a ele |
| `service_role` | Servidor | Bypassa RLS — usar APENAS em Edge Functions/API Routes server-side |

## Distinção gestor vs colaborador

```sql
-- Helper function (criar em core):
CREATE OR REPLACE FUNCTION core.get_my_role(p_business_id uuid)
RETURNS text AS $$
  SELECT business_role FROM core.business_members
  WHERE user_id = auth.uid() AND business_id = p_business_id
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policy de escrita restrita a gestores:
CREATE POLICY "gestor_only_write" ON integrations.channels
  FOR INSERT WITH CHECK (
    core.get_my_role(business_id) = 'gestor'
  );
```

## RLS por schema

| Schema | RLS | Observação |
|---|---|---|
| `core.users` | ✅ | Usuário lê/edita apenas seu próprio perfil |
| `core.businesses` | ✅ | Apenas membros do negócio |
| `core.business_members` | ✅ | Gestor gerencia, colaborador só lê |
| `crm.*` | ✅ | Isolamento por `business_id` |
| `real_estate.*` | ✅ | Via `lead_id → crm.leads.business_id` |
| `messaging.*` | ✅ | `business_id` + colaborador vê só atribuídos |
| `campaigns.*` | ✅ | `business_id`, write = gestor only |
| `scheduling.*` | ✅ | `business_id` |
| `ai.*` | ✅ | `business_id` |
| `integrations.*` | ✅ | `business_id`, write = gestor only |
| `analytics.*` | ✅ read-only | Views com `business_id` embutido no filtro |

## Checklist pós-migration

Após qualquer `apply_migration`, executar obrigatoriamente:
1. `get_advisors(type: "security")` — verifica tabelas sem RLS ou policies ausentes
2. `get_advisors(type: "performance")` — verifica índices em FKs e colunas de filtro

## Regra sobre service_role

```
✅ service_role → Edge Functions, API Routes (server-side)
❌ service_role → NUNCA no client-side (browser, componentes React)
✅ publishable key → client-side (sempre com RLS habilitado)
```

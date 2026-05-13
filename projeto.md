# 🚀 DeepLead — Plataforma CRM Inteligente

> **Status:** Fase 0 — Frontend Simulado + Backend Supabase configurado
> **Última atualização:** 2026-05-11
> **Fase atual:** Setup de infraestrutura

---

## 🗄️ Supabase — Backend / Banco de Dados

> [!IMPORTANT]
> **Este é o único projeto Supabase deste repositório.** Toda operação de banco de dados deve referenciar exclusivamente o ID `tvcfzqcwdldryiqtcjob`.

| Campo | Valor |
|---|---|
| **Project Name** | DeepLead |
| **Project ID** | `tvcfzqcwdldryiqtcjob` |
| **Project URL** | `https://tvcfzqcwdldryiqtcjob.supabase.co` |
| **Região** | `us-east-1` |
| **Status** | `ACTIVE_HEALTHY` |
| **Dashboard** | https://supabase.com/dashboard/project/tvcfzqcwdldryiqtcjob |
| **DB Host** | `db.tvcfzqcwdldryiqtcjob.supabase.co` |
| **Postgres** | 17.6 |

### Variáveis de Ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://tvcfzqcwdldryiqtcjob.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   ← client-safe
SUPABASE_SECRET_KEY=sb_secret_...                         ← somente server
```

> O `.env.local` está coberto pelo `.gitignore` e **nunca deve ser commitado**.

### Workflow: Supabase CLI (via MCP)

O fluxo de trabalho preferencial com Supabase neste projeto é **via Supabase CLI através do MCP `supabase-mcp-server`**, não via SDK client-side diretamente. Isso garante rastreabilidade, versionamento de migrations e segurança.

| Operação | Ferramenta |
|---|---|
| Criar/alterar tabelas | `apply_migration` |
| Consultar dados / debug | `execute_sql` |
| Ver logs | `get_logs` |
| Ver estrutura atual | `list_tables` |
| Auditoria de segurança | `get_advisors (security)` |
| Auditoria de performance | `get_advisors (performance)` |

---

## 🗂️ Arquitetura de Banco de Dados

> Ver regras detalhadas de implementação em `AGENTS.md` — seções "Organização de Schemas" e "RLS".

### Organização de Schemas PostgreSQL

`public` fica **reservada para extensões** (`pgcrypto`, etc.). Nenhuma tabela de aplicação vai na `public`.

| Schema | Domínio |
|---|---|
| `core` | Plataforma: usuários, negócios, membros, planos |
| `crm` | Leads, pipeline, atividades, importações |
| `real_estate` | Perfil imobiliário do lead, imóveis, interesses |
| `messaging` | Conversas, mensagens, templates |
| `campaigns` | Campanhas e automações |
| `scheduling` | Agenda e eventos |
| `ai` | Insights, sessões, regras de scoring |
| `integrations` | Canais externos, webhooks, credenciais |
| `analytics` | Views e métricas |

### RLS — Row Level Security

- **RLS habilitado em TODA tabela, sem exceção**
- Padrão de isolamento: `business_id` garante que cada negócio vê apenas seus dados
- Gestor: acesso total ao negócio / Colaborador: apenas dados atribuídos a ele
- `service_role` bypassa RLS — usar somente server-side (Edge Functions, API Routes)
- Após cada migration: rodar `get_advisors(security)` e `get_advisors(performance)`

### Decisões de modelagem — Módulo Leads (2026-05-11)

**Arquitetura escolhida:** tabela de campos comuns + tabelas separadas por segmento.

| Tabela | Schema | Descrição |
|---|---|---|
| `leads` | `crm` | Campos universais: identidade, perfil socioecon., CRM, rastreamento |
| `lead_profiles` | `real_estate` | Campos específicos: intenção de compra, imóvel desejado, financeiro |
| `properties` | `real_estate` | Portfólio de imóveis da imobiliária |
| `lead_property_interests` | `real_estate` | Relação M:N: lead ↔ imóveis de interesse |
| `lead_activities` | `crm` | Linha do tempo de ações por lead |
| `lead_score_history` | `crm` | Histórico de variações de score (lógica de cálculo: backlog IA) |
| `lead_imports` | `crm` | Controle de lotes de importação (CSV, XLSX) |

**Campos de entrada de leads:**
- Campanhas de redes sociais
- Importação de planilha (CSV, XLSX, JSON)
- Formulários web (com captura de UTM + GeoIP + device)

**Qualificação:**
- Via fluxo automatizado (IA) — campo `qualification_source = 'ai_flow'`
- Via preenchimento manual do corretor — `qualification_source = 'manual'`
- Via importação — `qualification_source = 'import'`

**CPF:** campo opcional, armazenado criptografado (`pgcrypto`).

**Score:** coluna `smallint` presente desde o início. Lógica de recálculo automático = backlog da fase de IA.

**Imóvel de interesse:** híbrido — `interested_property_id` (FK para `properties`) + `interest_notes` (texto livre como fallback).

---

## 🎯 Visão do Produto

DeepLead é uma plataforma CRM de nova geração voltada para negócios que precisam gerenciar leads, campanhas multicanal e equipes de forma integrada. O diferencial central é a **IA como assistente ativo** em cada etapa do funil — não como feature periférica, mas como camada transversal a toda a plataforma.

**Público-alvo inicial:** Imobiliárias, negócios de serviços e qualquer operação que dependa de relacionamento ativo com leads.

---

## 🏗️ Arquitetura Geral (Visão Futura)

```
┌─────────────────────────────────────────────────────┐
│                   DeepLead Platform                  │
├──────────────┬──────────────────┬───────────────────┤
│   Frontend   │   Backend (API)  │   AI Layer        │
│   (Next.js)  │   (Node/Supabase)│  (OpenAI/Vertex)  │
├──────────────┴──────────────────┴───────────────────┤
│              Integrações Externas                    │
│  WhatsApp Business API │ Meta Graph │ TikTok API     │
└─────────────────────────────────────────────────────┘
```

**Stack prevista (produção):**
- **Frontend:** Next.js 14+ (App Router) + TailwindCSS
- **Backend:** Supabase (auth, DB, realtime, storage) + Edge Functions
- **IA:** OpenAI GPT-4o / Gemini (a definir por custo/performance)
- **Mensageria:** WhatsApp Business API (Meta Cloud API — recomendado)
- **Filas/Workers:** Supabase pg_cron + Deno workers (campanhas em lote)

---

## 📦 Módulos Planejados

---

### 1. 🔐 Sistema de Autenticação

**Status:** Discussão

**Classificações de usuário (plataforma):**
| Role | Descrição |
|------|-----------|
| `dev` | Acesso total, debug, feature flags |
| `tester` | Ambiente de testes, dados simulados |
| `basic` | Usuário final padrão (gestor/colaborador do negócio) |

**Classificações dentro de um negócio:**
| Role | Permissões |
|------|-----------|
| `gestor` | CRUD total no negócio, adiciona membros, vê analytics |
| `colaborador` | Acesso restrito a chats/leads atribuídos, sem acesso a configurações |

> **Decisão pendente:** Adotar RBAC simples (roles fixas) ou sistema granular de permissões (permissão por recurso)? Para MVP recomendo RBAC simples com roles fixas — mais fácil de apresentar e de implementar depois.

---

### 2. 🏢 Cadastro do Negócio (Business Profile)

**Status:** Discussão

**Funcionalidades:**
- Cadastro do perfil do negócio (nome, segmento, logo, CNPJ, endereço)
- Upload de logo (Supabase Storage futuramente)
- Gerenciamento de membros:
  - Convidar por e-mail
  - Atribuir role (`gestor` / `colaborador`)
  - Revogar acesso

**Ponto de atenção — Multi-tenancy:**
Um usuário pode pertencer a múltiplos negócios (ex: um gestor que tem duas imobiliárias). O modelo de dados precisa refletir isso desde o início.

```
users → user_business_memberships → businesses
```

---

### 3. 🔌 Conexão com Redes Sociais

**Status:** Discussão

**Canais previstos:**
- WhatsApp (Meta Cloud API — Business)
- Instagram (Meta Graph API)
- Facebook (Meta Graph API)
- TikTok (TikTok for Business API)

**Análise por canal:**

| Canal | Facilidade de Integração | Custo | Prioridade |
|-------|------------------------|-------|-----------|
| WhatsApp Business API | Média (OAuth + Webhook) | Mensagem paga após 24h | 🔴 Alta |
| Instagram DM | Média | Gratuito | 🟡 Média |
| Facebook | Baixa complexidade | Gratuito | 🟡 Média |
| TikTok | Alta complexidade (API restrita) | Gratuito | 🟢 Baixa |

> **Recomendação:** Começar com WhatsApp + Instagram via Meta Graph API (mesmo app, mesma aprovação). TikTok para segunda fase.

---

### 4. 📢 Sistema de Campanhas

**Status:** Discussão

**Tipos de campanha:**
- `broadcast`: envio em massa (WhatsApp/Instagram DM)
- `social_post`: publicação em feed/stories (Instagram, Facebook, TikTok)
- `drip`: sequência automatizada por gatilhos (lead entra no funil → recebe mensagem X após Y dias)

> **Ponto técnico importante:** O WhatsApp Business API cobra por conversa iniciada pela empresa (template messages). Mensagens dentro de janela de 24h (iniciadas pelo usuário) são gratuitas. Isso precisa ser transparente para o gestor na plataforma.

---

### 5. 💬 Sistema de Chat (WhatsApp)

**Status:** Discussão — precisa de decisão de design

**Pergunta:** "Seria uma conta Business única, com colaboradores acessando apenas os chats que são deles?"

**Resposta: Sim, isso funciona e é o modelo correto.**

**Como funciona na prática (Meta Cloud API):**
1. O negócio tem **um número WhatsApp Business** conectado à plataforma.
2. Todos os inbound messages chegam no **mesmo webhook**.
3. A plataforma faz o **roteamento interno**: cada conversa é atribuída a um colaborador.
4. Cada colaborador vê apenas as conversas atribuídas a ele.
5. O gestor tem visão global de todas as conversas.

**Critérios de atribuição (com IA futuramente):**
- Por produto/imóvel de interesse
- Por região geográfica
- Por disponibilidade do colaborador (agenda)
- Por histórico (lead já falou com X antes)
- Round-robin automático

**Funcionalidades do chat:**
- Inbox unificado com status: `new` / `open` / `pending` / `resolved`
- Tags nos leads
- Notas internas (visíveis só para a equipe)
- Templates de resposta rápida
- Transferência de conversa entre colaboradores
- **IA sugerindo resposta** (assistente inline no chat)

---

### 6. 📊 Sistema de Analytics

**Status:** Discussão

**Três dimensões:**

#### 6a. Analytics de Produto/Leads
- Taxa de conversão por produto, tempo médio no funil
- Origem dos leads (qual campanha, qual canal)
- Custo por lead (CPL), leads ganhos/perdidos e motivos

#### 6b. Analytics de Campanhas
- Impressões, cliques, taxa de abertura
- Performance por canal, melhor horário de envio

#### 6c. Analytics de Colaboradores
- Tempo médio de resposta, taxa de conversão individual
- Volume de atendimentos, satisfação (NPS futuro)

> **Recomendação de IA:** Painel de "insights automáticos" onde a IA identifica anomalias e oportunidades com linguagem natural.

---

### 7. 🎯 Sistema de Funil & Kanban

**Status:** Discussão

**Etapas default (imobiliária):**
```
Novo Lead → Contato Iniciado → Visita Agendada → Proposta → Negociação → Fechado (Won/Lost)
```

**Funcionalidades:**
- Etapas configuráveis pelo gestor
- Cards arrastáveis no Kanban
- Filtros: por responsável, produto, data de entrada
- **IA no funil:** lead scoring, alertas de risco, sugestão de próxima ação

---

### 8. 📅 Sistema de Agendamento

**Status:** Discussão

**Funcionalidades:**
- Agenda por colaborador (visão semanal/mensal)
- Agendamento de visitas, ligações, follow-ups
- Integração com Google Calendar / Outlook (futura)
- Automação: lembrete automático via WhatsApp para o lead (D-1 e H-2)
- Self-scheduling: Link público tipo Calendly

---

## 🤖 IA — Camada Transversal (Planejamento)

> A IA não deve ser um chatbot separado — deve ser um **co-piloto integrado** em cada módulo.

| Módulo | Ação de IA |
|--------|-----------|
| Chat | Sugestão de resposta contextual, classificação de sentimento |
| Funil | Lead scoring, alertas de risco, próxima ação sugerida |
| Campanhas | Melhor horário de envio, sugestão de copy, A/B automático |
| Analytics | Insights automáticos, relatório em linguagem natural |
| Agendamento | Otimização de agenda, sugestão de slot ideal |
| Global | Assistente conversacional para o gestor consultar seus dados |

**Assistente de IA (feature flagship):**
Um assistente conversacional acessível de qualquer tela:
- "Quantos leads fechamos esse mês?"
- "Quais leads estão em risco?"
- "Escreve uma mensagem de follow-up para o lead João que visitou o Apto 302"

---

## 📋 Roadmap de Desenvolvimento

### Fase 0 — Apresentação (Frontend Simulado) ← ESTAMOS AQUI
- [ ] Setup do projeto (Next.js + estrutura)
- [ ] Design system e componentes base
- [ ] Telas: Dashboard, Chat, Kanban, Campanhas, Analytics, Configurações
- [ ] Dados mockados realistas
- [ ] IA simulada (respostas pré-definidas para demo)

### Fase 1 — MVP Real
- [ ] Supabase auth + multi-tenancy
- [ ] WhatsApp Business API (inbound + outbound)
- [ ] CRUD de leads e funil
- [ ] Chat funcional com atribuição

### Fase 2 — Expansão
- [ ] Instagram / Facebook
- [ ] Sistema de campanhas com envio real
- [ ] Analytics real
- [ ] IA (lead scoring, sugestão de resposta)

### Fase 3 — Plataforma Completa
- [ ] Assistente de IA conversacional
- [ ] Self-scheduling
- [ ] TikTok
- [ ] App mobile (React Native)

---

## ❓ Questões em Aberto / Decisões Pendentes

1. **Stack do frontend:** Next.js (já pensando em produção) ou HTML/CSS puro (mais rápido para demo)?
2. **Nome do produto:** DeepLead confirmado?
3. **Segmento inicial:** Focar em imobiliárias para o demo ou deixar genérico?
4. **Idioma:** PT-BR apenas ou internacionalizar desde o início?
5. **Modelo de pricing (SaaS):** Por negócio? Por usuário? Por volume de mensagens?
6. **Identidade visual:** Já tem branding definido (cores, logo)?

---

*Documento vivo — atualizado a cada decisão tomada.*

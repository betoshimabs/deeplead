# 🎨 DeepLead — Design System & Identidade Visual

> **Status:** Decisões confirmadas ✅
> **Última atualização:** 2026-05-07
> **Referência principal:** [Coolors.co](https://coolors.co/?home)

---

## 🌈 Paleta Oficial (Coolors #03603481593362783)

```
#605454  ·  #F9795A  ·  #EB937C  ·  #127284  ·  #3BAFC4
#2F4251  ·  #555D6F  ·  #DAE1EA  ·  #FEFEFE
```

### Análise da Paleta

A paleta tem duas famílias que coexistem em tensão elegante:

| Família | Cores | Papel na UI |
|---------|-------|-------------|
| **Quente (Coral)** | `#F9795A` `#EB937C` `#605454` | Energia, destaque, ação, IA |
| **Fria (Teal/Navy)** | `#127284` `#3BAFC4` `#2F4251` `#555D6F` | Estrutura, confiança, navegação |
| **Neutros** | `#DAE1EA` `#FEFEFE` | Superfícies, bordas, fundos |

---

## 🎨 Mapeamento de Tokens de Design

### Modo: **Light-first** ✅
*(Referência Coolors.co — branco limpo com cor como acento, não como fundo)*

```css
/* === FUNDOS / SUPERFÍCIES === */
--bg-base:        #FEFEFE;  /* Fundo principal — quase branco puro */
--bg-subtle:      #F4F7FA;  /* Fundo de seções, alternância de linhas */
--bg-card:        #FFFFFF;  /* Cards elevados */
--bg-sidebar:     #F8FAFB;  /* Sidebar levemente destacada */
--bg-overlay:     rgba(47, 66, 81, 0.4); /* Backdrops de modais */

/* === PRIMÁRIO (Teal) — Navegação, CTAs, Ativo === */
--primary:        #127284;  /* Teal profundo — cor principal de marca */
--primary-light:  #3BAFC4;  /* Teal médio — hover, ícones ativos, charts */
--primary-subtle: #EBF7FA;  /* Teal/10 — fundos de badges, highlights sutis */

/* === ACENTO (Coral) — Ação, Destaque, IA === */
--accent:         #F9795A;  /* Coral vibrante — CTAs primários, botões de ação */
--accent-light:   #EB937C;  /* Pêssego — hover do coral, badges suaves */
--accent-subtle:  #FEF0EC;  /* Coral/8 — fundos de elementos de IA */

/* === TEXTO === */
--text-primary:   #2F4251;  /* Navy escuro — corpo de texto, headings */
--text-secondary: #555D6F;  /* Blue-grey — labels, captions, placeholders */
--text-muted:     #8A9BB0;  /* Gerado — texto muito secundário */
--text-disabled:  #B8C4D0;  /* Desabilitado */
--text-on-primary:#FEFEFE;  /* Texto sobre fundo teal */
--text-on-accent: #FEFEFE;  /* Texto sobre fundo coral */

/* === BORDAS === */
--border-default: #DAE1EA;  /* Bordas de cards, inputs, divisores */
--border-subtle:  #EDF0F4;  /* Bordas muito sutis, separadores */
--border-focus:   #3BAFC4;  /* Focus ring de inputs */
--border-strong:  #555D6F;  /* Bordas de elementos ativos/hover */

/* === ESTADOS SEMÂNTICOS === */
--success:        #22A06B;  /* Verde — lead ganho, status ok */
--success-subtle: #E6F5EF;
--warning:        #F59E0B;  /* Âmbar — alerta, pendente */
--warning-subtle: #FEF9EC;
--error:          #E03131;  /* Vermelho — lead perdido, erro */
--error-subtle:   #FFEAEA;
--info:           #127284;  /* Reutiliza o teal primário */

/* === IA — Linguagem Visual Exclusiva === */
--ai-primary:     #F9795A;  /* Coral — todo elemento gerado/assistido por IA */
--ai-secondary:   #EB937C;  /* Pêssego — IA em estado hover */
--ai-bg:          #FEF0EC;  /* Fundo de sugestões de IA */
--ai-border:      #F9795A;  /* Border de elementos de IA */

/* === MARROM/MAUVE (605454) — uso especial === */
--warm-brown:     #605454;  /* Usar em: avatars placeholder, estados neutros quentes */
```

> **Nota sobre `#605454`:** Esta cor tem um caráter "neutro quente" — ótimo para avatars placeholder, estados empty, ou como cor de um segmento específico (ex: o segmento imobiliário poderia ter esse tom como identidade).

---

## 🔤 Tipografia ✅

```css
/* Google Fonts: Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Escala tipográfica */
--text-xs:   11px;  /* Labels de badge, micro-texto */
--text-sm:   13px;  /* Captions, metadados */
--text-base: 15px;  /* Corpo padrão de interface */
--text-md:   16px;  /* Texto de parágrafo, inputs */
--text-lg:   18px;  /* Subtítulos de seção */
--text-xl:   22px;  /* Títulos de página */
--text-2xl:  28px;  /* Headlines de dashboard */
--text-3xl:  36px;  /* KPIs grandes, métricas */

/* Pesos */
--weight-regular:   400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;

/* Letter-spacing */
--tracking-tight:  -0.02em;  /* Headings grandes */
--tracking-normal:  0em;
--tracking-wide:    0.04em;  /* Labels, badges, caps */
```

---

## 📐 Spacing & Border Radius ✅

```css
/* === ESPAÇAMENTO (base 4px) === */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;

/* === BORDER RADIUS — "suave" como pedido === */
--radius-xs:   4px;    /* Badges pequenos, tags */
--radius-sm:   8px;    /* Inputs, dropdowns */
--radius-md:   12px;   /* Cards compactos, tooltips */
--radius-lg:   16px;   /* Cards principais ← uso mais frequente */
--radius-xl:   24px;   /* Painéis, seções grandes */
--radius-2xl:  32px;   /* Modais, drawers */
--radius-full: 9999px; /* Pills de status, avatars, botões pill */

/* === SOMBRAS (leves — estilo Notion/clean) === */
--shadow-xs:  0 1px 2px rgba(47, 66, 81, 0.05);
--shadow-sm:  0 2px 8px rgba(47, 66, 81, 0.08);
--shadow-md:  0 4px 16px rgba(47, 66, 81, 0.10);
--shadow-lg:  0 8px 32px rgba(47, 66, 81, 0.12);
--shadow-focus: 0 0 0 3px rgba(59, 175, 196, 0.25); /* Focus ring teal */
```

---

## 🏗️ Layout & Navegação ✅

### Estrutura de Página
```
┌──────────────────────────────────────────────────────┐
│  Topbar (56px) — Logo | Workspace | Search | Notif | User │
├───────────┬──────────────────────────────────────────┤
│           │                                          │
│ Sidebar   │         Main Content Area                │
│ (240px)   │  padding: 32px 40px                     │
│           │                                          │
│ Nav items │  Max-width: 1280px (centralizado)        │
│           │                                          │
│ ─────     │                                          │
│ IA Button │                                          │
└───────────┴──────────────────────────────────────────┘
```

### Sidebar — Itens de Navegação
```
  📊  Dashboard
  💬  Chat             (badge numérico — coral se houver não lidos)
  🎯  Pipeline / Kanban
  👥  Leads
  📢  Campanhas
  📅  Agenda
  📈  Analytics
  ─────────────────────
  ⚙️  Configurações
  🤖  Assistente IA    (fundo coral/10, texto coral — destaque especial)
```

### Sidebar Design
- Fundo: `--bg-sidebar` (#F8FAFB) com border-right sutil
- Item ativo: fundo `--primary-subtle`, texto `--primary`, ícone `--primary-light`
- Item hover: fundo `--bg-subtle`
- Logo "DeepLead": topo, 20px padding
- Collapse: ícone-only (64px) com tooltip nos items

---

## ✍️ Wordmark — "DeepLead" ✅

**Conceito:** tipografia Inter Bold, levemente trabalhada.

```
"Deep"  → peso 700, cor --primary (#127284)
"Lead"  → peso 700, cor --accent (#F9795A)
```

Alternativas:
- `DeepLead` em uma única cor `--primary` com um ícone circular simples
- `DL` monograma em formato de ícone quadrado arredondado (--radius-md) com gradiente teal→coral

Vamos definir e posso gerar as opções visuais para escolha.

---

## 🌍 Internacionalização (i18n) ✅

**Estratégia: Browser-first + toggle manual**

```typescript
// Lógica de detecção
const getBrowserLocale = (): 'pt-BR' | 'en' => {
  const lang = navigator.language || navigator.languages?.[0];
  return lang?.startsWith('pt') ? 'pt-BR' : 'en';
};

// Suportados:
// pt-BR — Português do Brasil (padrão para demo)
// en    — English
```

**Toggle discreto:**
- Pequeno seletor no canto do topbar ou footer da sidebar
- Formato: `PT | EN` — pills pequenas, sem destaque excessivo
- Persiste em localStorage

**Arquitetura:** next-intl (biblioteca padrão para Next.js i18n)
- Arquivos de tradução: `/messages/pt-BR.json` e `/messages/en.json`
- Todas as strings de UI extraídas desde o início

---

## 🔄 Microanimações ✅

```css
/* Princípio: sutil, rápido, nunca bloqueia o usuário */

/* Transições padrão */
--transition-fast:   120ms ease-out;   /* hover simples */
--transition-base:   200ms ease-out;   /* maioria das animações */
--transition-slow:   300ms ease-out;   /* modais, drawers */
--transition-spring: 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Efeitos */
Card hover:          translateY(-2px) + shadow-md (200ms)
Button hover:        brightness(0.95) (120ms)
Sidebar collapse:    width 250ms ease-out
Modal open:          scale(0.97→1) + fade (200ms)
Toast/notif:         slide-in + fade (300ms)
Skeleton loading:    shimmer animado em --bg-subtle
IA typing:           três pontos pulsando em --ai-primary (coral)
Page transition:     fade + slide-up 8px (150ms)
```

---

## 🧩 Componentes Chave

### Cards
```
Background:   --bg-card (#FFFFFF)
Border:       1px solid --border-default (#DAE1EA)
Border-radius: --radius-lg (16px)
Padding:      --space-6 (24px)
Shadow:       --shadow-sm (hover: --shadow-md)
Transition:   200ms ease-out
```

### Botões
```
Primary:    bg --accent (#F9795A), texto branco, radius-full, padding 12px 24px
            hover: brightness(0.92) + translateY(-1px)
Secondary:  border --primary, texto --primary, bg transparente
            hover: bg --primary-subtle
Ghost:      sem border, texto --text-secondary, hover bg --bg-subtle
Danger:     bg --error, texto branco
```

### Badges de Status
```
new:       texto --primary, bg --primary-subtle (#EBF7FA)
open:      texto #CA8A04, bg --warning-subtle
pending:   texto --text-secondary, bg --bg-subtle
resolved:  texto --success, bg --success-subtle
lost:      texto --error, bg --error-subtle
```

### Elementos de IA
```
Container: bg --ai-bg (#FEF0EC), border-left 3px solid --ai-primary
Ícone:     ✦ ou ◈ em --ai-primary (coral)
Texto:     --text-primary normal
Badge:     "IA" pill em --ai-primary/15 com texto --ai-primary
```

---

## ❓ Questões Ainda em Aberto

1. **Wordmark final:** "Deep" teal + "Lead" coral — ou prefere outra abordagem? Posso gerar opções visuais
2. **Dark mode:** Necessário para o demo ou fica para depois?
3. **Segmentos além do imobiliário:** Quais quer mostrar como opção no demo? (clínicas, educação, consultórios?)
4. **Idioma default da demo:** PT-BR ou inglês?

---

*Documento vivo — atualizado após cada decisão de design.*

# PLANO DE CAPTAÇÃO DE LEADS

**Programa Minha Casa Minha Vida**
Lista viva com WhatsApp | Atualização semanal automatizada

**Documento preparado por:** Imobiliária
**Versão:** 1.0 | 2025

---

## 1. Sumário Executivo

**Insight central:** O lead do MCMV não acorda pensando em comprar um imóvel — ele acorda pagando aluguel e querendo parar. A captação eficaz intercepta essa dor, não o desejo. Isso muda fontes, linguagem e gatilho de entrada na lista.

Este documento descreve um sistema de geração automatizada e contínua de leads qualificados para a venda de imóveis enquadrados no Programa Minha Casa Minha Vida (MCMV). O objetivo é construir uma lista ativa de potenciais compradores que contenha obrigatoriamente o número de WhatsApp de cada lead, e que se renove semanalmente de forma automatizada.

Os pilares da estratégia são:
- Captura baseada em dor habitacional, não em busca ativa por imóvel.
- Sete fontes de dados públicas e automatizáveis, priorizadas por score de intenção.
- Seis gatilhos de vida que geram novos leads organicamente toda semana.
- Pipeline de qualificação e enriquecimento com validação obrigatória de WhatsApp.
- Ciclo semanal de atualização com detecção de leads obsoletos (decay detection).

## 2. Contexto: O Mercado MCMV

### 2.1 O Programa e as Faixas de Renda
O Minha Casa Minha Vida foi relançado em 2023 com condições mais amplas de financiamento e subsídio. A segmentação por faixas de renda define o perfil de lead e a abordagem comercial:

| Faixa | Renda Familiar Bruta | Subsídio | Destaque |
|-------|----------------------|----------|----------|
| Faixa 1 | Até R$ 2.640 | Máximo (subsidiado) | 50 anos para pagar, juros mínimos |
| Faixa 2 | R$ 2.640 a R$ 4.400 | Subsídio parcial | Uso do FGTS potencializado |
| Faixa 3 | R$ 4.400 a R$ 8.000 | Juros reduzidos | Maior poder de escolha do imóvel |

### 2.2 Por que a Abordagem Convencional Falha
Corretoras e imobiliárias tradicionais focam em portais imobiliários (Zap, Viva Real) e anúncios pagos em redes sociais. Esse modelo tem três problemas estruturais para o MCMV:
1. **Competição altíssima:** todos os concorrentes disputam o mesmo espaço.
2. **CPM elevado:** o público-alvo é amplo e pouco segmentado, inflando o custo por lead.
3. **Lead frio:** o usuário não declarou urgência, apenas navegou pelo anúncio.

A estratégia deste documento ataca o problema de forma diferente: em vez de esperar o lead buscar um imóvel, interceptamos a dor habitacional antes dela se transformar em intenção de busca formal. Isso reduz a concorrência e eleva drasticamente a taxa de conversão inicial.

## 3. Perfil do Lead Ideal (ICP)

O Ideal Customer Profile para MCMV combina critérios socioeconômicos obrigatórios (elegibilidade ao programa) com sinais comportamentais que indicam urgência e abertura para a compra:

| Dimensão | Descrição do Perfil Ideal |
|----------|---------------------------|
| Renda familiar bruta | Entre R$ 2.000 e R$ 8.000 (faixas 1, 2 e 3 do MCMV) |
| Situação atual de moradia | Inquilino pagando aluguel (não proprietário de imóvel) |
| Vínculo empregatício | CLT com ao menos 3 anos (FGTS disponível para entrada) |
| Histórico de imóvel | Nunca foi proprietário de imóvel residencial |
| Canal dominante | WhatsApp como principal meio de comunicação |
| Localização | Município ou região com oferta de empreendimentos MCMV |
| Gatilho principal | Reajuste de aluguel, nascimento de filho ou casamento recente |
| Nível de consciência | Sabe que paga aluguel; pode não saber ainda que se qualifica ao MCMV |

**Ponto crítico:** uma parcela significativa dos leads MCMV **NÃO SABE** que se qualifica ao programa. A abordagem educativa (mostrar elegibilidade) converte melhor do que a abordagem transacional (mostrar imóvel).

## 4. Fontes de Captação — as 7 Estratégias

### 4.1 OLX e Facebook Marketplace — Anúncios "Procuro"
- **Score de intenção:** 95/100
- **Atualização:** diária

Pessoas que postam anúncios do tipo "procuro apartamento 2 quartos até R$ 900" no OLX ou Facebook Marketplace são leads MCMV de altíssima qualidade. Em um único post público, o lead já declara: urgência de moradia, faixa de preço (que indica renda compatível com o MCMV) e o número de WhatsApp para contato.

**Implementação técnica:**
- Scraper Python (Playwright) monitora diariamente os termos: "procuro apartamento", "procuro casa", "aluguel" + cidade-alvo.
- Regex extrai número de WhatsApp do texto do anúncio (formatos: 11 9xxxx-xxxx, (11) 9xxxx-xxxx, wa.me/55...).
- Filtros: preço declarado entre R$ 600 e R$ 1.500, localização no raio de atuação, anúncio com menos de 7 dias.
- Resultado: nome, localização, faixa de preço, WhatsApp e texto de dor declarada.

### 4.2 Grupos de Facebook de Bairros e Aluguel
- **Score de intenção:** 90/100
- **Atualização:** diária

Grupos como "Aluguel [Cidade] Zona Sul", "Moradores de [Bairro]" e "Imóveis Baratos [Região]" concentram dezenas de posts semanais de famílias expressando dor habitacional. Posts como "aluguel subiu 40%, preciso sair" ou "alguém indica imóvel barato" são sinais de urgência máxima.

**Implementação técnica:**
- Mapeamento inicial: listar os 20-30 grupos mais relevantes da região de atuação.
- Scraping via Graph API (grupos públicos) ou solução headless (grupos privados com conta participante).
- LLM classifica posts por nível de urgência (1-10) e tipo de dor (custo, espaço, rescisão).
- Extração de WhatsApp dos comentários e do perfil do autor.

### 4.3 Comentários em Vídeos do YouTube sobre MCMV
- **Score de intenção:** 88/100
- **Atualização:** semanal

Vídeos como "Como funciona o Minha Casa Minha Vida 2024" e "Simulador FGTS Caixa" acumulam centenas de comentários de pessoas pedindo ajuda específica: "moro em [cidade], ganho R$ 3.200, posso me inscrever?". Esse é um lead no fundo do funil que já foi educado pelo vídeo e está pedindo um corretor.

**Implementação técnica:**
- YouTube Data API v3 (gratuita): busca vídeos por termo, coleta commentThreads paginados.
- LLM filtra comentários com intenção de compra declarada ou pergunta sobre elegibilidade.
- Enriquecimento: perfil do comentarista linkado ao Instagram (bio com WhatsApp) ou canal do YouTube.
- Prioridade: comentários com menos de 30 dias e com resposta de outros usuários (indica engajamento real).

### 4.4 Comentários nos Perfis de Concorrentes
- **Score de intenção:** 92/100
- **Atualização:** semanal

Os perfis públicos de Caixa Econômica Federal, MRV, Tenda e Direcional no Instagram e Facebook publicam regularmente conteúdo sobre MCMV e coletam milhares de comentários com intenção declarada: "tenho interesse", "como me inscrevo?", "tem empreendimento em [cidade]?". Esses leads já foram convencidos pelo marketing do concorrente — falta apenas o atendimento.

**Implementação técnica:**
- Instagram Graph API (para perfis públicos) ou scraper headless para coleta de comentários.
- Filtragem por: menção à cidade-alvo, pergunta sobre elegibilidade, expressão de interesse explícita.
- Extração de WhatsApp via bio do Instagram do comentarista ou pelo próprio comentário.
- Alerta semanal: novos posts de concorrentes com alto engajamento = oportunidade de captação.

### 4.5 Calculadora "Sair do Aluguel" — Lead Magnet Viral
- **Score de intenção:** 96/100
- **Lead inbound qualificado**

Esta é a fonte mais disruptiva do conjunto porque inverte o fluxo: o lead chega até você, já calculou a própria dor e pediu ajuda.
Uma calculadora digital simples pergunta: "Quanto você paga de aluguel? Há quantos anos? Qual sua renda familiar?" O resultado mostra: "Você já gastou R$ X em aluguel. Pagando a mesma quantia em parcelas MCMV, você estaria a N meses de ser dono(a)." O impacto emocional é forte e o compartilhamento espontâneo pelo WhatsApp torna essa ferramenta viral nos grupos de bairro.

**Implementação técnica:**
- Página leve (HTML/React) hospedada em domínio da imobiliária ou subdomínio.
- Ao exibir o resultado, formulário solicita nome e WhatsApp para "ver os imóveis disponíveis".
- Integração com CRM via webhook: lead entra automaticamente com score máximo e fonte "calculadora".
- Distribuição: grupos de WhatsApp de bairros, stories do Instagram, anúncio no Facebook por apenas R$ 5/dia.

### 4.6 Gatilho de 3 Anos de FGTS — LinkedIn e Instagram
- **Score de intenção:** 78/100
- **Lead frio com timing perfeito**

Ao completar 3 anos de carteira assinada, o trabalhador acumula FGTS suficiente para ser usado como entrada no MCMV. Quase nenhum sabe disso. Monitorar posts de "aniversário de empresa" e "3 anos na [empresa]" no LinkedIn e Instagram permite identificar esse lead no exato momento em que ele se torna elegível. A abordagem "Parabéns pelos 3 anos! Você sabia que agora pode usar seu FGTS?" tem abertura altíssima.

**Implementação técnica:**
- LinkedIn API ou scraper: busca posts com termos "3 anos", "três anos", "aniversário de empresa" + cidade-alvo.
- Instagram: monitoramento de hashtags como #3anosdeempresa #carteiraassinada + geolocalização.
- Filtragem por cargo (evitar altos executivos, focar em cargos operacionais com renda MCMV-compatível).
- Enriquecimento: WhatsApp via bio do Instagram ou contato público do perfil.

### 4.7 Parcerias com Imobiliárias de Locação
- **Score de intenção:** 85/100
- **Canal sustentável sem automação**

Cada imobiliária de locação da região gerencia dezenas a centenas de contratos de aluguel ativos. Esses inquilinos renovam contratos, recebem reajustes e eventualmente precisam sair. Uma parceria formal — com comissão por lead qualificado que feche contrato MCMV — transforma imobiliárias de locação em canais de alimentação contínua da sua lista, sem necessidade de automação ou scraping.

**Implementação:**
- Mapeamento via Google Maps: identificar todas as imobiliárias de locação num raio de 20km.
- Proposta de parceria: indicação de inquilinos com contratos vencendo ou com histórico de reajuste recente.
- Modelo de remuneração: R$ X por lead com WhatsApp validado + Y% de comissão sobre contrato fechado.
- Ferramenta de indicação: formulário simples onde o parceiro registra o lead (nome + WhatsApp + renda estimada).

## 5. Gatilhos de Vida — O Que Cria Novos Leads Toda Semana

A lista viva é sustentável porque eventos da vida real criam novos leads organicamente e de forma contínua. Os seis gatilhos abaixo geram novos candidatos a MCMV todas as semanas, independentemente de ação da imobiliária:

| Gatilho | Como Identificar | Canal de Monitoramento |
|---------|------------------|------------------------|
| Primeiro filho | Posts de chegada de bebê, chá de fralda, gravidez | Instagram: hashtags de bebê + cidade |
| Casamento recente | Anúncios de casamento ou posts de lua de mel | Instagram: #casamento + localização |
| Reajuste de aluguel | Reclamações sobre aumento de aluguel em grupos | Facebook Groups + Twitter/X |
| 3 anos de CLT | Posts de aniversário de emprego | LinkedIn + Instagram |
| Despejo ou rescisão | Posts pedindo indicação urgente de imóvel | Facebook Groups de bairro |
| Mudança de cidade | Posts de apresentação + busca de aluguel na cidade | Facebook Groups locais |

**Insight operacional:** os gatilhos de "primeiro filho" e "casamento recente" são os mais previsíveis e com maior urgência. Uma família com bebê chegando e 2 quartos que precisam de espaço é o lead com maior probabilidade de fechar em 90 dias.

## 6. Pipeline da Lista Viva — Ciclo Semanal

O pipeline automatizado roda toda madrugada de segunda-feira, processando novas entradas e limpando registros obsoletos. Ao final do ciclo, a equipe comercial recebe um delta claro: novos leads ranqueados + leads removidos da semana anterior.

| # | Etapa | Descrição e Lógica |
|---|-------|--------------------|
| 1 | Coleta multi-fonte | As 7 fontes rodam em paralelo: OLX, FB Marketplace, Grupos de Facebook, YouTube, Comentários de concorrentes, Calculadora (leads inbound) e indicações de parceiros. |
| 2 | Qualificação por LLM | Modelo de linguagem classifica cada lead: renda aparente estimada, nível de urgência (1-10), gatilho de dor identificado e compatibilidade com o portfólio de imóveis disponível. |
| 3 | Enriquecimento de WhatsApp | Número extraído diretamente da fonte (OLX, FB) ou rastreado via bio do Instagram. Todos os números passam por validação WA-check antes de entrar na lista. |
| 4 | Deduplicação e Decay | Remove: números já contatados nos últimos 90 dias, anúncios deletados ou expirados, leads em bairros fora do raio de atuação, números com WA-check negativo. |
| 5 | Entrega no CRM | CRM ou Google Sheets recebe o delta da semana: novos leads com score, fonte, gatilho e sugestão de texto de abordagem para WhatsApp personalizado por faixa MCMV. |

## 7. Modelo de Abordagem no WhatsApp

Cada lead recebe uma abordagem personalizada de acordo com a fonte de captação e o gatilho identificado. Abaixo, os três modelos de mensagem de abertura mais eficazes:

**Modelo A — Lead do OLX / Anúncio Procuro**
> Oi [Nome]! Vi que você está buscando um apartamento de [X] quartos. Tenho uma informação que pode mudar seus planos: com a renda que você descreveu, você provavelmente se qualifica ao Minha Casa Minha Vida — a prestação pode ser menor do que o aluguel que você pagaria. Posso te mostrar as opções disponíveis na [Cidade]?

**Modelo B — Lead do Gatilho de 3 Anos de FGTS**
> Oi [Nome], parabéns pelos [3] anos na [Empresa]! Aproveito para te passar uma informação importante: quem tem 3 anos ou mais de carteira assinada pode usar o FGTS como entrada no Minha Casa Minha Vida. Você sabia disso? Posso fazer uma simulação gratuita de quanto você poderia financiar?

**Modelo C — Lead da Calculadora (Inbound)**
> Oi [Nome]! Vi que você usou nossa calculadora de aluguel vs. financiamento. Pelo que você informou, você pode se qualificar ao Minha Casa Minha Vida Faixa [X]. Tenho [N] opções de imóvel na sua região dentro desse valor. Quando você teria 15 minutos para conversar?

## 8. Stack Tecnológico Recomendado

| Camada | Ferramenta Recomendada | Função |
|--------|------------------------|--------|
| Coleta | Python + Playwright | Scraping de OLX, Facebook, YouTube, Instagram |
| Orquestração | n8n (self-hosted) ou Prefect | Agendamento semanal e gestão de erros |
| Qualificação | Claude API (LLM) | Scoring de intenção, classificação de dor |
| Banco de dados | Supabase (PostgreSQL) | Armazenamento, deduplicação e histórico |
| Validação WA | WA-check API ou Evolution API | Confirmar número WhatsApp ativo antes de inserir |
| Entrega | Google Sheets + Webhook | Delta semanal para CRM ou planilha da equipe |
| Calculadora | Vercel (Next.js) ou Webflow | Lead magnet inbound hospedado |

## 9. Conformidade com a LGPD

Todas as fontes descritas neste documento são compostas de dados publicamente disponíveis. A coleta em si é legal. A restrição da LGPD se aplica ao contato ativo — que exige base legal adequada.

**Boas práticas obrigatórias para contato ativo via WhatsApp:**
- Identificar a imobiliária claramente na primeira mensagem.
- Informar como o contato do lead foi obtido (ex: "vi seu anúncio no OLX").
- Oferecer opção de opt-out imediato e honrá-la instantaneamente.
- Não armazenar dados sensíveis (renda exata, CPF) sem consentimento expresso.
- Manter log de origem e data de cada lead para auditoria.

## 10. Próximos Passos Recomendados

Sequência sugerida para implementação em 30 dias:

- **Semana 1:** Construir a Calculadora "Sair do Aluguel" e distribuir para 5 grupos de WhatsApp da região. Coletar primeiros leads inbound.
- **Semana 2:** Implementar o scraper de OLX e Facebook Marketplace. Testar extração de WhatsApp e validação WA-check.
- **Semana 3:** Ativar a coleta de Grupos de Facebook e YouTube. Configurar pipeline de qualificação por LLM.
- **Semana 4:** Integrar entrega no CRM. Contatar as primeiras imobiliárias de locação para parceria. Medir taxa de resposta por modelo de abordagem.

---
*Documento gerado com suporte de IA. Revisão e validação legal recomendadas antes da implementação.*
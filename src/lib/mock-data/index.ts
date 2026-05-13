import type {
  User, Business, BusinessMember, Lead, Conversation,
  Message, Campaign, AgendaEvent, AnalyticsSummary, PipelineColumn, AiInsight
} from '@/types';

// ============================================
// MOCK USERS / TEAM
// ============================================
export const mockUser: User = {
  id: 'u1',
  name: 'Bryan Costa',
  email: 'bryan@valore.com.br',
  platform_role: 'basic',
  created_at: '2025-01-10T10:00:00Z',
};

export const mockTeam: BusinessMember[] = [
  {
    id: 'm1',
    business_id: 'b1',
    user: { id: 'u1', name: 'Bryan Costa', email: 'bryan@valore.com.br', platform_role: 'basic', created_at: '2025-01-10T10:00:00Z' },
    business_role: 'gestor',
    joined_at: '2025-01-10T10:00:00Z',
    assigned_leads_count: 8,
  },
  {
    id: 'm2',
    business_id: 'b1',
    user: { id: 'u2', name: 'Mariana Silva', email: 'mariana@valore.com.br', platform_role: 'basic', created_at: '2025-02-05T09:00:00Z' },
    business_role: 'colaborador',
    joined_at: '2025-02-05T09:00:00Z',
    assigned_leads_count: 12,
  },
  {
    id: 'm3',
    business_id: 'b1',
    user: { id: 'u3', name: 'Rafael Mendes', email: 'rafael@valore.com.br', platform_role: 'basic', created_at: '2025-03-01T08:30:00Z' },
    business_role: 'colaborador',
    joined_at: '2025-03-01T08:30:00Z',
    assigned_leads_count: 9,
  },
  {
    id: 'm4',
    business_id: 'b1',
    user: { id: 'u4', name: 'Juliana Rocha', email: 'juliana@valore.com.br', platform_role: 'basic', created_at: '2025-04-12T11:00:00Z' },
    business_role: 'colaborador',
    joined_at: '2025-04-12T11:00:00Z',
    assigned_leads_count: 6,
  },
];

export const mockBusiness: Business = {
  id: 'b1',
  name: 'Valore Imóveis',
  segment: 'real_estate',
  cnpj: '12.345.678/0001-99',
  address: 'Av. Atlântica, 1702 — Barra, Salvador/BA',
  phone: '(71) 98765-4321',
  website: 'www.valoreimoveis.com.br',
  members: mockTeam,
  created_at: '2025-01-10T10:00:00Z',
};

// ============================================
// MOCK LEADS
// @deprecated — a página /leads agora busca do Supabase via /api/leads.
// Este array ainda é usado por: dashboard, pipeline, chat e agenda (migração futura).
// NÃO use em novos componentes — use fetchLeads() de @/lib/services/leads
// ============================================
export const mockLeads: Lead[] = [
  {
    id: 'l1', business_id: 'b1', name: 'Carlos Augusto Ribeiro', phone: '(71) 99234-1100',
    email: 'carlos.ribeiro@email.com', status: 'open', source: 'whatsapp',
    score: 92, assigned_to: mockTeam[1], tags: ['quente', 'financiado'],
    stage: 'negotiation', created_at: '2026-04-10T09:00:00Z', last_contact_at: '2026-05-06T14:30:00Z',
    real_estate_profile: {
      lead_id: 'l1',
      purchase_intent: 'buy',
      interest_notes: 'Apto 302 — Condomínio Brise Barra',
      budget_max: 680000,
      bedrooms_min: 3,
      desired_neighborhoods: ['Barra'],
      financing_pre_approved: true,
    },
  },
  {
    id: 'l2', business_id: 'b1', name: 'Fernanda Oliveira', phone: '(71) 98876-5544',
    email: 'fernanda.o@gmail.com', status: 'new', source: 'instagram',
    score: 78, assigned_to: mockTeam[2], tags: ['novo', 'vista-mar'],
    stage: 'contact_initiated', created_at: '2026-05-01T11:00:00Z', last_contact_at: '2026-05-05T09:15:00Z',
    real_estate_profile: {
      lead_id: 'l2',
      purchase_intent: 'buy',
      interest_notes: 'Cobertura — Jardins do Farol',
      budget_max: 1200000,
      property_types: ['penthouse'],
    },
  },
  {
    id: 'l3', business_id: 'b1', name: 'Marcos Vieira Santos', phone: '(71) 99112-8833',
    status: 'pending', source: 'facebook', score: 55, assigned_to: mockTeam[1],
    tags: ['pendente', 'financiamento'],
    stage: 'visit_scheduled', created_at: '2026-04-20T08:30:00Z', last_contact_at: '2026-05-04T16:00:00Z',
    real_estate_profile: {
      lead_id: 'l3',
      purchase_intent: 'buy',
      interest_notes: 'Casa — Alphaville Salvador I',
      budget_max: 890000,
      property_types: ['house'],
      financing_pre_approved: false,
    },
  },
  {
    id: 'l4', business_id: 'b1', name: 'Patrícia Lima', phone: '(71) 99887-2211',
    email: 'patricia.lima@empresa.com', status: 'open', source: 'website',
    score: 88, assigned_to: mockTeam[3], tags: ['empresa', 'urgente'],
    stage: 'proposal', created_at: '2026-04-25T10:00:00Z', last_contact_at: '2026-05-06T11:00:00Z',
    real_estate_profile: {
      lead_id: 'l4',
      purchase_intent: 'buy',
      interest_notes: 'Sala Comercial — Empresarial Paralela',
      budget_max: 420000,
      property_types: ['commercial'],
    },
  },
  {
    id: 'l5', business_id: 'b1', name: 'Rodrigo Carvalho', phone: '(71) 98554-9900',
    status: 'won', source: 'referral', score: 98, assigned_to: mockTeam[0],
    tags: ['fechado', 'indicação'],
    stage: 'won', created_at: '2026-03-15T09:00:00Z', last_contact_at: '2026-04-30T14:00:00Z',
    real_estate_profile: {
      lead_id: 'l5',
      purchase_intent: 'buy',
      interest_notes: 'Apto 1501 — Torre Atlântico',
      budget_max: 950000,
      property_types: ['apartment'],
    },
  },
  {
    id: 'l6', business_id: 'b1', name: 'Aline Ferreira Costa', phone: '(71) 99342-6677',
    email: 'alinecosta@hotmail.com', status: 'new', source: 'whatsapp',
    score: 63, assigned_to: mockTeam[2], tags: ['novo'],
    stage: 'new_lead', created_at: '2026-05-06T17:00:00Z', last_contact_at: '2026-05-06T17:00:00Z',
    real_estate_profile: {
      lead_id: 'l6',
      purchase_intent: 'buy',
      interest_notes: 'Apto 2 quartos — Pituba',
      budget_max: 380000,
      bedrooms_min: 2,
      desired_neighborhoods: ['Pituba'],
    },
  },
  {
    id: 'l7', business_id: 'b1', name: 'Eduardo Maia', phone: '(71) 99765-3322',
    status: 'open', source: 'instagram', score: 71, assigned_to: mockTeam[1],
    tags: ['instagram', 'permuta'],
    stage: 'contact_initiated', created_at: '2026-04-28T12:00:00Z', last_contact_at: '2026-05-05T10:30:00Z',
    real_estate_profile: {
      lead_id: 'l7',
      purchase_intent: 'buy',
      interest_notes: 'Permuta — Casa por Apto na Barra',
      budget_max: 750000,
      has_property_to_sell: true,
      desired_neighborhoods: ['Barra'],
    },
  },
  {
    id: 'l8', business_id: 'b1', name: 'Renata Nunes', phone: '(71) 98843-1199',
    email: 'renata.nunes@gmail.com', status: 'lost', source: 'direct',
    score: 20, tags: ['perdido', 'sem-retorno'],
    stage: 'lost', created_at: '2026-04-01T09:00:00Z', last_contact_at: '2026-04-15T08:00:00Z',
    real_estate_profile: {
      lead_id: 'l8',
      purchase_intent: 'buy',
      interest_notes: 'Apto Jardim Armação',
      budget_max: 300000,
    },
  },
  {
    id: 'l9', business_id: 'b1', name: 'Thiago Borges', phone: '(71) 99231-7788',
    status: 'pending', source: 'whatsapp', score: 84, assigned_to: mockTeam[3],
    tags: ['alto-valor', 'direto'],
    stage: 'visit_scheduled', created_at: '2026-04-22T14:00:00Z', last_contact_at: '2026-05-06T09:00:00Z',
    real_estate_profile: {
      lead_id: 'l9',
      purchase_intent: 'buy',
      interest_notes: 'Penthouse — Barra Prime',
      budget_max: 2100000,
      property_types: ['penthouse'],
      desired_neighborhoods: ['Barra'],
    },
  },
  {
    id: 'l10', business_id: 'b1', name: 'Isabela Corrêa', phone: '(71) 99554-4433',
    email: 'isa.correa@hotmail.com', status: 'new', source: 'facebook',
    score: 47, assigned_to: mockTeam[2], tags: ['novo', 'first-time'],
    stage: 'new_lead', created_at: '2026-05-07T08:00:00Z', last_contact_at: '2026-05-07T08:00:00Z',
    real_estate_profile: {
      lead_id: 'l10',
      purchase_intent: 'buy',
      interest_notes: 'Primeiro imóvel — até 350k',
      budget_max: 350000,
    },
  },
];

// ============================================
// MOCK PIPELINE COLUMNS
// ============================================
export const mockPipelineColumns: PipelineColumn[] = [
  { id: 'new_lead',          label: 'Novo Lead',        color: '#3BAFC4', leads: mockLeads.filter(l => l.stage === 'new_lead') },
  { id: 'contact_initiated', label: 'Contato Iniciado', color: '#555D6F', leads: mockLeads.filter(l => l.stage === 'contact_initiated') },
  { id: 'visit_scheduled',   label: 'Visita Agendada',  color: '#127284', leads: mockLeads.filter(l => l.stage === 'visit_scheduled') },
  { id: 'proposal',          label: 'Proposta',          color: '#F59E0B', leads: mockLeads.filter(l => l.stage === 'proposal') },
  { id: 'negotiation',       label: 'Negociação',        color: '#F9795A', leads: mockLeads.filter(l => l.stage === 'negotiation') },
  { id: 'won',               label: 'Fechado ✓',         color: '#22A06B', leads: mockLeads.filter(l => l.stage === 'won') },
  { id: 'lost',              label: 'Perdido',           color: '#E03131', leads: mockLeads.filter(l => l.stage === 'lost') },
];

// ============================================
// MOCK CONVERSATIONS
// ============================================
export const mockConversations: Conversation[] = [
  {
    id: 'c1', business_id: 'b1', lead: mockLeads[0], status: 'open',
    channel: 'whatsapp', assigned_to: mockTeam[1],
    unread_count: 2, tags: ['quente', 'negociação'],
    created_at: '2026-04-10T09:00:00Z', updated_at: '2026-05-06T14:30:00Z',
    messages: [
      { id: 'msg1', conversation_id: 'c1', sender_type: 'lead', content: 'Olá! Gostaria de saber mais sobre o apartamento 302 no Brise Barra.', created_at: '2026-05-06T10:00:00Z', read: true },
      { id: 'msg2', conversation_id: 'c1', sender_type: 'agent', content: 'Olá Carlos! Claro, com prazer. O apto 302 tem 3 suítes, 2 vagas e vista parcial para o mar. Posso agendar uma visita para você?', created_at: '2026-05-06T10:15:00Z', read: true },
      { id: 'msg3', conversation_id: 'c1', sender_type: 'lead', content: 'Que ótimo! Tem disponibilidade para amanhã de manhã?', created_at: '2026-05-06T14:20:00Z', read: false },
      { id: 'msg4', conversation_id: 'c1', sender_type: 'lead', content: 'Ou sábado também seria possível?', created_at: '2026-05-06T14:25:00Z', read: false },
    ],
  },
  {
    id: 'c2', business_id: 'b1', lead: mockLeads[1], status: 'new',
    channel: 'instagram', assigned_to: mockTeam[2],
    unread_count: 1, tags: ['novo'],
    created_at: '2026-05-01T11:00:00Z', updated_at: '2026-05-05T09:15:00Z',
    messages: [
      { id: 'msg5', conversation_id: 'c2', sender_type: 'lead', content: 'Vi o anúncio da cobertura no Instagram. Qual é o valor?', created_at: '2026-05-05T09:15:00Z', read: false },
    ],
  },
  {
    id: 'c3', business_id: 'b1', lead: mockLeads[3], status: 'open',
    channel: 'whatsapp', assigned_to: mockTeam[3],
    unread_count: 0, tags: ['comercial', 'urgente'],
    created_at: '2026-04-25T10:00:00Z', updated_at: '2026-05-06T11:00:00Z',
    messages: [
      { id: 'msg6', conversation_id: 'c3', sender_type: 'agent', content: 'Boa tarde Patrícia! Seguindo com a proposta da sala comercial, já convesei com o proprietário e ele aceita R$ 415.000.', created_at: '2026-05-06T11:00:00Z', read: true },
      { id: 'msg7', conversation_id: 'c3', sender_type: 'lead', content: 'Perfeito! Vou conversar com sócio e retorno amanhã.', created_at: '2026-05-06T11:30:00Z', read: true },
    ],
  },
  {
    id: 'c4', business_id: 'b1', lead: mockLeads[8], status: 'pending',
    channel: 'whatsapp', assigned_to: mockTeam[3],
    unread_count: 0, tags: ['alto-valor'],
    created_at: '2026-04-22T14:00:00Z', updated_at: '2026-05-06T09:00:00Z',
    messages: [
      { id: 'msg8', conversation_id: 'c4', sender_type: 'lead', content: 'Bom dia! Tenho interesse no Penthouse da Barra Prime. É possível uma visita particular fora do horário comercial?', created_at: '2026-05-06T09:00:00Z', read: true },
      { id: 'msg9', conversation_id: 'c4', sender_type: 'agent', content: 'Bom dia Thiago! Com certeza. Temos disponibilidade sábado às 10h ou domingo às 14h. Qual prefere?', created_at: '2026-05-06T09:30:00Z', read: true },
    ],
  },
  {
    id: 'c5', business_id: 'b1', lead: mockLeads[5], status: 'new',
    channel: 'whatsapp', assigned_to: mockTeam[2],
    unread_count: 1, tags: ['novo'],
    created_at: '2026-05-06T17:00:00Z', updated_at: '2026-05-06T17:00:00Z',
    messages: [
      { id: 'msg10', conversation_id: 'c5', sender_type: 'lead', content: 'Oi! Vi um apartamento de 2 quartos na Pituba por 380k no OLX. Vocês têm algo assim?', created_at: '2026-05-06T17:00:00Z', read: false },
    ],
  },
];

// ============================================
// MOCK CAMPAIGNS
// ============================================
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1', business_id: 'b1', name: 'Lançamento Torre Atlântico', type: 'broadcast',
    channel: 'whatsapp', status: 'completed', audience_count: 1240, sent_count: 1238,
    opened_count: 892, clicked_count: 234, sent_at: '2026-04-15T10:00:00Z',
    created_at: '2026-04-10T09:00:00Z',
    content: 'Exclusivo para você: novo lançamento Torre Atlântico na Barra. Aptos de 2 e 3 suítes a partir de R$ 680.000. Condições especiais de pré-lançamento.',
  },
  {
    id: 'camp2', business_id: 'b1', name: 'Semana do Imóvel — Instagram', type: 'social_post',
    channel: 'instagram', status: 'running', audience_count: 5400, sent_count: 5400,
    opened_count: 1820, clicked_count: 310, sent_at: '2026-05-01T08:00:00Z',
    created_at: '2026-04-28T15:00:00Z',
  },
  {
    id: 'camp3', business_id: 'b1', name: 'Follow-up Leads Frios', type: 'drip',
    channel: 'whatsapp', status: 'running', audience_count: 87, sent_count: 43,
    opened_count: 31, clicked_count: 8, scheduled_at: '2026-04-20T09:00:00Z',
    created_at: '2026-04-18T11:00:00Z',
    content: 'Sequência automática: D+0 boas-vindas → D+3 catálogo → D+7 depoimentos → D+14 oferta exclusiva',
  },
  {
    id: 'camp4', business_id: 'b1', name: 'Dia das Mães — Imóvel dos Sonhos', type: 'broadcast',
    channel: 'whatsapp', status: 'scheduled', audience_count: 2100,
    scheduled_at: '2026-05-11T09:00:00Z', created_at: '2026-05-05T14:00:00Z',
    content: 'Presenteie sua mãe com o lar que ela merece. Seleção especial de imóveis com condições facilitadas.',
  },
  {
    id: 'camp5', business_id: 'b1', name: 'Retargeting Facebook', type: 'social_post',
    channel: 'facebook', status: 'draft', audience_count: 0,
    created_at: '2026-05-07T08:00:00Z',
  },
];

// ============================================
// MOCK AGENDA EVENTS
// ============================================
export const mockEvents: AgendaEvent[] = [
  {
    id: 'ev1', business_id: 'b1',
    title: 'Visita — Carlos Ribeiro — Brise Barra 302',
    type: 'visit', lead: mockLeads[0], assigned_to: mockTeam[1],
    start_at: '2026-05-07T10:00:00Z', end_at: '2026-05-07T11:00:00Z',
    location: 'Condomínio Brise Barra, Barra — Salvador/BA',
    confirmed: true,
  },
  {
    id: 'ev2', business_id: 'b1',
    title: 'Ligação — Fernanda Oliveira — Cobertura Jardins',
    type: 'call', lead: mockLeads[1], assigned_to: mockTeam[2],
    start_at: '2026-05-07T14:00:00Z', end_at: '2026-05-07T14:30:00Z',
    confirmed: false,
  },
  {
    id: 'ev3', business_id: 'b1',
    title: 'Follow-up — Marcos Vieira — Alphaville',
    type: 'follow_up', lead: mockLeads[2], assigned_to: mockTeam[1],
    start_at: '2026-05-08T09:00:00Z', end_at: '2026-05-08T09:30:00Z',
    confirmed: true,
  },
  {
    id: 'ev4', business_id: 'b1',
    title: 'Visita — Thiago Borges — Penthouse Barra Prime',
    type: 'visit', lead: mockLeads[8], assigned_to: mockTeam[3],
    start_at: '2026-05-10T10:00:00Z', end_at: '2026-05-10T12:00:00Z',
    location: 'Barra Prime Tower — Av. Oceânica, 2450',
    confirmed: true,
  },
  {
    id: 'ev5', business_id: 'b1',
    title: 'Reunião de equipe — Resultados do mês',
    type: 'meeting', assigned_to: mockTeam[0],
    start_at: '2026-05-08T15:00:00Z', end_at: '2026-05-08T16:00:00Z',
    confirmed: true, notes: 'Apresentar resultados de abril e metas de maio.',
  },
];

// ============================================
// MOCK ANALYTICS
// ============================================
function generateTimeSeries(days: number, base: number, variance: number): { date: string; value: number }[] {
  const result = [];
  const today = new Date('2026-05-07');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({
      date: d.toISOString().split('T')[0],
      value: Math.max(0, Math.round(base + (Math.random() - 0.5) * variance)),
    });
  }
  return result;
}

export const mockAnalytics: AnalyticsSummary = {
  total_leads: 247,
  leads_this_month: 38,
  leads_growth: 14.2,
  conversion_rate: 18.6,
  conversion_growth: 3.1,
  avg_response_time: '1h 52m',
  won_deals: 7,
  won_value: 4280000,
  lost_deals: 3,
  leads_by_source: [
    { source: 'whatsapp',  count: 98 },
    { source: 'instagram', count: 72 },
    { source: 'website',   count: 38 },
    { source: 'facebook',  count: 24 },
    { source: 'referral',  count: 11 },
    { source: 'direct',    count: 4  },
  ],
  leads_by_stage: [
    { stage: 'new_lead',          count: 12 },
    { stage: 'contact_initiated', count: 18 },
    { stage: 'visit_scheduled',   count: 9  },
    { stage: 'proposal',          count: 6  },
    { stage: 'negotiation',       count: 4  },
    { stage: 'won',               count: 7  },
    { stage: 'lost',              count: 3  },
  ],
  leads_over_time: generateTimeSeries(30, 8, 6),
  conversions_over_time: generateTimeSeries(30, 1.5, 2),
};

// ============================================
// AI INSIGHTS (mock)
// ============================================
export const mockAiInsights: AiInsight[] = [
  {
    id: 'ai1', business_id: 'b1', lead_id: 'l1',
    type: 'alert',
    title: 'Lead em risco de perda',
    description: 'Carlos Ribeiro está há 2 dias sem resposta após demonstrar alto interesse. Score caiu de 95 → 92. Recomendo contato urgente.',
    action_label: 'Ver conversa',
    is_read: false, is_dismissed: false,
    created_at: '2026-05-07T08:00:00Z',
  },
  {
    id: 'ai2', business_id: 'b1',
    type: 'opportunity',
    title: 'Melhor horário para campanha',
    description: 'Seus leads abrem mensagens 43% mais no período 18h–20h. Sua próxima campanha está agendada para 9h — considere ajustar.',
    action_label: 'Ajustar campanha',
    is_read: false, is_dismissed: false,
    created_at: '2026-05-07T07:00:00Z',
  },
  {
    id: 'ai3', business_id: 'b1',
    type: 'info',
    title: 'Desempenho da equipe',
    description: 'Mariana tem o menor tempo de resposta da equipe (42min) e maior taxa de visitas agendadas (68%). Destaque do mês.',
    action_label: 'Ver analytics',
    is_read: true, is_dismissed: false,
    created_at: '2026-05-06T18:00:00Z',
  },
];

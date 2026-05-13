import type { Locale } from '@/types';

type TranslationDict = Record<string, string | Record<string, string>>;

const translations: Record<Locale, TranslationDict> = {
  'pt-BR': {
    // Nav
    'nav.dashboard':      'Dashboard',
    'nav.contacts':       'Contatos',
    'nav.chat':           'Chat',
    'nav.pipeline':       'Pipeline',
    'nav.leads':          'Leads',
    'nav.campaigns':      'Campanhas',
    'nav.agenda':         'Agenda',
    'nav.analytics':      'Analytics',
    'nav.settings':       'Configurações',
    'nav.ai':             'Assistente IA',

    // Dashboard
    'dashboard.title':           'Dashboard',
    'dashboard.welcome':         'Bom dia',
    'dashboard.total_leads':     'Total de Leads',
    'dashboard.new_this_month':  'Novos este mês',
    'dashboard.conversion':      'Taxa de Conversão',
    'dashboard.avg_response':    'Tempo Médio de Resposta',
    'dashboard.won_deals':       'Negócios Fechados',
    'dashboard.revenue':         'Receita do Mês',
    'dashboard.recent_activity': 'Atividade Recente',
    'dashboard.ai_insights':     'Insights da IA',
    'dashboard.pipeline_summary':'Resumo do Pipeline',

    // Leads
    'leads.title':        'Leads',
    'leads.add':          'Novo Lead',
    'leads.search':       'Buscar lead...',
    'leads.filter':       'Filtrar',
    'leads.name':         'Nome',
    'leads.phone':        'Telefone',
    'leads.source':       'Origem',
    'leads.stage':        'Etapa',
    'leads.score':        'Score IA',
    'leads.assignedTo':   'Responsável',
    'leads.lastContact':  'Último Contato',
    'leads.actions':      'Ações',
    'leads.interest':     'Interesse',
    'leads.budget':       'Orçamento',

    // Pipeline stages
    'stage.new_lead':           'Novo Lead',
    'stage.contact_initiated':  'Contato Iniciado',
    'stage.visit_scheduled':    'Visita Agendada',
    'stage.proposal':           'Proposta',
    'stage.negotiation':        'Negociação',
    'stage.won':                'Fechado ✓',
    'stage.lost':               'Perdido',

    // Status
    'status.new':       'Novo',
    'status.open':      'Aberto',
    'status.pending':   'Pendente',
    'status.resolved':  'Resolvido',
    'status.won':       'Ganho',
    'status.lost':      'Perdido',

    // Source
    'source.whatsapp':  'WhatsApp',
    'source.instagram': 'Instagram',
    'source.facebook':  'Facebook',
    'source.website':   'Site',
    'source.referral':  'Indicação',
    'source.direct':    'Direto',

    // Chat
    'chat.title':           'Chat',
    'chat.inbox':           'Caixa de Entrada',
    'chat.search':          'Buscar conversa...',
    'chat.assign':          'Atribuir',
    'chat.transfer':        'Transferir',
    'chat.resolve':         'Resolver',
    'chat.type_message':    'Escreva uma mensagem...',
    'chat.send':            'Enviar',
    'chat.ai_suggestion':   'Sugestão da IA',
    'chat.use_suggestion':  'Usar sugestão',
    'chat.internal_note':   'Nota interna',
    'chat.templates':       'Templates',
    'chat.no_messages':     'Nenhuma mensagem ainda.',
    'chat.unread':          'não lida',
    'chat.all':             'Todas',
    'chat.mine':            'Minhas',

    // Pipeline
    'pipeline.title':       'Pipeline',
    'pipeline.add_lead':    'Adicionar Lead',
    'pipeline.view_list':   'Ver Lista',
    'pipeline.view_kanban': 'Ver Kanban',

    // Campaigns
    'campaigns.title':      'Campanhas',
    'campaigns.new':        'Nova Campanha',
    'campaigns.name':       'Nome',
    'campaigns.channel':    'Canal',
    'campaigns.type':       'Tipo',
    'campaigns.status':     'Status',
    'campaigns.audience':   'Público',
    'campaigns.sent':       'Enviados',
    'campaigns.opened':     'Abertos',
    'campaigns.scheduled':  'Agendado para',
    'campaigns.broadcast':  'Envio em Massa',
    'campaigns.social_post':'Publicação Social',
    'campaigns.drip':       'Sequência Automática',

    // Agenda
    'agenda.title':         'Agenda',
    'agenda.new_event':     'Novo Evento',
    'agenda.today':         'Hoje',
    'agenda.visit':         'Visita',
    'agenda.call':          'Ligação',
    'agenda.follow_up':     'Follow-up',
    'agenda.meeting':       'Reunião',

    // Analytics
    'analytics.title':       'Analytics',
    'analytics.leads':       'Leads',
    'analytics.conversions': 'Conversões',
    'analytics.revenue':     'Receita',
    'analytics.period':      'Período',
    'analytics.this_month':  'Este mês',
    'analytics.last_month':  'Mês anterior',
    'analytics.last_quarter':'Último trimestre',
    'analytics.by_source':   'Por Origem',
    'analytics.by_stage':    'Por Etapa',
    'analytics.by_collaborator': 'Por Colaborador',
    'analytics.response_time': 'Tempo de Resposta',

    // Settings
    'settings.title':        'Configurações',
    'settings.business':     'Meu Negócio',
    'settings.members':      'Membros',
    'settings.integrations': 'Integrações',
    'settings.billing':      'Faturamento',
    'settings.segment':      'Segmento',
    'settings.segment_label':'Tipo de Negócio',

    // Segment selector
    'segment.generic':      'Genérico',
    'segment.real_estate':  'Imobiliário',

    // Common
    'common.save':     'Salvar',
    'common.cancel':   'Cancelar',
    'common.delete':   'Excluir',
    'common.edit':     'Editar',
    'common.view':     'Ver',
    'common.close':    'Fechar',
    'common.loading':  'Carregando...',
    'common.search':   'Buscar',
    'common.filter':   'Filtrar',
    'common.export':   'Exportar',
    'common.today':    'Hoje',
    'common.yesterday':'Ontem',
    'common.growth':   'crescimento',
    'common.leads':    'leads',
    'common.of':       'de',
    'common.all':      'Todos',
    'common.none':     'Nenhum',
    'common.ai_badge': 'IA',
    'common.new_badge':'NOVO',
    'common.beta':     'BETA',
  },

  'en': {
    'nav.dashboard':      'Dashboard',
    'nav.contacts':       'Contacts',
    'nav.chat':           'Chat',
    'nav.pipeline':       'Pipeline',
    'nav.leads':          'Leads',
    'nav.campaigns':      'Campaigns',
    'nav.agenda':         'Calendar',
    'nav.analytics':      'Analytics',
    'nav.settings':       'Settings',
    'nav.ai':             'AI Assistant',

    'dashboard.title':           'Dashboard',
    'dashboard.welcome':         'Good morning',
    'dashboard.total_leads':     'Total Leads',
    'dashboard.new_this_month':  'New this month',
    'dashboard.conversion':      'Conversion Rate',
    'dashboard.avg_response':    'Avg Response Time',
    'dashboard.won_deals':       'Closed Deals',
    'dashboard.revenue':         'Monthly Revenue',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.ai_insights':     'AI Insights',
    'dashboard.pipeline_summary':'Pipeline Summary',

    'leads.title':        'Leads',
    'leads.add':          'New Lead',
    'leads.search':       'Search lead...',
    'leads.filter':       'Filter',
    'leads.name':         'Name',
    'leads.phone':        'Phone',
    'leads.source':       'Source',
    'leads.stage':        'Stage',
    'leads.score':        'AI Score',
    'leads.assignedTo':   'Assigned To',
    'leads.lastContact':  'Last Contact',
    'leads.actions':      'Actions',
    'leads.interest':     'Interest',
    'leads.budget':       'Budget',

    'stage.new_lead':           'New Lead',
    'stage.contact_initiated':  'Contact Initiated',
    'stage.visit_scheduled':    'Visit Scheduled',
    'stage.proposal':           'Proposal',
    'stage.negotiation':        'Negotiation',
    'stage.won':                'Closed ✓',
    'stage.lost':               'Lost',

    'status.new':       'New',
    'status.open':      'Open',
    'status.pending':   'Pending',
    'status.resolved':  'Resolved',
    'status.won':       'Won',
    'status.lost':      'Lost',

    'source.whatsapp':  'WhatsApp',
    'source.instagram': 'Instagram',
    'source.facebook':  'Facebook',
    'source.website':   'Website',
    'source.referral':  'Referral',
    'source.direct':    'Direct',

    'chat.title':           'Chat',
    'chat.inbox':           'Inbox',
    'chat.search':          'Search conversation...',
    'chat.assign':          'Assign',
    'chat.transfer':        'Transfer',
    'chat.resolve':         'Resolve',
    'chat.type_message':    'Type a message...',
    'chat.send':            'Send',
    'chat.ai_suggestion':   'AI Suggestion',
    'chat.use_suggestion':  'Use suggestion',
    'chat.internal_note':   'Internal note',
    'chat.templates':       'Templates',
    'chat.no_messages':     'No messages yet.',
    'chat.unread':          'unread',
    'chat.all':             'All',
    'chat.mine':            'Mine',

    'pipeline.title':       'Pipeline',
    'pipeline.add_lead':    'Add Lead',
    'pipeline.view_list':   'List View',
    'pipeline.view_kanban': 'Kanban View',

    'campaigns.title':      'Campaigns',
    'campaigns.new':        'New Campaign',
    'campaigns.name':       'Name',
    'campaigns.channel':    'Channel',
    'campaigns.type':       'Type',
    'campaigns.status':     'Status',
    'campaigns.audience':   'Audience',
    'campaigns.sent':       'Sent',
    'campaigns.opened':     'Opened',
    'campaigns.scheduled':  'Scheduled for',
    'campaigns.broadcast':  'Broadcast',
    'campaigns.social_post':'Social Post',
    'campaigns.drip':       'Drip Sequence',

    'agenda.title':         'Calendar',
    'agenda.new_event':     'New Event',
    'agenda.today':         'Today',
    'agenda.visit':         'Visit',
    'agenda.call':          'Call',
    'agenda.follow_up':     'Follow-up',
    'agenda.meeting':       'Meeting',

    'analytics.title':       'Analytics',
    'analytics.leads':       'Leads',
    'analytics.conversions': 'Conversions',
    'analytics.revenue':     'Revenue',
    'analytics.period':      'Period',
    'analytics.this_month':  'This month',
    'analytics.last_month':  'Last month',
    'analytics.last_quarter':'Last quarter',
    'analytics.by_source':   'By Source',
    'analytics.by_stage':    'By Stage',
    'analytics.by_collaborator': 'By Collaborator',
    'analytics.response_time': 'Response Time',

    'settings.title':        'Settings',
    'settings.business':     'My Business',
    'settings.members':      'Members',
    'settings.integrations': 'Integrations',
    'settings.billing':      'Billing',
    'settings.segment':      'Segment',
    'settings.segment_label':'Business Type',

    'segment.generic':      'Generic',
    'segment.real_estate':  'Real Estate',

    'common.save':     'Save',
    'common.cancel':   'Cancel',
    'common.delete':   'Delete',
    'common.edit':     'Edit',
    'common.view':     'View',
    'common.close':    'Close',
    'common.loading':  'Loading...',
    'common.search':   'Search',
    'common.filter':   'Filter',
    'common.export':   'Export',
    'common.today':    'Today',
    'common.yesterday':'Yesterday',
    'common.growth':   'growth',
    'common.leads':    'leads',
    'common.of':       'of',
    'common.all':      'All',
    'common.none':     'None',
    'common.ai_badge': 'AI',
    'common.new_badge':'NEW',
    'common.beta':     'BETA',
  },
};

export function getTranslations(locale: Locale): Record<string, string> {
  const dict = translations[locale];
  const flat: Record<string, string> = {};
  for (const [key, val] of Object.entries(dict)) {
    if (typeof val === 'string') {
      flat[key] = val;
    } else {
      for (const [subKey, subVal] of Object.entries(val)) {
        flat[`${key}.${subKey}`] = subVal;
      }
    }
  }
  return flat;
}

export function detectLocale(): 'pt-BR' | 'en' {
  if (typeof window === 'undefined') return 'pt-BR';
  const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'pt-BR';
  return lang.startsWith('pt') ? 'pt-BR' : 'en';
}

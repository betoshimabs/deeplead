'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { fetchCampaigns } from '@/lib/services/campaigns';
import type { Campaign, CampaignStatus } from '@/types';
import { Plus, Sparkles, MoreHorizontal, Send, Calendar, Users, MousePointer, Eye, Play, Pause, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<CampaignStatus, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  draft:     { bg: '#F4F7FA', text: '#555D6F', label: 'Rascunho', icon: FileText },
  scheduled: { bg: '#EBF7FA', text: '#127284', label: 'Agendada', icon: Clock },
  running:   { bg: '#FEF9EC', text: '#CA8A04', label: 'Em andamento', icon: Play },
  paused:    { bg: '#F4F7FA', text: '#8A9BB0', label: 'Pausada', icon: Pause },
  completed: { bg: '#E6F5EF', text: '#22A06B', label: 'Concluída', icon: CheckCircle2 },
  failed:    { bg: '#FFEAEA', text: '#E03131', label: 'Falhou', icon: AlertCircle },
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', tiktok: '🎵',
};

const TYPE_LABELS: Record<string, string> = {
  broadcast: 'Envio em Massa', social_post: 'Publicação Social', drip: 'Sequência Automática',
};

function MetricChip({ icon: Icon, value, label, color = '#555D6F' }: { icon: React.ElementType; value?: number; label: string; color?: string }) {
  if (value === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#8A9BB0]">
      <Icon size={12} style={{ color }} />
      <span className="font-medium" style={{ color }}>{value.toLocaleString('pt-BR')}</span>
      <span>{label}</span>
    </div>
  );
}

export default function CampanhasPage() {
  const { t } = useApp();
  const [tab, setTab] = useState<'all' | CampaignStatus>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetchCampaigns()
      .then(res => setCampaigns(res.data))
      .catch(() => alert('Erro ao carregar campanhas.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(c => tab === 'all' || c.status === tab);

  const stats = {
    total: campaigns.length,
    running: campaigns.filter(c => c.status === 'running').length,
    totalReach: campaigns.reduce((a, c) => a + (c.sent_count ?? 0), 0),
    avgOpen: campaigns.filter(c => c.opened_count).length > 0 
      ? Math.round(
          campaigns
            .filter(c => c.opened_count)
            .reduce((a, c) => a + (c.opened_count! / (c.audience_count || 1) * 100), 0) /
          campaigns.filter(c => c.opened_count).length
        )
      : 0,
  };

  return (
    <AppLayout title={t('campaigns.title')}>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de campanhas', value: stats.total, color: '#127284' },
          { label: 'Em andamento', value: stats.running, color: '#F59E0B' },
          { label: 'Mensagens enviadas', value: stats.totalReach.toLocaleString('pt-BR'), color: '#3BAFC4' },
          { label: 'Taxa média de abertura', value: `${stats.avgOpen}%`, color: '#22A06B' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#DAE1EA] px-4 py-3">
            <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#8A9BB0]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-[#F4F7FA] rounded-xl p-1">
          {(['all', 'running', 'scheduled', 'completed', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === s ? 'bg-white text-[#127284] shadow-sm' : 'text-[#8A9BB0] hover:text-[#555D6F]'
              }`}>
              {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-xs text-[#F9795A] bg-[#FEF0EC] px-3 py-2 rounded-xl hover:bg-[#F9795A] hover:text-white transition-all">
            <Sparkles size={12} />
            Sugerir horário ideal
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium bg-[#127284] text-white px-4 py-2 rounded-xl hover:bg-[#3BAFC4] transition-all">
            <Plus size={14} />
            {t('campaigns.new')}
          </button>
        </div>
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-[#DAE1EA] rounded-2xl p-5 h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#DAE1EA] rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-[#F4F7FA] rounded-full flex items-center justify-center text-[#8A9BB0] mb-3">
              <Sparkles size={20} />
            </div>
            <h3 className="text-[#2F4251] font-bold mb-1">Nenhuma campanha encontrada</h3>
            <p className="text-[#8A9BB0] text-sm">Crie sua primeira campanha para se conectar com seus leads.</p>
          </div>
        ) : (
          filtered.map(camp => {
          const status = STATUS_CONFIG[camp.status];
          const StatusIcon = status.icon;
          const openRate = camp.opened_count && camp.audience_count
            ? Math.round(camp.opened_count / camp.audience_count * 100)
            : null;
          const clickRate = camp.clicked_count && camp.audience_count
            ? Math.round(camp.clicked_count / camp.audience_count * 100)
            : null;

          return (
            <div key={camp.id} className="bg-white rounded-2xl border border-[#DAE1EA] p-5 hover:shadow-sm transition-all">
              <div className="flex items-start gap-4">
                {/* Channel icon */}
                <div className="w-10 h-10 rounded-xl bg-[#F4F7FA] flex items-center justify-center text-xl shrink-0">
                  {CHANNEL_ICONS[camp.channel]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-[#2F4251]">{camp.name}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: status.bg, color: status.text }}>
                          <span className="flex items-center gap-1">
                            <StatusIcon size={10} />
                            {status.label}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8A9BB0]">
                        <span>{TYPE_LABELS[camp.type]}</span>
                        <span>·</span>
                        <span className="capitalize">{camp.channel}</span>
                        {camp.scheduled_at && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {format(new Date(camp.scheduled_at), "d MMM 'às' HH'h'mm", { locale: ptBR })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button className="text-[#8A9BB0] hover:text-[#555D6F] p-1">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 flex-wrap">
                    <MetricChip icon={Users} value={camp.audience_count} label="público" color="#127284" />
                    <MetricChip icon={Send} value={camp.sent_count} label="enviados" color="#3BAFC4" />
                    {openRate !== null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Eye size={12} className="text-[#F59E0B]" />
                        <span className="font-medium text-[#F59E0B]">{openRate}%</span>
                        <span className="text-[#8A9BB0]">abertura</span>
                      </div>
                    )}
                    {clickRate !== null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <MousePointer size={12} className="text-[#22A06B]" />
                        <span className="font-medium text-[#22A06B]">{clickRate}%</span>
                        <span className="text-[#8A9BB0]">cliques</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {camp.sent_count !== undefined && camp.audience_count > 0 && (
                    <div className="mt-3 h-1.5 bg-[#F4F7FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 bg-[#127284]"
                        style={{ width: `${Math.min(100, (camp.sent_count / camp.audience_count) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </AppLayout>
  );
}

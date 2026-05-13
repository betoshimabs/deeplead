'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { updateLead } from '@/lib/services/leads';
import { Plus, Sparkles, TrendingUp, RefreshCw, SlidersHorizontal,
  MessageSquare, Phone, ChevronRight, GripVertical, X, Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/lib/apiClient';
import { ViewScopeToggle, type ViewScope } from '@/components/ui/ViewScopeToggle';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PipelineLead {
  id: string; name: string; phone: string; email: string | null;
  status: string; stage: string; score: number; source: string;
  tags: string[]; notes: string | null; ip_city: string | null;
  created_at: string; last_contact_at: string | null;
  assigned_member: { id: string; business_role: string; user: { id: string; name: string } } | null;
  real_estate_profile: {
    interest_notes?: string; budget_min?: number; budget_max?: number;
    purchase_timeline?: string; financing_pre_approved?: boolean;
    desired_neighborhoods?: string[];
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_COLUMNS = [
  { id: 'new_lead',          label: 'Novo Lead',        color: '#3BAFC4', bg: '#EBF7FA' },
  { id: 'contact_initiated', label: 'Contato Iniciado', color: '#555D6F', bg: '#F4F7FA' },
  { id: 'visit_scheduled',   label: 'Visita Agendada',  color: '#127284', bg: '#E0F2F7' },
  { id: 'proposal',          label: 'Proposta',          color: '#F59E0B', bg: '#FEF9EC' },
  { id: 'negotiation',       label: 'Negociação',        color: '#F9795A', bg: '#FEF0EC' },
  { id: 'won',               label: 'Fechado ✓',         color: '#22A06B', bg: '#E6F5EF' },
  { id: 'lost',              label: 'Perdido',           color: '#E03131', bg: '#FFEAEA' },
];

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', website: '🌐',
  referral: '🤝', direct: '📞', tiktok: '🎵', import: '📥',
};

const TIMELINE_SHORT: Record<string, string> = {
  immediate: 'Imediato', within_3m: '< 3 meses', within_6m: '< 6 meses',
  within_12m: '< 12 meses', exploring: 'Explorando',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#22A06B' : score >= 65 ? '#F59E0B' : '#E03131';
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}>
      {score}
    </div>
  );
}

function LeadCard({
  lead, onDragStart, onClick, onChat,
}: {
  lead: PipelineLead;
  onDragStart: (e: React.DragEvent, id: string, fromStage: string) => void;
  onClick: (lead: PipelineLead) => void;
  onChat: (lead: PipelineLead) => void;
}) {
  const profile = lead.real_estate_profile;
  const memberName = lead.assigned_member?.user?.name;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id, lead.stage)}
      onClick={() => onClick(lead)}
      className="bg-white rounded-xl border border-[#DAE1EA] p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all group select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#127284] to-[#3BAFC4] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {lead.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#2F4251] truncate">{lead.name}</div>
            <div className="text-[11px] text-[#8A9BB0] truncate">{lead.ip_city ?? lead.phone}</div>
          </div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      {/* Interest */}
      {profile?.interest_notes && (
        <p className="text-xs text-[#555D6F] mb-2.5 leading-relaxed line-clamp-2 bg-[#F8FAFB] px-2 py-1.5 rounded-lg">
          {profile.interest_notes}
        </p>
      )}

      {/* Budget */}
      {profile?.budget_max && (
        <div className="flex items-center gap-1 mb-2.5">
          <span className="text-xs font-semibold text-[#22A06B]">
            R$ {profile.budget_max.toLocaleString('pt-BR')}
          </span>
          {profile.financing_pre_approved && (
            <span className="text-[10px] bg-[#E6F5EF] text-[#22A06B] px-1.5 rounded-full">FGTS/Fin.</span>
          )}
        </div>
      )}

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {lead.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] bg-[#F4F7FA] text-[#8A9BB0] px-1.5 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm" title={lead.source}>{SOURCE_ICONS[lead.source] ?? '❓'}</span>
          {lead.last_contact_at && (
            <span className="text-[10px] text-[#B8C4D0]">
              {formatDistanceToNow(new Date(lead.last_contact_at), { locale: ptBR, addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onChat(lead); }}
            className="w-6 h-6 rounded-lg hover:bg-[#EBF7FA] flex items-center justify-center text-[#8A9BB0] hover:text-[#127284]"
          >
            <MessageSquare size={12} />
          </button>
          {memberName && (
            <div className="w-5 h-5 rounded-full bg-[#3BAFC4]/20 flex items-center justify-center text-[9px] font-bold text-[#127284]" title={memberName}>
              {memberName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  col, leads, onDrop, onDragOver, onDragStart, onLeadClick, onChat, loading,
}: {
  col: any;
  leads: PipelineLead[];
  onDrop: (e: React.DragEvent, stage: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, id: string, fromStage: string) => void;
  onLeadClick: (lead: PipelineLead) => void;
  onChat: (lead: PipelineLead) => void;
  loading: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const totalValue = leads.reduce((sum, l) => sum + (l.real_estate_profile?.budget_max ?? 0), 0);

  return (
    <div
      className="flex flex-col w-[220px] shrink-0"
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { setIsDragOver(false); onDrop(e, col.id); }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
        <span className="text-xs font-bold text-[#2F4251] truncate">{col.label}</span>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: col.bg, color: col.color }}>
          {leads.length}
        </span>
      </div>

      {/* Value indicator */}
      {totalValue > 0 && (
        <div className="px-1 mb-2">
          <span className="text-[10px] font-medium text-[#22A06B]">
            R$ {(totalValue / 1000000).toFixed(1)}M
          </span>
        </div>
      )}

      {/* Drop zone */}
      <div className={`flex-1 space-y-2.5 min-h-[120px] rounded-xl p-2 transition-all ${
        isDragOver ? 'bg-[#EBF7FA] border-2 border-dashed border-[#3BAFC4]' : 'bg-transparent border-2 border-transparent'
      }`}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#F4F7FA] rounded-xl animate-pulse" />
          ))
        ) : leads.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[11px] text-[#B8C4D0] rounded-xl border border-dashed border-[#EDF0F4]">
            Arraste aqui
          </div>
        ) : (
          leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onClick={onLeadClick}
              onChat={onChat}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8A9BB0] hover:text-[#127284] hover:bg-[#EBF7FA] px-3 py-2 rounded-xl transition-all w-full">
        <Plus size={12} /> Adicionar lead
      </button>
    </div>
  );
}

// Mini detail panel that slides in from the right
function LeadDetailPanel({ lead, columns, onClose, onChat }: {
  lead: PipelineLead | null; columns: any[]; onClose: () => void; onChat: (l: PipelineLead) => void;
}) {
  if (!lead) return null;
  const col = columns.find(c => c.id === lead.stage);
  const profile = lead.real_estate_profile;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-[#DAE1EA] z-50 flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-[#EDF0F4] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#127284] to-[#3BAFC4] flex items-center justify-center text-white font-bold">
            {lead.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#2F4251] truncate">{lead.name}</p>
            {col && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: col.bg, color: col.color }}>{col.label}</span>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-[#8A9BB0]">Telefone</span><span className="text-[#2F4251] font-medium">{lead.phone}</span></div>
            {lead.email && <div className="flex justify-between"><span className="text-[#8A9BB0]">E-mail</span><span className="text-[#2F4251] text-xs truncate ml-4">{lead.email}</span></div>}
            {lead.ip_city && <div className="flex justify-between"><span className="text-[#8A9BB0]">Cidade</span><span className="text-[#2F4251]">{lead.ip_city}</span></div>}
            <div className="flex justify-between"><span className="text-[#8A9BB0]">Origem</span><span>{SOURCE_ICONS[lead.source]} {lead.source}</span></div>
            {lead.assigned_member && <div className="flex justify-between"><span className="text-[#8A9BB0]">Responsável</span><span className="text-[#2F4251]">{lead.assigned_member.user.name.split(' ')[0]}</span></div>}
          </div>
          {profile && (
            <div className="bg-[#F8FAFB] rounded-xl p-3.5 space-y-2">
              <p className="text-[10px] font-bold text-[#8A9BB0] uppercase tracking-wide">Perfil Imobiliário</p>
              {profile.interest_notes && <p className="text-xs text-[#555D6F]">{profile.interest_notes}</p>}
              {profile.budget_max && (
                <p className="text-sm font-semibold text-[#22A06B]">
                  R$ {profile.budget_max.toLocaleString('pt-BR')}
                </p>
              )}
              {profile.purchase_timeline && <p className="text-xs text-[#8A9BB0]">Prazo: {TIMELINE_SHORT[profile.purchase_timeline]}</p>}
              {profile.desired_neighborhoods && profile.desired_neighborhoods.length > 0 && (
                <p className="text-xs text-[#8A9BB0]">Bairros: {profile.desired_neighborhoods.join(', ')}</p>
              )}
            </div>
          )}
          {lead.notes && (
            <div className="bg-[#FEF9EC] rounded-xl p-3 border border-[#F59E0B]/20">
              <p className="text-[10px] font-medium text-[#8A9BB0] mb-1">Notas</p>
              <p className="text-xs text-[#555D6F]">{lead.notes}</p>
            </div>
          )}
          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-[#F4F7FA] text-[#555D6F] rounded-full">#{t}</span>)}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-[#EDF0F4] space-y-2">
          <button onClick={() => onChat(lead)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#127284] text-white text-sm font-medium rounded-xl hover:bg-[#3BAFC4] transition-all">
            <MessageSquare size={15} /> Abrir conversa <ChevronRight size={14} className="ml-auto" />
          </button>
          <a href={`tel:${lead.phone}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#DAE1EA] text-[#555D6F] text-sm rounded-xl hover:bg-[#F4F7FA] transition-all">
            <Phone size={15} /> Ligar
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const { t, user, activeBusinessId } = useApp();
  const router = useRouter();

  const isColaborador = user?.role === 'colaborador';
  const canManage = user?.role === 'dono' || user?.role === 'gestor';
  const myMemberId = user?.businesses.find(b => b.id === activeBusinessId)?.memberId ?? null;
  const [scope, setScope] = useState<ViewScope>('business');

  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [columns, setColumns] = useState<any[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [dragging, setDragging] = useState<{ id: string; fromStage: string } | null>(null);
  const [filters, setFilters] = useState<{ source?: string; score_min?: number; score_max?: number }>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleChatNav = async (l: PipelineLead) => {
    try {
      const json: any = await apiClient(`/api/conversations?lead_id=${l.id}`);
      if (json.data?.id) router.push(`/chat?conversation_id=${json.data.id}`);
      else {
        const cJson: any = await apiClient('/api/conversations', { method: 'POST', body: JSON.stringify({ lead_id: l.id }) });
        router.push(`/chat?conversation_id=${cJson.data?.id ?? ''}`);
      }
    } catch { router.push('/chat'); }
  };

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.source)    params.set('source', filters.source);
      if (filters.score_min) params.set('score_min', String(filters.score_min));
      if (filters.score_max) params.set('score_max', String(filters.score_max));
      // Scope filter
      const effectiveAssigned = isColaborador ? myMemberId : (scope === 'mine' ? myMemberId : null);
      if (effectiveAssigned) params.set('assigned_to', effectiveAssigned);

      const [json, confJson]: any = await Promise.all([
        apiClient(`/api/pipeline?${params}`, { cache: 'no-store' }),
        apiClient('/api/pipeline/configs', { cache: 'no-store' })
      ]);
      
      setLeads(json.data ?? []);
      if (confJson.data?.length > 0) {
        setColumns(confJson.data.map((c: any) => ({
          id: c.stage_key, label: c.label, color: c.color, bg: `${c.color}20`
        })));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, scope, isColaborador, myMemberId]);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string, fromStage: string) => {
    setDragging({ id, fromStage });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    if (!dragging || dragging.fromStage === toStage) { setDragging(null); return; }

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === dragging.id ? { ...l, stage: toStage } : l));
    setDragging(null);

    try {
      await updateLead(dragging.id, { stage: toStage });
    } catch (e: any) {
      setError(e.message || 'Falha ao mover o lead. A tela será atualizada.');
      loadPipeline(); // rollback on error
    }
  };

  // Stats
  const totalLeads = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;
  const wonLeads   = leads.filter(l => l.stage === 'won').length;
  const totalVal   = leads.reduce((s, l) => s + (l.real_estate_profile?.budget_max ?? 0), 0);
  const convRate   = (totalLeads + wonLeads) > 0 ? Math.round((wonLeads / (totalLeads + wonLeads)) * 100) : 0;
  const hotLeads   = leads.filter(l => l.score >= 80 && !['won', 'lost'].includes(l.stage)).length;

  const leadsForStage = (stageId: string) => leads.filter(l => l.stage === stageId);

  return (
    <AppLayout title={t('pipeline.title')}>
      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Em andamento', value: totalLeads, color: '#127284', bg: '#EBF7FA' },
          { label: 'Score ≥ 80', value: hotLeads, color: '#F9795A', bg: '#FEF0EC' },
          { label: 'Fechados (30d)', value: wonLeads, color: '#22A06B', bg: '#E6F5EF' },
          { label: 'Conv. %', value: `${convRate}%`, color: '#F59E0B', bg: '#FEF9EC' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#DAE1EA] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: s.bg, color: s.color }}>{s.value}</div>
            <span className="text-xs text-[#555D6F] leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 text-sm text-[#8A9BB0]">
          <TrendingUp size={14} className="text-[#127284]" />
          {totalVal > 0 && (
            <span>Portfólio potencial: <strong className="text-[#22A06B]">R$ {(totalVal / 1000000).toFixed(1)}M</strong></span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canManage && (
            <ViewScopeToggle
              scope={scope}
              onChange={(s) => setScope(s)}
              labels={{ business: 'Todo o negócio', mine: 'Meu pipeline' }}
            />
          )}
          <button onClick={loadPipeline} className="w-9 h-9 rounded-xl border border-[#DAE1EA] bg-white flex items-center justify-center text-[#8A9BB0] hover:border-[#3BAFC4]">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              Object.values(filters).some(Boolean)
                ? 'bg-[#127284] text-white border-[#127284]'
                : 'bg-white text-[#555D6F] border-[#DAE1EA] hover:border-[#3BAFC4] hover:text-[#127284]'
            }`}>
            <SlidersHorizontal size={14} /> Filtros
          </button>
          <button className="flex items-center gap-1.5 text-xs text-[#F9795A] bg-[#FEF0EC] px-3 py-2.5 rounded-xl hover:bg-[#F9795A] hover:text-white transition-all">
            <Sparkles size={12} /> Analisar pipeline
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium bg-[#127284] text-white px-4 py-2.5 rounded-xl hover:bg-[#3BAFC4] transition-all">
            <Plus size={14} /> Novo lead
          </button>
        </div>
      </div>

      {/* Quick filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-[#DAE1EA] p-4 mb-5 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[10px] text-[#8A9BB0] uppercase tracking-wide mb-1.5">Origem</p>
            <div className="flex gap-1.5">
              {['whatsapp', 'instagram', 'facebook', 'website', 'referral'].map(s => (
                <button key={s} onClick={() => setFilters(f => ({ ...f, source: f.source === s ? undefined : s }))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${filters.source === s ? 'bg-[#127284] text-white border-[#127284]' : 'border-[#DAE1EA] text-[#555D6F] hover:border-[#3BAFC4]'}`}>
                  {SOURCE_ICONS[s]} {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#8A9BB0] uppercase tracking-wide mb-1.5">Score mínimo</p>
            <input type="range" min={0} max={100} value={filters.score_min ?? 0}
              onChange={e => setFilters(f => ({ ...f, score_min: Number(e.target.value) || undefined }))}
              className="w-32 accent-[#127284]" />
            <span className="ml-2 text-xs text-[#127284] font-bold">{filters.score_min ?? 0}+</span>
          </div>
          <button onClick={() => setFilters({})} className="ml-auto text-xs text-[#E03131] hover:underline flex items-center gap-1">
            <X size={12} /> Limpar filtros
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#FFEAEA] text-[#E03131] text-sm px-4 py-3 rounded-xl mb-5 flex items-center justify-between">
          {error}
          <button onClick={loadPipeline} className="underline text-xs">Tentar novamente</button>
        </div>
      )}

      {/* Kanban board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max">
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              leads={leadsForStage(col.id)}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onDragStart={handleDragStart}
              onLeadClick={setSelectedLead}
              onChat={lead => handleChatNav(lead)}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <LeadDetailPanel
        lead={selectedLead}
        columns={columns}
        onClose={() => setSelectedLead(null)}
        onChat={lead => handleChatNav(lead)}
      />
    </AppLayout>
  );
}

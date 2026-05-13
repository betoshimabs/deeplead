'use client';
import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { fetchLeads, fetchMembers, updateLead, deleteLead } from '@/lib/services/leads';
import type { LeadFilters } from '@/lib/services/leads';
import { ViewScopeToggle, type ViewScope } from '@/components/ui/ViewScopeToggle';
import { LeadFiltersPanel } from './components/LeadFiltersPanel';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { LeadEditModal } from './components/LeadEditModal';
import type { Lead } from '@/types';
import {
  Search, SlidersHorizontal, Plus, Sparkles,
  Phone, MessageSquare, MoreHorizontal,
  ArrowUpDown, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  new:      { bg: '#EBF7FA', text: '#127284',  label: 'Novo' },
  open:     { bg: '#FEF9EC', text: '#CA8A04',  label: 'Aberto' },
  pending:  { bg: '#F4F7FA', text: '#555D6F',  label: 'Pendente' },
  resolved: { bg: '#E6F5EF', text: '#22A06B',  label: 'Resolvido' },
  won:      { bg: '#E6F5EF', text: '#22A06B',  label: 'Ganho' },
  lost:     { bg: '#FFEAEA', text: '#E03131',  label: 'Perdido' },
};

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'Novo', contact_initiated: 'Contato',
  visit_scheduled: 'Visita', proposal: 'Proposta',
  negotiation: 'Neg.', won: 'Fechado', lost: 'Perdido',
};

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', website: '🌐',
  referral: '🤝', direct: '📞', tiktok: '🎵', import: '📥',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#22A06B' : score >= 65 ? '#F59E0B' : '#E03131';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 bg-[#F4F7FA] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold min-w-[24px]" style={{ color }}>{score}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#EDF0F4]">
          <div className="w-8 h-8 rounded-full bg-[#F4F7FA]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#F4F7FA] rounded w-1/3" />
            <div className="h-2.5 bg-[#F4F7FA] rounded w-1/4" />
          </div>
          <div className="h-3 bg-[#F4F7FA] rounded w-20" />
          <div className="h-3 bg-[#F4F7FA] rounded w-16" />
          <div className="h-3 bg-[#F4F7FA] rounded w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const EMPTY_FILTERS: LeadFilters = {};

export default function LeadsPage() {
  const { t, user, activeBusinessId } = useApp();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Scope: dono/gestor toggle between full business and own leads
  // Colaborador always sees only their own — no toggle rendered
  const isColaborador = user?.role === 'colaborador';
  const canManage = user?.role === 'dono' || user?.role === 'gestor';
  const myMemberId = user?.businesses.find(b => b.id === activeBusinessId)?.memberId ?? null;
  const [scope, setScope] = useState<ViewScope>('business');

  // Data state
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // UI state
  const [filters, setFilters]               = useState<LeadFilters>({});
  const [searchInput, setSearchInput]       = useState('');
  const [filtersOpen, setFiltersOpen]       = useState(false);
  const [selectedLead, setSelectedLead]     = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [editLead, setEditLead]             = useState<Lead | null>(null);
  const [createOpen, setCreateOpen]         = useState(false);
  const [page, setPage]                     = useState(0);
  const [sortKey, setSortKey]               = useState<string>('created_at');
  const [sortDir, setSortDir]               = useState<'asc' | 'desc'>('desc');
  const PAGE_SIZE = 20;

  // Count active filters (excluding search & pagination)
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => !['q', 'limit', 'offset', 'assigned_to'].includes(k) && v !== undefined
  ).length;

  // ── Load members once ────────────────────────────────────────────────────
  useEffect(() => {
    fetchMembers().then(setMembers).catch(() => {});
  }, []);

  // ── Load leads ───────────────────────────────────────────────────────────
  const buildScopeFilter = useCallback((): Partial<LeadFilters> => {
    if (isColaborador && myMemberId) return { assigned_to: myMemberId };
    if (scope === 'mine' && myMemberId) return { assigned_to: myMemberId };
    return {};
  }, [isColaborador, scope, myMemberId]);

  const loadLeads = useCallback(async (f: LeadFilters, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLeads({
        ...f,
        ...buildScopeFilter(),
        limit: PAGE_SIZE,
        offset: p * PAGE_SIZE,
      });
      setLeads(result.data ?? []);
      setTotal(result.count ?? result.data?.length ?? 0);
    } catch (err) {
      setError('Não foi possível carregar os leads. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [buildScopeFilter]);

  useEffect(() => {
    loadLeads(filters, page);
  }, [filters, page, scope, loadLeads]);


  // ── Search debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, q: searchInput || undefined }));
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterChange = (partial: Partial<LeadFilters>) => {
    setFilters(f => ({ ...f, ...partial }));
    setPage(0);
  };

  const handleFilterReset = () => {
    setFilters({});
    setSearchInput('');
    setPage(0);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditOpen(true);
  };

  const handleEditSaved = (updated: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === editLead?.id ? { ...l, ...updated } : l));
    if (selectedLead?.id === editLead?.id) setSelectedLead(prev => prev ? { ...prev, ...updated } : prev);
    // refresh KPIs from server
    loadLeads(filters, page);
  };

  const handleCreateSaved = () => {
    setCreateOpen(false);
    loadLeads(filters, page);
  };

  const handleOpenChat = (_lead: Lead) => {}; // handled inside drawer

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      setDrawerOpen(false);
      setSelectedLead(null);
      loadLeads(filters, page);
    } catch {
      alert('Falha ao excluir o lead.');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateLead(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as any } : l));
      setSelectedLead(prev => prev && prev.id === id ? { ...prev, status: status as any } : prev);
      // Refresh to get accurate KPI counts
      loadLeads(filters, page);
    } catch {
      alert('Falha ao atualizar o status do lead.');
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: total,
    hot: leads.filter(l => l.score >= 80).length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  // Client-side sort (server paginates, we sort current page)
  const sortedLeads = [...leads].sort((a, b) => {
    let av: any = (a as any)[sortKey] ?? '';
    let bv: any = (b as any)[sortKey] ?? '';
    if (sortKey === 'last_contact') { av = a.last_contact_at ?? ''; bv = b.last_contact_at ?? ''; }
    if (sortKey === 'assigned') { av = (a as any).assigned_member?.user?.name ?? ''; bv = (b as any).assigned_member?.user?.name ?? ''; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppLayout title={t('leads.title')}>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de leads', value: total, color: '#127284', bg: '#EBF7FA' },
          { label: 'Score ≥ 80 (quentes)', value: stats.hot, color: '#F9795A', bg: '#FEF0EC' },
          { label: 'Ganhos', value: stats.won, color: '#22A06B', bg: '#E6F5EF' },
          { label: 'Perdidos', value: stats.lost, color: '#E03131', bg: '#FFEAEA' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#DAE1EA] px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <span className="text-base font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <span className="text-xs text-[#555D6F] leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('leads.search')}
            className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] transition-all"
          />
        </div>

        {/* Quick status filter */}
        <div className="flex items-center gap-1 bg-[#F4F7FA] rounded-xl p-1">
          {[
            { val: undefined, label: 'Todos' },
            { val: 'new',     label: 'Novos' },
            { val: 'open',    label: 'Abertos' },
            { val: 'pending', label: 'Pendentes' },
            { val: 'won',     label: 'Ganhos' },
            { val: 'lost',    label: 'Perdidos' },
          ].map(({ val, label }) => (
            <button key={label}
              onClick={() => { handleFilterChange({ status: val }); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.status === val
                  ? 'bg-white text-[#127284] shadow-sm'
                  : 'text-[#8A9BB0] hover:text-[#555D6F]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Scope toggle — only for dono/gestor */}
          {canManage && (
            <ViewScopeToggle
              scope={scope}
              onChange={(s) => { setScope(s); setPage(0); }}
              labels={{ business: 'Todo o negócio', mine: 'Meus leads' }}
            />
          )}
          <button
            onClick={() => loadLeads(filters, page)}
            className="w-9 h-9 rounded-xl border border-[#DAE1EA] bg-white flex items-center justify-center text-[#8A9BB0] hover:text-[#127284] hover:border-[#3BAFC4] transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setFiltersOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              activeFilterCount > 0
                ? 'bg-[#127284] text-white border-[#127284]'
                : 'bg-white text-[#555D6F] border-[#DAE1EA] hover:border-[#3BAFC4] hover:text-[#127284]'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button className="flex items-center gap-1.5 text-xs text-[#F9795A] bg-[#FEF0EC] px-3 py-2.5 rounded-xl hover:bg-[#F9795A] hover:text-white transition-all">
            <Sparkles size={12} />
            Score IA
          </button>

          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 text-sm font-medium bg-[#127284] text-white px-4 py-2.5 rounded-xl hover:bg-[#3BAFC4] transition-all">
            <Plus size={14} />
            {t('leads.add')}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-[#8A9BB0]">Filtros ativos:</span>
          {filters.status && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Status: {STATUS_MAP[filters.status]?.label}
              <button onClick={() => handleFilterChange({ status: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          {filters.stage && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Etapa: {STAGE_LABELS[filters.stage]}
              <button onClick={() => handleFilterChange({ stage: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          {filters.source && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Origem: {filters.source}
              <button onClick={() => handleFilterChange({ source: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          {filters.assigned_to && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Responsável: {members.find(m => m.id === filters.assigned_to)?.user?.name?.split(' ')[0] ?? '—'}
              <button onClick={() => handleFilterChange({ assigned_to: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          {filters.ip_city && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Cidade: {filters.ip_city}
              <button onClick={() => handleFilterChange({ ip_city: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          {(filters.score_min !== undefined || filters.score_max !== undefined) && (
            <span className="flex items-center gap-1 text-xs bg-[#EBF7FA] text-[#127284] px-2.5 py-1 rounded-full">
              Score: {filters.score_min ?? 0}–{filters.score_max ?? 100}
              <button onClick={() => handleFilterChange({ score_min: undefined, score_max: undefined })} className="ml-0.5 hover:text-[#E03131]">×</button>
            </span>
          )}
          <button onClick={handleFilterReset} className="text-xs text-[#E03131] hover:underline ml-1">
            Limpar todos
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#DAE1EA] overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-sm font-medium text-[#2F4251]">{error}</p>
            <button onClick={() => loadLeads(filters, page)}
              className="mt-3 text-xs text-[#127284] hover:underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDF0F4]">
                  {[
                    { label: 'Lead',             key: 'name' },
                    { label: 'Contato',          key: 'phone' },
                    { label: 'Interesse / Orç.', key: 'interest' },
                    { label: 'Etapa',            key: 'stage' },
                    { label: 'Origem',           key: 'source' },
                    { label: 'Score',            key: 'score' },
                    { label: 'Responsável',      key: 'assigned' },
                    { label: 'Último contato',   key: 'last_contact' },
                    { label: '',                 key: 'actions' },
                  ].map(h => (
                    <th key={h.key}
                      onClick={() => ['name','score','last_contact','assigned'].includes(h.key) ? handleSort(h.key) : null}
                      className={`text-left text-xs font-semibold text-[#8A9BB0] px-4 py-3.5 whitespace-nowrap ${
                        ['name','score','last_contact','assigned'].includes(h.key) ? 'cursor-pointer hover:text-[#127284] select-none' : ''
                      }`}>
                      <span className="flex items-center gap-1">
                        {h.label}
                        {['name','score','last_contact','assigned'].includes(h.key) && (
                          <ArrowUpDown size={10} className={sortKey === h.key ? 'opacity-80 text-[#127284]' : 'opacity-30'} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9}><Skeleton /></td></tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="font-medium text-[#2F4251]">Nenhum lead encontrado</p>
                        <p className="text-sm text-[#8A9BB0] mt-1">Tente ajustar os filtros ou adicione um novo lead</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedLeads.map(lead => {
                  const status = STATUS_MAP[lead.status] ?? STATUS_MAP.new;
                  const profile = lead.real_estate_profile;
                  const assignedMember = (lead as any).assigned_member;

                  return (
                    <tr key={lead.id}
                      className="border-b border-[#EDF0F4] hover:bg-[#F8FAFB] transition-colors group cursor-pointer"
                      onClick={() => handleLeadClick(lead)}>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#127284] to-[#3BAFC4] flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {lead.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#2F4251] truncate max-w-[150px]">{lead.name}</div>
                            <div className="text-[11px] text-[#8A9BB0]">{lead.email ?? lead.ip_city ?? '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 text-sm text-[#555D6F] whitespace-nowrap">{lead.phone}</td>

                      {/* Interest / Budget */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[160px]">
                          <p className="text-xs text-[#555D6F] truncate">{profile?.interest_notes ?? '—'}</p>
                          {profile?.budget_max && (
                            <p className="text-xs font-semibold text-[#22A06B] mt-0.5">
                              R$ {profile.budget_max.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Stage badge */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: status.bg, color: status.text }}>
                          {STAGE_LABELS[lead.stage]}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-base" title={lead.source}>{SOURCE_ICONS[lead.source] ?? '❓'}</span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5 w-28">
                        <ScoreBar score={lead.score} />
                      </td>

                      {/* Assigned */}
                      <td className="px-4 py-3.5">
                        {assignedMember?.user ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#3BAFC4]/20 flex items-center justify-center text-[10px] font-bold text-[#127284] shrink-0">
                              {assignedMember.user.name.charAt(0)}
                            </div>
                            <span className="text-xs text-[#555D6F] truncate max-w-[80px]">
                              {assignedMember.user.name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#B8C4D0]">—</span>
                        )}
                      </td>

                      {/* Last contact */}
                      <td className="px-4 py-3.5 text-xs text-[#8A9BB0] whitespace-nowrap">
                        {lead.last_contact_at
                          ? formatDistanceToNow(new Date(lead.last_contact_at), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </td>

                      {/* Row actions */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenChat(lead)}
                            title="Abrir chat"
                            className="w-7 h-7 rounded-lg hover:bg-[#EBF7FA] flex items-center justify-center text-[#8A9BB0] hover:text-[#127284] transition-colors">
                            <MessageSquare size={13} />
                          </button>
                          <button title="Ligar"
                            className="w-7 h-7 rounded-lg hover:bg-[#EBF7FA] flex items-center justify-center text-[#8A9BB0] hover:text-[#127284] transition-colors">
                            <Phone size={13} />
                          </button>
                          <button onClick={() => handleLeadClick(lead)}
                            title="Ver detalhes"
                            className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0] transition-colors">
                            <MoreHorizontal size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && leads.length > 0 && (
          <div className="px-4 py-3 border-t border-[#EDF0F4] flex items-center justify-between">
            <span className="text-xs text-[#8A9BB0]">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total} leads
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="w-7 h-7 rounded-lg border border-[#DAE1EA] flex items-center justify-center text-[#8A9BB0] hover:border-[#3BAFC4] hover:text-[#127284] disabled:opacity-30 transition-all">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button key={i}
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                    page === i ? 'bg-[#127284] text-white' : 'border border-[#DAE1EA] text-[#8A9BB0] hover:border-[#3BAFC4]'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="w-7 h-7 rounded-lg border border-[#DAE1EA] flex items-center justify-center text-[#8A9BB0] hover:border-[#3BAFC4] hover:text-[#127284] disabled:opacity-30 transition-all">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter panel */}
      <LeadFiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        members={members}
        activeCount={activeFilterCount}
      />

      {/* Detail drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); }}
        onEdit={handleEdit}
        onOpenChat={handleOpenChat}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
      {/* Edit modal */}
      <LeadEditModal
        lead={editLead}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleEditSaved}
      />
      {/* Create modal — null lead triggers creation mode */}
      <LeadEditModal
        lead={null}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleCreateSaved}
      />
    </AppLayout>

  );
}

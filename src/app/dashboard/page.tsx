'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { fetchDashboardData } from '@/lib/services/dashboard';
import type { DashboardData, DashboardView, DashboardDays, HotLead, RecentMsg, UpcomingEvent, UnassignedLead, TeamActivity } from '@/lib/services/dashboard';
import {
  Users, TrendingUp, Clock, AlertTriangle, Sparkles,
  MessageSquare, Calendar, ChevronRight, Zap, Building2,
  User, RefreshCw, Flame, UserCheck
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = '#127284', urgent = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color?: string; urgent?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md ${urgent ? 'border-[#F9795A]/40 bg-[#FFF8F6]' : 'border-[#DAE1EA]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} style={{ color }} strokeWidth={1.8} />
        </div>
        {urgent && (
          <span className="text-[10px] font-bold text-[#F9795A] bg-[#FEF0EC] px-2 py-0.5 rounded-full uppercase tracking-wide">Urgente</span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#2F4251] mb-0.5">{value}</div>
      <div className="text-sm text-[#8A9BB0]">{label}</div>
      {sub && <div className="text-xs text-[#B8C4D0] mt-1">{sub}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({ icon: Icon, title, href, color = '#127284' }: {
  icon: React.ElementType; title: string; href?: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} strokeWidth={2} />
        </div>
        <h2 className="font-semibold text-[#2F4251] text-[15px]">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-xs text-[#127284] font-medium flex items-center gap-0.5 hover:underline">
          Ver tudo <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

// ─── Hot Leads Widget ─────────────────────────────────────────
function HotLeadsWidget({ leads }: { leads: HotLead[] }) {
  if (!leads.length) return (
    <div className="text-center py-10 text-[#8A9BB0] text-sm">Nenhum lead quente no momento.</div>
  );
  return (
    <div className="space-y-2">
      {leads.map(lead => (
        <Link key={lead.id} href={`/leads?highlight=${lead.id}`}>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F4F7FA] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#FEF0EC] flex items-center justify-center shrink-0">
              <Flame size={15} className="text-[#F9795A]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#2F4251] text-sm truncate">{lead.name}</div>
              <div className="text-xs text-[#8A9BB0]">
                {lead.stage} · {lead.last_contact_at
                  ? `Contato ${formatDistanceToNow(new Date(lead.last_contact_at), { locale: ptBR, addSuffix: true })}`
                  : 'Sem contato'}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-[#EBF7FA] text-[#127284]">
                {lead.score}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Recent Messages Widget ───────────────────────────────────
const CHANNEL_ICONS: Record<string, string> = { whatsapp: '💬', instagram: '📸', facebook: '👤', website: '🌐' };

function RecentMsgsWidget({ msgs }: { msgs: RecentMsg[] }) {
  if (!msgs.length) return (
    <div className="text-center py-10 text-[#8A9BB0] text-sm">Nenhuma conversa recente.</div>
  );
  return (
    <div className="space-y-2">
      {msgs.map(msg => (
        <Link key={msg.id} href={`/chat?conversation=${msg.id}`}>
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F4F7FA] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#F4F7FA] flex items-center justify-center text-base shrink-0">
              {CHANNEL_ICONS[msg.channel] ?? '💬'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#2F4251] text-sm truncate">{msg.lead_name ?? 'Lead'}</div>
              <div className="text-xs text-[#8A9BB0]">
                {formatDistanceToNow(new Date(msg.updated_at), { locale: ptBR, addSuffix: true })}
              </div>
            </div>
            {msg.unread_count > 0 && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#F9795A] text-white text-[10px] font-bold flex items-center justify-center">
                {msg.unread_count}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Upcoming Events Widget ───────────────────────────────────
function UpcomingEventsWidget({ events }: { events: UpcomingEvent[] }) {
  if (!events.length) return (
    <div className="text-center py-10 text-[#8A9BB0] text-sm">Sem compromissos nos próximos 7 dias.</div>
  );
  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F4F7FA] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#EBF7FA] flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#127284] uppercase">
              {format(new Date(ev.start_at), 'MMM', { locale: ptBR })}
            </span>
            <span className="text-base font-bold text-[#127284] leading-none">
              {format(new Date(ev.start_at), 'd')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#2F4251] text-sm truncate">{ev.title}</div>
            <div className="text-xs text-[#8A9BB0]">
              {format(new Date(ev.start_at), 'HH:mm')} · {ev.lead_name ?? ev.location ?? ev.type}
            </div>
          </div>
          {!ev.confirmed && (
            <span className="text-[10px] font-medium text-[#CA8A04] bg-[#FEF9EC] px-2 py-0.5 rounded-full shrink-0">Pendente</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Unassigned Leads Widget ──────────────────────────────────
function UnassignedLeadsWidget({ leads, members, onAssigned }: {
  leads: UnassignedLead[];
  members: { id: string; name: string }[];
  onAssigned?: () => void;
}) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  if (!leads.length) return (
    <div className="text-center py-10 text-[#8A9BB0] text-sm">Todos os leads têm responsáveis. ✓</div>
  );

  const handleAssign = async (leadId: string, memberId: string) => {
    if (!memberId) return;
    setAssigning(leadId);
    setAssignError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
          'x-user-id': localStorage.getItem('dl_active_user') ?? '',
        },
        // memberId is business_members.id which is what leads.assigned_to references
        body: JSON.stringify({ assigned_to: memberId, _log_activity: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao atribuir');
      onAssigned?.(); // refresh dashboard
    } catch (e: any) {
      setAssignError(e.message);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-2">
      {assignError && (
        <div className="text-xs text-[#E03131] bg-[#FFEAEA] px-3 py-2 rounded-lg">
          Erro: {assignError}
        </div>
      )}
      {leads.map(lead => (
        <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F4F7FA] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#F4F7FA] border border-[#DAE1EA] flex items-center justify-center shrink-0">
            {assigning === lead.id
              ? <div className="w-4 h-4 border-2 border-[#127284]/20 border-t-[#127284] rounded-full animate-spin" />
              : <User size={14} className="text-[#8A9BB0]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#2F4251] text-sm truncate">{lead.name}</div>
            <div className="text-xs text-[#8A9BB0]">{lead.stage} · score {lead.score}</div>
          </div>
          <select
            disabled={assigning === lead.id}
            value=""
            onChange={e => { if (e.target.value) handleAssign(lead.id, e.target.value); }}
            className="text-xs border border-[#DAE1EA] rounded-lg px-2 py-1.5 text-[#555D6F] bg-white focus:outline-none focus:border-[#127284] cursor-pointer disabled:opacity-50"
          >
            <option value="" disabled>Atribuir…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ─── Team Activity Feed ───────────────────────────────────────
const ACTIVITY_LABELS: Record<string, string> = {
  creation: 'criou o lead', contact: 'contatou', stage_change: 'moveu de etapa',
  import: 'converteu contato', note: 'adicionou nota', whatsapp: 'enviou mensagem',
};

function TeamActivityFeed({ activities }: { activities: TeamActivity[] }) {
  if (!activities.length) return (
    <div className="text-center py-10 text-[#8A9BB0] text-sm">Sem atividades recentes.</div>
  );
  return (
    <div className="space-y-3">
      {activities.map(a => (
        <div key={a.id} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#127284] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
            {a.actor_name?.split(' ').map(n => n[0]).join('').substring(0, 2) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2F4251]">
              <span className="font-medium">{a.actor_name?.split(' ')[0]}</span>
              {' '}<span className="text-[#555D6F]">{ACTIVITY_LABELS[a.type] ?? a.type}</span>
              {a.lead_name && <span className="font-medium"> {a.lead_name}</span>}
            </p>
            <p className="text-xs text-[#8A9BB0] mt-0.5">
              {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State (no business) ────────────────────────────────
function NoBusiness() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Building2 size={64} className="text-[#DAE1EA] mb-4" />
      <h2 className="text-xl font-bold text-[#2F4251] mb-2">Bem-vindo ao DeepLead</h2>
      <p className="text-[#8A9BB0] max-w-sm">
        Sua conta ainda não está vinculada a nenhum negócio. Peça ao gestor para convidá-lo ou crie um novo workspace.
      </p>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
  const { user, business, activeUserId, isLoadingUser } = useApp();
  const devUser = (user as any);
  const role: string = devUser?.role ?? 'colaborador';
  const canToggleView = role === 'dono' || role === 'gestor';

  const [days, setDays] = useState<DashboardDays>(() => {
    if (typeof window !== 'undefined') {
      return (parseInt(localStorage.getItem('dl_dash_days') ?? '30') as DashboardDays);
    }
    return 30;
  });
  const [view, setView] = useState<DashboardView>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dl_dash_view') as DashboardView) ?? 'user';
    }
    return 'user';
  });

  const [data, setData] = useState<DashboardData | null>(null);
  const [serverRole, setServerRole] = useState<string>(role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Members list for unassigned widget
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    if (!business || isLoadingUser) return; // wait for AppContext to finish loading
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardData(days, view);
      setData(res.data);
      setServerRole(res.role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days, view, business, activeUserId, isLoadingUser]);

  useEffect(() => { load(); }, [load]);

  // Load members for unassigned widget
  useEffect(() => {
    if (!business || !canToggleView) return;
    fetch('/api/members', {
      headers: {
        'x-business-id': localStorage.getItem('dl_active_business') ?? '',
        'x-user-id': localStorage.getItem('dl_active_user') ?? '',
      }
    })
      .then(r => r.json())
      .then(res => {
        // IMPORTANT: assigned_to in leads stores the business_members.id (member_id),
        // NOT core.users.id. Use m.id (the membership record ID).
        const list = (res.data ?? []).map((m: any) => ({
          id: m.id,          // business_members.id (this is what leads.assigned_to stores)
          userId: m.user?.id, // core.users.id (for display purposes)
          name: m.user?.name,
        })).filter((m: any) => m.id && m.name);
        setMembers(list);
      })
      .catch(() => {});
  }, [business, canToggleView]);

  const handleDays = (d: DashboardDays) => {
    setDays(d);
    localStorage.setItem('dl_dash_days', String(d));
  };
  const handleView = (v: DashboardView) => {
    setView(v);
    localStorage.setItem('dl_dash_view', v);
  };

  if (!business) return <AppLayout title="Dashboard"><NoBusiness /></AppLayout>;

  const kpis = data?.kpis;
  const isBusinessView = view === 'business';

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* ── Header bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#2F4251]">
              {view === 'user' ? `Olá, ${user?.name?.split(' ')[0]} 👋` : business.name}
            </h1>
            <p className="text-sm text-[#8A9BB0] mt-0.5">
              {view === 'user' ? 'Sua visão personalizada do CRM' : 'Visão geral do negócio'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View toggle (dono/gestor only) */}
            {canToggleView && (
              <div className="flex items-center bg-[#F4F7FA] rounded-xl p-1 gap-1">
                <button
                  onClick={() => handleView('user')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'user' ? 'bg-white text-[#127284] shadow-sm' : 'text-[#8A9BB0] hover:text-[#555D6F]'}`}
                >
                  <User size={14} /> Minha Visão
                </button>
                <button
                  onClick={() => handleView('business')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'business' ? 'bg-white text-[#127284] shadow-sm' : 'text-[#8A9BB0] hover:text-[#555D6F]'}`}
                >
                  <Building2 size={14} /> Negócio
                </button>
              </div>
            )}

            {/* Days toggle */}
            <div className="flex items-center bg-[#F4F7FA] rounded-xl p-1 gap-1">
              {([7, 30] as DashboardDays[]).map(d => (
                <button
                  key={d}
                  onClick={() => handleDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? 'bg-white text-[#127284] shadow-sm' : 'text-[#8A9BB0] hover:text-[#555D6F]'}`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button onClick={load} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F4F7FA] text-[#8A9BB0] hover:text-[#127284] transition-colors disabled:animate-spin">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="bg-[#FFEAEA] border border-[#F9795A]/30 rounded-xl p-4 text-sm text-[#E03131]">
            Erro ao carregar dados: {error}
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label={`Novos leads (${days}d)`}
            value={loading ? '—' : (kpis?.total_leads ?? 0)}
            sub={view === 'business' ? 'Todo o negócio' : 'Atribuídos a mim'}
            color="#127284"
          />
          <KpiCard
            icon={TrendingUp}
            label="Taxa de conversão"
            value={loading ? '—' : `${kpis?.conversion_rate ?? 0}%`}
            sub={`Qualificados + fechados`}
            color="#22A06B"
          />
          <KpiCard
            icon={Clock}
            label="Tempo médio de resposta"
            value={loading ? '—' : `${kpis?.avg_response_hours ?? 0}h`}
            sub="Primeiro contato"
            color="#3BAFC4"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Leads sem contato +48h"
            value={loading ? '—' : (kpis?.leads_no_contact ?? 0)}
            sub="Precisam de atenção"
            color="#F9795A"
            urgent={(kpis?.leads_no_contact ?? 0) > 0}
          />
        </div>

        {/* ── Main widgets grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Hot Leads */}
          <div className="bg-white rounded-2xl p-5 border border-[#DAE1EA]">
            <SectionHeader icon={Flame} title="Leads Quentes" href="/leads" color="#F9795A" />
            {loading
              ? <LoadingSkeleton rows={4} />
              : <HotLeadsWidget leads={data?.hot_leads ?? []} />
            }
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-2xl p-5 border border-[#DAE1EA]">
            <SectionHeader icon={MessageSquare} title="Mensagens Recentes" href="/chat" color="#127284" />
            {loading
              ? <LoadingSkeleton rows={4} />
              : <RecentMsgsWidget msgs={data?.recent_msgs ?? []} />
            }
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl p-5 border border-[#DAE1EA]">
            <SectionHeader icon={Calendar} title="Próximos Compromissos" href="/agenda" color="#3BAFC4" />
            {loading
              ? <LoadingSkeleton rows={4} />
              : <UpcomingEventsWidget events={data?.upcoming ?? []} />
            }
          </div>
        </div>

        {/* ── AI Insights placeholder ─────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0E5B6A] to-[#127284] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-[#F9795A]" />
            <span className="font-semibold">Assistente IA</span>
            <span className="text-[10px] font-bold bg-[#F9795A] px-1.5 py-0.5 rounded-full">BETA</span>
          </div>
          <p className="text-white/70 text-sm">
            A IA está analisando seus leads e identificando oportunidades. Os insights personalizados estarão disponíveis em breve.
          </p>
        </div>

        {/* ── Gestor/Dono — Business View Extra Widgets ──────── */}
        {canToggleView && isBusinessView && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unassigned Leads */}
            <div className="bg-white rounded-2xl p-5 border border-[#DAE1EA]">
              <SectionHeader icon={UserCheck} title="Leads sem Responsável" color="#F9795A" />
              {loading
                ? <LoadingSkeleton rows={4} />
                : <UnassignedLeadsWidget leads={data?.unassigned ?? []} members={members} onAssigned={load} />
              }
            </div>

            {/* Team Activity */}
            <div className="bg-white rounded-2xl p-5 border border-[#DAE1EA]">
              <SectionHeader icon={Zap} title="Atividade da Equipe" color="#3BAFC4" />
              {loading
                ? <LoadingSkeleton rows={5} />
                : <TeamActivityFeed activities={data?.team_activity ?? []} />
              }
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F4F7FA] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#F4F7FA] rounded w-3/4" />
            <div className="h-2.5 bg-[#F4F7FA] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

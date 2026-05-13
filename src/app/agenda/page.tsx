'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { ViewScopeToggle, type ViewScope } from '@/components/ui/ViewScopeToggle';
import { apiClient } from '@/lib/apiClient';
import {
  Plus, ChevronLeft, ChevronRight, MapPin, User, Phone, Video,
  RefreshCw, CheckCircle2, Clock,
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AgendaEvent {
  id: string;
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  location: string | null;
  notes: string | null;
  confirmed: boolean;
  lead: { id: string; name: string; phone: string } | null;
  member: {
    id: string;
    business_role: string;
    user: { id: string; name: string; avatar_url: string | null };
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  visit:     { bg: '#EBF7FA', text: '#127284', border: '#3BAFC4' },
  call:      { bg: '#E6F5EF', text: '#22A06B', border: '#22A06B' },
  follow_up: { bg: '#FEF9EC', text: '#CA8A04', border: '#F59E0B' },
  meeting:   { bg: '#FEF0EC', text: '#F9795A', border: '#F9795A' },
  other:     { bg: '#F4F7FA', text: '#555D6F', border: '#8A9BB0' },
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  visit: MapPin, call: Phone, follow_up: User, meeting: Video, other: User,
};

const EVENT_LABELS: Record<string, string> = {
  visit: 'Visita', call: 'Ligação', follow_up: 'Follow-up', meeting: 'Reunião', other: 'Outro',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { t, user, activeBusinessId } = useApp();

  const isColaborador = user?.role === 'colaborador';
  const canManage = user?.role === 'dono' || user?.role === 'gestor';
  const myMemberId = user?.businesses.find(b => b.id === activeBusinessId)?.memberId ?? null;
  const [scope, setScope] = useState<ViewScope>('business');

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load events ────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async (month: Date) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('month', format(month, 'yyyy-MM'));
      const effectiveAssigned = isColaborador ? myMemberId : (scope === 'mine' ? myMemberId : null);
      if (effectiveAssigned) params.set('assigned_to', effectiveAssigned);

      const json: any = await apiClient(`/api/events?${params}`, { cache: 'no-store' });
      setEvents(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }, [scope, isColaborador, myMemberId]);

  useEffect(() => { loadEvents(currentMonth); }, [currentMonth, scope, loadEvents]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun
  const paddedDays: (Date | null)[] = Array(startPad).fill(null).concat(days as any);

  const eventsForDay = (day: Date) =>
    events.filter(ev => isSameDay(new Date(ev.start_at), day));

  const selectedEvents = eventsForDay(selectedDay);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     events.length,
    confirmed: events.filter(e => e.confirmed).length,
    pending:   events.filter(e => !e.confirmed).length,
    visits:    events.filter(e => e.type === 'visit').length,
  };

  return (
    <AppLayout title={t('agenda.title')}>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total no mês', value: stats.total,     color: '#127284', bg: '#EBF7FA' },
          { label: 'Confirmados',  value: stats.confirmed, color: '#22A06B', bg: '#E6F5EF' },
          { label: 'Pendentes',    value: stats.pending,   color: '#F59E0B', bg: '#FEF9EC' },
          { label: 'Visitas',      value: stats.visits,    color: '#F9795A', bg: '#FEF0EC' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#DAE1EA] px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: s.bg, color: s.color }}>{s.value}</div>
            <span className="text-xs text-[#555D6F] leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div />
        <div className="flex items-center gap-2">
          {canManage && (
            <ViewScopeToggle
              scope={scope}
              onChange={setScope}
              labels={{ business: 'Toda equipe', mine: 'Minha agenda' }}
            />
          )}
          <button onClick={() => loadEvents(currentMonth)}
            className="w-9 h-9 rounded-xl border border-[#DAE1EA] bg-white flex items-center justify-center text-[#8A9BB0] hover:border-[#3BAFC4] hover:text-[#127284] transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium bg-[#127284] text-white px-4 py-2.5 rounded-xl hover:bg-[#3BAFC4] transition-all">
            <Plus size={14} /> Novo evento
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FFEAEA] text-[#E03131] text-sm px-4 py-3 rounded-xl mb-5">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-2xl border border-[#DAE1EA] p-6">
          {/* Month header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#2F4251] text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="w-8 h-8 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#555D6F] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => { setCurrentMonth(today); setSelectedDay(today); }}
                className="px-3 py-1 text-xs font-medium text-[#127284] bg-[#EBF7FA] rounded-lg hover:bg-[#127284] hover:text-white transition-all">
                Hoje
              </button>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="w-8 h-8 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#555D6F] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-[#8A9BB0] py-1">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;
              const dayEvents = eventsForDay(day);
              const isSelected = isSameDay(day, selectedDay);
              const isTodayDay = isToday(day);
              return (
                <button key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm transition-all ${
                    isSelected
                      ? 'bg-[#127284] text-white'
                      : isTodayDay
                        ? 'bg-[#EBF7FA] text-[#127284] font-bold'
                        : 'hover:bg-[#F4F7FA] text-[#2F4251]'
                  }`}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : EVENT_COLORS[ev.type]?.border ?? '#127284' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-[#DAE1EA] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EDF0F4] shrink-0">
            <p className="text-[11px] font-semibold text-[#8A9BB0] uppercase tracking-wide">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-lg font-bold text-[#2F4251] mt-0.5">
              {selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[#F4F7FA] rounded-xl animate-pulse" />
              ))
            ) : selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm text-[#8A9BB0]">Nenhum evento neste dia</p>
              </div>
            ) : selectedEvents.map(ev => {
              const colors = EVENT_COLORS[ev.type] ?? EVENT_COLORS.other;
              const Icon = EVENT_ICONS[ev.type] ?? User;
              return (
                <div key={ev.id}
                  className="rounded-xl border p-3.5 transition-all hover:shadow-sm"
                  style={{ backgroundColor: colors.bg, borderColor: `${colors.border}40` }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: colors.border + '25', color: colors.text }}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                          {ev.title}
                        </span>
                        {ev.confirmed
                          ? <CheckCircle2 size={13} className="text-[#22A06B] shrink-0" />
                          : <Clock size={13} className="text-[#F59E0B] shrink-0" />
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: colors.border + '20', color: colors.text }}>
                          {EVENT_LABELS[ev.type]}
                        </span>
                        <span className="text-[11px] text-[#8A9BB0]">
                          {format(new Date(ev.start_at), 'HH:mm')} – {format(new Date(ev.end_at), 'HH:mm')}
                        </span>
                      </div>
                      {ev.lead && (
                        <p className="text-[11px] text-[#555D6F] mt-1.5 truncate">
                          👤 {ev.lead.name}
                        </p>
                      )}
                      {ev.location && (
                        <p className="text-[11px] text-[#8A9BB0] mt-0.5 truncate">
                          📍 {ev.location}
                        </p>
                      )}
                      {ev.member && (
                        <p className="text-[11px] text-[#8A9BB0] mt-0.5 truncate">
                          👤 {ev.member.user.name.split(' ')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

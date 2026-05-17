'use client';
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { fetchConversations, fetchMessages, sendMessage, updateConversation } from '@/lib/services/chat';
import { fetchLead, updateLead } from '@/lib/services/leads';
import { createClient } from '@/lib/supabase/client';
import { ViewScopeToggle, type ViewScope } from '@/components/ui/ViewScopeToggle';
import Link from 'next/link';
import {
  Search, Send, Sparkles, CheckCheck, MoreHorizontal,
  Phone, Info, Tag, RefreshCw, Filter, X, MessageSquare,
  Home, MapPin, DollarSign, Loader2, Briefcase, Users, Calendar, Pencil, Save, Mail, Clock, AlertTriangle
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  conversation_id: string;
  sender_type: 'lead' | 'agent' | 'ai' | 'system';
  sender_id: string | null;
  content: string;
  read: boolean;
  is_ai_suggestion: boolean;
  created_at: string;
  sender: { id: string; name: string; avatar_url: string | null } | null;
}

interface Conv {
  id: string;
  channel: string;
  status: string;
  unread_count: number;
  last_message_at: string;
  lead: {
    id: string; name: string; phone: string; email: string | null;
    status: string; stage: string; score: number; ip_city: string | null;
    real_estate_profile?: { interest_notes?: string; budget_max?: number } | null;
  };
  assigned_member: { id: string; business_role: string; user: { id: string; name: string } } | null;
  last_message: { content: string; sender_type: string; created_at: string } | null;
}

import type { Lead } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────
const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', email: '📧', tiktok: '🎵',
};
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  new:      { bg: '#EBF7FA', text: '#127284',  label: 'Novo' },
  open:     { bg: '#FEF9EC', text: '#CA8A04',  label: 'Aberto' },
  pending:  { bg: '#F4F7FA', text: '#555D6F',  label: 'Pendente' },
  resolved: { bg: '#E6F5EF', text: '#22A06B',  label: 'Resolvido' },
};
const STAGE_LABELS: Record<string, string> = {
  new_lead: 'Novo', contact_initiated: 'Contato', visit_scheduled: 'Visita',
  proposal: 'Proposta', negotiation: 'Negociação', won: 'Fechado', lost: 'Perdido',
};

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', website: '🌐',
  referral: '🤝', direct: '📞', tiktok: '🎵', import: '📥',
};
const TIMELINE_PT: Record<string, string> = {
  immediate: 'Imediato', within_3m: 'Até 3 meses', within_6m: 'Até 6 meses',
  within_12m: 'Até 12 meses', exploring: 'Explorando',
};
const INTENT_PT: Record<string, string> = { buy: 'Compra', rent: 'Aluguel', invest: 'Investimento' };

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon size={12} className="text-[#8A9BB0] mt-0.5 shrink-0" />
      <div>
        <div className="text-[9px] text-[#8A9BB0] uppercase tracking-wide leading-none mb-0.5">{label}</div>
        <div className="text-xs text-[#2F4251]">{value}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#EDF0F4] pt-4 mt-4">
      <h4 className="text-[10px] font-bold text-[#8A9BB0] uppercase tracking-wide mb-3">{title}</h4>
      {children}
    </div>
  );
}

const AI_TIPS: Record<string, string> = {
  new:      'Sugiro uma saudação personalizada mencionando a origem do lead.',
  open:     'Lead engajado — bom momento para propor visita ou enviar proposta.',
  pending:  'Lead aguardando retorno. Recomendo follow-up direto.',
  resolved: 'Conversa encerrada. Solicite avaliação/indicação.',
};

function msgDate(d: string) {
  const date = new Date(d);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Ontem';
  return format(date, 'dd/MM');
}

function groupByDate(msgs: Msg[]) {
  const groups: { label: string; msgs: Msg[] }[] = [];
  msgs.forEach(m => {
    const date = new Date(m.created_at);
    const label = isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "d 'de' MMMM", { locale: ptBR });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.msgs.push(m);
    else groups.push({ label, msgs: [m] });
  });
  return groups;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ name, size = 9 }: { name: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-[#127284] to-[#3BAFC4] flex items-center justify-center text-white font-bold shrink-0`}
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.4 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ConvItem({ conv, active, onClick }: { conv: Conv; active: boolean; onClick: () => void }) {
  const s = STATUS_STYLE[conv.status] ?? STATUS_STYLE.new;
  return (
    <button onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-[#F8FAFB] border-b border-[#F0F4F8] ${active ? 'bg-[#EBF7FA] border-l-2 border-l-[#127284]' : ''}`}>
      <div className="relative shrink-0">
        <Avatar name={conv.lead.name} size={9} />
        <span className="absolute -bottom-0.5 -right-0.5 text-[11px]">{CHANNEL_ICON[conv.channel] ?? '💬'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm text-[#2F4251] truncate">{conv.lead.name}</span>
          <span className="text-[11px] text-[#8A9BB0] shrink-0 ml-2">
            {conv.last_message_at ? msgDate(conv.last_message_at) : ''}
          </span>
        </div>
        <p className="text-xs text-[#8A9BB0] truncate">
          {conv.last_message?.sender_type === 'agent' ? '✓ ' : ''}
          {conv.last_message?.content ?? 'Sem mensagens'}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
          {conv.unread_count > 0 && (
            <span className="bg-[#F9795A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">{conv.unread_count}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ChatContent() {
  const { t, user, activeBusinessId } = useApp();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('conversation_id');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isColaborador = user?.role === 'colaborador';
  const canManage = user?.role === 'dono' || user?.role === 'gestor';
  const myMemberId = user?.businesses.find(b => b.id === activeBusinessId)?.memberId ?? null;
  const [scope, setScope] = useState<ViewScope>('business');

  const [conversations, setConversations] = useState<Conv[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConvId);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showLeadDetails, setShowLeadDetails] = useState(true);
  const [aiTip, setAiTip] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);

  // Full lead details state
  const [fullLead, setFullLead] = useState<Lead | null>(null);
  const [loadingFullLead, setLoadingFullLead] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  // Agent Modal state
  const [agentModalOpen, setAgentModalOpen] = useState(false);

  const selected = conversations.find(c => c.id === selectedId) ?? null;
  const filtered = conversations.filter(c =>
    (!search || c.lead.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || c.status === statusFilter)
  );

  // Load conversations with scope filter
  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const effectiveAssigned = isColaborador ? myMemberId : (scope === 'mine' ? myMemberId : undefined);
      const data = await fetchConversations({ limit: 50, assigned_to: effectiveAssigned ?? undefined });
      setConversations(data);
      setSelectedId(prev => {
        if (data.length > 0 && !prev && !initialConvId) return data[0].id;
        return prev;
      });
    } catch { /* silent */ } finally { if (!silent) setLoadingConvs(false); }
  }, [initialConvId, scope, isColaborador, myMemberId]);

  useEffect(() => { loadConversations(); }, [scope]);

  // Check WhatsApp connection status
  useEffect(() => {
    fetch('/api/integrations/whatsapp', {
      headers: { 'x-business-id': localStorage.getItem('dl_active_business') ?? '' },
    })
      .then(r => r.json())
      .then(json => setWhatsappConnected(json.connected ?? false))
      .catch(() => setWhatsappConnected(false));
  }, [activeBusinessId]);

  // Realtime conversations updates (for new messages, insights, modes, etc.)
  useEffect(() => {
    if (!activeBusinessId) return;
    const supabase = createClient();
    
    // We use a custom broadcast event from the server to bypass Postgres RLS WAL limitations
    const channel = supabase.channel(`business_chat_${activeBusinessId}`)
      .on('broadcast', { event: 'conversation_updated' }, () => {
        // Silently reload to fetch the joined data (like lead name, last_message content, etc.)
        // This ensures the sidebar is always perfectly synced without F5.
        loadConversations(true);
      })
      // Fallback for native DB changes (status changes, etc)
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'messaging',
        table: 'conversations'
      }, () => {
        loadConversations(true);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [activeBusinessId, loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    setLoadingMsgs(true);
    fetchMessages(selectedId)
      .then(data => { setMessages(data); })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));

    // Subscribe to realtime messages using Broadcast (Foolproof, bypasses Postgres replication issues)
    const supabase = createClient();
    const channel = supabase.channel(`chat_${selectedId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const newMsg = payload as Msg;
        // Append optimistically for instant feedback
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, sender: null }]; // Null sender initially, will be updated by fetch
        });
        
        // Trigger a refetch to get the joined data (like sender.name)

        fetchMessages(selectedId).then(data => setMessages(data));
        
        // Update unread count if it's not from agent
        if (newMsg.sender_type !== 'agent') {
          setConversations(prev => prev.map(c => 
            c.id === selectedId ? { 
              ...c, 
              last_message: { content: newMsg.content, sender_type: newMsg.sender_type, created_at: newMsg.created_at },
              last_message_at: newMsg.created_at,
              unread_count: c.unread_count + 1 
            } : c
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  // AI tip based on status or insight
  useEffect(() => {
    if (selected) {
      setAiTip(selected.ai_insight || AI_TIPS[selected.status] || AI_TIPS.new);
    }
  }, [selected]);

  // Load full lead details when conversation is selected
  useEffect(() => {
    if (!selectedId || !selected || !selected.lead.id) {
      setFullLead(null);
      return;
    }
    setLoadingFullLead(true);
    fetchLead(selected.lead.id)
      .then(data => {
        setFullLead(data);
        setNoteInput(data.notes || '');
      })
      .catch(console.error)
      .finally(() => setLoadingFullLead(false));
  }, [selectedId, selected?.lead.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedId || sending || !selected) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // TAKEOVER LOGIC: If agent types manually, switch mode to manual automatically
    let modeUpdateProm = Promise.resolve();
    if (selected.ai_mode === 'agent') {
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, ai_mode: 'manual' } : c));
      modeUpdateProm = updateConversation(selectedId, { ai_mode: 'manual' });
    }

    // Optimistic
    const tempMsg: Msg = {
      id: `temp_${Date.now()}`, conversation_id: selectedId,
      sender_type: 'agent', sender_id: '22222222-0000-0000-0000-000000000001',
      content, read: true, is_ai_suggestion: false,
      created_at: new Date().toISOString(), sender: { id: 'u1', name: 'Bryan Costa', avatar_url: null },
    };
    setMessages(prev => [...prev, tempMsg]);
    // Update conv list preview
    setConversations(prev => prev.map(c =>
      c.id === selectedId ? {
        ...c, last_message: { content, sender_type: 'agent', created_at: tempMsg.created_at },
        last_message_at: tempMsg.created_at, unread_count: 0
      } : c
    ));
    try {
      await modeUpdateProm;
      const { data } = await sendMessage(selectedId, content);
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...tempMsg, ...data } : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Falha ao enviar mensagem.');
    } finally { setSending(false); }
  };

  const handleModeChange = async (mode: 'manual' | 'assisted' | 'agent') => {
    if (!selectedId || !selected) return;
    
    if (mode === 'agent' && selected.ai_mode !== 'agent') {
      setAgentModalOpen(true);
      return;
    }

    await applyModeChange(mode);
  };

  const applyModeChange = async (mode: 'manual' | 'assisted' | 'agent') => {
    if (!selectedId || !selected) return;
    const oldMode = selected.ai_mode;
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, ai_mode: mode } : c));
    try {
      await updateConversation(selectedId, { ai_mode: mode });
    } catch {
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, ai_mode: oldMode } : c));
      alert('Falha ao atualizar modo da IA.');
    }
  };

  const confirmAgentMode = () => {
    setAgentModalOpen(false);
    applyModeChange('agent');
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedId || !selected) return;
    const oldStatus = selected.status;
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status } : c));
    try {
      await updateConversation(selectedId, { status });
    } catch {
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status: oldStatus } : c));
      alert('Falha ao atualizar status.');
    }
  };

  const handleSaveNote = async () => {
    if (!fullLead) return;
    try {
      await updateLead(fullLead.id, { notes: noteInput.trim() });
      setFullLead({ ...fullLead, notes: noteInput.trim() });
      setEditingNote(false);
    } catch {
      alert('Falha ao salvar nota.');
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count ?? 0), 0);
  const groups = groupByDate(messages);

  return (
    <AppLayout title={t('chat.title')}>
      <div className="flex gap-0 h-[calc(100vh-120px)] bg-white rounded-2xl border border-[#DAE1EA] overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="w-80 shrink-0 flex flex-col border-r border-[#EDF0F4]">
          {/* Header */}
          <div className="px-4 py-4 border-b border-[#EDF0F4] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#2F4251] text-sm">Conversas</h3>
                {totalUnread > 0 && <p className="text-[11px] text-[#F9795A]">{totalUnread} não lida{totalUnread > 1 ? 's' : ''}</p>}
              </div>
              <button onClick={loadConversations} className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]">
                <RefreshCw size={13} className={loadingConvs ? 'animate-spin' : ''} />
              </button>
            </div>
            {/* Scope toggle */}
            {canManage && (
              <div className="mb-3">
                <ViewScopeToggle
                  scope={scope}
                  onChange={setScope}
                  labels={{ business: 'Todas conversas', mine: 'Minhas conversas' }}
                  className="w-full"
                />
              </div>
            )}
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-2 bg-[#F4F7FA] rounded-xl text-xs text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:ring-1 focus:ring-[#3BAFC4]" />
            </div>
            {/* Status filter tabs */}
            <div className="flex gap-1 mt-2">
              {[{ v: '', l: 'Todos' }, { v: 'new', l: 'Novos' }, { v: 'open', l: 'Abertos' }, { v: 'pending', l: 'Pendentes' }, { v: 'archived', l: 'Arquivados' }].map(({ v, l }) => (
                <button key={v} onClick={() => setStatusFilter(v)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${statusFilter === v ? 'bg-[#127284] text-white' : 'text-[#8A9BB0] hover:text-[#2F4251]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp not connected banner */}
          {whatsappConnected === false && (
            <div className="mx-3 mb-2 p-3 bg-[#FEF9EC] border border-[#FDE68A] rounded-xl">
              <p className="text-[11px] font-semibold text-[#92400E] mb-1">WhatsApp não conectado</p>
              <p className="text-[10px] text-[#B45309] leading-relaxed mb-2">
                Conecte seu WhatsApp Business para receber mensagens aqui em tempo real.
              </p>
              <Link
                href="/business"
                className="text-[10px] font-bold text-[#CA8A04] hover:underline flex items-center gap-1"
                onClick={() => {}}
              >
                Configurar integração →
              </Link>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F0F4F8] animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-[#F4F7FA] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[#F4F7FA] rounded w-2/3" />
                    <div className="h-2.5 bg-[#F4F7FA] rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare size={32} className="text-[#DAE1EA] mb-3" />
                <p className="text-sm text-[#8A9BB0] font-medium">
                  {whatsappConnected === false ? 'Conecte o WhatsApp para ver mensagens' : 'Nenhuma conversa ainda'}
                </p>
                <p className="text-xs text-[#B8C4D0] mt-1">
                  {whatsappConnected !== false ? 'Mensagens do WhatsApp aparecem aqui automaticamente' : ''}
                </p>
              </div>
            ) : filtered.map(c => (
              <ConvItem key={c.id} conv={c} active={selectedId === c.id}
                onClick={() => { setSelectedId(c.id); setShowLeadDetails(true); }} />
            ))}
          </div>
        </div>

        {/* ── Chat Area ── */}
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={48} className="text-[#DAE1EA] mb-4" />
            <p className="font-medium text-[#2F4251]">Selecione uma conversa</p>
            <p className="text-sm text-[#8A9BB0] mt-1">Escolha um lead no painel ao lado</p>
          </div>
        ) : (
          <div className="flex-1 flex min-w-0">

            {/* Messages column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-[#EDF0F4] flex items-center gap-3 shrink-0">
                <Avatar name={selected.lead.name} size={9} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#2F4251] text-sm">{selected.lead.name}</span>
                    <span className="text-base">{CHANNEL_ICON[selected.channel]}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: STATUS_STYLE[selected.status]?.bg, color: STATUS_STYLE[selected.status]?.text }}>
                      {STATUS_STYLE[selected.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A9BB0]">
                    {selected.lead.phone}
                    {selected.lead.ip_city && ` · ${selected.lead.ip_city}`}
                    {selected.assigned_member && ` · ${selected.assigned_member.user.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* AI Mode Selector */}
                  <div className="flex bg-[#F4F7FA] rounded-lg p-0.5 border border-[#DAE1EA]">
                    {(['manual', 'assisted', 'agent'] as const).map(mode => (
                      <button key={mode} onClick={() => handleModeChange(mode)}
                        className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all ${selected.ai_mode === mode ? 'bg-white text-[#127284] shadow-sm' : 'text-[#8A9BB0] hover:text-[#555D6F]'}`}>
                        {mode === 'manual' ? 'Manual' : mode === 'assisted' ? 'Copiloto' : 'Agente'}
                      </button>
                    ))}
                  </div>
                  {/* Status change */}
                  <select value={selected.status} onChange={e => handleStatusChange(e.target.value)}
                    className="text-xs border border-[#DAE1EA] rounded-lg px-2 py-1.5 text-[#555D6F] bg-white outline-none focus:border-[#3BAFC4]">
                    <option value="new">Novo</option>
                    <option value="open">Aberto</option>
                    <option value="pending">Pendente</option>
                    <option value="resolved">Resolvido</option>
                  </select>
                  <button className="w-8 h-8 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]">
                    <Phone size={14} />
                  </button>
                  <button onClick={() => setShowLeadDetails(s => !s)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showLeadDetails ? 'bg-[#EBF7FA] text-[#127284]' : 'hover:bg-[#F4F7FA] text-[#8A9BB0]'}`}>
                    <Info size={14} />
                  </button>
                </div>
              </div>

              {/* AI tip */}
              {aiTip && (
                <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-[#EBF7FA] to-[#F4F7FA] rounded-xl border border-[#D0EDF3] flex items-start gap-2 shrink-0">
                  <Sparkles size={14} className="text-[#127284] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#127284] mb-0.5">Assistente IA</p>
                    <p className="text-xs text-[#555D6F]">{aiTip}</p>
                  </div>
                  <button onClick={() => setAiTip('')} className="text-[#8A9BB0] hover:text-[#555D6F] shrink-0">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#3BAFC4]" />
                  </div>
                ) : groups.map(group => (
                  <div key={group.label}>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#EDF0F4]" />
                      <span className="text-[11px] text-[#B8C4D0] font-medium">{group.label}</span>
                      <div className="flex-1 h-px bg-[#EDF0F4]" />
                    </div>
                    <div className="space-y-2">
                      {group.msgs.map(msg => {
                        const isAgent = msg.sender_type === 'agent' || msg.sender_type === 'ai';
                        return (
                          <div key={msg.id} className={`flex items-end gap-2 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isAgent && <div className="w-6 h-6 rounded-full bg-[#F4F7FA] border border-[#DAE1EA] flex items-center justify-center text-[10px] font-bold text-[#8A9BB0] shrink-0">{selected.lead.name.charAt(0)}</div>}
                            <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isAgent
                              ? msg.is_ai_suggestion
                                ? 'bg-gradient-to-br from-[#127284] to-[#3BAFC4] text-white rounded-br-sm'
                                : 'bg-[#127284] text-white rounded-br-sm'
                              : 'bg-[#F4F7FA] text-[#2F4251] rounded-bl-sm'}`}>
                              {msg.is_ai_suggestion && <div className="flex items-center gap-1 mb-1 opacity-80"><Sparkles size={10} /><span className="text-[10px]">IA</span></div>}
                              {msg.content}
                              <div className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isAgent ? 'text-white/60' : 'text-[#B8C4D0]'}`}>
                                  {format(new Date(msg.created_at), 'HH:mm')}
                                </span>
                                {isAgent && <CheckCheck size={10} className={msg.read ? 'text-white/80' : 'text-white/40'} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-3 border-t border-[#EDF0F4] shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-[#F4F7FA] rounded-2xl border border-[#DAE1EA] focus-within:border-[#3BAFC4] focus-within:bg-white transition-all">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Digite uma mensagem... (Enter para enviar)"
                      rows={1}
                      className="w-full px-4 py-3 bg-transparent text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none resize-none"
                      style={{ maxHeight: 120 }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={handleSend} disabled={!input.trim() || sending}
                      className="w-10 h-10 bg-[#127284] text-white rounded-xl flex items-center justify-center hover:bg-[#3BAFC4] disabled:opacity-40 transition-all">
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                    <button onClick={() => setInput(aiTip || 'Olá! Como posso te ajudar?')}
                      title="Sugestão IA"
                      className="w-10 h-10 bg-[#F4F7FA] text-[#F9795A] rounded-xl flex items-center justify-center hover:bg-[#FEF0EC] transition-all border border-[#DAE1EA]">
                      <Sparkles size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Lead Info Panel ── */}
            {showLeadDetails && (
              <div className="w-72 shrink-0 border-l border-[#EDF0F4] overflow-y-auto bg-white">
                <div className="p-4 border-b border-[#EDF0F4]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#8A9BB0] uppercase tracking-wide">Info do Lead</h4>
                    <button onClick={() => setShowLeadDetails(false)} className="text-[#B8C4D0] hover:text-[#555D6F]"><X size={13} /></button>
                  </div>
                  <Avatar name={selected.lead.name} size={10} />
                  <p className="font-semibold text-[#2F4251] mt-2 text-sm">{selected.lead.name}</p>
                  <p className="text-xs text-[#8A9BB0]">{selected.lead.phone}</p>

                  {/* Score */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#F4F7FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#127284]" style={{ width: `${selected.lead.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#127284]">{selected.lead.score}</span>
                  </div>
                </div>

                <div className="p-4">
                  {loadingFullLead && !fullLead ? (
                    <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#3BAFC4]" /></div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <InfoRow icon={Phone} label="Telefone" value={selected.lead.phone} />
                        <InfoRow icon={Mail} label="E-mail" value={fullLead?.email} />
                        <InfoRow icon={MapPin} label="Localização" value={fullLead ? [fullLead.ip_city, fullLead.ip_state].filter(Boolean).join(' — ') : selected.lead.ip_city} />
                        <InfoRow icon={Calendar} label="Lead desde" value={fullLead?.created_at ? format(new Date(fullLead.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : undefined} />
                        <InfoRow icon={Clock} label="Último contato" value={fullLead?.last_contact_at ? formatDistanceToNow(new Date(fullLead.last_contact_at), { addSuffix: true, locale: ptBR }) : undefined} />
                        <InfoRow icon={Tag} label="Origem" value={fullLead?.source ? `${SOURCE_ICONS[fullLead.source] ?? ''} ${fullLead.source}` : undefined} />
                        {fullLead && (fullLead as any).assigned_member?.user?.name && (
                           <InfoRow icon={Users} label="Responsável" value={(fullLead as any).assigned_member.user.name} />
                        )}
                      </div>

                      {fullLead?.tags && fullLead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {fullLead.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded border border-[#DAE1EA] text-[#555D6F] bg-[#F4F7FA]">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Notes Section */}
                      <div className="mt-4 border-t border-[#EDF0F4] pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-[#8A9BB0] uppercase tracking-wide font-bold">Notas</p>
                          {!editingNote && (
                            <button onClick={() => setEditingNote(true)} className="text-[#8A9BB0] hover:text-[#127284]">
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                        {editingNote ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteInput}
                              onChange={e => setNoteInput(e.target.value)}
                              className="w-full text-xs p-2 border border-[#3BAFC4] rounded-lg outline-none resize-none bg-[#F4F7FA]"
                              rows={4}
                              placeholder="Adicione uma nota..."
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingNote(false); setNoteInput(fullLead?.notes || ''); }} className="text-[10px] px-2 py-1 text-[#8A9BB0] hover:bg-[#F4F7FA] rounded transition-all">Cancelar</button>
                              <button onClick={handleSaveNote} className="text-[10px] px-2 py-1 bg-[#127284] text-white rounded hover:bg-[#3BAFC4] flex items-center gap-1 transition-all">
                                <Save size={10} /> Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          fullLead?.notes ? (
                            <div className="p-3 bg-[#FEF9EC] rounded-xl border border-[#F59E0B]/20">
                              <p className="text-xs text-[#555D6F] whitespace-pre-wrap">{fullLead.notes}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#B8C4D0] italic cursor-pointer hover:text-[#8A9BB0] transition-colors" onClick={() => setEditingNote(true)}>Nenhuma nota. Clique para adicionar.</p>
                          )
                        )}
                      </div>

                      {/* Extra Profile details */}
                      {(fullLead?.occupation || fullLead?.monthly_income || fullLead?.marital_status || fullLead?.dependents_count) && (
                        <Section title="Perfil Socioeconômico">
                          <div className="space-y-3">
                            <InfoRow icon={Briefcase} label="Profissão" value={fullLead.occupation} />
                            {fullLead.monthly_income && <InfoRow icon={DollarSign} label="Renda mensal" value={`R$ ${fullLead.monthly_income.toLocaleString('pt-BR')}`} />}
                            {fullLead.marital_status && <InfoRow icon={Users} label="Estado civil" value={{ single: 'Solteiro(a)', married: 'Casado(a)', divorced: 'Divorciado(a)', widowed: 'Viúvo(a)', other: 'Outro' }[fullLead.marital_status]} />}
                            {fullLead.dependents_count != null && fullLead.dependents_count > 0 && <InfoRow icon={Users} label="Dependentes" value={`${fullLead.dependents_count} pessoa(s)`} />}
                          </div>
                        </Section>
                      )}
                      
                      {(fullLead?.real_estate_profile || selected.lead.real_estate_profile) && (
                        <Section title="Perfil Imobiliário">
                          <div className="space-y-3">
                            {(fullLead?.real_estate_profile?.interest_notes || selected.lead.real_estate_profile?.interest_notes) && (
                              <div className="p-2.5 bg-[#EBF7FA] rounded-lg">
                                <p className="text-[10px] text-[#127284] font-semibold flex items-center gap-1 mb-1"><Home size={10} /> Interesse</p>
                                <p className="text-xs text-[#2F4251]">{fullLead?.real_estate_profile?.interest_notes || selected.lead.real_estate_profile?.interest_notes}</p>
                              </div>
                            )}
                            <InfoRow icon={DollarSign} label="Orçamento"
                               value={(fullLead?.real_estate_profile || selected.lead.real_estate_profile)?.budget_max ? `R$ ${((fullLead?.real_estate_profile || selected.lead.real_estate_profile)?.budget_min ?? 0).toLocaleString('pt-BR')} — R$ ${(fullLead?.real_estate_profile || selected.lead.real_estate_profile)?.budget_max?.toLocaleString('pt-BR')}` : undefined} />
                            <InfoRow icon={Home} label="Intenção" value={fullLead?.real_estate_profile?.purchase_intent ? INTENT_PT[fullLead.real_estate_profile.purchase_intent] : undefined} />
                            <InfoRow icon={Clock} label="Prazo" value={fullLead?.real_estate_profile?.purchase_timeline ? TIMELINE_PT[fullLead.real_estate_profile.purchase_timeline] : undefined} />
                            {fullLead?.real_estate_profile?.desired_neighborhoods && fullLead.real_estate_profile.desired_neighborhoods.length > 0 && (
                              <InfoRow icon={MapPin} label="Bairros desejados" value={fullLead.real_estate_profile.desired_neighborhoods.join(', ')} />
                            )}
                          </div>
                        </Section>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Agent Mode Modal */}
      {agentModalOpen && (
        <div className="fixed inset-0 bg-[#2F4251]/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-[#FEF0EC] flex items-center justify-center text-[#F9795A] mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#2F4251] mb-2">Ativar Modo Agente?</h3>
              <p className="text-sm text-[#555D6F] leading-relaxed mb-6">
                A IA irá assumir o controle desta conversa e enviará mensagens para o lead no seu lugar de forma autônoma.
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setAgentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#555D6F] bg-[#F4F7FA] hover:bg-[#EDF0F4] transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmAgentMode}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#127284] hover:bg-[#3BAFC4] transition-colors shadow-sm">
                  Sim, ativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#3BAFC4]" /></div>}>
      <ChatContent />
    </Suspense>
  );
}

'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Phone, Mail, MessageSquare, MapPin, Tag, Calendar,
  Briefcase, Users, DollarSign, Home, Clock, Pencil, Trash2,
  ChevronRight, CheckCircle2, Activity
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead } from '@/types';
import { LeadActivityTimeline } from './LeadActivityTimeline';
import { apiClient } from '@/lib/apiClient';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  new:      { bg: '#EBF7FA', text: '#127284', label: 'Novo' },
  open:     { bg: '#FEF9EC', text: '#CA8A04', label: 'Aberto' },
  pending:  { bg: '#F4F7FA', text: '#555D6F', label: 'Pendente' },
  resolved: { bg: '#E6F5EF', text: '#22A06B', label: 'Resolvido' },
  won:      { bg: '#E6F5EF', text: '#22A06B', label: 'Ganho' },
  lost:     { bg: '#FFEAEA', text: '#E03131', label: 'Perdido' },
};

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'Novo Lead', contact_initiated: 'Contato Iniciado',
  visit_scheduled: 'Visita Agendada', proposal: 'Proposta',
  negotiation: 'Negociação', won: 'Fechado', lost: 'Perdido',
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
const CHANNEL_PT: Record<string, string> = { whatsapp: 'WhatsApp', phone: 'Telefone', email: 'E-mail', in_person: 'Presencial' };
const TIME_PT: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite', weekend: 'Fim de semana', anytime: 'Qualquer hora' };

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? '#22A06B' : score >= 65 ? '#F59E0B' : '#E03131';
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#F4F7FA" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * c} ${c - (score / 100) * c}`} strokeLinecap="round" />
      </svg>
      <div className="text-center z-10">
        <div className="text-lg font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] text-[#8A9BB0] -mt-0.5">score</div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-[#8A9BB0] mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] text-[#8A9BB0] uppercase tracking-wide">{label}</div>
        <div className="text-sm text-[#2F4251]">{value}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#EDF0F4] pt-5 mt-5">
      <h4 className="text-xs font-bold text-[#8A9BB0] uppercase tracking-wide mb-4">{title}</h4>
      {children}
    </div>
  );
}

type Tab = 'info' | 'history';

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function LeadDetailDrawer({ lead, open, onClose, onEdit, onOpenChat, onDelete, onStatusChange }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<Tab>('info');
  const [navigating, setNavigating] = useState(false);

  const handleOpenChat = useCallback(async (l: Lead) => {
    setNavigating(true);
    try {
      // Try to find existing conversation for this lead
      const json: any = await apiClient(`/api/conversations?lead_id=${l.id}`);
      const conv = json.data;
      if (conv?.id) {
        router.push(`/chat?conversation_id=${conv.id}`);
      } else {
        // Create new conversation then navigate
        const created: any = await apiClient('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ lead_id: l.id }),
        });
        router.push(`/chat?conversation_id=${created.data?.id ?? ''}`);
      }
    } catch {
      router.push('/chat');
    } finally {
      setNavigating(false);
    }
  }, [router]);

  if (!lead) return null;

  const status = STATUS_MAP[lead.status] ?? STATUS_MAP.new;
  const profile = lead.real_estate_profile;
  const assignedName = (lead as any).assigned_member?.user?.name;

  return (
    <>
      {open && <div className="fixed inset-0 bg-[#2F4251]/30 z-40 backdrop-blur-[2px]" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white border-l border-[#DAE1EA] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EDF0F4] shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#127284] to-[#3BAFC4] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {lead.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-[#2F4251] text-base leading-tight">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg, color: status.text }}>{status.label}</span>
                  <span className="text-xs text-[#8A9BB0]">{STAGE_LABELS[lead.stage]}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]"><X size={16} /></button>
          </div>

          {/* Score + quick actions */}
          <div className="flex items-center gap-3">
            <ScoreRing score={lead.score} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <button onClick={() => handleOpenChat(lead)} disabled={navigating}
                className="flex flex-col items-center gap-1 py-2 rounded-xl bg-[#EBF7FA] hover:bg-[#127284] text-[#127284] hover:text-white transition-all disabled:opacity-60">
                <MessageSquare size={15} />
                <span className="text-[10px] font-medium">{navigating ? '...' : 'Chat'}</span>
              </button>
              <a href={`tel:${lead.phone}`}
                className="flex flex-col items-center gap-1 py-2 rounded-xl bg-[#F4F7FA] hover:bg-[#555D6F] text-[#555D6F] hover:text-white transition-all">
                <Phone size={15} />
                <span className="text-[10px] font-medium">Ligar</span>
              </a>
              <button onClick={() => onEdit(lead)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl bg-[#FEF0EC] hover:bg-[#F9795A] text-[#F9795A] hover:text-white transition-all">
                <Pencil size={15} />
                <span className="text-[10px] font-medium">Editar</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[{ key: 'info' as Tab, label: 'Informações' }, { key: 'history' as Tab, label: 'Histórico' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-[#127284] text-white' : 'text-[#8A9BB0] hover:text-[#2F4251]'}`}>
                {t.key === 'history' && <Activity size={11} className="inline mr-1" />}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'history' ? (
            <LeadActivityTimeline leadId={lead.id} />
          ) : (
            <>
              {/* Contact info */}
              <div className="space-y-3">
                <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
                {lead.email && <InfoRow icon={Mail} label="E-mail" value={lead.email} />}
                {(lead.ip_city || lead.ip_state) && (
                  <InfoRow icon={MapPin} label="Localização" value={[lead.ip_city, lead.ip_state].filter(Boolean).join(' — ')} />
                )}
                <InfoRow icon={Calendar} label="Lead desde" value={format(new Date(lead.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} />
                {lead.last_contact_at && (
                  <InfoRow icon={Clock} label="Último contato" value={formatDistanceToNow(new Date(lead.last_contact_at), { addSuffix: true, locale: ptBR })} />
                )}
                <InfoRow icon={Tag} label="Origem" value={`${SOURCE_ICONS[lead.source] ?? ''} ${lead.source}`} />
                {assignedName && <InfoRow icon={Users} label="Responsável" value={assignedName} />}
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {lead.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[#F4F7FA] text-[#555D6F] border border-[#DAE1EA]">#{tag}</span>
                  ))}
                </div>
              )}

              {lead.notes && (
                <div className="mt-4 p-3 bg-[#FEF9EC] rounded-xl border border-[#F59E0B]/20">
                  <p className="text-xs text-[#8A9BB0] mb-1 font-medium">Notas</p>
                  <p className="text-sm text-[#555D6F] leading-relaxed">{lead.notes}</p>
                </div>
              )}

              {(lead.occupation || lead.monthly_income || lead.marital_status) && (
                <Section title="Perfil Socioeconômico">
                  <div className="space-y-3">
                    <InfoRow icon={Briefcase} label="Profissão" value={lead.occupation} />
                    {lead.monthly_income && <InfoRow icon={DollarSign} label="Renda mensal" value={`R$ ${lead.monthly_income.toLocaleString('pt-BR')}`} />}
                    {lead.marital_status && <InfoRow icon={Users} label="Estado civil" value={{ single: 'Solteiro(a)', married: 'Casado(a)', divorced: 'Divorciado(a)', widowed: 'Viúvo(a)', other: 'Outro' }[lead.marital_status]} />}
                    {lead.dependents_count != null && lead.dependents_count > 0 && <InfoRow icon={Users} label="Dependentes" value={`${lead.dependents_count} pessoa(s)`} />}
                  </div>
                </Section>
              )}

              {profile && (
                <Section title="Perfil Imobiliário">
                  <div className="space-y-3">
                    {profile.interest_notes && (
                      <div className="p-3 bg-[#EBF7FA] rounded-xl">
                        <p className="text-xs text-[#127284] font-semibold mb-1 flex items-center gap-1"><Home size={12} /> Interesse</p>
                        <p className="text-sm text-[#2F4251]">{profile.interest_notes}</p>
                      </div>
                    )}
                    <InfoRow icon={DollarSign} label="Orçamento"
                      value={profile.budget_max ? `R$ ${(profile.budget_min ?? 0).toLocaleString('pt-BR')} — R$ ${profile.budget_max.toLocaleString('pt-BR')}` : undefined} />
                    <InfoRow icon={Home} label="Intenção" value={profile.purchase_intent ? INTENT_PT[profile.purchase_intent] : undefined} />
                    <InfoRow icon={Clock} label="Prazo" value={profile.purchase_timeline ? TIMELINE_PT[profile.purchase_timeline] : undefined} />
                    {profile.desired_neighborhoods && profile.desired_neighborhoods.length > 0 && (
                      <InfoRow icon={MapPin} label="Bairros desejados" value={profile.desired_neighborhoods.join(', ')} />
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.financing_pre_approved && <span className="flex items-center gap-1 text-xs text-[#22A06B] bg-[#E6F5EF] px-2.5 py-1 rounded-full"><CheckCircle2 size={11} /> Finan. pré-aprovado</span>}
                      {profile.fgts_available && <span className="flex items-center gap-1 text-xs text-[#22A06B] bg-[#E6F5EF] px-2.5 py-1 rounded-full"><CheckCircle2 size={11} /> FGTS disponível</span>}
                      {profile.has_property_to_sell && <span className="flex items-center gap-1 text-xs text-[#F59E0B] bg-[#FEF9EC] px-2.5 py-1 rounded-full"><Home size={11} /> Tem imóvel p/ vender</span>}
                    </div>
                    <InfoRow icon={MessageSquare} label="Canal preferido" value={profile.preferred_channel ? CHANNEL_PT[profile.preferred_channel] : undefined} />
                    <InfoRow icon={Clock} label="Melhor horário" value={profile.preferred_contact_time ? TIME_PT[profile.preferred_contact_time] : undefined} />
                  </div>
                </Section>
              )}

              <Section title="Alterar Status">
                <div className="grid grid-cols-2 gap-2">
                  {['won', 'lost', 'pending', 'open'].map(s => (
                    <button key={s} disabled={lead.status === s} onClick={() => onStatusChange(lead.id, s)}
                      className={`py-2 rounded-xl text-xs font-medium transition-all border ${lead.status === s
                        ? 'bg-[#F4F7FA] text-[#B8C4D0] border-[#EDF0F4] cursor-default'
                        : s === 'won' ? 'border-[#22A06B] text-[#22A06B] hover:bg-[#22A06B] hover:text-white'
                        : s === 'lost' ? 'border-[#E03131] text-[#E03131] hover:bg-[#E03131] hover:text-white'
                        : 'border-[#DAE1EA] text-[#555D6F] hover:bg-[#F4F7FA]'
                      }`}>
                      {STATUS_MAP[s]?.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Zona de Perigo">
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 text-sm text-[#E03131] hover:bg-[#FFEAEA] px-3 py-2 rounded-xl transition-all w-full">
                    <Trash2 size={14} /> Excluir lead
                  </button>
                ) : (
                  <div className="bg-[#FFEAEA] rounded-xl p-3">
                    <p className="text-xs text-[#E03131] font-medium mb-2">Confirma exclusão de {lead.name}?</p>
                    <div className="flex gap-2">
                      <button onClick={() => { onDelete(lead.id); setConfirmDelete(false); }}
                        className="flex-1 py-1.5 bg-[#E03131] text-white text-xs font-medium rounded-lg hover:brightness-90">Confirmar</button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-1.5 bg-white text-[#555D6F] text-xs font-medium rounded-lg hover:bg-[#F4F7FA]">Cancelar</button>
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EDF0F4] shrink-0">
          <button onClick={() => handleOpenChat(lead)} disabled={navigating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#127284] text-white font-medium rounded-xl hover:bg-[#3BAFC4] transition-all disabled:opacity-60">
            <MessageSquare size={16} />
            {navigating ? 'Abrindo conversa...' : 'Abrir conversa'}
            <ChevronRight size={14} className="ml-auto" />
          </button>
        </div>
      </div>
    </>
  );
}

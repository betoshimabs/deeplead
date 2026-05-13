'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Phone, Mail, Briefcase, DollarSign, Home, MapPin, Tag } from 'lucide-react';
import { updateLead, createLead } from '@/lib/services/leads';
import type { Lead, LeadRealEstateProfile } from '@/types';

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Partial<Lead>) => void;
}

const STAGES = [
  { value: 'new_lead',          label: 'Novo Lead' },
  { value: 'contact_initiated', label: 'Contato Iniciado' },
  { value: 'visit_scheduled',   label: 'Visita Agendada' },
  { value: 'proposal',          label: 'Proposta' },
  { value: 'negotiation',       label: 'Negociação' },
  { value: 'won',               label: 'Fechado' },
  { value: 'lost',              label: 'Perdido' },
];

const STATUSES = [
  { value: 'new',      label: 'Novo' },
  { value: 'open',     label: 'Aberto' },
  { value: 'pending',  label: 'Pendente' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'won',      label: 'Ganho' },
  { value: 'lost',     label: 'Perdido' },
];

const SOURCES = [
  { value: 'whatsapp',  label: '💬 WhatsApp' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'facebook',  label: '👤 Facebook' },
  { value: 'website',   label: '🌐 Site' },
  { value: 'referral',  label: '🤝 Indicação' },
  { value: 'direct',    label: '📞 Direto' },
  { value: 'tiktok',    label: '🎵 TikTok' },
  { value: 'import',    label: '📥 Importação' },
];

const MARITAL = [
  { value: 'single',   label: 'Solteiro(a)' },
  { value: 'married',  label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed',  label: 'Viúvo(a)' },
  { value: 'other',    label: 'Outro' },
];

const EMPLOYMENT = [
  { value: 'clt',           label: 'CLT' },
  { value: 'autonomous',    label: 'Autônomo' },
  { value: 'business_owner',label: 'Empresário' },
  { value: 'retired',       label: 'Aposentado' },
  { value: 'other',         label: 'Outro' },
];

const INTENT_OPTS = [
  { value: 'buy',    label: 'Compra' },
  { value: 'rent',   label: 'Aluguel' },
  { value: 'invest', label: 'Investimento' },
];

const TIMELINE_OPTS = [
  { value: 'immediate',   label: 'Imediato' },
  { value: 'within_3m',  label: 'Até 3 meses' },
  { value: 'within_6m',  label: 'Até 6 meses' },
  { value: 'within_12m', label: 'Até 12 meses' },
  { value: 'exploring',  label: 'Explorando' },
];

const CHANNEL_OPTS = [
  { value: 'whatsapp',   label: 'WhatsApp' },
  { value: 'phone',      label: 'Telefone' },
  { value: 'email',      label: 'E-mail' },
  { value: 'in_person',  label: 'Presencial' },
];

const CONTACT_TIME_OPTS = [
  { value: 'morning',   label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening',   label: 'Noite' },
  { value: 'weekend',   label: 'Fim de semana' },
  { value: 'anytime',   label: 'Qualquer hora' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#8A9BB0] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] focus:bg-white transition-all" />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] outline-none focus:border-[#3BAFC4] focus:bg-white transition-all appearance-none">
      <option value="">— selecionar —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

type Section = 'contact' | 'profile' | 'real_estate';

export function LeadEditModal({ lead, open, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('contact');
  const [form, setForm] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<Record<string, any>>({});

  useEffect(() => {
    if (lead) {
      setForm({
        name:             lead.name ?? '',
        phone:            lead.phone ?? '',
        secondary_phone:  lead.secondary_phone ?? '',
        email:            lead.email ?? '',
        status:           lead.status ?? 'new',
        stage:            lead.stage ?? 'new_lead',
        source:           lead.source ?? 'direct',
        score:            lead.score ?? 50,
        occupation:       lead.occupation ?? '',
        employer:         lead.employer ?? '',
        employment_type:  lead.employment_type ?? '',
        monthly_income:   lead.monthly_income ?? '',
        marital_status:   lead.marital_status ?? '',
        dependents_count: lead.dependents_count ?? 0,
        ip_city:          lead.ip_city ?? '',
        ip_state:         lead.ip_state ?? '',
        notes:            lead.notes ?? '',
        tags:             (lead.tags ?? []).join(', '),
      });

      const rp: Partial<LeadRealEstateProfile> = lead.real_estate_profile ?? {};
      setProfile({
        purchase_intent:        rp.purchase_intent ?? '',
        purchase_timeline:      rp.purchase_timeline ?? '',
        budget_min:             rp.budget_min ?? '',
        budget_max:             rp.budget_max ?? '',
        interest_notes:         rp.interest_notes ?? '',
        desired_neighborhoods:  (rp.desired_neighborhoods ?? []).join(', '),
        financing_pre_approved: rp.financing_pre_approved ?? false,
        fgts_available:         rp.fgts_available ?? false,
        has_property_to_sell:   rp.has_property_to_sell ?? false,
        preferred_channel:      rp.preferred_channel ?? '',
        preferred_contact_time: rp.preferred_contact_time ?? '',
      });
    } else {
      setForm({
        name: '', phone: '', secondary_phone: '', email: '',
        status: 'new', stage: 'new_lead', source: 'direct', score: 50,
        occupation: '', employer: '', employment_type: '', monthly_income: '',
        marital_status: '', dependents_count: 0, ip_city: '', ip_state: '',
        notes: '', tags: '',
      });
      setProfile({
        purchase_intent: '', purchase_timeline: '', budget_min: '', budget_max: '',
        interest_notes: '', desired_neighborhoods: '', financing_pre_approved: false,
        fgts_available: false, has_property_to_sell: false, preferred_channel: '',
        preferred_contact_time: '',
      });
    }
  }, [lead, open]);

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setP = (k: string, v: any) => setProfile(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      alert('Nome e telefone são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const cleanForm = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
      const leadPayload = {
        ...cleanForm,
        score: Number(form.score || 0),
        dependents_count: Number(form.dependents_count || 0),
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };

      const cleanProfile = Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, v === '' ? null : v]));
      const profilePayload = {
        ...cleanProfile,
        budget_min: profile.budget_min ? Number(profile.budget_min) : null,
        budget_max: profile.budget_max ? Number(profile.budget_max) : null,
        desired_neighborhoods: profile.desired_neighborhoods
          ? profile.desired_neighborhoods.split(',').map((n: string) => n.trim()).filter(Boolean)
          : [],
      };

      if (lead) {
        await updateLead(lead.id, { ...leadPayload, real_estate_profile: profilePayload } as Record<string, unknown>);
        onSaved({ ...leadPayload, real_estate_profile: profilePayload } as Partial<Lead>);
      } else {
        const created = await createLead({ ...leadPayload, real_estate_profile: profilePayload } as Record<string, unknown>);
        onSaved(created.data ?? created);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'contact',     label: 'Contato' },
    { key: 'profile',     label: 'Perfil' },
    { key: 'real_estate', label: 'Imobiliário' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-[#2F4251]/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
        onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#EDF0F4] flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-semibold text-[#2F4251]">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
              {lead && <p className="text-xs text-[#8A9BB0] mt-0.5">{lead.name}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]">
              <X size={16} />
            </button>
          </div>

          {/* Section tabs */}
          <div className="px-6 pt-4 flex gap-1 shrink-0">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.key
                    ? 'bg-[#127284] text-white'
                    : 'text-[#8A9BB0] hover:text-[#2F4251] hover:bg-[#F4F7FA]'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* CONTACT */}
            {activeSection === 'contact' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nome completo">
                    <Input value={form.name} onChange={v => setF('name', v)} placeholder="Nome do lead" />
                  </Field>
                  <Field label="Status">
                    <Select value={form.status} onChange={v => setF('status', v)} options={STATUSES} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Telefone principal">
                    <Input value={form.phone} onChange={v => setF('phone', v)} placeholder="(71) 99999-0000" />
                  </Field>
                  <Field label="Telefone secundário">
                    <Input value={form.secondary_phone} onChange={v => setF('secondary_phone', v)} placeholder="(71) 99999-0000" />
                  </Field>
                </div>
                <Field label="E-mail">
                  <Input value={form.email} onChange={v => setF('email', v)} placeholder="email@exemplo.com" type="email" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Etapa do pipeline">
                    <Select value={form.stage} onChange={v => setF('stage', v)} options={STAGES} />
                  </Field>
                  <Field label="Origem">
                    <Select value={form.source} onChange={v => setF('source', v)} options={SOURCES} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Cidade">
                    <Input value={form.ip_city} onChange={v => setF('ip_city', v)} placeholder="Salvador" />
                  </Field>
                  <Field label="Estado (UF)">
                    <Input value={form.ip_state} onChange={v => setF('ip_state', v)} placeholder="BA" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Score IA (0–100)">
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={form.score ?? 50}
                        onChange={e => setF('score', e.target.value)}
                        className="flex-1 accent-[#127284]" />
                      <span className="text-sm font-bold text-[#127284] w-8">{form.score}</span>
                    </div>
                  </Field>
                  <Field label="Tags (separadas por vírgula)">
                    <Input value={form.tags} onChange={v => setF('tags', v)} placeholder="quente, financiado, urgente" />
                  </Field>
                </div>
                <Field label="Notas internas">
                  <textarea value={form.notes} onChange={e => setF('notes', e.target.value)}
                    rows={3} placeholder="Observações sobre este lead..."
                    className="w-full px-3 py-2.5 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] focus:bg-white transition-all resize-none" />
                </Field>
              </>
            )}

            {/* PROFILE */}
            {activeSection === 'profile' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Profissão">
                    <Input value={form.occupation} onChange={v => setF('occupation', v)} placeholder="Engenheiro, Médico..." />
                  </Field>
                  <Field label="Empresa / Empregador">
                    <Input value={form.employer} onChange={v => setF('employer', v)} placeholder="Nome da empresa" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo de vínculo">
                    <Select value={form.employment_type} onChange={v => setF('employment_type', v)} options={EMPLOYMENT} />
                  </Field>
                  <Field label="Renda mensal (R$)">
                    <Input value={form.monthly_income} onChange={v => setF('monthly_income', v)} type="number" placeholder="12000" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Estado civil">
                    <Select value={form.marital_status} onChange={v => setF('marital_status', v)} options={MARITAL} />
                  </Field>
                  <Field label="Número de dependentes">
                    <Input value={form.dependents_count} onChange={v => setF('dependents_count', v)} type="number" placeholder="0" />
                  </Field>
                </div>
              </>
            )}

            {/* REAL ESTATE */}
            {activeSection === 'real_estate' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Intenção de compra">
                    <Select value={profile.purchase_intent} onChange={v => setP('purchase_intent', v)} options={INTENT_OPTS} />
                  </Field>
                  <Field label="Prazo estimado">
                    <Select value={profile.purchase_timeline} onChange={v => setP('purchase_timeline', v)} options={TIMELINE_OPTS} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Orçamento mínimo (R$)">
                    <Input value={profile.budget_min} onChange={v => setP('budget_min', v)} type="number" placeholder="300000" />
                  </Field>
                  <Field label="Orçamento máximo (R$)">
                    <Input value={profile.budget_max} onChange={v => setP('budget_max', v)} type="number" placeholder="500000" />
                  </Field>
                </div>
                <Field label="Interesse / Imóvel em vista">
                  <Input value={profile.interest_notes} onChange={v => setP('interest_notes', v)} placeholder="Apto 302 — Condomínio Brise Barra" />
                </Field>
                <Field label="Bairros desejados (separados por vírgula)">
                  <Input value={profile.desired_neighborhoods} onChange={v => setP('desired_neighborhoods', v)} placeholder="Barra, Pituba, Ondina" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Canal preferido">
                    <Select value={profile.preferred_channel} onChange={v => setP('preferred_channel', v)} options={CHANNEL_OPTS} />
                  </Field>
                  <Field label="Melhor horário para contato">
                    <Select value={profile.preferred_contact_time} onChange={v => setP('preferred_contact_time', v)} options={CONTACT_TIME_OPTS} />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { key: 'financing_pre_approved', label: 'Financiamento pré-aprovado' },
                    { key: 'fgts_available',         label: 'FGTS disponível' },
                    { key: 'has_property_to_sell',   label: 'Tem imóvel para vender' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setP(key, !profile[key])}
                        className={`w-10 h-5 rounded-full transition-all relative ${profile[key] ? 'bg-[#127284]' : 'bg-[#DAE1EA]'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${profile[key] ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className="text-sm text-[#555D6F]">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#EDF0F4] flex items-center justify-between shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 border border-[#DAE1EA] rounded-xl text-sm text-[#555D6F] hover:bg-[#F4F7FA] transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#127284] text-white text-sm font-medium rounded-xl hover:bg-[#3BAFC4] disabled:opacity-60 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

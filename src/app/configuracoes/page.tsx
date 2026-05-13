'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { mockBusiness, mockTeam } from '@/lib/mock-data';
import {
  Building2, Users, Link2, CreditCard, Plus, CheckCircle2,
  AlertCircle, Settings, Trash2, Edit, Globe, Phone, Mail, MapPin, ChevronRight
} from 'lucide-react';

const TABS = [
  { id: 'business', label: 'Meu Negócio', icon: Building2 },
  { id: 'members', label: 'Membros', icon: Users },
  { id: 'integrations', label: 'Integrações', icon: Link2 },
  { id: 'billing', label: 'Faturamento', icon: CreditCard },
] as const;

type Tab = typeof TABS[number]['id'];

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', connected: true, detail: '+55 (71) 98765-4321 · 120 mensagens este mês' },
  { id: 'instagram', name: 'Instagram', icon: '📸', connected: true, detail: '@valoreimoveis · 5.4k seguidores' },
  { id: 'facebook', name: 'Facebook', icon: '👤', connected: false, detail: 'Não conectado' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: false, detail: 'Não conectado' },
  { id: 'google-calendar', name: 'Google Calendar', icon: '📅', connected: false, detail: 'Sincronize sua agenda' },
];

export default function ConfiguracoesPage() {
  const { t, segment, setSegment } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  return (
    <AppLayout title={t('settings.title')}>
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    active ? 'bg-[#EBF7FA] text-[#127284]' : 'text-[#555D6F] hover:bg-[#F4F7FA]'
                  }`}>
                  <Icon size={16} strokeWidth={1.8} className={active ? 'text-[#127284]' : 'text-[#8A9BB0]'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'business' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
                <h3 className="font-semibold text-[#2F4251] mb-5">Informações do Negócio</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Building2, label: 'Nome', value: mockBusiness.name },
                    { icon: Globe, label: 'Website', value: mockBusiness.website },
                    { icon: Phone, label: 'Telefone', value: mockBusiness.phone },
                    { icon: MapPin, label: 'Endereço', value: mockBusiness.address },
                    { icon: Settings, label: 'CNPJ', value: mockBusiness.cnpj },
                  ].map(f => (
                    <div key={f.label} className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-medium text-[#8A9BB0] mb-1.5">{f.label}</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F4F7FA] rounded-xl">
                        <f.icon size={14} className="text-[#8A9BB0] shrink-0" />
                        <span className="text-sm text-[#2F4251]">{f.value ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-5">
                  <button className="flex items-center gap-2 bg-[#127284] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#3BAFC4] transition-all">
                    <Edit size={14} />
                    Editar informações
                  </button>
                </div>
              </div>

              {/* Segment */}
              <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
                <h3 className="font-semibold text-[#2F4251] mb-1">{t('settings.segment_label')}</h3>
                <p className="text-sm text-[#8A9BB0] mb-4">Adapta a plataforma para o seu tipo de negócio</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['generic', 'real_estate'] as const).map(s => (
                    <button key={s} onClick={() => setSegment(s)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        segment === s
                          ? 'border-[#127284] bg-[#EBF7FA]'
                          : 'border-[#DAE1EA] hover:border-[#3BAFC4]'
                      }`}>
                      <div className="text-2xl mb-2">{s === 'generic' ? '⚡' : '🏠'}</div>
                      <div className={`font-medium text-sm ${segment === s ? 'text-[#127284]' : 'text-[#2F4251]'}`}>
                        {t(`segment.${s}`)}
                      </div>
                      <div className="text-xs text-[#8A9BB0] mt-0.5">
                        {s === 'generic' ? 'Qualquer tipo de negócio' : 'Imobiliárias e corretores'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-[#DAE1EA] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#EDF0F4] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#2F4251]">{t('settings.members')}</h3>
                  <p className="text-xs text-[#8A9BB0] mt-0.5">{mockTeam.length} membros ativos</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm font-medium bg-[#127284] text-white px-4 py-2 rounded-xl hover:bg-[#3BAFC4] transition-all">
                  <Plus size={14} />
                  Convidar
                </button>
              </div>
              <div className="divide-y divide-[#EDF0F4]">
                {mockTeam.map(member => (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F4F7FA] transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: member.business_role === 'gestor' ? '#127284' : '#3BAFC4' }}>
                      {member.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#2F4251]">{member.user.name}</div>
                      <div className="text-xs text-[#8A9BB0]">{member.user.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        member.business_role === 'gestor'
                          ? 'bg-[#EBF7FA] text-[#127284]'
                          : 'bg-[#F4F7FA] text-[#555D6F]'
                      }`}>
                        {member.business_role === 'gestor' ? 'Gestor' : 'Colaborador'}
                      </span>
                      <span className="text-xs text-[#8A9BB0]">{member.assigned_leads_count ?? 0} leads</span>
                      <button className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0] hover:text-[#E03131] transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-3">
              {INTEGRATIONS.map(integ => (
                <div key={integ.id} className="bg-white rounded-2xl border border-[#DAE1EA] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F7FA] flex items-center justify-center text-xl shrink-0">
                    {integ.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-[#2F4251]">{integ.name}</span>
                      {integ.connected
                        ? <span className="flex items-center gap-1 text-[11px] text-[#22A06B] font-medium"><CheckCircle2 size={12} /> Conectado</span>
                        : <span className="text-[11px] text-[#8A9BB0]">Não conectado</span>
                      }
                    </div>
                    <div className="text-xs text-[#8A9BB0]">{integ.detail}</div>
                  </div>
                  <button className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    integ.connected
                      ? 'text-[#555D6F] bg-[#F4F7FA] hover:bg-[#FFEAEA] hover:text-[#E03131]'
                      : 'text-white bg-[#127284] hover:bg-[#3BAFC4]'
                  }`}>
                    {integ.connected ? 'Desconectar' : <>Conectar <ChevronRight size={12} /></>}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-[#127284] bg-[#EBF7FA] px-2.5 py-1 rounded-full">Plano Profissional</span>
                    <div className="text-3xl font-bold text-[#2F4251] mt-3">R$ 197<span className="text-base font-normal text-[#8A9BB0]">/mês</span></div>
                  </div>
                  <span className="text-xs font-medium text-[#22A06B] bg-[#E6F5EF] px-2.5 py-1 rounded-full">Ativo</span>
                </div>
                <div className="space-y-2 text-sm text-[#555D6F]">
                  {['Até 5 usuários', 'WhatsApp Business incluído', 'Analytics completo', 'Assistente de IA', 'Suporte prioritário'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#22A06B]" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
                <h3 className="font-semibold text-[#2F4251] mb-1">Uso do mês</h3>
                <div className="space-y-3 mt-3">
                  {[
                    { label: 'Usuários', used: 4, total: 5 },
                    { label: 'Mensagens WhatsApp', used: 1238, total: 2000 },
                    { label: 'Leads ativos', used: 247, total: 500 },
                  ].map(u => (
                    <div key={u.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#555D6F]">{u.label}</span>
                        <span className="text-[#2F4251] font-medium">{u.used.toLocaleString('pt-BR')} / {u.total.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-1.5 bg-[#F4F7FA] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#127284]" style={{ width: `${(u.used / u.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

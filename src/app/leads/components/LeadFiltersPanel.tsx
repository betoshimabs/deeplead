'use client';
import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { LeadFilters } from '@/lib/services/leads';

interface Member { id: string; business_role: string; user: { name: string } }

interface Props {
  open: boolean;
  onClose: () => void;
  filters: LeadFilters;
  onChange: (f: Partial<LeadFilters>) => void;
  onReset: () => void;
  members: Member[];
  activeCount: number;
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
  { value: 'new',      label: 'Novo',      color: '#127284' },
  { value: 'open',     label: 'Aberto',    color: '#CA8A04' },
  { value: 'pending',  label: 'Pendente',  color: '#555D6F' },
  { value: 'resolved', label: 'Resolvido', color: '#22A06B' },
  { value: 'won',      label: 'Ganho',     color: '#22A06B' },
  { value: 'lost',     label: 'Perdido',   color: '#E03131' },
];

const SOURCES = [
  { value: 'whatsapp',  label: 'WhatsApp',  icon: '💬' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook',  label: 'Facebook',  icon: '👤' },
  { value: 'website',   label: 'Site',      icon: '🌐' },
  { value: 'referral',  label: 'Indicação', icon: '🤝' },
  { value: 'direct',    label: 'Direto',    icon: '📞' },
  { value: 'tiktok',    label: 'TikTok',    icon: '🎵' },
  { value: 'import',    label: 'Importação',icon: '📥' },
];

const CITIES = ['Salvador', 'Lauro de Freitas', 'Camaçari', 'Feira de Santana', 'Vitória da Conquista'];

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wide mb-2">{children}</p>;
}

function ToggleChip({
  active, onClick, children, color,
}: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? 'border-transparent text-white'
          : 'border-[#DAE1EA] text-[#555D6F] hover:border-[#3BAFC4] hover:text-[#127284]'
      }`}
      style={active ? { backgroundColor: color ?? '#127284' } : {}}
    >
      {children}
    </button>
  );
}

export function LeadFiltersPanel({ open, onClose, filters, onChange, onReset, members, activeCount }: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-[#2F4251]/20 z-40 backdrop-blur-[1px]" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-[#DAE1EA] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EDF0F4] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-[#2F4251]">Filtros</h3>
            {activeCount > 0 && (
              <p className="text-xs text-[#F9795A]">{activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={onReset} className="flex items-center gap-1 text-xs text-[#8A9BB0] hover:text-[#E03131] transition-colors">
                <RotateCcw size={12} /> Limpar
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#F4F7FA] flex items-center justify-center text-[#8A9BB0]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Score range */}
          <div>
            <FilterLabel>Score IA</FilterLabel>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100}
                value={filters.score_min ?? ''}
                onChange={e => onChange({ score_min: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Mín"
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] outline-none focus:border-[#3BAFC4]"
              />
              <span className="text-[#8A9BB0] text-xs">—</span>
              <input
                type="number" min={0} max={100}
                value={filters.score_max ?? ''}
                onChange={e => onChange({ score_max: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Máx"
                className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] outline-none focus:border-[#3BAFC4]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <FilterLabel>Status</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <ToggleChip
                  key={s.value}
                  active={filters.status === s.value}
                  color={s.color}
                  onClick={() => onChange({ status: filters.status === s.value ? undefined : s.value })}
                >
                  {s.label}
                </ToggleChip>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div>
            <FilterLabel>Etapa do Pipeline</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(s => (
                <ToggleChip
                  key={s.value}
                  active={filters.stage === s.value}
                  onClick={() => onChange({ stage: filters.stage === s.value ? undefined : s.value })}
                >
                  {s.label}
                </ToggleChip>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <FilterLabel>Origem</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <ToggleChip
                  key={s.value}
                  active={filters.source === s.value}
                  onClick={() => onChange({ source: filters.source === s.value ? undefined : s.value })}
                >
                  {s.icon} {s.label}
                </ToggleChip>
              ))}
            </div>
          </div>

          {/* Responsible */}
          <div>
            <FilterLabel>Responsável</FilterLabel>
            <div className="space-y-1.5">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => onChange({ assigned_to: filters.assigned_to === m.id ? undefined : m.id })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                    filters.assigned_to === m.id
                      ? 'bg-[#EBF7FA] text-[#127284]'
                      : 'text-[#555D6F] hover:bg-[#F4F7FA]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    filters.assigned_to === m.id ? 'bg-[#127284]' : 'bg-[#8A9BB0]'
                  }`}>
                    {m.user.name.charAt(0)}
                  </div>
                  <span className="truncate">{m.user.name}</span>
                  {m.business_role === 'gestor' && (
                    <span className="ml-auto text-[10px] text-[#127284] bg-[#EBF7FA] px-1.5 py-0.5 rounded-full">Gestor</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <FilterLabel>Cidade</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <ToggleChip
                  key={c}
                  active={filters.ip_city === c}
                  onClick={() => onChange({ ip_city: filters.ip_city === c ? undefined : c })}
                >
                  {c}
                </ToggleChip>
              ))}
            </div>
            <input
              type="text"
              value={!CITIES.includes(filters.ip_city ?? '') ? (filters.ip_city ?? '') : ''}
              onChange={e => onChange({ ip_city: e.target.value || undefined })}
              placeholder="Outra cidade..."
              className="mt-2 w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4]"
            />
          </div>

          {/* State */}
          <div>
            <FilterLabel>Estado</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {['BA', 'SP', 'RJ', 'MG', 'PE'].map(s => (
                <ToggleChip
                  key={s}
                  active={filters.ip_state === s}
                  onClick={() => onChange({ ip_state: filters.ip_state === s ? undefined : s })}
                >
                  {s}
                </ToggleChip>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#EDF0F4] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#127284] text-white text-sm font-medium rounded-xl hover:bg-[#3BAFC4] transition-all"
          >
            Aplicar filtros {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>
    </>
  );
}

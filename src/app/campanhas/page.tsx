'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/apiClient';
import { Plus, Download, Users, FileText, ExternalLink, MapPin, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const ST_MAP: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: '#E6F5EF', text: '#22A06B', label: 'Concluída' },
  draft:     { bg: '#F4F7FA', text: '#555D6F', label: 'Rascunho' },
  failed:    { bg: '#FFEAEA', text: '#E03131', label: 'Falhou' },
};
const SOURCES   = ['whatsapp','instagram','facebook','tiktok','website','referral','direct','import'];
const STATUSES  = ['new','contacted','lost'];
const UFS       = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const TEMPLATES = [
  { value:'whatsapp', label:'WhatsApp', desc:'Nome + Telefone (55...)' },
  { value:'email',    label:'E-mail',   desc:'Nome + Email' },
  { value:'full',     label:'Completo', desc:'Todos os campos' },
];
const STATUS_LABEL: Record<string, string> = { new:'Novo', contacted:'Contatado', in_progress:'Em Prog.', converted:'Convertido', lost:'Perdido' };
const STATUS_CLR:   Record<string, string> = { new:'#127284', contacted:'#6B7CF7', in_progress:'#F59E0B', converted:'#22A06B', lost:'#E03131' };

const INP = 'w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] transition-all';

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active
        ? 'bg-[#127284] text-white border-[#127284]'
        : 'bg-white text-[#555D6F] border-[#DAE1EA] hover:border-[#127284]'}`}>
      {label}
    </button>
  );
}

function Lbl({ t }: { t: string }) {
  return <p className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wide mb-1.5">{t}</p>;
}

/* ─── City Autocomplete ─────────────────────────────────────────────────────── */
type City = { id: number; name: string; state_code: string; lat: number; lng: number };

function CitySearch({ value, stateFilter, onChange }: {
  value: City | null;
  stateFilter?: string;
  onChange: (c: City | null) => void;
}) {
  const [q, setQ]           = useState('');
  const [results, setRes]   = useState<City[]>([]);
  const [open, setOpen]     = useState(false);
  const timer               = useRef<NodeJS.Timeout>();
  const ref                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setQ('');
    else setQ(`${value.name} / ${value.state_code}`);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (val: string) => {
    setQ(val);
    if (value) onChange(null);
    clearTimeout(timer.current);
    if (val.length < 2) { setRes([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: val, limit: '10' });
      if (stateFilter) params.set('state', stateFilter);
      const r = await apiClient(`/api/geo/cities?${params}`);
      setRes(r.data ?? []);
      setOpen(true);
    }, 250);
  };

  const select = (c: City) => { onChange(c); setQ(`${c.name} / ${c.state_code}`); setOpen(false); setRes([]); };
  const clear  = () => { onChange(null); setQ(''); setRes([]); };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
        <input value={q} onChange={e => search(e.target.value)} placeholder="Buscar cidade..."
          className={INP + ' pl-8 pr-8'} />
        {value && (
          <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A9BB0] hover:text-[#E03131]">
            <X size={13} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#DAE1EA] rounded-xl shadow-lg overflow-hidden">
          {results.map(c => (
            <button key={c.id} onClick={() => select(c)} type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F4F7FA] transition-colors">
              <MapPin size={12} className="text-[#3BAFC4] shrink-0" />
              <span className="text-[#2F4251]">{c.name}</span>
              <span className="text-[#8A9BB0] text-xs ml-auto">{c.state_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Preview Panel ─────────────────────────────────────────────────────────── */
function PreviewPanel({ contacts, total, loading }: { contacts: any[]; total: number; loading: boolean }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-semibold text-[#8A9BB0] uppercase tracking-wide">Pré-visualização</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
        <div className="bg-[#F4F7FA] rounded-xl px-3 py-2 text-center">
          <div className="text-lg font-bold text-[#2F4251]">{loading ? '—' : total.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-[#8A9BB0]">elegíveis</div>
        </div>
        <div className="bg-[#EBF7FA] rounded-xl px-3 py-2 text-center">
          <div className="text-lg font-bold text-[#127284]">{loading ? '—' : contacts.length}</div>
          <div className="text-xs text-[#8A9BB0]">amostra</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col gap-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-[#F4F7FA] rounded-xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && contacts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[#B8C4D0]">
          <Users size={28} className="mb-2" />
          <p className="text-sm font-medium">Nenhum contato elegível</p>
          <p className="text-xs mt-1">Ajuste os filtros ao lado</p>
        </div>
      )}

      {/* Table */}
      {!loading && contacts.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {contacts.map((c: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-2 bg-[#F4F7FA] rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[#127284]/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#127284]">{c.name?.[0]?.toUpperCase() ?? '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#2F4251] truncate">{c.name}</p>
                <p className="text-xs text-[#8A9BB0] truncate">{c.phone ?? c.email ?? '—'}{c.city ? ` · ${c.city}` : ''}</p>
              </div>
              {c.status && (
                <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0 font-medium"
                  style={{ backgroundColor: `${STATUS_CLR[c.status]}15`, color: STATUS_CLR[c.status] }}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              )}
            </div>
          ))}
          {total > contacts.length && (
            <p className="text-xs text-center text-[#8A9BB0] pt-1">+ {(total - contacts.length).toLocaleString('pt-BR')} contatos adicionais</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function CampanhasPage() {
  const { businessId } = useApp() as any;
  const [campaigns, setCampaigns]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [open, setOpen]             = useState(false);
  const [saving, setSaving]         = useState(false);

  // Form
  const [name, setName]             = useState('');
  const [notes, setNotes]           = useState('');
  const [tmpl, setTmpl]             = useState('whatsapp');
  const [statusF, setStatusF]       = useState<string[]>([]);
  const [sourceF, setSourceF]       = useState<string[]>([]);
  const [uf, setUf]                 = useState('');
  const [city, setCity]             = useState<City | null>(null);
  const [radius, setRadius]         = useState(0);
  const [ageMin, setAgeMin]         = useState('');
  const [ageMax, setAgeMax]         = useState('');
  const [reeng, setReeng]           = useState(false);

  // Preview
  const [prevList, setPrevList]     = useState<any[]>([]);
  const [prevTotal, setPrevTotal]   = useState(0);
  const [prevLoading, setPrevLoad]  = useState(false);
  const previewTimer                = useRef<NodeJS.Timeout>();

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try { const r = await apiClient('/api/campaigns?type=external'); setCampaigns(r.data ?? []); }
    catch { setCampaigns([]); }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  /* Real-time preview */
  const runPreview = useCallback(async () => {
    if (!businessId || !open) return;
    setPrevLoad(true);
    try {
      const p = new URLSearchParams();
      if (statusF.length) p.set('status', statusF.join(','));
      if (sourceF.length) p.set('source', sourceF.join(','));
      if (uf)             p.set('state_code', uf);
      if (city) {
        p.set('city', city.name);
        if (radius > 0) { p.set('radius_km', String(radius)); p.set('lat', String(city.lat)); p.set('lng', String(city.lng)); }
      }
      if (ageMin) p.set('age_min', ageMin);
      if (ageMax) p.set('age_max', ageMax);
      if (reeng)  p.set('reengagement', 'true');
      const r = await apiClient('/api/campaigns/eligible?' + p.toString());
      setPrevTotal(r.count ?? 0);
      setPrevList(r.sample ?? []);
    } catch { /* silent */ }
    finally { setPrevLoad(false); }
  }, [businessId, open, statusF, sourceF, uf, city, radius, ageMin, ageMax, reeng]);

  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(runPreview, 400);
    return () => clearTimeout(previewTimer.current);
  }, [runPreview]);

  const togStatus = (v: string) => setStatusF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const togSource = (v: string) => setSourceF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const create = async () => {
    if (!name.trim()) { alert('Dê um nome à campanha.'); return; }
    setSaving(true);
    try {
      const filters: Record<string, any> = {};
      if (statusF.length) filters.status = statusF;
      if (sourceF.length) filters.source = sourceF;
      if (uf) filters.state_code = uf;
      if (city) { filters.city = city.name; if (radius > 0) { filters.radius_km = radius; filters.center_lat = city.lat; filters.center_lng = city.lng; } }
      if (ageMin) filters.age_min = +ageMin;
      if (ageMax) filters.age_max = +ageMax;
      if (reeng) filters.include_reengagement = true;

      const r = await apiClient('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ type: 'external', name, notes, filters, export_template: tmpl }),
      });
      if (r.error) throw new Error(r.error);
      setOpen(false);
      setName(''); setNotes(''); setTmpl('whatsapp'); setStatusF([]); setSourceF([]);
      setUf(''); setCity(null); setRadius(0); setAgeMin(''); setAgeMax(''); setReeng(false);
      await load();
      if (r.data?.export_signed_url) window.open(r.data.export_signed_url, '_blank');
    } catch (e: any) { alert(e.message ?? 'Erro ao criar campanha.'); }
    finally { setSaving(false); }
  };

  const totalContacts = campaigns.reduce((a, c) => a + (c.contact_count ?? 0), 0);

  return (
    <AppLayout title="Campanhas">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Campanhas externas',  value: campaigns.length, color: '#127284' },
          { label: 'Contatos alcançados', value: totalContacts.toLocaleString('pt-BR'), color: '#3BAFC4' },
          { label: 'Campanhas internas',  value: 'Em breve', color: '#8A9BB0' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#DAE1EA] px-4 py-3">
            <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#8A9BB0]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-[#2F4251]">Campanhas Externas</h2>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-[#127284] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#3BAFC4] transition-all">
          <Plus size={14} /> Nova campanha externa
        </button>
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {loading ? (
          [1,2].map(i => <div key={i} className="bg-white border border-[#DAE1EA] rounded-2xl h-20 animate-pulse" />)
        ) : campaigns.length === 0 ? (
          <div className="bg-white border border-[#DAE1EA] rounded-2xl p-10 text-center">
            <ExternalLink size={32} className="mx-auto text-[#B8C4D0] mb-3" />
            <p className="font-semibold text-[#2F4251] mb-1">Nenhuma campanha externa ainda</p>
            <p className="text-sm text-[#8A9BB0]">Crie sua primeira campanha para exportar contatos segmentados.</p>
          </div>
        ) : campaigns.map(c => {
          const s = ST_MAP[c.status] ?? ST_MAP.completed;
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-[#DAE1EA] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EBF7FA] flex items-center justify-center shrink-0">
                <ExternalLink size={16} className="text-[#127284]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[#2F4251] truncate">{c.name}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8A9BB0]">
                  <span className="flex items-center gap-1"><Users size={11} />{(c.contact_count ?? 0).toLocaleString('pt-BR')} contatos</span>
                  <span className="flex items-center gap-1"><FileText size={11} />{c.export_template ?? 'full'}</span>
                  <span>{format(new Date(c.created_at), "d MMM yyyy", { locale: ptBR })}</span>
                </div>
                {c.notes && <p className="text-xs text-[#8A9BB0] mt-1 truncate">{c.notes}</p>}
              </div>
              {c.export_signed_url && (
                <a href={c.export_signed_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-[#EBF7FA] text-[#127284] hover:bg-[#127284] hover:text-white transition-all shrink-0">
                  <Download size={13} /> Baixar CSV
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal split ───────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF0F4] shrink-0">
              <h2 className="font-semibold text-[#2F4251]">Nova Campanha Externa</h2>
              <button onClick={() => setOpen(false)} className="text-[#8A9BB0] hover:text-[#2F4251] text-xl leading-none">&times;</button>
            </div>

            {/* Modal body: left form + right preview */}
            <div className="flex-1 min-h-0 flex">

              {/* ── LEFT: Form ── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 border-r border-[#EDF0F4]">

                <div>
                  <Lbl t="Nome da campanha" />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Leads inativos maio 2025" className={INP} />
                </div>

                <div>
                  <Lbl t="Observações" />
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Contexto desta campanha..." className={INP + ' resize-none'} />
                </div>

                <div>
                  <Lbl t="Status do contato" />
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => <Chip key={s} label={s} active={statusF.includes(s)} onClick={() => togStatus(s)} />)}
                  </div>
                </div>

                <div>
                  <Lbl t="Origem" />
                  <div className="flex flex-wrap gap-2">
                    {SOURCES.map(s => <Chip key={s} label={s} active={sourceF.includes(s)} onClick={() => togSource(s)} />)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Lbl t="Estado (UF)" />
                    <select value={uf} onChange={e => { setUf(e.target.value); setCity(null); }}
                      className={INP}>
                      <option value="">Todos</option>
                      {UFS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Lbl t="Cidade" />
                    <CitySearch value={city} stateFilter={uf} onChange={c => { setCity(c); if (!c) setRadius(0); }} />
                  </div>
                </div>

                {/* Radius — só aparece quando uma cidade está selecionada */}
                {city && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Lbl t={`Raio a partir de ${city.name}`} />
                      <span className="text-xs font-bold text-[#127284]">{radius === 0 ? 'Apenas a cidade' : `${radius} km`}</span>
                    </div>
                    <input type="range" min={0} max={200} step={5} value={radius}
                      onChange={e => setRadius(Number(e.target.value))}
                      className="w-full accent-[#127284]" />
                    <div className="flex justify-between text-xs text-[#B8C4D0] mt-0.5">
                      <span>Só a cidade</span><span>100 km</span><span>200 km</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Lbl t="Idade mín." />
                    <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)}
                      placeholder="18" className={INP} />
                  </div>
                  <div>
                    <Lbl t="Idade máx." />
                    <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)}
                      placeholder="65" className={INP} />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setReeng(v => !v)}
                    className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${reeng ? 'bg-[#127284]' : 'bg-[#DAE1EA]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${reeng ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-[#555D6F]">Incluir re-engajamentos (leads frios +90 dias)</span>
                </label>

                <div>
                  <Lbl t="Template de exportação" />
                  <div className="space-y-2">
                    {TEMPLATES.map(t => (
                      <label key={t.value} onClick={() => setTmpl(t.value)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tmpl === t.value ? 'border-[#127284] bg-[#EBF7FA]' : 'border-[#DAE1EA] hover:border-[#3BAFC4]'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${tmpl === t.value ? 'border-[#127284] bg-[#127284]' : 'border-[#B8C4D0]'}`} />
                        <div>
                          <p className="text-sm font-medium text-[#2F4251]">{t.label}</p>
                          <p className="text-xs text-[#8A9BB0]">{t.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Preview ── */}
              <div className="w-72 shrink-0 flex flex-col px-5 py-5 min-h-0">
                <PreviewPanel contacts={prevList} total={prevTotal} loading={prevLoading} />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#EDF0F4] flex items-center justify-between shrink-0">
              <p className="text-xs text-[#8A9BB0]">
                {prevLoading ? 'Calculando...' : `${prevTotal.toLocaleString('pt-BR')} contatos elegíveis com os filtros atuais`}
              </p>
              <button onClick={create} disabled={saving || !name.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#127284] text-white text-sm font-medium rounded-xl hover:bg-[#3BAFC4] disabled:opacity-60 transition-all">
                <Download size={14} />{saving ? 'Gerando...' : 'Gerar e baixar CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

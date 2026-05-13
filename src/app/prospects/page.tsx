'use client';
import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { fetchProspects, createProspect, updateProspect, deleteProspect, convertProspectToLead } from '@/lib/services/prospects';
import type { ProspectFilters } from '@/lib/services/prospects';
import Papa from 'papaparse';
import { ImportProspectsModal } from './components/ImportProspectsModal';
import {
  Search, SlidersHorizontal, Plus, Target,
  Phone, MessageSquare, MoreHorizontal,
  RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Zap,
  Wand2, Upload, Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  new:       { bg: '#EBF7FA', text: '#127284',  label: 'Novo' },
  contacted: { bg: '#FEF9EC', text: '#CA8A04',  label: 'Contatado' },
  converted: { bg: '#E6F5EF', text: '#22A06B',  label: 'Convertido' },
  lost:      { bg: '#FFEAEA', text: '#E03131',  label: 'Perdido' },
};

const SOURCE_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', website: '🌐',
  referral: '🤝', direct: '📞', tiktok: '🎵', import: '📥',
};

const PAGE_SIZE = 50;

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
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProspectsPage() {
  const { t } = useApp();
  const [isPending, startTransition] = useTransition();

  // Data
  const [prospects, setProspects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI
  const [filters, setFilters] = useState<ProspectFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'direct', status: 'new', notes: '' });
  const [saving, setSaving] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const loadProspects = useCallback((f: ProspectFilters, p: number) => {
    setLoading(true);
    fetchProspects({ ...f, limit: PAGE_SIZE, offset: p * PAGE_SIZE })
      .then((res: any) => {
        setProspects(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => alert('Erro ao carregar prospectos.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const to = setTimeout(() => {
      startTransition(() => {
        setPage(0);
        loadProspects({ ...filters, q: searchInput }, 0);
      });
    }, 400);
    return () => clearTimeout(to);
  }, [searchInput, filters, loadProspects]);

  useEffect(() => {
    loadProspects({ ...filters, q: searchInput }, page);
  }, [page, loadProspects]); // Removed filters and searchInput to avoid double fetch

  const handleConvert = async (id: string) => {
    if (!confirm('Deseja converter este Prospect em Lead qualificado?')) return;
    setConvertingId(id);
    try {
      await convertProspectToLead(id);
      alert('Convertido com sucesso! Ele agora está na aba de Leads.');
      loadProspects({ ...filters, q: searchInput }, page);
    } catch {
      alert('Falha ao converter.');
    } finally {
      setConvertingId(null);
    }
  };

  const handleExport = () => {
    if (prospects.length === 0) return alert('Não há prospectos para exportar.');
    
    // Prepare data for export
    const exportData = prospects.map(p => ({
      Nome: p.name || '',
      Email: p.email || '',
      Telefone: p.phone || '',
      Origem: p.source || '',
      Status: STATUS_MAP[p.status]?.label || p.status,
      Data_Criacao: new Date(p.created_at).toLocaleDateString('pt-BR'),
      Notas: p.notes || ''
    }));

    const csv = Papa.unparse(exportData, { delimiter: ';' });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prospectos_export_${formatDistanceToNow(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreate = async () => {
    if (!form.name) return alert('Nome é obrigatório');
    setSaving(true);
    try {
      const cleanForm = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
      await createProspect(cleanForm);
      setCreateOpen(false);
      setForm({ name: '', phone: '', email: '', source: 'direct', status: 'new', notes: '' });
      loadProspects({ ...filters, q: searchInput }, page);
    } catch {
      alert('Falha ao criar prospecto.');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: total,
    new: prospects.filter(p => p.status === 'new').length,
    converted: prospects.filter(p => p.status === 'converted').length,
  };

  return (
    <AppLayout title="Prospecção">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total na Base', value: total, color: '#127284', bg: '#EBF7FA' },
          { label: 'Novos', value: stats.new, color: '#F9795A', bg: '#FEF0EC' },
          { label: 'Convertidos (página atual)', value: stats.converted, color: '#22A06B', bg: '#E6F5EF' },
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
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar nome, email ou fone..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#DAE1EA] rounded-xl text-sm outline-none focus:border-[#3BAFC4] focus:ring-2 focus:ring-[#3BAFC4]/10 transition-all"
          />
        </div>
        
        <button onClick={() => { setFilters({}); setSearchInput(''); setPage(0); }} className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#DAE1EA] bg-white text-[#8A9BB0] hover:bg-[#F4F7FA] hover:text-[#555D6F] transition-colors" title="Atualizar">
          <RefreshCw size={14} className={loading || isPending ? 'animate-spin' : ''} />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert('Em breve: Automação + IA para enriquecimento de prospectos')}
            className="px-3.5 py-2 bg-[#F4F7FA] text-[#127284] rounded-xl text-sm font-semibold hover:bg-[#EBF7FA] transition-all flex items-center gap-1.5 border border-[#DAE1EA]"
          >
            <Wand2 size={14} /> Atualizar prospectos
          </button>
          
          <button 
            onClick={() => setImportOpen(true)}
            className="px-3.5 py-2 bg-white text-[#555D6F] rounded-xl text-sm font-semibold hover:bg-[#F4F7FA] hover:text-[#2F4251] transition-all flex items-center gap-1.5 border border-[#DAE1EA]"
          >
            <Upload size={14} /> Importar prospectos
          </button>
          
          <button 
            onClick={handleExport}
            className="px-3.5 py-2 bg-white text-[#555D6F] rounded-xl text-sm font-semibold hover:bg-[#F4F7FA] hover:text-[#2F4251] transition-all flex items-center gap-1.5 border border-[#DAE1EA]"
          >
            <Download size={14} /> Exportar prospectos
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DAE1EA] rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
        <div className="flex items-center px-4 py-3 bg-[#F4F7FA] border-b border-[#EDF0F4] text-[11px] font-bold text-[#8A9BB0] uppercase tracking-wider shrink-0">
          <div className="w-8" />
          <div className="flex-1 min-w-[200px]">Contato Frio</div>
          <div className="w-[120px]">Status</div>
          <div className="w-[160px]">Origem</div>
          <div className="w-[120px]">Data</div>
          <div className="w-[180px] text-right">Ação</div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          {loading && prospects.length === 0 ? <Skeleton /> : null}
          {!loading && prospects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-[#F4F7FA] rounded-full flex items-center justify-center mb-4">
                <Target size={24} className="text-[#B8C4D0]" />
              </div>
              <h3 className="text-[#2F4251] font-semibold mb-1">Nenhum prospecto encontrado</h3>
              <p className="text-[#8A9BB0] text-sm max-w-sm">A base de prospecção fria está vazia ou não há resultados para a busca.</p>
            </div>
          )}
          
          <div className="divide-y divide-[#EDF0F4]">
            {prospects.map(p => {
              const status = STATUS_MAP[p.status] ?? STATUS_MAP.new;
              const sourceIcon = SOURCE_ICONS[p.source] ?? '📌';
              const isConverted = p.status === 'converted';

              return (
                <div key={p.id} className={`flex items-center px-4 py-3 hover:bg-[#F9FAFB] transition-colors ${isConverted ? 'opacity-60' : ''}`}>
                  <div className="w-8 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-[#EBF7FA] text-[#127284] flex items-center justify-center text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] truncate pr-4">
                    <div className="font-semibold text-sm text-[#2F4251] truncate flex items-center gap-2">
                      {p.name}
                      {isConverted && <CheckCircle2 size={14} className="text-[#22A06B]" />}
                    </div>
                    <div className="text-xs text-[#8A9BB0] truncate mt-0.5">{p.email || p.phone || 'Sem contato'}</div>
                  </div>
                  <div className="w-[120px] shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="w-[160px] shrink-0 text-sm text-[#555D6F] flex items-center gap-1.5">
                    <span>{sourceIcon}</span>
                    <span className="capitalize">{p.source}</span>
                  </div>
                  <div className="w-[120px] shrink-0 text-xs text-[#8A9BB0]">
                    {formatDistanceToNow(new Date(p.created_at), { locale: ptBR, addSuffix: true })}
                  </div>
                  <div className="w-[180px] shrink-0 flex items-center justify-end gap-2">
                    {isConverted ? (
                      <span className="text-xs text-[#8A9BB0] italic px-3">Já convertido</span>
                    ) : (
                      <button 
                        onClick={() => handleConvert(p.id)}
                        disabled={convertingId === p.id}
                        className="px-3 py-1.5 bg-[#FEF0EC] text-[#F9795A] hover:bg-[#F9795A] hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        {convertingId === p.id ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                        Converter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 bg-white border-t border-[#EDF0F4] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#8A9BB0]">
            Mostrando <span className="font-semibold text-[#2F4251]">{Math.min(total, prospects.length)}</span> de <span className="font-semibold text-[#2F4251]">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="w-8 h-8 rounded-lg border border-[#DAE1EA] flex items-center justify-center text-[#555D6F] hover:bg-[#F4F7FA] disabled:opacity-50 disabled:hover:bg-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} className="w-8 h-8 rounded-lg border border-[#DAE1EA] flex items-center justify-center text-[#555D6F] hover:bg-[#F4F7FA] disabled:opacity-50 disabled:hover:bg-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Basic Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-[#2F4251]/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-semibold text-lg text-[#2F4251] mb-4">Adicionar Prospecto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8A9BB0] mb-1">NOME</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm outline-none focus:border-[#3BAFC4] focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8A9BB0] mb-1">TELEFONE</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm outline-none focus:border-[#3BAFC4] focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8A9BB0] mb-1">EMAIL</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm outline-none focus:border-[#3BAFC4] focus:bg-white" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-semibold text-[#8A9BB0] hover:bg-[#F4F7FA] rounded-xl transition-colors">Cancelar</button>
              <button disabled={saving} onClick={handleCreate} className="px-4 py-2 bg-[#127284] text-white rounded-xl text-sm font-semibold hover:bg-[#0E5B6A] transition-colors flex items-center gap-2 disabled:opacity-50">
                {saving && <RefreshCw size={14} className="animate-spin" />}
                Salvar Prospecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportProspectsModal 
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          alert('Prospectos importados com sucesso!');
          loadProspects({ ...filters, q: searchInput }, page);
        }}
      />
    </AppLayout>
  );
}

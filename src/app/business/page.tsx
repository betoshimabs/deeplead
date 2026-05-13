'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { Building2, Users, Puzzle, Plus, Lock, X, ChevronDown, Loader2, AlertTriangle, CheckCircle, Search, UserPlus, Trash2 } from 'lucide-react';
import { WhatsAppIntegrationCard } from './components/WhatsAppIntegrationCard';

type BusinessRole = 'dono' | 'gestor' | 'colaborador';

interface Member {
  id: string;
  business_role: BusinessRole;
  user: { id: string; name: string; email: string; avatar_url?: string };
}

interface PlanMeta {
  plan_name: string;
  max_users: number;
  current_count: number;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

const ROLE_LABELS: Record<BusinessRole, string> = {
  dono: 'Dono',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
};

const ROLE_COLORS: Record<BusinessRole, string> = {
  dono: 'text-[#F9795A] bg-[#FEF0EC]',
  gestor: 'text-[#127284] bg-[#EBF7FA]',
  colaborador: 'text-[#555D6F] bg-[#F4F7FA]',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function UserAvatar({ user, size = 8 }: { user: { name: string; avatar_url?: string }; size?: number }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
  }
  const palette = ['bg-[#127284]', 'bg-[#2F4251]', 'bg-[#3BAFC4]', 'bg-[#F9795A]', 'bg-[#22A06B]'];
  const bg = palette[user.name.charCodeAt(0) % palette.length];
  const szClass = `w-${size} h-${size}`;
  return (
    <div className={`${szClass} rounded-full ${bg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
      {initials(user.name)}
    </div>
  );
}

// ── Confirm Remove Dialog ──────────────────────────────────────────────
function ConfirmRemoveDialog({ member, onConfirm, onCancel }: {
  member: Member;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#DAE1EA] p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FFEAEA] mx-auto mb-4">
          <Trash2 size={22} className="text-[#E03131]" />
        </div>
        <h3 className="text-center font-semibold text-[#2F4251] text-lg mb-1">Remover membro?</h3>
        <p className="text-center text-sm text-[#8A9BB0] mb-6">
          <span className="font-medium text-[#555D6F]">{member.user.name}</span> perderá acesso a este negócio imediatamente.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#DAE1EA] text-sm font-medium text-[#555D6F] hover:bg-[#F4F7FA] transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#E03131] text-white text-sm font-medium hover:bg-[#C92A2A] transition-colors">
            Sim, remover
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 ${type === 'error' ? 'bg-[#FFEAEA] text-[#E03131] border border-[#F9795A]/30' : 'bg-[#E6F5EF] text-[#22A06B] border border-[#22A06B]/30'}`}>
      {type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Add Member Modal ─────────────────────────────────────────────────
function AddMemberModal({ onClose, onSuccess, canSetGestor }: {
  onClose: () => void;
  onSuccess: (member: Member) => void;
  canSetGestor: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<SearchUser | null>(null);
  const [role, setRole] = useState<'gestor' | 'colaborador'>('colaborador');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced real-time search
  useEffect(() => {
    if (selected) return;
    if (query.length < 2) { setResults([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { 'x-business-id': localStorage.getItem('dl_active_business') ?? '' },
        });
        const json = await res.json();
        setResults(json.data ?? []);
        setShowDropdown(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (u: SearchUser) => {
    setSelected(u); setQuery(u.name); setShowDropdown(false); setResults([]); setError(null);
  };

  const handleClear = () => { setSelected(null); setQuery(''); setResults([]); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError('Selecione um usuário da lista de resultados.'); return; }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
          'x-user-id': localStorage.getItem('dl_active_user') ?? '',
        },
        body: JSON.stringify({ email: selected.email, business_role: role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao adicionar membro.');
      onSuccess(json.data);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#DAE1EA]">
        <div className="flex items-center justify-between p-6 border-b border-[#EDF0F4]">
          <h2 className="font-semibold text-lg text-[#2F4251]">Adicionar Membro</h2>
          <button onClick={onClose} className="text-[#8A9BB0] hover:text-[#2F4251] transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-[#FFEAEA] rounded-xl text-sm text-[#E03131] border border-[#F9795A]/30">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Buscar por nome ou e-mail</label>
            <div className="relative" ref={wrapRef}>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                showDropdown ? 'border-[#127284] ring-2 ring-[#127284]/15' : 'border-[#DAE1EA] focus-within:border-[#127284] focus-within:ring-2 focus-within:ring-[#127284]/15'
              }`}>
                {selected ? <UserAvatar user={selected} size={6} /> : <Search size={15} className="text-[#8A9BB0] shrink-0" />}
                <input
                  type="text" value={query} autoFocus
                  onChange={e => { setQuery(e.target.value); if (selected) setSelected(null); }}
                  onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                  placeholder="Digite o nome ou e-mail…"
                  className="flex-1 text-sm text-[#2F4251] placeholder:text-[#B8C4D0] focus:outline-none bg-transparent min-w-0"
                />
                {searching && <Loader2 size={14} className="animate-spin text-[#127284] shrink-0" />}
                {(query || selected) && !searching && (
                  <button type="button" onClick={handleClear} className="text-[#B8C4D0] hover:text-[#555D6F] shrink-0 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#DAE1EA] rounded-xl shadow-lg z-20 overflow-hidden">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#8A9BB0] flex items-center gap-2">
                      <UserPlus size={15} /> Nenhuma conta encontrada.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F4F7FA] max-h-52 overflow-y-auto">
                      {results.map(u => (
                        <button key={u.id} type="button" onClick={() => handleSelect(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F7FA] transition-colors text-left">
                          <UserAvatar user={u} size={8} />
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-[#2F4251] truncate">{u.name}</div>
                            <div className="text-xs text-[#8A9BB0] truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected preview pill */}
            {selected && (
              <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-[#EBF7FA] rounded-xl border border-[#127284]/20">
                <UserAvatar user={selected} size={6} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[#127284]">{selected.name}</span>
                  <span className="text-xs text-[#8A9BB0] ml-2">{selected.email}</span>
                </div>
                <CheckCircle size={15} className="text-[#127284] shrink-0" />
              </div>
            )}
            {!selected && query.length < 2 && (
              <p className="text-xs text-[#8A9BB0] mt-1.5">O usuário deve possuir uma conta DeepLead cadastrada.</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Papel no negócio</label>
            <div className={`grid gap-3 ${canSetGestor ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {canSetGestor && (
                <button type="button" onClick={() => setRole('gestor')}
                  className={`p-3 rounded-xl border text-left transition-all ${role === 'gestor' ? 'border-[#127284] bg-[#EBF7FA]' : 'border-[#DAE1EA] hover:border-[#127284]/40'}`}>
                  <div className="font-medium text-sm text-[#2F4251]">Gestor</div>
                  <div className="text-xs text-[#8A9BB0] mt-0.5">Acesso total, gerencia membros</div>
                </button>
              )}
              <button type="button" onClick={() => setRole('colaborador')}
                className={`p-3 rounded-xl border text-left transition-all ${role === 'colaborador' ? 'border-[#127284] bg-[#EBF7FA]' : 'border-[#DAE1EA] hover:border-[#127284]/40'}`}>
                <div className="font-medium text-sm text-[#2F4251]">Colaborador</div>
                <div className="text-xs text-[#8A9BB0] mt-0.5">Acesso aos próprios leads</div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#DAE1EA] text-sm font-medium text-[#555D6F] hover:bg-[#F4F7FA] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !selected}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#127284] text-white text-sm font-medium hover:bg-[#0E5B6A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────
function MembersTab({ currentUserId, currentRole }: { currentUserId: string; currentRole: BusinessRole }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<PlanMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const canManage = currentRole === 'dono' || currentRole === 'gestor';
  const canChangeRoles = currentRole === 'dono';

  const ROLE_ORDER: Record<BusinessRole, number> = { dono: 0, gestor: 1, colaborador: 2 };
  const sortMembers = (list: Member[]) =>
    [...list].sort((a, b) => {
      const roleDiff = ROLE_ORDER[a.business_role] - ROLE_ORDER[b.business_role];
      if (roleDiff !== 0) return roleDiff;
      return a.user.name.localeCompare(b.user.name, 'pt-BR');
    });

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        headers: {
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
          'x-user-id': localStorage.getItem('dl_active_user') ?? '',
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMembers(sortMembers(json.data ?? []));
      setMeta(json.meta ?? null);
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleRoleChange = async (memberId: string, newRole: BusinessRole) => {
    setChangingRole(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
          'x-user-id': localStorage.getItem('dl_active_user') ?? '',
        },
        body: JSON.stringify({ business_role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMembers(prev => sortMembers(prev.map(m => m.id === memberId ? { ...m, business_role: newRole } : m)));
      setToast({ message: 'Papel atualizado com sucesso.', type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemove = async (member: Member) => {
    setConfirmRemove(null);
    setRemoving(member.id);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
          'x-user-id': localStorage.getItem('dl_active_user') ?? '',
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      setMeta(prev => prev ? { ...prev, current_count: prev.current_count - 1 } : prev);
      setToast({ message: `${member.user.name} foi removido do negócio.`, type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setRemoving(null);
    }
  };

  const atLimit = meta ? meta.current_count >= meta.max_users : false;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmRemove && (
        <ConfirmRemoveDialog
          member={confirmRemove}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => handleRemove(confirmRemove)}
        />
      )}
      {showModal && (
        <AddMemberModal
          canSetGestor={currentRole === 'dono'}
          onClose={() => setShowModal(false)}
          onSuccess={(member) => {
            setMembers(prev => sortMembers([...prev, member]));
            setMeta(prev => prev ? { ...prev, current_count: prev.current_count + 1 } : prev);
            setShowModal(false);
            setToast({ message: `${member.user.name} adicionado com sucesso!`, type: 'success' });
          }}
        />
      )}

      <div className="bg-white rounded-2xl border border-[#EDF0F4] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#EDF0F4] flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-[#2F4251]">Equipe</h3>
            {meta && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-[#EDF0F4] rounded-full h-1.5 w-40">
                  <div
                    className="bg-[#127284] h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((meta.current_count / meta.max_users) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-[#8A9BB0]">
                  {meta.current_count} / {meta.max_users} usuários · Plano {meta.plan_name}
                </span>
              </div>
            )}
          </div>
          {canManage && (
            <button
              onClick={() => atLimit ? setToast({ message: `Limite de ${meta?.max_users} usuários atingido. Faça upgrade do plano.`, type: 'error' }) : setShowModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${atLimit ? 'bg-[#F4F7FA] text-[#8A9BB0] cursor-not-allowed' : 'bg-[#127284] text-white hover:bg-[#0E5B6A]'}`}
            >
              <Plus size={16} />
              Adicionar Membro
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[#8A9BB0]" />
          </div>
        ) : (
          <div className="divide-y divide-[#EDF0F4]">
            {members.map(member => {
              const isMe = member.user.id === currentUserId;
              const isDono = member.business_role === 'dono';
              const canRemoveThis = canManage && !isDono && !isMe &&
                (currentRole === 'dono' || member.business_role === 'colaborador');

              return (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-[#F4F7FA] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#127284] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {initials(member.user.name)}
                    </div>
                    <div>
                      <div className="font-medium text-[#2F4251] flex items-center gap-2">
                        {member.user.name}
                        {isMe && <span className="text-xs bg-[#FEF0EC] text-[#F9795A] px-2 py-0.5 rounded-full">Você</span>}
                      </div>
                      <div className="text-sm text-[#8A9BB0]">{member.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role badge or selector */}
                    {canChangeRoles && !isDono && !isMe ? (
                      <div className="relative">
                        <select
                          value={member.business_role}
                          disabled={changingRole === member.id}
                          onChange={e => handleRoleChange(member.id, e.target.value as BusinessRole)}
                          className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium rounded-lg border border-[#DAE1EA] bg-white focus:outline-none focus:border-[#127284] cursor-pointer disabled:opacity-50"
                        >
                          <option value="gestor">Gestor</option>
                          <option value="colaborador">Colaborador</option>
                        </select>
                        {changingRole === member.id
                          ? <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-[#127284]" />
                          : <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A9BB0] pointer-events-none" />
                        }
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[member.business_role]}`}>
                        {ROLE_LABELS[member.business_role]}
                      </span>
                    )}

                    {/* Remove button — always visible trash icon */}
                    {canRemoveThis ? (
                      removing === member.id
                        ? <Loader2 size={16} className="animate-spin text-[#8A9BB0] shrink-0" />
                        : <button
                            onClick={() => setConfirmRemove(member)}
                            title={`Remover ${member.user.name}`}
                            className="p-1.5 rounded-lg text-[#B8C4D0] hover:text-[#E03131] hover:bg-[#FFEAEA] transition-all shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                    ) : (
                      <div className="w-7" /> /* spacer */
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function BusinessPage() {
  const { business, user } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'members' | 'integrations'>('members');

  const devUser = user as any;
  const currentRole: BusinessRole = devUser?.role ?? 'colaborador';
  const currentUserId: string = devUser?.id ?? '';
  const canManage = currentRole === 'dono' || currentRole === 'gestor';

  if (!business) {
    return (
      <AppLayout title="Meu Negócio">
        <div className="flex flex-col items-center justify-center text-center h-[60vh]">
          <Building2 size={64} className="text-[#DAE1EA] mb-4" />
          <h2 className="text-2xl font-bold text-[#2F4251] mb-2">Você não possui um negócio</h2>
          <p className="text-[#8A9BB0] mb-6 max-w-md">
            Sua conta não está vinculada a nenhum negócio. Solicite um convite ao gestor ou crie um novo workspace (Plano Profissional).
          </p>
          <button className="bg-[#127284] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0E5B6A] transition-colors">
            Criar Novo Negócio
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meu Negócio">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2F4251] tracking-tight">{business.name}</h1>
            <p className="text-[#8A9BB0] mt-1">Gerencie as configurações do seu workspace.</p>
          </div>
          {!canManage && (
            <div className="flex items-center gap-2 bg-[#F4F7FA] text-[#555D6F] px-4 py-2 rounded-lg text-sm font-medium border border-[#EDF0F4]">
              <Lock size={16} /> Somente Leitura
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EDF0F4]">
          {[
            { id: 'profile', icon: Building2, label: 'Perfil' },
            { id: 'members', icon: Users, label: 'Membros' },
            { id: 'integrations', icon: Puzzle, label: 'Integrações' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 border-b-2 font-medium text-sm transition-all ${activeTab === tab.id ? 'border-[#127284] text-[#127284]' : 'border-transparent text-[#8A9BB0] hover:text-[#555D6F]'}`}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#EDF0F4] shadow-sm">
              <h3 className="font-semibold text-lg text-[#2F4251] mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Nome do Negócio</label>
                  <input type="text" defaultValue={business.name} disabled={!canManage}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none focus:ring-2 focus:ring-[#127284]/20 focus:border-[#127284] disabled:bg-[#F4F7FA] disabled:text-[#8A9BB0]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Segmento</label>
                  <select disabled={!canManage} defaultValue="real_estate"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none disabled:bg-[#F4F7FA] disabled:text-[#8A9BB0]">
                    <option value="real_estate">Imobiliário</option>
                    <option value="generic">Genérico / Outros</option>
                  </select>
                </div>
              </div>
              {canManage && (
                <div className="mt-6 flex justify-end">
                  <button className="bg-[#127284] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#0E5B6A] transition-colors">
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#EDF0F4] shadow-sm">
              <h3 className="font-semibold text-lg text-[#2F4251] mb-4">Plano de Faturamento</h3>
              <div className="p-4 bg-[#EBF7FA] rounded-xl border border-[#127284]/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#127284] text-lg">DeepLead Profissional</div>
                  <div className="text-sm text-[#555D6F] mt-0.5">Próxima cobrança em 30 dias.</div>
                </div>
                {currentRole === 'dono' && (
                  <button className="text-[#127284] font-medium hover:underline text-sm">Gerenciar Assinatura</button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <MembersTab currentUserId={currentUserId} currentRole={currentRole} />
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-[#2F4251] mb-1">Integrações de Canal</h3>
              <p className="text-sm text-[#8A9BB0]">Conecte seus canais para receber e enviar mensagens diretamente pelo DeepLead.</p>
            </div>

            {/* WhatsApp — real integration */}
            <WhatsAppIntegrationCard canManage={canManage} />

            {/* Other channels — coming soon */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '📸', name: 'Instagram Direct', status: 'coming_soon' },
                { icon: '🌐', name: 'Website Webhook', status: 'coming_soon' },
                { icon: '📞', name: 'Telefonia VoIP', status: 'coming_soon' },
                { icon: '🎵', name: 'TikTok', status: 'coming_soon' },
              ].map(c => (
                <div key={c.name} className="p-4 rounded-xl border border-[#EDF0F4] flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4F7FA] flex items-center justify-center text-xl">{c.icon}</div>
                    <div>
                      <div className="font-medium text-[#2F4251] text-sm">{c.name}</div>
                      <div className="text-xs text-[#8A9BB0] mt-0.5">Em breve</div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F4F7FA] text-[#8A9BB0]">Indisponível</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

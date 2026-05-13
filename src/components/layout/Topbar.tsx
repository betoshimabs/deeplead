'use client';
import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Globe, Building2, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Segment, Locale } from '@/types';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user, t, locale, setLocale, segment, setSegment, business, logout, devUsers, activeUserId, switchUser, liveRoles } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [segmentMenuOpen, setSegmentMenuOpen] = useState(false);
  // Local role cache for DEV_ACCOUNTS that haven't been loaded yet
  const [fetchedRoles, setFetchedRoles] = useState<Record<string, string | null>>({});

  // Pre-fetch roles for all dev accounts so the dropdown is always up-to-date
  useEffect(() => {
    const businessId = localStorage.getItem('dl_active_business') ?? '';
    devUsers.forEach(async (account) => {
      if (liveRoles[account.id] !== undefined) return; // already loaded by context
      try {
        const res = await fetch('/api/me', { headers: { 'x-user-id': account.id } });
        if (!res.ok) return;
        const json = await res.json();
        const biz = (json.data?.businesses ?? []).find((b: any) => b.id === businessId);
        setFetchedRoles(prev => ({ ...prev, [account.id]: biz?.role ?? null }));
      } catch {}
    });
  }, [devUsers, liveRoles]);

  const SEGMENTS: { value: Segment; label: string }[] = [
    { value: 'generic',     label: t('segment.generic') },
    { value: 'real_estate', label: t('segment.real_estate') },
  ];

  const initials = user?.name.split(' ').map(n => n[0]).slice(0, 2).join('') ?? 'U';

  return (
    <header className="h-14 bg-white border-b border-[#DAE1EA] px-6 flex items-center gap-4 shrink-0 z-20">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-[17px] font-semibold text-[#2F4251] truncate">{title}</h1>
        )}
      </div>

      {/* Segment Selector */}
      <div className="relative">
        <button
          onClick={() => { setSegmentMenuOpen(o => !o); setUserMenuOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DAE1EA] bg-white hover:bg-[#F4F7FA] transition-all text-sm text-[#555D6F] hover:text-[#2F4251]"
        >
          <Building2 size={14} className="text-[#127284]" />
          <span className="text-[#2F4251] font-medium">{t(`segment.${segment}`)}</span>
          <ChevronDown size={14} className={`transition-transform ${segmentMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {segmentMenuOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-[#DAE1EA] rounded-xl shadow-lg py-1.5 z-50">
            {SEGMENTS.map(s => (
              <button
                key={s.value}
                onClick={() => { setSegment(s.value); setSegmentMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm hover:bg-[#F4F7FA] transition-colors text-[#2F4251]"
              >
                {segment === s.value && <Check size={14} className="text-[#127284]" />}
                <span className={segment === s.value ? 'ml-0 font-medium text-[#127284]' : 'ml-[22px]'}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locale Toggle */}
      <div className="flex items-center gap-1 bg-[#F4F7FA] rounded-lg p-0.5">
        {(['pt-BR', 'en'] as Locale[]).map(l => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`
              px-2.5 py-1 rounded-md text-[12px] font-medium transition-all
              ${locale === l
                ? 'bg-white text-[#127284] shadow-sm'
                : 'text-[#8A9BB0] hover:text-[#555D6F]'
              }
            `}
          >
            {l === 'pt-BR' ? 'PT' : 'EN'}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F4F7FA] transition-colors text-[#555D6F]">
        <Bell size={18} strokeWidth={1.8} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F9795A] rounded-full ring-1 ring-white" />
      </button>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => { setUserMenuOpen(o => !o); setSegmentMenuOpen(false); }}
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[#F4F7FA] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#127284] flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-[13px] font-medium text-[#2F4251] hidden md:block max-w-[120px] truncate">
            {user?.name?.split(' ')[0] ?? 'Usuário'}
          </span>
          <ChevronDown size={14} className={`text-[#8A9BB0] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {userMenuOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-[#DAE1EA] rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#EDF0F4]">
              <div className="text-[13px] font-semibold text-[#2F4251]">{user?.name}</div>
              <div className="text-[12px] text-[#8A9BB0]">{user?.email}</div>
            </div>
            <div className="py-1.5">
              <button className="w-full text-left px-4 py-2 text-sm text-[#555D6F] hover:bg-[#F4F7FA] transition-colors">
                Meu Perfil
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-[#555D6F] hover:bg-[#F4F7FA] transition-colors">
                Configurações
              </button>
              <div className="border-t border-[#EDF0F4] my-1" />
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-[#E03131] hover:bg-[#FFEAEA] transition-colors"
              >
                Sair
              </button>

              <div className="border-t border-[#EDF0F4] my-1" />
              <div className="px-4 py-1 mt-1 text-[11px] font-bold text-[#8A9BB0] uppercase tracking-wider">Dev Simulator</div>
              {devUsers?.map(u => {
                // Merge: context liveRoles (from switchUser) > fetchedRoles (prefetch) > null
                const liveRole = liveRoles[u.id] !== undefined ? liveRoles[u.id] : fetchedRoles[u.id];
                const roleLabel = liveRole ?? 'Isolado';
                return (
                  <button
                    key={u.id}
                    onClick={() => { switchUser(u.id); setUserMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${activeUserId === u.id ? 'text-[#127284] bg-[#EBF7FA] font-medium' : 'text-[#555D6F] hover:bg-[#F4F7FA]'}`}
                  >
                    <span>{u.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-[#8A9BB0] capitalize bg-white px-1.5 py-0.5 rounded shadow-sm border border-[#EDF0F4]">
                      {roleLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Close menus on outside click */}
      {(userMenuOpen || segmentMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setUserMenuOpen(false); setSegmentMenuOpen(false); }}
        />
      )}
    </header>
  );
}

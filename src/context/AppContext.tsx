'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Business, Segment, Locale } from '@/types';
import { detectLocale, getTranslations } from '@/lib/i18n/translations';

// ── DEV_ACCOUNTS ─────────────────────────────────────────────────────────────
// Lista estática APENAS de contas que existem para simulação.
// NÃO contém role nem businesses — esses dados são carregados via /api/me.
// IDs devem coincidir exatamente com core.users no Supabase.
export const DEV_ACCOUNTS = [
  { id: '22222222-0000-0000-0000-000000000001', name: 'Bryan Costa',   email: 'bryan@valore.com.br'   },
  { id: '22222222-0000-0000-0000-000000000002', name: 'Mariana Silva', email: 'mariana@valore.com.br' },
  { id: '22222222-0000-0000-0000-000000000004', name: 'Juliana Rocha', email: 'juliana@valore.com.br' },
  { id: '22222222-0000-0000-0000-000000000003', name: 'Felipe Alves',  email: 'felipe@isolado.com.br' },
];

// Mantém export de DEV_USERS como alias para não quebrar imports existentes
export const DEV_USERS = DEV_ACCOUNTS;

// ── Types ─────────────────────────────────────────────────────────────────────
interface LiveUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  platform_role: string;
  role: string | null;        // role no negócio ativo
  businesses: Array<{
    memberId: string;         // business_members.id (FK para leads.assigned_to)
    id: string;               // businesses.id
    name: string;
    role: string;
  }>;
}

interface AppContextValue {
  // Auth (Dev Simulator)
  user: LiveUser | null;
  isAuthenticated: boolean;
  activeUserId: string | null;
  activeBusinessId: string | null;
  switchUser: (id: string) => void;
  switchBusiness: (id: string) => void;
  logout: () => void;
  devUsers: typeof DEV_ACCOUNTS;
  // Map of userId → role label (fetched live from DB when each user is loaded)
  liveRoles: Record<string, string | null>;
  isSwitching: boolean;
  isLoadingUser: boolean;

  // Business
  business: Business | null;
  myBusinesses: LiveUser['businesses'];

  // Segment
  segment: Segment;
  setSegment: (s: Segment) => void;

  // Locale / i18n
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  aiPanelOpen: boolean;
  toggleAiPanel: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LiveUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [myBusinesses, setMyBusinesses] = useState<LiveUser['businesses']>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  // Live roles map: userId → role string (populated as each user is ever loaded)
  const [liveRoles, setLiveRoles] = useState<Record<string, string | null>>({});

  const [segment, setSegmentState] = useState<Segment>('real_estate');
  const [locale, setLocaleState] = useState<Locale>('pt-BR');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Init locale
  useEffect(() => {
    const detected = detectLocale();
    const saved = localStorage.getItem('dl_locale') as Locale | null;
    const resolved = saved ?? detected;
    setLocaleState(resolved);
    setTranslations(getTranslations(resolved));
  }, []);

  // Init sidebar
  useEffect(() => {
    const saved = localStorage.getItem('dl_sidebar_collapsed');
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);

  // ── Core: load user from /api/me ─────────────────────────────────────────
  const loadUser = useCallback(async (userId: string, preferredBusinessId?: string | null) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch('/api/me', {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) throw new Error('Failed to load user');
      const json = await res.json();
      const liveUser: LiveUser = json.data;

      // Determine active business
      const savedBusId = preferredBusinessId ?? localStorage.getItem('dl_active_business');
      let activeBus = liveUser.businesses.find(b => b.id === savedBusId);
      if (!activeBus && liveUser.businesses.length > 0) activeBus = liveUser.businesses[0];

      // Set role to the role in the active business
      const roleInActiveBus = activeBus?.role ?? null;
      const hydratedUser: LiveUser = { ...liveUser, role: roleInActiveBus };

      setUser(hydratedUser);
      setActiveUserId(userId);
      setMyBusinesses(liveUser.businesses);
      setIsAuthenticated(true);
      localStorage.setItem('dl_active_user', userId);
      // Update liveRoles map so DevSimulator always reflects the DB
      setLiveRoles(prev => ({ ...prev, [userId]: roleInActiveBus }));

      if (activeBus) {
        setActiveBusinessId(activeBus.id);
        setBusiness({ id: activeBus.id, name: activeBus.name } as Business);
        localStorage.setItem('dl_active_business', activeBus.id);
      } else {
        setActiveBusinessId(null);
        setBusiness(null);
        localStorage.removeItem('dl_active_business');
      }
    } catch (e) {
      console.error('[AppContext] loadUser failed:', e);
      // Fallback to first dev account without live data
      const fallback = DEV_ACCOUNTS[0];
      setActiveUserId(fallback.id);
      setUser({ ...fallback, platform_role: 'basic', role: null, businesses: [] });
      setIsAuthenticated(true);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Init on mount — read saved userId from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('dl_active_user') ?? DEV_ACCOUNTS[0].id;
    const savedBusId = localStorage.getItem('dl_active_business');
    loadUser(savedUserId, savedBusId);
  }, [loadUser]);

  // ── logout (dev mode) ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('dl_active_user');
    localStorage.removeItem('dl_active_business');
    window.location.reload();
  }, []);

  // ── switchUser ────────────────────────────────────────────────────────────
  const switchUser = useCallback((id: string) => {
    setIsSwitching(true);
    // Clear business preference so /api/me picks first available
    localStorage.removeItem('dl_active_business');
    setTimeout(async () => {
      await loadUser(id);
      setIsSwitching(false);
    }, 800);
  }, [loadUser]);

  // ── switchBusiness ────────────────────────────────────────────────────────
  const switchBusiness = useCallback((id: string) => {
    setIsSwitching(true);
    setTimeout(() => {
      localStorage.setItem('dl_active_business', id);
      window.location.reload();
    }, 800);
  }, []);

  const setSegment = useCallback((s: Segment) => {
    setSegmentState(s);
    localStorage.setItem('dl_segment', s);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setTranslations(getTranslations(l));
    localStorage.setItem('dl_locale', l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[key] ?? key;
  }, [translations]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('dl_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  const toggleAiPanel = useCallback(() => {
    setAiPanelOpen(prev => !prev);
  }, []);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated, activeUserId, activeBusinessId,
      switchUser, switchBusiness, logout,
      devUsers: DEV_ACCOUNTS, liveRoles,
      isSwitching, isLoadingUser,
      business, myBusinesses,
      segment, setSegment,
      locale, setLocale, t,
      sidebarCollapsed, toggleSidebar,
      aiPanelOpen, toggleAiPanel,
    }}>
      {children}
      {isSwitching && (
        <div className="fixed inset-0 z-[9999] bg-[#2F4251]/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="font-semibold text-lg">Trocando ambiente...</p>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

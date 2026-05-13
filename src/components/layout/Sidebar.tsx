'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Kanban, Users, Megaphone,
  Calendar, BarChart3, Settings, Sparkles, ChevronLeft, ChevronRight,
  Building2, BookUser, Briefcase, UserCog, ChevronDown
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const NAV_ITEMS = [
  { href: '/dashboard',     icon: LayoutDashboard, key: 'nav.dashboard' },
  { href: '/contacts',      icon: BookUser,        key: 'nav.contacts' },
  { href: '/campanhas',     icon: Megaphone,       key: 'nav.campaigns' },
  { href: '/leads',         icon: Users,           key: 'nav.leads' },
  { href: '/pipeline',      icon: Kanban,          key: 'nav.pipeline' },
  { href: '/chat',          icon: MessageSquare,   key: 'nav.chat',      badge: true },
  { href: '/agenda',        icon: Calendar,        key: 'nav.agenda' },
  { href: '/analytics',     icon: BarChart3,       key: 'nav.analytics' },
] as const;

const BOTTOM_ITEMS = [
  { href: '/business', icon: Briefcase, key: 'Meu Negócio' },
  { href: '/settings', icon: UserCog, key: 'Configurações' },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, t, business, user, activeUserId, activeBusinessId, devUsers, switchUser, switchBusiness, myBusinesses } = useApp();
  const { toggleAiPanel } = useApp();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const w = sidebarCollapsed ? 72 : 240;

  return (
    <motion.aside
      animate={{ width: w }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col h-full border-r border-[#DAE1EA] bg-white overflow-hidden shrink-0 z-10"
    >
      {/* Logo + Business */}
      <div className="relative border-b border-[#EDF0F4]">
        <div 
          className="flex items-center gap-3 px-4 py-5 cursor-pointer hover:bg-[#F4F7FA] transition-colors"
          onClick={() => !sidebarCollapsed && setDropdownOpen(!dropdownOpen)}
        >
          <div className="w-8 h-8 rounded-[10px] bg-[#127284] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">DL</span>
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex-1 flex items-center justify-between overflow-hidden"
            >
              <div>
                <div className="font-bold text-[15px] leading-tight">
                  <span className="text-[#127284]">Deep</span>
                  <span className="text-[#F9795A]">Lead</span>
                </div>
                <div className="text-[11px] text-[#8A9BB0] truncate max-w-[150px]">
                  {business?.name ?? 'Sem Negócio'}
                </div>
              </div>
              <ChevronDown size={14} className="text-[#8A9BB0]" />
            </motion.div>
          )}
        </div>

        {/* Dropdown (Business Switcher) */}
        {dropdownOpen && !sidebarCollapsed && (
          <div className="w-full bg-[#F4F7FA] border-b border-[#EDF0F4] py-2">
            <div className="px-4 text-xs font-semibold text-[#8A9BB0] mb-2">Meus Negócios</div>
            {myBusinesses.map(b => (
              <div 
                key={b.id} 
                onClick={() => { switchBusiness(b.id); setDropdownOpen(false); }}
                className={`px-5 py-2 text-sm cursor-pointer transition-colors ${activeBusinessId === b.id ? 'text-[#127284] font-medium bg-[#EBF7FA]' : 'text-[#555D6F] hover:bg-[#EDF0F4] hover:text-[#2F4251]'}`}
              >
                {b.name}
              </div>
            ))}
            {myBusinesses.length === 0 && (
              <div className="px-5 py-2 text-sm text-[#8A9BB0]">Nenhum negócio</div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}>
              <div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-all duration-150 group
                  ${active
                    ? 'bg-[#EBF7FA] text-[#127284]'
                    : 'text-[#555D6F] hover:bg-[#F4F7FA] hover:text-[#2F4251]'
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${active ? 'text-[#127284]' : 'text-[#8A9BB0] group-hover:text-[#555D6F]'}`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className={`text-sm font-medium truncate ${active ? 'text-[#127284]' : ''}`}
                  >
                    {t(key)}
                  </motion.span>
                )}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-0.5 h-5 bg-[#127284] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* AI Button */}
      <div className="px-2 pb-2">
        <button
          onClick={toggleAiPanel}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-[#FEF0EC] text-[#F9795A] hover:bg-[#F9795A] hover:text-white
            transition-all duration-200 cursor-pointer group
          `}
        >
          <Sparkles size={18} className="shrink-0" strokeWidth={1.8} />
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
              className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{t('nav.ai')}</span>
              <span className="text-[10px] font-bold bg-[#F9795A] text-white group-hover:bg-white group-hover:text-[#F9795A] px-1.5 py-0.5 rounded-full transition-colors">
                {t('common.beta')}
              </span>
            </motion.div>
          )}
        </button>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#EDF0F4] px-2 py-3 space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, key }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150
                ${active ? 'bg-[#EBF7FA] text-[#127284]' : 'text-[#555D6F] hover:bg-[#F4F7FA]'}
              `}>
                <Icon size={18} className="shrink-0" strokeWidth={1.8} />
                {!sidebarCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                    className="text-sm font-medium">{key.includes('.') ? t(key) : key}</motion.span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8A9BB0] hover:bg-[#F4F7FA] hover:text-[#555D6F] transition-all duration-150"
        >
          {sidebarCollapsed
            ? <ChevronRight size={18} strokeWidth={1.8} />
            : <ChevronLeft size={18} strokeWidth={1.8} />
          }
          {!sidebarCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
              className="text-sm">Recolher</motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

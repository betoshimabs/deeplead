'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AiPanel } from '@/components/ai/AiPanel';
import { useApp } from '@/context/AppContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { sidebarCollapsed, aiPanelOpen } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FA]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-250 ease-out"
        style={{ marginLeft: 0 }}
      >
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="p-8 max-w-[1400px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Panel Overlay */}
      <AnimatePresence>
        {aiPanelOpen && <AiPanel />}
      </AnimatePresence>
    </div>
  );
}

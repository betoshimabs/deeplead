'use client';
import React from 'react';
import { Users, User } from 'lucide-react';

export type ViewScope = 'business' | 'mine';

interface ViewScopeToggleProps {
  scope: ViewScope;
  onChange: (scope: ViewScope) => void;
  labels?: { business: string; mine: string };
  className?: string;
}

/**
 * Toggle between "full business view" and "my own view".
 * Only rendered for dono/gestor — collaborators don't get a toggle.
 */
export function ViewScopeToggle({ scope, onChange, labels, className = '' }: ViewScopeToggleProps) {
  const bLabel = labels?.business ?? 'Todo o negócio';
  const mLabel = labels?.mine ?? 'Meus itens';

  return (
    <div className={`flex items-center gap-1 bg-[#F4F7FA] rounded-xl p-1 ${className}`}>
      <button
        onClick={() => onChange('business')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          scope === 'business'
            ? 'bg-white text-[#127284] shadow-sm'
            : 'text-[#8A9BB0] hover:text-[#555D6F]'
        }`}
      >
        <Users size={12} />
        {bLabel}
      </button>
      <button
        onClick={() => onChange('mine')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          scope === 'mine'
            ? 'bg-white text-[#127284] shadow-sm'
            : 'text-[#8A9BB0] hover:text-[#555D6F]'
        }`}
      >
        <User size={12} />
        {mLabel}
      </button>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Phone, Home, FileText, TrendingUp, Tag, Star, Import, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/lib/apiClient';

interface Activity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { id: string; name: string } | null;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  message_sent:     { icon: <MessageSquare size={12} />, color: '#127284', bg: '#EBF7FA' },
  message_received: { icon: <MessageSquare size={12} />, color: '#555D6F', bg: '#F4F7FA' },
  call:             { icon: <Phone size={12} />,         color: '#22A06B', bg: '#E6F5EF' },
  visit:            { icon: <Home size={12} />,          color: '#F59E0B', bg: '#FEF9EC' },
  note:             { icon: <FileText size={12} />,      color: '#8A9BB0', bg: '#F4F7FA' },
  stage_change:     { icon: <TrendingUp size={12} />,    color: '#127284', bg: '#EBF7FA' },
  status_change:    { icon: <Tag size={12} />,           color: '#F9795A', bg: '#FEF0EC' },
  score_change:     { icon: <Star size={12} />,          color: '#F59E0B', bg: '#FEF9EC' },
  import:           { icon: <Import size={12} />,        color: '#8A9BB0', bg: '#F4F7FA' },
  ai_insight:       { icon: <Star size={12} />,          color: '#9333EA', bg: '#F5F0FF' },
};

export function LeadActivityTimeline({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    apiClient(`/api/leads/${leadId}/activities`)
      .then((j: any) => setActivities(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 size={20} className="animate-spin text-[#3BAFC4]" />
    </div>
  );

  if (activities.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <CheckCircle size={28} className="text-[#DAE1EA] mb-2" />
      <p className="text-sm text-[#8A9BB0]">Nenhuma atividade registrada</p>
      <p className="text-xs text-[#B8C4D0] mt-1">As ações aparecerão aqui automaticamente</p>
    </div>
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-[#EDF0F4]" />
      <div className="space-y-3">
        {activities.map(a => {
          const style = TYPE_ICON[a.type] ?? TYPE_ICON.note;
          return (
            <div key={a.id} className="flex items-start gap-3 pl-1">
              {/* Icon bubble */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white"
                style={{ backgroundColor: style.bg, color: style.color }}>
                {style.icon}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-sm text-[#2F4251] leading-snug">{a.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {a.actor && (
                    <span className="text-[10px] text-[#8A9BB0]">{a.actor.name.split(' ')[0]}</span>
                  )}
                  <span className="text-[10px] text-[#B8C4D0]" title={format(new Date(a.created_at), 'dd/MM/yyyy HH:mm')}>
                    {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

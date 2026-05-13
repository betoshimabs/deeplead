'use client';
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { mockAnalytics } from '@/lib/mock-data';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, Target, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#127284', '#3BAFC4', '#F9795A', '#EB937C', '#22A06B', '#F59E0B'];

const SOURCE_PT: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', website: 'Site',
  facebook: 'Facebook', referral: 'Indicação', direct: 'Direto',
};

const STAGE_PT: Record<string, string> = {
  new_lead: 'Novo', contact_initiated: 'Contato', visit_scheduled: 'Visita',
  proposal: 'Proposta', negotiation: 'Negociação', won: 'Ganho', lost: 'Perdido',
};

function StatCard({ icon: Icon, label, value, sub, trend, up, color = '#127284' }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  trend?: string; up?: boolean; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#DAE1EA] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} strokeWidth={1.8} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            up ? 'bg-[#E6F5EF] text-[#22A06B]' : 'bg-[#FFEAEA] text-[#E03131]'
          }`}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[#2F4251] mb-0.5">{value}</div>
      <div className="text-sm text-[#8A9BB0]">{label}</div>
      {sub && <div className="text-xs text-[#B8C4D0] mt-1">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useApp();
  const a = mockAnalytics;

  const leadsChartData = a.leads_over_time.slice(-30).map(d => ({
    date: format(new Date(d.date), 'dd/MM'),
    leads: d.value,
  }));

  const sourceData = a.leads_by_source.map(s => ({
    name: SOURCE_PT[s.source] ?? s.source,
    value: s.count,
  }));

  const stageData = a.leads_by_stage.map(s => ({
    name: STAGE_PT[s.stage] ?? s.stage,
    leads: s.count,
  }));

  const collaborators = [
    { name: 'Mariana Silva', leads: 12, conversions: 4, rate: 33.3, responseTime: '42min', color: '#127284' },
    { name: 'Rafael Mendes', leads: 9, conversions: 2, rate: 22.2, responseTime: '1h 15m', color: '#3BAFC4' },
    { name: 'Juliana Rocha', leads: 6, conversions: 1, rate: 16.7, responseTime: '2h 08m', color: '#EB937C' },
    { name: 'Bryan Costa', leads: 8, conversions: 3, rate: 37.5, responseTime: '55min', color: '#22A06B' },
  ];

  return (
    <AppLayout title={t('analytics.title')}>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total de Leads" value={a.total_leads.toString()} sub={`+${a.leads_this_month} este mês`} trend={`+${a.leads_growth}%`} up color="#127284" />
        <StatCard icon={Target} label="Taxa de Conversão" value={`${a.conversion_rate}%`} trend={`+${a.conversion_growth}%`} up color="#3BAFC4" />
        <StatCard icon={Clock} label="Tempo Médio Resposta" value={a.avg_response_time} sub="média da equipe" color="#F9795A" />
        <StatCard icon={DollarSign} label="Receita do Mês" value={`R$ ${(a.won_value / 1e6).toFixed(2)}M`} sub={`${a.won_deals} negócios fechados`} trend="+7 este mês" up color="#22A06B" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Leads over time */}
        <div className="col-span-2 bg-white rounded-2xl border border-[#DAE1EA] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-[#2F4251]">Leads — últimos 30 dias</h3>
              <p className="text-xs text-[#8A9BB0] mt-0.5">Novos leads por dia</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={leadsChartData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#127284" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#127284" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A9BB0' }} axisLine={false} tickLine={false}
                interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#8A9BB0' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #DAE1EA', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" stroke="#127284" strokeWidth={2} fill="url(#grad1)" dot={false} activeDot={{ r: 4, fill: '#127284' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By source */}
        <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
          <h3 className="font-semibold text-[#2F4251] mb-5">Por Origem</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #DAE1EA', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {sourceData.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[#555D6F]">{s.name}</span>
                </div>
                <span className="font-medium text-[#2F4251]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Pipeline stages */}
        <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
          <h3 className="font-semibold text-[#2F4251] mb-5">Leads por Etapa</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stageData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#8A9BB0' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#555D6F' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #DAE1EA', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
                {stageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI insight */}
        <div className="bg-white rounded-2xl border border-[#DAE1EA] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[#F9795A]" />
            <h3 className="font-semibold text-[#2F4251]">Análise da IA</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Lead mais quente', value: 'Carlos Ribeiro', detail: 'Score 92 — em negociação há 2 dias', color: '#22A06B' },
              { label: 'Canal com melhor conversão', value: 'Indicação', detail: '45% de taxa de fechamento', color: '#127284' },
              { label: 'Melhor horário para contato', value: '18h — 20h', detail: '+43% de engajamento', color: '#F9795A' },
              { label: 'Colaborador destaque', value: 'Mariana Silva', detail: '33% de conversão | 42min resposta', color: '#3BAFC4' },
            ].map(i => (
              <div key={i.label} className="flex items-start gap-3 p-3 rounded-xl bg-[#F4F7FA]">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: i.color }} />
                <div>
                  <div className="text-xs text-[#8A9BB0]">{i.label}</div>
                  <div className="text-sm font-semibold text-[#2F4251]">{i.value}</div>
                  <div className="text-xs text-[#8A9BB0]">{i.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collaborator table */}
      <div className="bg-white rounded-2xl border border-[#DAE1EA] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDF0F4]">
          <h3 className="font-semibold text-[#2F4251]">Performance da Equipe</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EDF0F4]">
              {['Colaborador', 'Leads atribuídos', 'Conversões', 'Taxa', 'Tempo de resposta'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-[#8A9BB0] px-6 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collaborators.map((c, i) => (
              <tr key={c.name} className={`border-b border-[#EDF0F4] ${i % 2 === 0 ? '' : 'bg-[#F4F7FA]/40'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: c.color }}>
                      {c.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[#2F4251]">{c.name}</span>
                    {i === 0 && <span className="text-[10px] bg-[#FEF9EC] text-[#F59E0B] px-2 py-0.5 rounded-full font-bold">⭐ TOP</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#555D6F]">{c.leads}</td>
                <td className="px-6 py-4 text-sm font-medium text-[#22A06B]">{c.conversions}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#F4F7FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.rate * 2}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: c.color }}>{c.rate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#555D6F]">{c.responseTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}

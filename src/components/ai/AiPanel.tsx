'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Maximize2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEMO_RESPONSES: Record<string, string> = {
  default: 'Olá! Sou o assistente de IA da DeepLead. Posso te ajudar a analisar seus leads, sugerir mensagens, gerar relatórios ou responder perguntas sobre seu pipeline. O que deseja saber?',
  leads: '📊 Este mês você tem **38 novos leads**, um crescimento de **+14.2%** em relação ao mês anterior. Os principais canais são WhatsApp (40%) e Instagram (29%). Seus leads mais quentes agora são Carlos Ribeiro (score 92) e Thiago Borges (score 84).',
  risk: '⚠️ Identifiquei **3 leads em risco** de abandono:\n\n1. **Carlos Ribeiro** — 2 dias sem resposta pós-interesse alto\n2. **Marcos Vieira** — visita confirmada mas sem confirmação do lead\n3. **Eduardo Maia** — 5 dias sem interação\n\nRecomendo contato imediato com todos os três.',
  campaign: '📢 A campanha **"Lançamento Torre Atlântico"** teve ótima performance: 72% de taxa de abertura (acima da média de 58%) e 18.9% de cliques. Para sua próxima campanha de Dia das Mães, recomendo horário entre **18h e 20h** quando seu público tem 43% mais engajamento.',
  message: '✨ Aqui está uma sugestão de mensagem para o Carlos Ribeiro:\n\n*"Olá Carlos, tudo bem? Vi que você demonstrou interesse no Apto 302 do Brise Barra. Tenho disponibilidade amanhã às 10h ou sábado às 9h para uma visita especial. O que acha?"*\n\nQuer que eu ajuste o tom ou algum detalhe?',
};

function getAiResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('lead') || lower.includes('quantos') || lower.includes('mês')) return DEMO_RESPONSES.leads;
  if (lower.includes('risco') || lower.includes('perda') || lower.includes('abandono')) return DEMO_RESPONSES.risk;
  if (lower.includes('campanha') || lower.includes('mensagem') && lower.includes('enviar')) return DEMO_RESPONSES.campaign;
  if (lower.includes('mensagem') || lower.includes('escreve') || lower.includes('follow')) return DEMO_RESPONSES.message;
  return DEMO_RESPONSES.default;
}

export function AiPanel() {
  const { toggleAiPanel } = useApp();
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: 'assistant', content: DEMO_RESPONSES.default },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: getAiResponse(userMsg) }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const SUGGESTIONS = ['Quantos leads temos?', 'Leads em risco', 'Performance da campanha', 'Escreve mensagem de follow-up'];

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40" onClick={toggleAiPanel} />
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-[#DAE1EA] shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EDF0F4] bg-[#FEF0EC]">
          <div className="w-8 h-8 rounded-xl bg-[#F9795A] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#2F4251] text-sm">Assistente IA</div>
            <div className="text-[11px] text-[#8A9BB0]">DeepLead Intelligence</div>
          </div>
          <button onClick={toggleAiPanel} className="p-1.5 rounded-lg hover:bg-[#FEF0EC] text-[#8A9BB0] hover:text-[#555D6F] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#F9795A] flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#127284] text-white rounded-tr-sm'
                    : 'bg-[#F4F7FA] text-[#2F4251] rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#F9795A] flex items-center justify-center shrink-0">
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="bg-[#F4F7FA] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="ai-dot" />
                <span className="ai-dot" />
                <span className="ai-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Quick suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#DAE1EA] text-[#555D6F] hover:border-[#F9795A] hover:text-[#F9795A] transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-[#EDF0F4]">
          <div className="flex items-end gap-2 bg-[#F4F7FA] rounded-2xl px-4 py-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa..."
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none min-h-[20px] max-h-[100px]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-[#F9795A] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#EB937C] transition-all shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[11px] text-[#B8C4D0] text-center mt-2">
            Respostas simuladas para demonstração
          </p>
        </div>
      </motion.div>
    </>
  );
}

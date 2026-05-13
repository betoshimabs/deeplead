'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, Loader2, Copy, Check,
  X, ExternalLink, ChevronRight, Wifi, WifiOff, Trash2, RefreshCw
} from 'lucide-react';

interface WhatsAppChannel {
  id: string;
  status: string;
  display_name: string;
  phone_number_id: string;
  connected_at: string;
}

interface WebhookInfo {
  url: string;
  verify_token: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="shrink-0 p-1.5 rounded-lg hover:bg-[#DAE1EA] transition-colors text-[#8A9BB0]" title="Copiar">
      {copied ? <Check size={14} className="text-[#22A06B]" /> : <Copy size={14} />}
    </button>
  );
}

// ─── Step 1: Enter credentials ────────────────────────────────────────────────
function StepCredentials({ onVerified }: { onVerified: (webhook: WebhookInfo) => void }) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': localStorage.getItem('dl_active_business') ?? '',
        },
        body: JSON.stringify({ phone_number_id: phoneNumberId.trim(), access_token: accessToken.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao conectar.');
      onVerified(json.webhook);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#FEF9EC] border border-[#FDE68A] rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-[#CA8A04] shrink-0 mt-0.5" />
        <div className="text-sm text-[#92400E]">
          <p className="font-semibold mb-1">Você vai precisar do Meta for Developers</p>
          <p className="text-xs">Acesse <span className="font-mono">developers.facebook.com</span> → Seu App → WhatsApp → Configuração de API para obter o <strong>Phone Number ID</strong> e o <strong>Token de Acesso Permanente</strong>.</p>
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#CA8A04] hover:underline"
          >
            Abrir Meta for Developers <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FFEAEA] border border-[#FCA5A5] rounded-xl flex items-start gap-2 text-sm text-[#E03131]">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#2F4251] mb-1.5">
            Phone Number ID
            <span className="ml-1 text-xs font-normal text-[#8A9BB0]">(da Meta for Developers)</span>
          </label>
          <input
            value={phoneNumberId}
            onChange={e => setPhoneNumberId(e.target.value)}
            placeholder="Ex: 123456789012345"
            className="w-full px-3 py-2.5 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm font-mono outline-none focus:border-[#3BAFC4] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#2F4251] mb-1.5">
            Token de Acesso Permanente
            <span className="ml-1 text-xs font-normal text-[#8A9BB0]">(não o token temporário)</span>
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            placeholder="EAAxxxxx..."
            className="w-full px-3 py-2.5 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl text-sm font-mono outline-none focus:border-[#3BAFC4] focus:bg-white transition-all"
          />
          <p className="text-xs text-[#8A9BB0] mt-1.5">O token é armazenado de forma segura e nunca exposto ao cliente.</p>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading || !phoneNumberId || !accessToken}
        className="w-full py-3 bg-[#127284] text-white rounded-xl font-semibold text-sm hover:bg-[#0E5B6A] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Verificando com Meta...</>
        ) : (
          <><CheckCircle2 size={16} /> Verificar e Conectar</>
        )}
      </button>
    </div>
  );
}

// ─── Step 2: Configure Webhook ────────────────────────────────────────────────
function StepWebhook({ webhook, onDone }: { webhook: WebhookInfo; onDone: () => void }) {
  return (
    <div className="space-y-5">
      <div className="bg-[#E6F5EF] border border-[#22A06B]/30 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 size={16} className="text-[#22A06B] shrink-0 mt-0.5" />
        <div className="text-sm text-[#166534]">
          <p className="font-semibold">Credenciais verificadas com sucesso! ✅</p>
          <p className="text-xs mt-0.5">Agora configure o webhook na Meta para receber mensagens em tempo real.</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-[#2F4251] mb-3">
          Configure o Webhook no Meta for Developers
        </h4>
        <ol className="text-sm text-[#555D6F] space-y-2 mb-4 list-decimal list-inside">
          <li>Acesse seu App → <strong>WhatsApp</strong> → <strong>Configuração</strong></li>
          <li>Em <em>Webhooks</em>, clique em <strong>Editar</strong></li>
          <li>Cole a URL e o Token abaixo</li>
          <li>Assine o campo <strong>messages</strong></li>
        </ol>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#8A9BB0] uppercase tracking-wide mb-1.5">URL do Callback</label>
            <div className="flex items-center gap-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl px-3 py-2">
              <code className="flex-1 text-xs text-[#2F4251] break-all font-mono">{webhook.url}</code>
              <CopyButton value={webhook.url} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#8A9BB0] uppercase tracking-wide mb-1.5">Token de Verificação</label>
            <div className="flex items-center gap-2 bg-[#F4F7FA] border border-[#DAE1EA] rounded-xl px-3 py-2">
              <code className="flex-1 text-xs text-[#2F4251] font-mono">{webhook.verify_token}</code>
              <CopyButton value={webhook.verify_token} />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#EBF7FA] rounded-xl border border-[#127284]/20">
          <p className="text-xs text-[#0E5B6A] font-semibold flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} /> Atenção: URL deve ser pública
          </p>
          <p className="text-xs text-[#127284]">
            A URL acima só funcionará após o deploy no Vercel ou outra plataforma com HTTPS. 
            Em localhost o webhook não funcionará. Configure o deploy primeiro.
          </p>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full py-3 bg-[#127284] text-white rounded-xl font-semibold text-sm hover:bg-[#0E5B6A] transition-all flex items-center justify-center gap-2"
      >
        Concluir Configuração <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Connected State ──────────────────────────────────────────────────────────
function ConnectedState({ channel, onDisconnect }: { channel: WhatsAppChannel; onDisconnect: () => void }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/whatsapp', {
        method: 'DELETE',
        headers: { 'x-business-id': localStorage.getItem('dl_active_business') ?? '' },
      });
      onDisconnect();
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };

  const connectedSince = new Date(channel.connected_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="flex items-center gap-4 p-4 bg-[#E6F5EF] border border-[#22A06B]/30 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-2xl shrink-0">
          💬
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-[#2F4251] text-sm">{channel.display_name}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#22A06B] bg-[#22A06B]/10 px-2 py-0.5 rounded-full">
              <Wifi size={10} /> Ativo
            </span>
          </div>
          <p className="text-xs text-[#555D6F]">Conectado desde {connectedSince}</p>
        </div>
        {!confirmDisconnect ? (
          <button
            onClick={() => setConfirmDisconnect(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#E03131] bg-white border border-[#FCA5A5] rounded-xl hover:bg-[#FFEAEA] transition-colors"
          >
            <WifiOff size={13} /> Desconectar
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-[#E03131] font-medium">Confirmar?</span>
            <button onClick={() => setConfirmDisconnect(false)} className="p-1.5 rounded-lg hover:bg-white text-[#8A9BB0] transition-colors"><X size={14} /></button>
            <button onClick={handleDisconnect} disabled={disconnecting} className="flex items-center gap-1 px-3 py-1.5 bg-[#E03131] text-white text-xs font-bold rounded-xl hover:bg-[#C92A2A] transition-colors disabled:opacity-50">
              {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Sim
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#F4F7FA] rounded-xl border border-[#DAE1EA]">
          <div className="text-[10px] text-[#8A9BB0] font-bold uppercase tracking-wide mb-1">Phone Number ID</div>
          <div className="text-sm font-mono text-[#2F4251] truncate">{channel.phone_number_id}</div>
        </div>
        <div className="p-3 bg-[#F4F7FA] rounded-xl border border-[#DAE1EA]">
          <div className="text-[10px] text-[#8A9BB0] font-bold uppercase tracking-wide mb-1">Canal</div>
          <div className="text-sm text-[#2F4251]">WhatsApp Business API</div>
        </div>
      </div>

      <div className="p-4 bg-[#EBF7FA] rounded-xl border border-[#127284]/20">
        <p className="text-xs font-semibold text-[#0E5B6A] mb-1">💡 Dica</p>
        <p className="text-xs text-[#127284]">
          Mensagens enviadas para o seu número WhatsApp Business aparecerão automaticamente na aba <strong>Chat</strong> em tempo real — assim que o webhook estiver configurado com a URL de produção.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function WhatsAppIntegrationCard({ canManage }: { canManage: boolean }) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState<WhatsAppChannel | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [webhook, setWebhook] = useState<WebhookInfo | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/whatsapp', {
        headers: { 'x-business-id': localStorage.getItem('dl_active_business') ?? '' },
      });
      const json = await res.json();
      setConnected(json.connected);
      setChannel(json.channel ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-[#EDF0F4] flex items-center gap-3 bg-white">
        <div className="w-10 h-10 rounded-lg bg-[#F4F7FA] flex items-center justify-center text-xl shrink-0">💬</div>
        <div className="flex-1">
          <div className="h-3 bg-[#F4F7FA] rounded w-32 mb-2 animate-pulse" />
          <div className="h-2.5 bg-[#F4F7FA] rounded w-20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (connected && channel) {
    return (
      <div className="bg-white rounded-2xl border border-[#DAE1EA] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EDF0F4] flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-[#2F4251]">WhatsApp Business API</h4>
            <p className="text-xs text-[#8A9BB0] mt-0.5">Canal de mensagens conectado</p>
          </div>
          <button onClick={loadStatus} className="w-7 h-7 rounded-lg text-[#8A9BB0] hover:bg-[#F4F7FA] flex items-center justify-center transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="p-5">
          <ConnectedState channel={channel} onDisconnect={() => { setConnected(false); setChannel(null); }} />
        </div>
      </div>
    );
  }

  if (!connecting) {
    return (
      <div className="p-4 rounded-xl border border-[#EDF0F4] flex items-center justify-between bg-white hover:border-[#DAE1EA] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F4F7FA] flex items-center justify-center text-xl shrink-0">💬</div>
          <div>
            <div className="font-medium text-[#2F4251] text-sm">WhatsApp Business API</div>
            <div className="text-xs text-[#8A9BB0] mt-0.5">Não conectado</div>
          </div>
        </div>
        <button
          disabled={!canManage}
          onClick={() => setConnecting(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#127284] hover:bg-[#0E5B6A] transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          Conectar <ChevronRight size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#DAE1EA] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EDF0F4] flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-[#2F4251]">Conectar WhatsApp Business</h4>
          <p className="text-xs text-[#8A9BB0] mt-0.5">
            Passo {step} de 2 — {step === 1 ? 'Credenciais' : 'Webhook'}
          </p>
        </div>
        <button
          onClick={() => { setConnecting(false); setStep(1); setWebhook(null); }}
          className="w-7 h-7 rounded-lg text-[#8A9BB0] hover:bg-[#F4F7FA] flex items-center justify-center transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center px-5 pt-4 gap-2">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= s ? 'text-[#127284]' : 'text-[#B8C4D0]'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${step > s ? 'bg-[#127284] border-[#127284] text-white' : step === s ? 'border-[#127284] text-[#127284]' : 'border-[#DAE1EA] text-[#B8C4D0]'}`}>
                {step > s ? <Check size={10} /> : s}
              </div>
              {s === 1 ? 'Credenciais' : 'Webhook'}
            </div>
            {s < 2 && <div className={`flex-1 h-px ${step > 1 ? 'bg-[#127284]' : 'bg-[#EDF0F4]'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="p-5">
        {step === 1 && (
          <StepCredentials
            onVerified={(wh) => {
              setWebhook(wh);
              setStep(2);
            }}
          />
        )}
        {step === 2 && webhook && (
          <StepWebhook
            webhook={webhook}
            onDone={() => {
              setConnecting(false);
              setStep(1);
              loadStatus();
            }}
          />
        )}
      </div>
    </div>
  );
}

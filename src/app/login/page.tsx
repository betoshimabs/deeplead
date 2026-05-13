'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const { switchUser, devUsers } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('bryan@valore.com.br');
  const [password, setPassword] = useState('deeplead2026');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const matched = devUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched && password) {
      switchUser(matched.id);
      router.push('/dashboard');
    } else if (!matched) {
      setError('Email não encontrado. Use a conta de demonstração abaixo.');
      setLoading(false);
    } else {
      setError('Preencha todos os campos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">
      {/* Left panel — branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#127284] p-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-white" />
          <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-[#F9795A]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-[12px] bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold">DL</span>
            </div>
            <span className="text-white font-bold text-xl">
              Deep<span className="text-[#EB937C]">Lead</span>
            </span>
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            CRM Inteligente<br />para seu negócio
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Gerencie seus leads, campanhas e equipe com o poder da inteligência artificial ao seu lado.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {[
            { emoji: '🎯', text: 'Pipeline com lead scoring por IA' },
            { emoji: '💬', text: 'Chat WhatsApp unificado com sugestões' },
            { emoji: '📊', text: 'Analytics e insights automáticos' },
            { emoji: '📢', text: 'Campanhas multicanal com automação' },
          ].map(f => (
            <div key={f.emoji} className="flex items-center gap-3">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-white/80 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        {/* AI badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Sparkles size={14} className="text-[#EB937C]" />
            <span className="text-white/80 text-xs">Assistente de IA integrado em toda plataforma</span>
          </div>
        </div>
      </motion.div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[10px] bg-[#127284] flex items-center justify-center">
              <span className="text-white font-bold text-sm">DL</span>
            </div>
            <span className="font-bold text-lg text-[#2F4251]">
              Deep<span className="text-[#F9795A]">Lead</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#2F4251] mb-1">Bem-vindo de volta</h1>
          <p className="text-[#8A9BB0] text-sm mb-8">Acesse sua conta para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#2F4251] mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] focus:ring-3 focus:ring-[#3BAFC4]/20 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#2F4251] mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB0]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-[#DAE1EA] rounded-xl text-sm text-[#2F4251] placeholder:text-[#B8C4D0] outline-none focus:border-[#3BAFC4] focus:ring-3 focus:ring-[#3BAFC4]/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB0] hover:text-[#555D6F]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[#E03131] text-sm bg-[#FFEAEA] px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-[#555D6F]">Lembrar-me</span>
              </label>
              <button type="button" className="text-[#127284] hover:text-[#3BAFC4] font-medium transition-colors">
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#127284] hover:bg-[#0e5f6f] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-8 p-4 bg-[#EBF7FA] rounded-xl border border-[#DAE1EA]">
            <p className="text-xs text-[#555D6F] font-medium mb-1">🔑 Conta de demonstração</p>
            <p className="text-xs text-[#8A9BB0]">
              <strong>Email:</strong> bryan@valore.com.br<br />
              <strong>Senha:</strong> deeplead2026
            </p>
          </div>

          <p className="text-center text-sm text-[#8A9BB0] mt-6">
            Não tem conta?{' '}
            <button className="text-[#127284] hover:text-[#3BAFC4] font-medium transition-colors">
              Solicitar acesso
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

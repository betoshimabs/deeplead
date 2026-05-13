'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { User as UserIcon, Shield, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user, locale, setLocale } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  if (!user) return null;

  return (
    <AppLayout title="Configurações">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2F4251] tracking-tight">Configurações Pessoais</h1>
          <p className="text-[#8A9BB0] mt-1">Gerencie seu perfil, segurança e preferências.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Menu Lateral das Configs */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <MenuButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserIcon} label="Meu Perfil" />
            <MenuButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Shield} label="Segurança" />
            <MenuButton active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} icon={Palette} label="Preferências" />
          </div>

          {/* Área Principal */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0F4] shadow-sm">
                <h3 className="font-semibold text-lg text-[#2F4251] mb-6">Informações Pessoais</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-[#127284] text-white flex items-center justify-center text-2xl font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <button className="bg-[#EBF7FA] text-[#127284] px-4 py-2 rounded-lg font-medium hover:bg-[#127284] hover:text-white transition-colors text-sm">
                      Alterar Foto
                    </button>
                    <p className="text-xs text-[#8A9BB0] mt-2">Recomendado: 256x256px. Máx: 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Nome Completo</label>
                    <input type="text" defaultValue={user.name} 
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none focus:ring-2 focus:ring-[#127284]/20 focus:border-[#127284]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-1.5">E-mail</label>
                    <input type="email" defaultValue={user.email} disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DAE1EA] bg-[#F4F7FA] text-[#8A9BB0] cursor-not-allowed" 
                    />
                    <p className="text-xs text-[#8A9BB0] mt-1">O e-mail não pode ser alterado diretamente.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Cargo / Título</label>
                    <input type="text" placeholder="Ex: Corretor Associado" 
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none focus:ring-2 focus:ring-[#127284]/20 focus:border-[#127284]" 
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EDF0F4] flex justify-end">
                  <button className="bg-[#127284] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#0E5B6A] transition-colors">
                    Salvar Perfil
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0F4] shadow-sm">
                <h3 className="font-semibold text-lg text-[#2F4251] mb-6">Segurança e Senha</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Senha Atual</label>
                    <input type="password" placeholder="••••••••" 
                      className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none focus:ring-2 focus:ring-[#127284]/20 focus:border-[#127284]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-1.5">Nova Senha</label>
                    <input type="password" placeholder="Nova senha segura" 
                      className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#DAE1EA] focus:outline-none focus:ring-2 focus:ring-[#127284]/20 focus:border-[#127284]" 
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EDF0F4] flex justify-end">
                  <button className="bg-[#127284] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#0E5B6A] transition-colors">
                    Atualizar Senha
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl p-6 border border-[#EDF0F4] shadow-sm">
                <h3 className="font-semibold text-lg text-[#2F4251] mb-6">Preferências de Visualização</h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-3">Idioma da Interface</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setLocale('pt-BR')}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-center font-medium transition-colors w-40 ${locale === 'pt-BR' ? 'border-[#127284] bg-[#EBF7FA] text-[#127284]' : 'border-[#DAE1EA] text-[#555D6F] hover:bg-[#F4F7FA]'}`}
                      >
                        🇧🇷 Português
                      </button>
                      <button 
                        onClick={() => setLocale('en')}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-center font-medium transition-colors w-40 ${locale === 'en' ? 'border-[#127284] bg-[#EBF7FA] text-[#127284]' : 'border-[#DAE1EA] text-[#555D6F] hover:bg-[#F4F7FA]'}`}
                      >
                        🇺🇸 English
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#555D6F] mb-3">Tema de Cores</label>
                    <div className="flex gap-4">
                      <button className="px-4 py-3 rounded-xl border border-[#127284] bg-[#EBF7FA] text-[#127284] flex items-center justify-center font-medium w-40">
                        Claro (Light)
                      </button>
                      <button disabled className="px-4 py-3 rounded-xl border border-[#DAE1EA] bg-[#F4F7FA] text-[#8A9BB0] flex items-center justify-center font-medium w-40 cursor-not-allowed">
                        Escuro (Em breve)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MenuButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
        ${active ? 'bg-[#EBF7FA] text-[#127284]' : 'text-[#555D6F] hover:bg-[#F4F7FA] hover:text-[#2F4251]'}
      `}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

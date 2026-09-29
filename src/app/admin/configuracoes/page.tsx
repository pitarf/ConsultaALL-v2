'use client';

import React, { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/admin';
import { getUserProfile } from '@/app/actions/perfil';
import { Save, Globe, MessageSquare, Loader2, Info, Image, ExternalLink, Scale, CreditCard, Eye, EyeOff, ShieldCheck, Settings } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página de Configurações do Sistema no Painel Admin.
 * Permite alterar SEO, Branding (Logo e Favicon), Gateway PushinPay e canais de suporte.
 */
export default function AdminSettingsPage() {
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPushinToken, setShowPushinToken] = useState(false);
  const [showWebhookToken, setShowWebhookToken] = useState(false);
  const [showBrevoToken, setShowBrevoToken] = useState(false);
  const [showDirectToken, setShowDirectToken] = useState(false);
  const [showConsultaToken, setShowConsultaToken] = useState(false);
  const [settings, setSettings] = useState({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    supportWhatsapp: '',
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    companyCnpj: '',
    companyAddress: '',
    companyEmail: '',
    pushinpayToken: '',
    pushinpayWebhookToken: '',
    pixFee: 0.95,
    brevoApiKey: '',
    directDataToken: '',
    directDataBaseUrl: '',
    directDataV3Url: '',
    apiConsultaToken: '',
    apiConsultaUrl: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [data, profile] = await Promise.all([
          getSystemSettings(),
          getUserProfile()
        ]);
        if (profile) {
          setRole(profile.role);
        }
        setSettings({
          siteTitle: data.siteTitle || '',
          siteDescription: data.siteDescription || '',
          siteKeywords: data.siteKeywords || '',
          supportWhatsapp: data.supportWhatsapp || '',
          logoUrl: data.logoUrl || '',
          faviconUrl: data.faviconUrl || '',
          companyName: data.companyName || '',
          companyCnpj: data.companyCnpj || '',
          companyAddress: data.companyAddress || '',
          companyEmail: data.companyEmail || '',
          pushinpayToken: data.pushinpayToken || '',
          pushinpayWebhookToken: data.pushinpayWebhookToken || '',
          pixFee: data.pixFee ?? 0.95,
          brevoApiKey: data.brevoApiKey || '',
          directDataToken: data.directDataToken || '',
          directDataBaseUrl: data.directDataBaseUrl || '',
          directDataV3Url: data.directDataV3Url || '',
          apiConsultaToken: data.apiConsultaToken || '',
          apiConsultaUrl: data.apiConsultaUrl || '',
        });
      } catch {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSystemSettings(settings);
      if (res.success) {
        toast.success('Configurações salvas com sucesso!');
      }
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações do Sistema</h1>
        <p className="text-slate-500 dark:text-gray-400 mt-2">Gerencie a identidade visual, SEO e canais de suporte.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* ====== BRANDING VISUAL ====== */}
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Branding Visual</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm">Defina a logo e o favicon do sistema via URL externa.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">URL da Logo</label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                Recomendado: PNG ou SVG com fundo transparente. Tamanho ideal: 200x60px.
              </p>
              {/* Pré-visualização da Logo */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 p-4 flex items-center justify-center min-h-[80px]">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Preview da Logo"
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <Image className="w-8 h-8 text-slate-400 dark:text-gray-600 mx-auto mb-1" />
                    <p className="text-slate-500 dark:text-gray-600 text-xs">Pré-visualização da Logo</p>
                    <p className="text-slate-400 dark:text-gray-700 text-xs mt-1">
                      Padrão: <span className="text-primary">/logo-default.png</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">URL do Favicon</label>
              <input
                type="url"
                value={settings.faviconUrl}
                onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="https://exemplo.com/favicon.ico"
              />
              <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                Recomendado: ICO ou PNG 32x32px. Aparece na aba do navegador.
              </p>
              {/* Pré-visualização do Favicon */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50 p-4 flex flex-col items-center justify-center min-h-[80px] gap-3">
                {settings.faviconUrl ? (
                  <>
                    <img
                      src={settings.faviconUrl}
                      alt="Preview do Favicon"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <a
                      href={settings.faviconUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Ver arquivo <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-1">
                      <span className="text-primary text-xs font-bold">DB</span>
                    </div>
                    <p className="text-slate-500 dark:text-gray-600 text-xs">Pré-visualização do Favicon</p>
                    <p className="text-slate-400 dark:text-gray-700 text-xs mt-1">
                      Padrão: <span className="text-primary">ícone DB gerado</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ====== SEO & IDENTIDADE ====== */}
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Identidade & SEO</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Título do Site</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="Ex: ConsultasBrasil - Investigação de Dados"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Descrição (Meta Description)</label>
              <textarea
                rows={3}
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all resize-none text-sm"
                placeholder="Uma breve descrição para os motores de busca..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Palavras-chave (Keywords)</label>
              <input
                type="text"
                value={settings.siteKeywords}
                onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="consultas, cpf, cnpj, veículos (separadas por vírgula)"
              />
            </div>
          </div>
        </section>

        {role === 'ADMIN' && (
          <>
            {/* ====== GATEWAY DE PAGAMENTO (PUSHINPAY) ====== */}
            <section className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gateway de Pagamento (PushinPay)</h2>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">Configure as chaves de integração Pix. Se deixado em branco, o sistema usará as chaves padrão do arquivo .env.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Token da API PushinPay */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Token de API PushinPay (Bearer Token)</label>
                      {settings.pushinpayToken && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Configurado
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPushinToken(!showPushinToken)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {showPushinToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showPushinToken ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showPushinToken ? "text" : "password"}
                    value={settings.pushinpayToken}
                    onChange={(e) => setSettings({ ...settings, pushinpayToken: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                    placeholder="Ex: 67768|cy3n6j9UdLD0FeXc0ZjhiNRYrcbGL4pwBIbzJT5B0d32938d"
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Token de autenticação gerado no painel da PushinPay (Menu {'>'} Tokens de Acesso). Usado para gerar cobranças Pix.
                  </p>
                </div>

                {/* Token de Segurança do Webhook */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Token de Segurança do Webhook (PUSHINPAY_WEBHOOK_TOKEN)</label>
                    <button
                      type="button"
                      onClick={() => setShowWebhookToken(!showWebhookToken)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {showWebhookToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showWebhookToken ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showWebhookToken ? "text" : "password"}
                    value={settings.pushinpayWebhookToken}
                    onChange={(e) => setSettings({ ...settings, pushinpayWebhookToken: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                    placeholder="Ex: 880d03ddeda5ad631ebd021c6d7b5013"
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Senha de validação inserida na URL do webhook para verificar notificações de pagamento confirmadas.
                  </p>
                </div>

                {/* Taxa do Gateway Pix */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Taxa do Gateway Pix por Transação (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.pixFee}
                    onChange={(e) => setSettings({ ...settings, pixFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                    placeholder="Ex: 0.95"
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Valor fixo deduzido de cada recarga Pix aprovada para calcular o Lucro Líquido Real no dashboard (Ex: R$ 0,95).
                  </p>
                </div>
              </div>
            </section>

            {/* ====== CONFIGURAÇÕES DE APIS EXTERNAS ====== */}
            <section className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">APIs & Integrações Externas</h2>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">Configure as chaves e endpoints de consulta e comunicação. Se deixados em branco, o sistema usará as chaves padrão do arquivo .env.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Brevo API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Chave API Brevo (E-mails transacionais)</label>
                      {settings.brevoApiKey && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Configurado
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBrevoToken(!showBrevoToken)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {showBrevoToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showBrevoToken ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showBrevoToken ? "text" : "password"}
                    value={settings.brevoApiKey}
                    onChange={(e) => setSettings({ ...settings, brevoApiKey: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                    placeholder="Ex: xkeysib-xxxxxxxx..."
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    Chave de API da plataforma Brevo (antiga Sendinblue) para envio automático de e-mails de recuperação de senha.
                  </p>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* Direct Data Section */}
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white">Direct Data (Consultas Avançadas)</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Token DirectData (GUID)</label>
                        {settings.directDataToken && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Configurado
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDirectToken(!showDirectToken)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {showDirectToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showDirectToken ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <input
                      type={showDirectToken ? "text" : "password"}
                      value={settings.directDataToken}
                      onChange={(e) => setSettings({ ...settings, directDataToken: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                      placeholder="Ex: d4b39ad3-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400">URL Base DirectData (V2)</label>
                      <input
                        type="text"
                        value={settings.directDataBaseUrl}
                        onChange={(e) => setSettings({ ...settings, directDataBaseUrl: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                        placeholder="Padrão: https://api.directd.com.br"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-gray-400">URL DirectData V3</label>
                      <input
                        type="text"
                        value={settings.directDataV3Url}
                        onChange={(e) => setSettings({ ...settings, directDataV3Url: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                        placeholder="Padrão: https://apiv3.directd.com.br"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-white/5" />

                {/* API Consulta (Hero) Section */}
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white">API Consulta Brasil (Hero)</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Token API Consulta</label>
                        {settings.apiConsultaToken && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Configurado
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConsultaToken(!showConsultaToken)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {showConsultaToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showConsultaToken ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <input
                      type={showConsultaToken ? "text" : "password"}
                      value={settings.apiConsultaToken}
                      onChange={(e) => setSettings({ ...settings, apiConsultaToken: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm font-mono"
                      placeholder="Ex: seu_token_da_api_consulta_brasil..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-gray-400">URL da API Consulta</label>
                    <input
                      type="text"
                      value={settings.apiConsultaUrl}
                      onChange={(e) => setSettings({ ...settings, apiConsultaUrl: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                      placeholder="Padrão: https://services.apiconsultabrasil.com/"
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ====== INFORMAÇÕES LEGAIS (PARA TERMOS DE USO) ====== */}
        <section className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Informações Legais</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm">Dados que aparecerão automaticamente na página de Termos de Uso.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Razão Social / Nome da Empresa</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="Ex: Minha Empresa de Dados LTDA"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">CNPJ</label>
              <input
                type="text"
                value={settings.companyCnpj}
                onChange={(e) => setSettings({ ...settings, companyCnpj: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">E-mail de Contato Legal</label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="contato@seusite.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">WhatsApp de Suporte</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400">+</span>
                <input
                  type="text"
                  value={settings.supportWhatsapp}
                  onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                  placeholder="5511999999999"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-600 dark:text-gray-400">Endereço Completo</label>
              <input
                type="text"
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all text-sm"
                placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
              />
            </div>
          </div>
        </section>

        {/* Botão de salvar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}

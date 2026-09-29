import Link from "next/link";
import SearchTeaser from "@/components/SearchTeaser";
import { prisma } from "../../lib/prisma";
import {
  Search,
  ShieldCheck,
  Zap,
  Database,
  Car,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Lock,
  Clock,
} from "lucide-react";

/**
 * Landing Page Principal do ConsultasBrasil (Arquivada para /home2)
 * Design original escuro com glassmorphism, gradientes azul/roxo e identidade investigativa.
 */
export default async function Home2() {
  const settings = await prisma.systemSetting.findFirst();

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ===================== NAVBAR ===================== */}
      <header className="border-b border-white/10 glass-panel sticky top-0 z-50">
        <div className="container-premium py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Search className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold tracking-wider text-white">
              Consultas<span className="text-primary">Brasil</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#recursos" className="text-sm text-gray-400 hover:text-white transition-colors">
              Recursos
            </Link>
            <Link href="#como-funciona" className="text-sm text-gray-400 hover:text-white transition-colors">
              Como Funciona
            </Link>
            <Link href="#seguranca" className="text-sm text-gray-400 hover:text-white transition-colors">
              Segurança
            </Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-premium text-sm px-5 py-2.5">
              Acessar Plataforma
            </Link>
          </nav>

          {/* Mobile CTA */}
          <Link href="/login" className="md:hidden btn-premium text-sm px-4 py-2">
            Entrar
          </Link>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative flex flex-col justify-center items-center text-center px-4 py-28 lg:py-40 overflow-hidden">
        {/* Orbs de fundo */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[130px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[100px] -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Plataforma Online • Acesso Imediato
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-300 mb-6 max-w-5xl mx-auto leading-tight">
          Painel Completo de <br className="hidden md:block" /> Consultas Online
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Pesquise nomes, CPFs, telefones e muito mais em nossa <br className="hidden md:block" /> plataforma completa de investigação profissional.
        </p>

        <SearchTeaser />

        {/* Trust strip abaixo dos botões */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Sem assinatura obrigatória</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Pagamento por consulta</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Resultados em segundos</span>
        </div>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="py-10 border-y border-white/5 bg-black/20">
        <div className="container-premium">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50M+", label: "Registros Disponíveis" },
              { value: "< 3s", label: "Tempo de Resposta" },
              { value: "99.9%", label: "Uptime Garantido" },
              { value: "100%", label: "Legal e Seguro" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== MÓDULOS DE CONSULTA ===================== */}
      <section id="recursos" className="py-24">
        <div className="container-premium">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">O que você pode consultar</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Módulos de Investigação
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Informações precisas e atualizadas sobre pessoas, empresas, veículos e endereços em um único lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: User,
                color: "from-emerald-500 to-green-600",
                glow: "rgba(16,185,129,0.3)",
                title: "Consulta de Pessoas",
                desc: "CPF, nome completo, endereço atual, histórico, vínculos familiares, e-mails e telefones associados.",
                tags: ["CPF", "Nome", "Histórico"],
              },
              {
                icon: Phone,
                color: "from-teal-500 to-emerald-600",
                glow: "rgba(20,184,166,0.3)",
                title: "Consulta por Telefone",
                desc: "Descubra o proprietário de qualquer número, operadora, histórico e dados cadastrais vinculados.",
                tags: ["Celular", "Fixo", "WhatsApp"],
              },
              {
                icon: Mail,
                color: "from-violet-500 to-purple-700",
                glow: "rgba(139,92,246,0.3)",
                title: "Consulta por E-mail",
                desc: "Rastreie o dono de um e-mail, redes sociais associadas, cadastros e histórico de uso.",
                tags: ["Gmail", "Outlook", "Corporativo"],
              },
              {
                icon: Building2,
                color: "from-emerald-500 to-teal-600",
                glow: "rgba(16,185,129,0.3)",
                title: "Consulta de Empresas",
                desc: "CNPJ, quadro societário, situação cadastral, endereço fiscal e faturamento estimado.",
                tags: ["CNPJ", "Sócios", "Situação"],
              },
              {
                icon: Car,
                color: "from-orange-500 to-red-600",
                glow: "rgba(249,115,22,0.3)",
                title: "Consulta de Veículos",
                desc: "Proprietário atual, histórico de multas, restrições, roubo/furto e características do veículo.",
                tags: ["Placa", "Chassi", "Proprietário"],
              },
              {
                icon: MapPin,
                color: "from-pink-500 to-rose-600",
                glow: "rgba(236,72,153,0.3)",
                title: "Consulta de Endereços",
                desc: "Valide e complete endereços, encontre moradores históricos e vínculos com um CEP ou logradouro.",
                tags: ["CEP", "Logradouro", "Moradores"],
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass-panel p-6 rounded-2xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
                style={{ boxShadow: `0 0 0 transparent` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section id="como-funciona" className="py-24 bg-black/20 border-y border-white/5">
        <div className="container-premium">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simples e Rápido</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Como Funciona</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Em menos de 1 minuto você já tem acesso às informações que precisa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Linha conectora */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {[
              { step: "01", icon: User, title: "Crie sua Conta", desc: "Cadastro gratuito e imediato. Sem burocracia, sem contrato." },
              { step: "02", icon: Database, title: "Adicione Créditos", desc: "Recarregue sua carteira via Pix com qualquer valor." },
              { step: "03", icon: Search, title: "Faça sua Consulta", desc: "Digite os dados e receba o relatório completo em segundos." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center border border-primary/30">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SEGURANÇA ===================== */}
      <section id="seguranca" className="py-24">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Proteção Total</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Sua Segurança é Nossa<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Prioridade Máxima</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Operamos com total conformidade legal. Todas as consultas são registradas e auditadas. Seus dados de pagamento são protegidos com criptografia de ponta a ponta.
              </p>
              <div className="space-y-4">
                {[
                  "Dados criptografados com SSL/TLS",
                  "Pagamentos via Pix 100% seguros",
                  "Conformidade com a LGPD",
                  "Auditoria de todas as consultas",
                  "Sem compartilhamento de dados pessoais",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Lock, title: "Criptografia", desc: "Dados protegidos com SSL de 256 bits" },
                { icon: ShieldCheck, title: "LGPD", desc: "Totalmente em conformidade com a lei" },
                { icon: Clock, title: "24/7 Online", desc: "Plataforma disponível a qualquer hora" },
                { icon: Zap, title: "Resposta Rápida", desc: "Resultados em menos de 3 segundos" },
              ].map((card) => (
                <div key={card.title} className="glass-panel p-6 rounded-2xl">
                  <card.icon className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-bold text-white text-sm mb-1">{card.title}</h4>
                  <p className="text-gray-500 text-xs">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-primary/10 rounded-full blur-[80px] -z-10" />
        <div className="container-premium text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Pronto para Encontrar<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              o que Precisa?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Crie sua conta agora, adicione créditos e faça sua primeira consulta em menos de 2 minutos.
          </p>
          <Link
            href="/cadastro"
            className="btn-premium px-12 py-5 text-xl inline-flex items-center gap-3"
          >
            <Search className="w-6 h-6" />
            Começar Agora
          </Link>
          <p className="text-gray-600 text-sm mt-6">Cadastro 100% gratuito • Sem mensalidade • Pague só o que usar</p>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-white/10 py-12 bg-black/40">
        <div className="container-premium">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-lg font-bold text-white">
                Consultas<span className="text-primary">Brasil</span>
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
              <Link href="/cadastro" className="hover:text-white transition-colors">Cadastro</Link>
              <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            </div>
            <p className="text-gray-600 text-sm text-center md:text-right">
              © {new Date().getFullYear()} {settings?.siteTitle?.split(' - ')[0] || "ConsultasBrasil"}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

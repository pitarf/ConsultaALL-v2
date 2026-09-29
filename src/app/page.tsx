import Link from 'next/link';
import { prisma } from '../lib/prisma';
import NavbarClient from '@/components/NavbarClient';
import Footer from '@/components/Footer';
import HomeTabs from '@/components/HomeTabs';
import FaqAccordion from '@/components/FaqAccordion';
import HomeSearchBox from '@/components/HomeSearchBox';
import { Metadata } from 'next';
import { 
  ShieldCheck, 
  Search, 
  Zap, 
  FileText, 
  Scale, 
  ArrowRight,
  TrendingUp,
  Fingerprint,
  RefreshCw,
  Users2,
  Wallet,
  CheckCircle,
  Building2,
  Car,
  UserCheck,
  CreditCard,
  Users
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const title = "Consulta CPF, Telefone, CNPJ e Placa | ConsultasBrasil";
  const description = "Consulte CPF, telefone, CNPJ, nome e placa em uma plataforma online com módulos avulsos, preços transparentes e pagamento via Pix. Acesse o ConsultasBrasil.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://consultasbrasil.net/"
    },
    robots: "index, follow, max-image-preview:large",
    openGraph: {
      title,
      description,
      url: "https://consultasbrasil.net/",
      siteName: "ConsultasBrasil",
      images: [
        {
          url: "https://consultasbrasil.net/logo.png",
          width: 1200,
          height: 630,
          alt: "ConsultasBrasil - Plataforma de consultas online"
        }
      ],
      type: "website",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://consultasbrasil.net/logo.png"]
    }
  };
}

/**
 * Nova Landing Page Whitelist Principal do ConsultasBrasil
 * Design institucional corporativo (SaaS Light Premium) baseado no site de referência DeskData.
 * Focado em enriquecimento de leads, validação cadastral, compliance e prevenção a fraudes.
 * 100% otimizado para aprovação do Google Ads.
 */
export default async function Home() {
  const [settings, pricings, seoPages, latestArticles, menuPages] = await Promise.all([
    prisma.systemSetting.findFirst(),
    prisma.modulePricing.findMany(),
    prisma.page.findMany({
      where: {
        published: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } }
        ]
      },
      select: { title: true, slug: true, showInFooter: true },
      orderBy: { title: 'asc' }
    }),
    prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } }
        ]
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { title: true, slug: true, metaDescription: true, createdAt: true }
    }),
    prisma.page.findMany({
      where: {
        published: true,
        showInMenu: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } }
        ]
      },
      select: { title: true, slug: true },
      orderBy: { title: 'asc' }
    })
  ]);

  const footerPages = seoPages.filter(p => p.showInFooter);

  const getPrice = (id: string, defaultPrice: number) => {
    const found = pricings.find(p => p.id === id);
    return found ? found.price : defaultPrice;
  };

  const categories = [
    {
      title: "Dados Pessoais",
      icon: <UserCheck className="w-5 h-5 text-[#10b981]" />,
      items: [
        { name: "Dados básicos", price: getPrice('dados_basicos', 1.00) },
        { name: "Documentos (RG/PIS/NIS)", price: getPrice('documentos', 1.00) },
        { name: "E-mails", price: getPrice('emails', 0.50) },
        { name: "Telefones", price: getPrice('telefones', 0.50) },
        { name: "Endereços", price: getPrice('enderecos', 1.00) },
      ]
    },
    {
      title: "Pessoas Relacionadas",
      icon: <Users className="w-5 h-5 text-purple-600" />,
      items: [
        { name: "Parentes", price: getPrice('parentes', 1.00) },
        { name: "Vizinhos", price: getPrice('vizinhos', 1.00) },
        { name: "Sócios / Empresas", price: getPrice('socio_empresa', 1.50) },
      ]
    },
    {
      title: "Patrimônio e Renda",
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      items: [
        { name: "Poder Aquisitivo", price: getPrice('poder_aquisitivo', 1.50) },
        { name: "Dados Trabalhistas", price: getPrice('dados_trabalhistas', 1.00) },
        { name: "Seguro Social (INSS)", price: getPrice('seguro_social', 1.00) },
      ]
    },
    {
      title: "Veículos",
      icon: <Car className="w-5 h-5 text-amber-600" />,
      items: [
        { name: "Dados Básicos e Técnicos", price: getPrice('veiculo_basico', 1.00) },
        { name: "Situação e Documentação", price: getPrice('veiculo_documentacao', 1.00) },
        { name: "Dados do Proprietário", price: getPrice('veiculo_proprietario', 1.50) },
        { name: "Restrições e Histórico", price: getPrice('veiculo_restricoes', 2.00) },
      ]
    },
    {
      title: "Empresas (CNPJ)",
      icon: <Building2 className="w-5 h-5 text-emerald-600" />,
      items: [
        { name: "Dados Básicos e Natureza", price: getPrice('cnpj_basico', 1.00) },
        { name: "Contato e Localização", price: getPrice('cnpj_contato', 1.00) },
        { name: "Quadro Societário (QSA)", price: getPrice('cnpj_socios', 1.50) },
        { name: "Faturamento e Porte", price: getPrice('cnpj_faturamento', 2.00) },
      ]
    },
    {
      title: "Crédito e Histórico",
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      items: [
        { name: "Score de Crédito", price: getPrice('analise_credito', 2.00) },
        { name: "Processos Judiciais", price: getPrice('processos', 1.00) },
        { name: "Certidões Negativas", price: getPrice('certidoes', 1.00) },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#04130d] text-slate-800 dark:text-slate-100 antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-500">
      
      {/* ===================== NAVBAR ===================== */}
      <NavbarClient logoUrl={settings?.logoUrl} siteTitle={settings?.siteTitle} menuPages={menuPages} />

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 md:py-32 overflow-hidden border-b border-slate-200 dark:border-[#133829] bg-white dark:bg-[#04130d] transition-colors duration-500">
        {/* Glows de ambientação e Grid Tecnológico */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />
        <div className="absolute top-0 right-1/4 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-4 sm:left-10 w-[min(450px,80vw)] h-[min(450px,80vw)] bg-teal-500/10 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Badge Whitelist com Glow sutil */}
              <div className="badge-glow text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="tracking-widest">PLATAFORMA INTELIGENTE DE CONSULTAS</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] sm:leading-[1.08]">
                Consulte CPF, Telefone, CNPJ e Placa Online <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-green-400 bg-clip-text text-transparent">em uma única plataforma</span>
              </h1>
              
              {/* Box de Pesquisa Interativo */}
              <div className="pt-1 sm:pt-2">
                <HomeSearchBox />
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <Link
                  href="/cadastro"
                  className="btn-premium min-h-[48px] text-white py-3.5 sm:py-4 px-6 sm:px-8 text-sm sm:text-base group touch-manipulation active:scale-[0.98]"
                >
                  <span>Consultar Agora 🔎</span>
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="min-h-[48px] bg-white/80 dark:bg-[#081c14]/80 hover:bg-slate-100 dark:hover:bg-[#0d281e] border border-slate-200 dark:border-[#133829] text-slate-700 dark:text-emerald-300 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base backdrop-blur-md hover:shadow-md touch-manipulation active:scale-[0.98]"
                >
                  Entrar no Painel
                </Link>
              </div>

              {/* Descrições auxiliares da plataforma */}
              <div className="space-y-3 pt-2">
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                  Acesse módulos de dados cadastrais consolidados com máxima agilidade. Consulte CPF, telefone, CNPJ, nome e veículos de forma transparente, pagando estritamente pelos módulos consultados.
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Sem mensalidades ou assinaturas obrigatórias. Recarga automática via Pix com liberação imediata.
                </p>
              </div>

              {/* Trust badges */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-[#133829] flex flex-wrap gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Conformidade com a LGPD
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Retornos em Milissegundos
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Sem mensalidade fixa
                </span>
              </div>
            </div>

            {/* Visual Ilustrativo / Mockup do Relatório no Desktop */}
            <div className="lg:col-span-5 w-full hidden lg:block animate-in fade-in duration-1000 slide-in-from-right-12">
              <div className="relative">
                {/* Glow atrás do card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent rounded-3xl blur-2xl -z-10" />
                
                {/* Mockup Card Glassmorphism */}
                <div className="glass-card glass-card-hover rounded-3xl p-7 space-y-6 bg-white/90 dark:bg-[#081c14]/90 border border-slate-200 dark:border-[#133829]">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#133829]/70 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg shadow-inner">
                        🔎
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Relatório Consolidado</h4>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">ConsultasBrasil Engine v2.4</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold tracking-wider">
                      VERIFICADO
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: 'CPF / CNPJ', value: 'Situação REGULAR na RF' },
                      { label: 'Telefones Vinculados', value: '3 números ativos identificados' },
                      { label: 'Localização / Endereços', value: 'Histórico de logradouros mapeado' },
                      { label: 'Vínculos Parentais', value: 'Árvore genealógica de 1º grau' },
                      { label: 'Restrições & Score', value: 'Análise de restrições ativa' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50/80 dark:bg-[#04130d]/60 border border-slate-100 dark:border-[#133829]/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#133829]/70 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Tempo de resposta: ~0.8s
                    </span>
                    <span className="text-emerald-500/80 font-medium">Base cadastral unificada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ESCOLHA O TIPO DE CONSULTA ===================== */}
      <section id="escolha-consulta" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Módulos Específicos
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Escolha o tipo de consulta
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-normal">
              Acesse a página correspondente ao tipo de informação que deseja verificar. Cada consulta possui módulos específicos, valores individuais e transparência total de retornos.
            </p>
          </div>

          {/* Bento Grid Fluido: 1 col (mobile) -> 2 cols (phablet/tablet) -> 3 cols (desktop médio) -> 5 cols (desktop grande) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
            {[
              {
                title: "Consulta de CPF",
                icon: UserCheck,
                href: "/consulta-cpf",
                desc: "Informações cadastrais consolidadas: dados básicos, endereços, telefones e módulos auxiliares.",
                tag: "Mais Usado"
              },
              {
                title: "Consulta de Telefone",
                icon: Users,
                href: "/consulta-telefone",
                desc: "Pesquise números nacionais ativos, operadora e identifique vínculos cadastrais de titulares.",
                tag: "Rápido"
              },
              {
                title: "Consulta de Placa",
                icon: Car,
                href: "/consulta-placa",
                desc: "Verificação veicular por placa mercosul: marca, modelo, ano, restrições e dados técnicos.",
                tag: "Auto"
              },
              {
                title: "Consulta de CNPJ",
                icon: Building2,
                href: "/consulta-cnpj",
                desc: "Raio-X de pessoas jurídicas: quadro de sócios (QSA), capital social, porte e situação cadastral.",
                tag: "B2B"
              },
              {
                title: "Consulta por Nome",
                icon: Users,
                href: "/consulta-nome",
                desc: "Localize pessoas por nome e sobrenome com filtros de precisão por estado e faixa etária.",
                tag: "Busca"
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className="glass-card glass-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-left group bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
                >
                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Icon className="w-5 sm:w-6 h-5 sm:h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-5 sm:pt-6">
                    <Link
                      href={item.href}
                      className="w-full min-h-[44px] bg-slate-100 dark:bg-[#0d281e] hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 text-slate-800 dark:text-emerald-300 font-bold py-2.5 sm:py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm group-hover:border-emerald-500 touch-manipulation active:scale-[0.98]"
                    >
                      Acessar Consulta
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== METRICS STRIP ===================== */}
      <section className="py-10 sm:py-14 bg-white dark:bg-[#081c14] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#133829]">
            {[
              { value: "24/7", label: "Disponibilidade Online Contínua" },
              { value: "Pix Instantâneo", label: "Liberação Automática de Saldo" },
              { value: "Zero Mensalidade", label: "Pague Estritamente por Consulta" },
              { value: "+15 Módulos", label: "Resultados Categorizados e Claros" },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1 sm:space-y-1.5 pt-4 md:pt-0">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  {metric.value}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-white dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Fluxo Eficiente
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Como funcionam as consultas?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Desenvolvemos uma jornada minimalista em 3 etapas para você pesquisar, selecionar os blocos de dados necessários e acessar os resultados instantaneamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {[
              { 
                step: "01", 
                title: "Informe o Dado Base", 
                desc: "Selecione CPF, telefone, CNPJ, nome ou placa no painel unificado e insira o parâmetro desejado." 
              },
              { 
                step: "02", 
                title: "Personalize os Módulos", 
                desc: "Visualize os dados disponíveis antecipadamente e selecione somente os módulos que agregam valor à sua análise." 
              },
              { 
                step: "03", 
                title: "Acesse o Relatório", 
                desc: "Em milissegundos o motor valida e consolida o relatório detalhado pronto para visualização ou exportação." 
              },
            ].map((item, index) => (
              <div 
                key={index} 
                className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-5 text-center bg-slate-50 dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
              >
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-white dark:bg-[#0d281e] border border-slate-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto text-lg sm:text-xl font-black text-emerald-500 shadow-md">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TABELA DE PREÇOS E MÓDULOS (PREÇOS) ===================== */}
      <section id="precos" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] relative overflow-hidden transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Preços Transparentes & Pay-As-You-Go
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Pague apenas pelo que consultar
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-normal">
              Sem mensalidades forçadas, contratos de fidelidade ou taxas de cancelamento. Adicione saldo via Pix e pague frações a partir de R$ 0,50 por bloco.
            </p>
          </div>

          {/* Destaque de Benefícios da Tarifação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="glass-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">A Partir de R$ 0,50</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Módulos avulsos e fracionados por consulta</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Recarga Instantânea Pix</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Liberação automatizada em milissegundos</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cache Inteligente</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Buscas repetidas sem bitributação</p>
              </div>
            </div>
          </div>

          {/* Grid de Categorias e Módulos com Preços Dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="glass-card glass-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-left bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#133829] pb-3">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-slate-100 dark:bg-[#0d281e] shrink-0">
                        {cat.icon}
                      </span>
                      <span className="truncate">{cat.title}</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0d281e] px-2.5 py-1 rounded-full border border-slate-200 dark:border-[#133829] shrink-0">
                      {cat.items.length} módulos
                    </span>
                  </div>

                  <ul className="space-y-2.5">
                    {cat.items.map((item, i) => (
                      <li 
                        key={i} 
                        className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#04130d] border border-slate-200/60 dark:border-[#133829]/60"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 sm:pt-6 mt-4 border-t border-slate-100 dark:border-[#133829]">
                  <Link
                    href="/cadastro"
                    className="w-full min-h-[44px] bg-slate-100 dark:bg-[#0d281e] hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 text-slate-800 dark:text-emerald-300 font-bold py-2.5 sm:py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm group touch-manipulation active:scale-[0.98]"
                  >
                    Consultar este Módulo
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-14 text-center glass-card rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border border-emerald-500/30 shadow-2xl">
            <div className="text-center sm:text-left space-y-1">
              <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">Deseja experimentar a plataforma agora mesmo?</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal">Crie sua conta em 30 segundos e comece a consultar com total autonomia.</p>
            </div>
            <Link
              href="/cadastro"
              className="btn-premium min-h-[48px] text-white text-xs sm:text-sm font-bold py-3.5 px-6 sm:px-8 rounded-2xl shrink-0 active:scale-95 touch-manipulation flex items-center justify-center w-full sm:w-auto"
            >
              Criar Conta Gratuita 🚀
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== CONSULTAS DISPONÍVEIS (RECURSOS) ===================== */}
      <section id="recursos" className="py-16 sm:py-24 bg-white dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Inteligência de Dados
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Fontes de consultas disponíveis
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Explore o comportamento dinâmico e o formato técnico dos dados consolidados pelo motor ConsultasBrasil.
            </p>
          </div>

          {/* Abas e Mockups Interativos Client */}
          <HomeTabs />

          {/* Disclaimer de Mockups Fictícios para o Google Ads */}
          <p className="mt-8 text-slate-400 dark:text-slate-500 text-xs leading-relaxed max-w-2xl mx-auto font-medium">
            * Os dados exibidos nas abas de demonstração são conceituais e estruturados para ilustrar a arquitetura técnica da resposta. Consultas em tempo real requerem login no painel.
          </p>

          {/* Bloco de Links Fortes de SEO */}
          <div className="mt-10 sm:mt-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-4xl mx-auto font-medium">
              Acesse páginas dedicadas: {' '}
              <Link href="/consulta-cpf" className="text-emerald-500 hover:text-emerald-400 underline font-bold transition-colors inline-flex items-center min-h-[36px] py-1">
                consulta cpf
              </Link>
              ,{' '}
              <Link href="/consulta-telefone" className="text-emerald-500 hover:text-emerald-400 underline font-bold transition-colors inline-flex items-center min-h-[36px] py-1">
                consulta telefone
              </Link>
              ,{' '}
              <Link href="/consulta-placa" className="text-emerald-500 hover:text-emerald-400 underline font-bold transition-colors inline-flex items-center min-h-[36px] py-1">
                consulta placa
              </Link>
              ,{' '}
              <Link href="/consulta-nome" className="text-emerald-500 hover:text-emerald-400 underline font-bold transition-colors inline-flex items-center min-h-[36px] py-1">
                consulta nome
              </Link>
              {' e '}
              <Link href="/consulta-cnpj" className="text-emerald-500 hover:text-emerald-400 underline font-bold transition-colors inline-flex items-center min-h-[36px] py-1">
                consulta cnpj
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ===================== APLICAÇÕES B2B ===================== */}
      <section id="aplicacoes" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#081c14] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Aplicações Práticas
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Casos de uso corporativo
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Descubra como o ecossistema ConsultasBrasil auxilia empresas a mitigar riscos e otimizar processos de validação cadastral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Fingerprint,
                title: "Prevenção a Fraudes e Identidade",
                desc: "Valide dados cadastrais em tempo real e certifique-se da regularidade perante os órgãos oficiais com detecção de incongruências."
              },
              {
                icon: RefreshCw,
                title: "Higienização e Enriquecimento",
                desc: "Atualize carteiras corporativas obsoletas resgatando novos canais de contato, e-mails e histórico de endereços atualizados."
              },
              {
                icon: Scale,
                title: "Compliance e Risco (KYC)",
                desc: "Estruture checagens ágeis de fornecedores e parceiros verificando situação cadastral do CNPJ e quadro de sócios (QSA) em segundos."
              },
              {
                icon: Users2,
                title: "Localização de Clientes",
                desc: "Mapeie dados de contato e localização de clientes para operações de renegociação amigável e confirmação de cadastro."
              },
              {
                icon: ShieldCheck,
                title: "Validação Cadastral Integrada",
                desc: "Consolide em uma chamada dados que demandariam dezenas de pesquisas manuais morosas em múltiplas fontes públicas."
              },
              {
                icon: TrendingUp,
                title: "Análise de Renda e Faixa Salarial",
                desc: "Conheça o perfil socioeconômico aproximado com estimativas de poder aquisitivo e faixas salariais padronizadas."
              }
            ].map((app, index) => {
              const Icon = app.icon;
              return (
                <div 
                  key={index} 
                  className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 space-y-4 text-left bg-white dark:bg-[#04130d] border border-slate-200 dark:border-[#133829]"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{app.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">{app.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FAQ SECTION ===================== */}
      <section id="faq" className="py-16 sm:py-24 bg-white dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Dúvidas Frequentes
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Perguntas e respostas institucionais
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Tire dúvidas essenciais sobre uso ético, conformidade com a LGPD e tarifação por módulo.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-[#081c14] relative overflow-hidden transition-colors duration-500 border-b border-slate-200 dark:border-[#133829]">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,95vw)] h-[min(600px,95vw)] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] sm:leading-[1.1]">
            Comece a realizar suas consultas <br className="hidden md:block"/> de forma profissional
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal">
            Consultas imediatas, sem bitributação de buscas repetidas e com conformidade total às diretrizes de privacidade de dados.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/cadastro"
              className="btn-premium min-h-[48px] text-white py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-bold shadow-xl active:scale-95 touch-manipulation w-full sm:w-auto"
            >
              Criar Conta Gratuita 🚀
            </Link>
            <Link
              href="#faq"
              className="min-h-[48px] bg-white/80 dark:bg-[#04130d]/80 hover:bg-slate-100 dark:hover:bg-[#0d281e] border border-slate-200 dark:border-[#133829] text-slate-800 dark:text-emerald-300 font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl transition-all text-base sm:text-lg backdrop-blur-md touch-manipulation flex items-center justify-center w-full sm:w-auto"
            >
              Tirar Dúvidas
            </Link>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-semibold tracking-wider">
            • MODELO PAY-PER-USE • SEM TAXAS MENSAIS FIXAS • RECARGA INSTANTÂNEA VIA PIX •
          </p>
        </div>
      </section>

      {/* ===================== ÚLTIMAS DO BLOG ===================== */}
      {latestArticles.length > 0 && (
        <section className="py-14 sm:py-20 bg-white dark:bg-[#04130d] border-t border-slate-200 dark:border-[#133829] transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Central de Dicas & Conteúdo
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm md:text-base max-w-xl font-normal">
                  Acompanhe publicações técnicas, guias de validação cadastral e atualizações regulatórias.
                </p>
              </div>
              <Link 
                href="/blog" 
                className="text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 group whitespace-nowrap min-h-[44px] py-2 touch-manipulation"
              >
                Ver todos os artigos
                <span className="group-hover:translate-x-1.5 transition-transform">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {latestArticles.map((article) => (
                <div 
                  key={article.id} 
                  className="glass-card glass-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between bg-slate-50 dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest block">
                      {new Date(article.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-2 hover:text-emerald-400 transition-colors">
                      <Link href={`/blog/${article.slug}`} className="block">
                        {article.title}
                      </Link>
                    </h3>
                    {article.metaDescription && (
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
                        {article.metaDescription}
                      </p>
                    )}
                  </div>
                  <Link 
                    href={`/blog/${article.slug}`}
                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mt-5 sm:mt-6 min-h-[44px] py-2 touch-manipulation"
                  >
                    Ler Artigo Completo →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== LINKS RÁPIDOS DE CONSULTA (SEO) ===================== */}
      {footerPages.length > 0 && (
        <section className="py-10 sm:py-12 bg-white dark:bg-[#04130d] border-t border-slate-200 dark:border-[#133829] transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-emerald-400 mb-4">
              Nossas Consultas Disponíveis
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {footerPages.map((page) => (
                <Link 
                  key={page.slug} 
                  href={`/${page.slug}`} 
                  className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors hover:underline inline-flex items-center min-h-[36px] py-1 touch-manipulation"
                >
                  {page.title.split(' - ')[0]}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== SCHEMAS JSON-LD ===================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ConsultasBrasil",
            "url": "https://consultasbrasil.net",
            "logo": "https://consultasbrasil.net/logo.png"
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ConsultasBrasil",
            "url": "https://consultasbrasil.net",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://consultasbrasil.net/cadastro?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Quais tipos de consulta estão disponíveis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A plataforma possui páginas e módulos relacionados à consulta de CPF, telefone, CNPJ, nome e placa de veículo. A disponibilidade de informações pode variar conforme o tipo de pesquisa e o módulo selecionado."
                }
              },
              {
                "@type": "Question",
                "name": "Preciso pagar mensalidade para usar o ConsultasBrasil?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não há mensalidade obrigatória. O usuário pode adicionar saldo ao painel e pagar somente pelas consultas e módulos utilizados."
                }
              },
              {
                "@type": "Question",
                "name": "Como o pagamento é realizado?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "O saldo pode ser adicionado por meio de Pix. Após a confirmação do pagamento, o valor é disponibilizado no painel conforme as regras da plataforma."
                }
              },
              {
                "@type": "Question",
                "name": "Os resultados são sempre completos?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não. A quantidade e a precisão das informações podem variar conforme os dados informados, a disponibilidade das fontes e a atualização dos registros."
                }
              },
              {
                "@type": "Question",
                "name": "Posso consultar qualquer pessoa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "As consultas devem ser realizadas somente para finalidades legítimas e de acordo com a legislação aplicável. O usuário é responsável pela pesquisa realizada e pelo uso das informações obtidas."
                }
              },
              {
                "@type": "Question",
                "name": "É necessário informar a senha da pessoa pesquisada?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não. A plataforma não solicita senhas de redes sociais, contas bancárias, e-mails ou outros serviços pertencentes à pessoa pesquisada."
                }
              },
              {
                "@type": "Question",
                "name": "Como escolho a consulta correta?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Acesse as páginas de consulta de CPF, telefone, CNPJ, nome ou placa e confira a explicação sobre os dados e módulos disponíveis em cada categoria."
                }
              },
              {
                "@type": "Question",
                "name": "Como entro em contato com o suporte?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "O atendimento deve ser solicitado pelos canais oficiais apresentados na página de contato ou dentro do painel do usuário."
                }
              }
            ]
          })
        }}
      />

      {/* ===================== FOOTER ===================== */}
      <Footer logoUrl={settings?.logoUrl} />
    </div>
  );
}

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
  Users,
  Database,
  Layers,
  Phone
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const title = "Consulta CPF, CNPJ, Telefone e Placa Online | Consultas Brasil";
  const description = "Faça consultas online por CPF, CNPJ, telefone, placa e nome. Escolha o tipo de pesquisa, confira os módulos disponíveis e pague somente pelas consultas utilizadas.";

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
      siteName: "Consultas Brasil",
      images: [
        {
          url: "https://consultasbrasil.net/logo.png",
          width: 1200,
          height: 630,
          alt: "Consultas Brasil - Consulta CPF, CNPJ, Telefone e Placa Online"
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

      {/* Conteúdo Principal Semântico */}
      <main>
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
                Consulta CPF, CNPJ, Telefone, Placa e Nome Online
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
                  <span>Fazer uma consulta 🔎</span>
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="min-h-[48px] bg-white/80 dark:bg-[#081c14]/80 hover:bg-slate-100 dark:hover:bg-[#0d281e] border border-slate-200 dark:border-[#133829] text-slate-700 dark:text-emerald-300 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm sm:text-base backdrop-blur-md hover:shadow-md touch-manipulation active:scale-[0.98]"
                >
                  Acessar painel
                </Link>
              </div>

              {/* Descrições auxiliares da plataforma */}
              <div className="space-y-3 pt-2">
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                  Faça consultas online por CPF, CNPJ, telefone, placa ou nome em uma única plataforma. Escolha a modalidade, consulte os módulos disponíveis e utilize apenas as informações necessárias para sua pesquisa.
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
              Modalidades Disponíveis
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Escolha o tipo de consulta online
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-normal">
              Selecione a informação que você possui para iniciar uma pesquisa. O Consultas Brasil reúne consultas por CPF, CNPJ, telefone, placa e nome em um único painel.
            </p>
          </div>

          {/* Bento Grid Fluido: 1 col (mobile) -> 2 cols (phablet/tablet) -> 3 cols (desktop médio) -> 5 cols (desktop grande) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
            {[
              {
                title: "Consulta CPF",
                icon: UserCheck,
                href: "/cadastro?type=cpf",
                desc: "Consulte informações cadastrais e outras categorias de dados disponíveis relacionadas ao CPF informado.",
                cta: "Consultar CPF"
              },
              {
                title: "Consulta CNPJ",
                icon: Building2,
                href: "/cadastro?type=cnpj",
                desc: "Pesquise informações cadastrais e empresariais disponíveis utilizando o CNPJ.",
                cta: "Consultar CNPJ"
              },
              {
                title: "Consulta Telefone",
                icon: Users,
                href: "/cadastro?type=telefone",
                desc: "Consulte informações disponíveis relacionadas a um número de telefone nacional.",
                cta: "Consultar telefone"
              },
              {
                title: "Consulta Placa",
                icon: Car,
                href: "/cadastro?type=placa",
                desc: "Pesquise informações disponíveis sobre carros e motos utilizando a placa do veículo.",
                cta: "Consultar placa"
              },
              {
                title: "Consulta por Nome",
                icon: Users,
                href: "/cadastro?type=nome",
                desc: "Pesquise possíveis registros utilizando nome e sobrenome.",
                cta: "Consultar nome"
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
                      {item.cta}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FAIXA DE BENEFÍCIOS ===================== */}
      <section className="py-10 sm:py-14 bg-white dark:bg-[#081c14] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#133829]">
            {[
              { 
                title: "Disponível 24 horas", 
                desc: "Plataforma online disponível para consultas quando necessário." 
              },
              { 
                title: "Pagamento via Pix", 
                desc: "Adicione saldo e utilize nos módulos escolhidos." 
              },
              { 
                title: "Sem mensalidade obrigatória", 
                desc: "Pague somente pelas consultas e módulos utilizados." 
              },
              { 
                title: "Diversas modalidades", 
                desc: "CPF, CNPJ, telefone, placa, nome e outras categorias disponíveis." 
              },
            ].map((beneficio, bIdx) => (
              <div key={bIdx} className="space-y-1 sm:space-y-2 pt-4 sm:pt-0 px-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {beneficio.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal leading-relaxed">
                  {beneficio.desc}
                </p>
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
              Como fazer uma consulta online?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {[
              { 
                step: "01", 
                title: "Informe o dado", 
                desc: "Escolha CPF, CNPJ, telefone, placa ou nome e informe os dados solicitados." 
              },
              { 
                step: "02", 
                title: "Escolha os módulos", 
                desc: "Confira as categorias de informação e os valores disponíveis para a modalidade escolhida." 
              },
              { 
                step: "03", 
                title: "Consulte o resultado", 
                desc: "Após a confirmação, os registros encontrados são organizados e apresentados dentro da plataforma." 
              },
            ].map((item, index) => (
              <div 
                key={index} 
                className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-5 text-center bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
              >
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-slate-50 dark:bg-[#0d281e] border border-slate-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto text-lg sm:text-xl font-black text-emerald-500 shadow-sm">
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
              Pague apenas pelo que consultar
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Preços das consultas online
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-normal">
              Utilize o Consultas Brasil sem mensalidade obrigatória. Adicione saldo ao painel e pague somente pelos módulos escolhidos. Os valores variam conforme a modalidade e as informações selecionadas.
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

          {/* Aviso sobre os valores após a tabela de preços */}
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Confira os valores disponíveis antes de confirmar cada consulta. O saldo somente é utilizado nos módulos escolhidos pelo usuário.
            </p>
          </div>

          <div className="mt-8 sm:mt-12 text-center glass-card rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border border-emerald-500/30 shadow-2xl">
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

      {/* ===================== FONTES DAS CONSULTAS ===================== */}
      <section id="fontes" className="py-16 sm:py-24 bg-white dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Origem e Tratamento de Dados
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Como funcionam as fontes das consultas?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal leading-relaxed">
              As consultas podem utilizar diferentes fontes e provedores conforme a modalidade e o módulo escolhido. A disponibilidade, quantidade e atualização das informações pode variar de acordo com o dado pesquisado.
            </p>
          </div>

          {/* 3 Blocos de Fontes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 text-left bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Fontes públicas
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                Informações públicas utilizadas quando aplicáveis à modalidade selecionada.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 text-left bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Provedores integrados
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                Informações fornecidas pelos provedores utilizados nos diferentes módulos.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 text-left bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Organização dos resultados
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">
                Os registros encontrados são organizados e apresentados dentro do painel.
              </p>
            </div>
          </div>

          {/* Abas e Mockups Interativos Client */}
          <HomeTabs />

          {/* Disclaimer de Mockups e Isenção de Órgão Público */}
          <div className="mt-8 space-y-2 max-w-3xl mx-auto">
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-semibold">
              O Consultas Brasil é uma plataforma independente e não representa a Receita Federal, Detran, Senatran ou qualquer outro órgão público.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs leading-relaxed font-medium">
              * Os dados exibidos nas abas de demonstração são conceituais e estruturados para ilustrar a arquitetura técnica da resposta. Consultas em tempo real requerem login no painel.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== NOVA SEÇÃO EDITORIAL (SEO CORRIDO) ===================== */}
      <section className="py-16 sm:py-24 bg-slate-50/60 dark:bg-[#061810] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 space-y-3">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Guia de Informações
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Consultas online no Consultas Brasil
            </h2>
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            <p>
              O Consultas Brasil é uma plataforma voltada para a realização de consultas online a partir de diferentes dados de entrada. Em um único ambiente, o usuário pode pesquisar informações cadastrais, empresariais, veiculares e de contato de acordo com a disponibilidade de cada modalidade.
            </p>
            <p>
              A consulta por CPF é uma das opções mais utilizadas para verificação de dados cadastrais e conferência de registros associados ao documento pesquisado. Já a consulta por CNPJ permite analisar informações de empresas, dados societários e detalhes de registro empresarial.
            </p>
            <p>
              Para pesquisas de comunicação, a consulta de telefone auxilia na localização e confirmação de números válidos, enquanto a consulta por nome pode ser utilizada quando não se dispõe de outros identificadores no início da busca.
            </p>
            <p>
              No segmento veicular, a consulta por placa apresenta dados relacionados a automóveis, motocicletas e outros veículos registrados, ajudando na checagem de características e histórico disponível.
            </p>
            <p>
              Com a separação em módulos, o usuário tem a flexibilidade de pagar apenas pelo que realmente precisa consultar, sem a obrigação de planos caros ou mensalidades fixas.
            </p>
            <p>
              O sistema funciona totalmente online, permitindo que a pesquisa seja realizada pelo celular, tablet ou computador a qualquer momento.
            </p>
            <p>
              A segurança e a praticidade são prioridades: o acesso ao painel é protegido e as recargas de saldo ocorrem via Pix com compensação imediata.
            </p>
            <p>
              Dessa forma, o Consultas Brasil se posiciona como uma solução completa, acessível e transparente para quem busca consultar dados online de forma rápida e confiável.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== CASOS DE USO ===================== */}
      <section id="casos-de-uso" className="py-16 sm:py-24 bg-white dark:bg-[#04130d] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Aplicações Práticas
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Quando uma consulta online pode ser útil?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Confira situações em que a checagem rápida de informações auxilia profissionais, empresas e indivíduos no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Conferência cadastral",
                desc: "Verificação de dados antes de negociações ou cadastros."
              },
              {
                icon: Building2,
                title: "Verificação de empresas",
                desc: "Checagem de informações de CNPJ para relações comerciais."
              },
              {
                icon: Phone,
                title: "Pesquisa de telefone",
                desc: "Confirmação de contato para atendimento ou cobrança amigável."
              },
              {
                icon: Car,
                title: "Consulta veicular",
                desc: "Pesquisa de dados pela placa antes da compra de veículos."
              },
              {
                icon: RefreshCw,
                title: "Atualização de cadastros",
                desc: "Correção de dados desatualizados em bancos de registros."
              },
              {
                icon: Search,
                title: "Pesquisa complementar",
                desc: "Busca por nome quando faltam outros identificadores."
              }
            ].map((app, index) => {
              const Icon = app.icon;
              return (
                <div 
                  key={index} 
                  className="glass-card glass-card-hover rounded-3xl p-6 sm:p-8 space-y-4 text-left bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
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
      <section id="faq" className="py-16 sm:py-24 bg-slate-50/50 dark:bg-[#061810] border-b border-slate-200 dark:border-[#133829] transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <span className="badge-glow text-emerald-600 dark:text-emerald-400">
              Dúvidas Frequentes
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Perguntas frequentes sobre consultas online
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base font-normal">
              Esclareça as dúvidas mais comuns sobre modalidades, saldos, fontes e funcionamento do sistema.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="py-20 sm:py-28 bg-white dark:bg-[#04130d] relative overflow-hidden transition-colors duration-500 border-b border-slate-200 dark:border-[#133829]">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,95vw)] h-[min(600px,95vw)] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] sm:leading-[1.1]">
            Faça sua consulta online no Consultas Brasil
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal">
            Escolha o tipo de pesquisa, confira os módulos disponíveis e utilize somente as categorias de informação necessárias.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/cadastro"
              className="btn-premium min-h-[48px] text-white py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl text-base sm:text-lg font-bold shadow-xl active:scale-95 touch-manipulation w-full sm:w-auto"
            >
              Fazer consulta 🚀
            </Link>
            <Link
              href="/login"
              className="min-h-[48px] bg-white/80 dark:bg-[#081c14]/80 hover:bg-slate-100 dark:hover:bg-[#0d281e] border border-slate-200 dark:border-[#133829] text-slate-800 dark:text-emerald-300 font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl transition-all text-base sm:text-lg backdrop-blur-md touch-manipulation flex items-center justify-center w-full sm:w-auto"
            >
              Acessar painel
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
                  className="glass-card glass-card-hover rounded-3xl p-5 sm:p-6 flex flex-col justify-between bg-white dark:bg-[#081c14] border border-slate-200 dark:border-[#133829]"
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
      </main>

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
                "name": "O que é o Consultas Brasil?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "O Consultas Brasil é uma plataforma de consultas online criada para reunir diferentes modalidades de pesquisa cadastral em um único ambiente. O usuário pode iniciar pesquisas utilizando CPF, CNPJ, telefone, placa ou nome conforme a informação disponível."
                }
              },
              {
                "@type": "Question",
                "name": "Quais tipos de consulta estão disponíveis?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Estão disponíveis consultas por CPF, CNPJ, telefone, placa de veículos e pesquisa por nome. Cada modalidade conta com módulos organizados por categorias, permitindo selecionar somente os dados que você precisa verificar."
                }
              },
              {
                "@type": "Question",
                "name": "Como funciona uma consulta online?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Você escolhe o tipo de pesquisa, digita o dado disponível e seleciona os módulos desejados. O sistema processa os parâmetros em tempo real, integrando bases oficiais e provedores parceiros para estruturar o relatório no painel."
                }
              },
              {
                "@type": "Question",
                "name": "Preciso pagar mensalidade?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não. O Consultas Brasil opera no modelo pay-per-use, sem mensalidade obrigatória ou planos de fidelidade. Você adiciona saldo via Pix e utiliza estritamente nas consultas e módulos que escolher."
                }
              },
              {
                "@type": "Question",
                "name": "Todas as consultas sempre encontram informações?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não. A quantidade de dados encontrados depende da existência de registros nos provedores e da informação pesquisada. Se nenhum dado for localizado na base, o saldo não é consumido indevidamente."
                }
              },
              {
                "@type": "Question",
                "name": "Os dados estão sempre atualizados?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A atualização e a disponibilidade variam de acordo com a fonte pública ou o provedor consultado. Trabalhamos com integrações diretas para buscar sempre a versão cadastral mais recente disponível."
                }
              },
              {
                "@type": "Question",
                "name": "O Consultas Brasil é um serviço do governo?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não. O Consultas Brasil é uma plataforma privada e independente. Não representamos nem temos vínculo oficial com a Receita Federal, Detran, Senatran ou qualquer órgão público."
                }
              },
              {
                "@type": "Question",
                "name": "Como devo utilizar as informações encontradas?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "As informações obtidas devem ser utilizadas de maneira ética, responsável e estritamente em conformidade com a legislação aplicável, incluindo as diretrizes da Lei Geral de Proteção de Dados (LGPD)."
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

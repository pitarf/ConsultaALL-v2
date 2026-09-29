import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface FooterProps {
  logoUrl?: string | null;
}

/**
 * Componente de Rodapé (Footer) unificado e responsivo para o ConsultasBrasil.
 * Exibe logo, links de consultas, informações da empresa, políticas legais e selo de status de sistemas.
 */
export default async function Footer({ logoUrl }: FooterProps) {
  // Busca dinamicamente no banco as páginas que devem aparecer no rodapé
  const dbPages = await prisma.page.findMany({
    where: { 
      published: true, 
      showInFooter: true,
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } }
      ]
    },
    select: { title: true, slug: true },
    orderBy: { title: 'asc' }
  });

  const legalKeywords = ['termo', 'política', 'privacidade', 'cookies', 'proteção', 'lgpd', 'legal', 'reembolso'];
  const empresaPages: { label: string, href: string }[] = [];
  const legalPages: { label: string, href: string }[] = [];

  for (const p of dbPages) {
    const isLegal = legalKeywords.some(kw => p.title.toLowerCase().includes(kw));
    if (isLegal) {
      legalPages.push({ label: p.title, href: `/${p.slug}` });
    } else {
      empresaPages.push({ label: p.title, href: `/${p.slug}` });
    }
  }

  // Links estáticos padrão do sistema
  const footerLinks = {
    consultas: [
      { label: 'Consulta CPF', href: '/consulta-cpf' },
      { label: 'Consulta Telefone', href: '/consulta-telefone' },
      { label: 'Consulta Placa', href: '/consulta-placa' },
      { label: 'Consulta CNPJ', href: '/consulta-cnpj' },
      { label: 'Consulta por Nome', href: '/consulta-nome' },
    ],
    empresa: [
      ...empresaPages,
      { label: 'Blog', href: '/blog' }
    ],
    legal: legalPages
  };

  return (
    <footer className="bg-slate-50 dark:bg-[#080b11] border-t border-slate-200 dark:border-white/5 py-12 sm:py-16 text-slate-500 dark:text-slate-400 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid de Links e Logo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-10 border-b border-slate-200 dark:border-white/5">
          
          {/* Coluna da Marca */}
          <div className="col-span-1 sm:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 touch-manipulation min-h-[44px]">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo do ConsultasBrasil" 
                  className="h-8 w-auto object-contain" 
                />
              ) : (
                <img 
                  src="/logo.png" 
                  alt="Logo do ConsultasBrasil" 
                  className="h-8 w-auto object-contain" 
                />
              )}
              <span className="text-lg font-bold text-[#243b56] dark:text-white tracking-tight">
                Consultas<span className="text-[#10b981]">Brasil</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed font-normal">
              Plataforma profissional de consultas cadastrais e inteligência de dados.
            </p>
          </div>

          {/* Spacer no Desktop */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Coluna Consultas */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-xs font-bold text-[#243b56] dark:text-white tracking-wider uppercase">
              Consultas
            </h4>
            <ul className="space-y-1.5 text-sm">
              {footerLinks.consultas.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="inline-flex items-center min-h-[44px] py-1 text-slate-600 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-emerald-400 transition-colors touch-manipulation"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna Empresa */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-xs font-bold text-[#243b56] dark:text-white tracking-wider uppercase">
              Empresa
            </h4>
            <ul className="space-y-1.5 text-sm">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="inline-flex items-center min-h-[44px] py-1 text-slate-600 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-emerald-400 transition-colors touch-manipulation"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna Legal */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-xs font-bold text-[#243b56] dark:text-white tracking-wider uppercase">
              Legal
            </h4>
            <ul className="space-y-1.5 text-sm">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="inline-flex items-center min-h-[44px] py-1 text-slate-600 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-emerald-400 transition-colors touch-manipulation"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Linha Inferior com Direitos e Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-slate-400 dark:text-slate-500">
          <p className="text-center sm:text-left">© 2026 ConsultasBrasil. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block animate-pulse"></span>
            <span>Todos os sistemas operacionais</span>
          </div>
        </div>

        {/* Declaração de conformidade de Whitelist (LGPD/B2B obrigatória) */}
        <div className="pt-8 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-600 max-w-4xl mx-auto leading-relaxed border-t border-slate-100 dark:border-white/5 mt-6 space-y-2">
          <p>
            A ConsultasBrasil é uma plataforma tecnológica de enriquecimento cadastral desenvolvida estritamente para uso corporativo (B2B). Nossos relatórios são estruturados a partir do processamento automatizado de bases públicas oficiais e provedores regulamentados sob a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD).
          </p>
          <p>
            Garantimos o livre exercício dos direitos dos titulares de dados. Caso deseje solicitar o bloqueio ou a restrição da visualização do seu cadastro em nossa ferramenta de busca, utilize o formulário de Opt-out no nosso canal oficial de Proteção de Dados acima.
          </p>
        </div>

      </div>
    </footer>
  );
}

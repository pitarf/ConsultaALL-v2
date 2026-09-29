import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import NavbarClient from '@/components/NavbarClient';
import Footer from '@/components/Footer';
import { Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.systemSetting.findFirst();
  const title = `Blog & Artigos - ${settings?.siteTitle || 'ConsultasBrasil'}`;
  const description = 'Leia notícias, tutoriais, novidades sobre enriquecimento de dados, proteção de dados (LGPD) e background check.';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consultasbrasil.net';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/blog`,
      type: 'website',
    },
  };
}

export default async function BlogFeedPage() {
  const [settings, articles, categories, menuPages] = await Promise.all([
    prisma.systemSetting.findFirst(),
    prisma.article.findMany({
      where: { 
        published: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-x-hidden">
      {/* ===================== NAVBAR ===================== */}
      <NavbarClient logoUrl={settings?.logoUrl} siteTitle={settings?.siteTitle} menuPages={menuPages} />

      {/* ===================== HEADER DO BLOG ===================== */}
      <section className="relative py-16 md:py-24 bg-white overflow-hidden border-b border-slate-200">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-50 rounded-full blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/50 text-[#2872fa] text-xs font-bold uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" />
            Nosso Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#243b56] tracking-tight">
            Central de Inteligência cadastral
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Tutoriais, artigos técnicos e novidades sobre conformidade cadastral, análise de dados corporativos e prevenção de fraudes.
          </p>
        </div>
      </section>

      {/* ===================== CONTEÚDO E FILTROS ===================== */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Nenhum artigo publicado</h2>
            <p className="text-slate-500 text-sm">Fique atento! Novidades serão publicadas muito em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const formattedDate = new Date(article.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });

              return (
                <article 
                  key={article.id} 
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col group"
                >
                  {/* Imagem do artigo */}
                  <Link href={`/blog/${article.slug}`} className="block overflow-hidden relative aspect-video bg-slate-100">
                    {article.image ? (
                      <img 
                        src={article.image} 
                        alt={article.imageAlt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Search className="w-10 h-10 stroke-[1.5]" />
                      </div>
                    )}
                    {article.category && (
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-blue-500/10">
                        {article.category.name}
                      </span>
                    )}
                  </Link>

                  {/* Conteúdo do artigo */}
                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {article.author}
                        </span>
                      </div>

                      {/* Título do artigo */}
                      <h3 className="text-xl font-bold text-[#243b56] group-hover:text-blue-600 transition-colors leading-snug">
                        <Link href={`/blog/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h3>

                      {/* Descrição resumida */}
                      {article.metaDescription && (
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                          {article.metaDescription}
                        </p>
                      )}
                    </div>

                    {/* Botão de Ler Mais */}
                    <div className="pt-4 border-t border-slate-100">
                      <Link 
                        href={`/blog/${article.slug}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
                      >
                        Ler Artigo Completo
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ===================== FOOTER ===================== */}
      <Footer logoUrl={settings?.logoUrl} />
    </div>
  );
}

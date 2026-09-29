import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import NavbarClient from '@/components/NavbarClient';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Tag, Search, ArrowRight, ChevronRight, Home } from 'lucide-react';
import { SeoPageContent } from '@/components/SeoPageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

// Helper para verificar se o artigo está em rascunho ou agendado para o futuro
function isArticleDraft(article: any) {
  if (!article) return true;
  if (!article.published) return true;
  if (article.publishedAt && new Date(article.publishedAt) > new Date()) return true;
  return false;
}

// 1. METADADOS DINÂMICOS DO ARTIGO (OG + Twitter Cards)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Verifica redirecionamento
  const redirect = await prisma.redirect.findUnique({
    where: { oldSlug: slug, type: 'ARTICLE' }
  });
  if (redirect) return {};

  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || isArticleDraft(article)) {
    return {
      title: 'Artigo não encontrado',
      robots: 'noindex, nofollow',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consultasbrasil.net';
  const canonicalUrl = article.canonical || `${baseUrl}/blog/${article.slug}`;

  let extraOg = {};
  if (article.openGraph) {
    try {
      extraOg = JSON.parse(article.openGraph);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: article.robotsIndex,
      follow: true, // Garante que robôs sigam links internos mesmo em noindex (noindex, follow)
    },
    openGraph: {
      title: article.title,
      description: article.metaDescription || undefined,
      url: `${baseUrl}/blog/${article.slug}`,
      images: article.image ? [{ url: article.image, alt: article.imageAlt || article.title }] : undefined,
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.author],
      ...extraOg,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription || undefined,
      images: article.image ? [article.image] : undefined,
    }
  };
}

// 2. COMPONENTE RENDERIZADOR DO ARTIGO COMPLETO
export default async function BlogArticleDetailPage({ params }: Props) {
  const { slug } = await params;

  // Verifica se o slug foi redirecionado
  const redirectEntry = await prisma.redirect.findUnique({
    where: { oldSlug: slug, type: 'ARTICLE' },
  });

  if (redirectEntry) {
    permanentRedirect(`/blog/${redirectEntry.newSlug}`);
  }

  // Busca o artigo e as configurações em paralelo
  const [article, settings, menuPages] = await Promise.all([
    prisma.article.findUnique({
      where: { slug },
      include: { category: true }
    }),
    prisma.systemSetting.findFirst(),
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

  if (!article || isArticleDraft(article)) {
    notFound();
  }

  // Busca artigos relacionados/recomendados (mesma categoria, limit 3)
  const relatedArticles = await prisma.article.findMany({
    where: {
      published: true,
      categoryId: article.categoryId,
      id: { not: article.id },
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } }
      ]
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consultasbrasil.net';
  const logoUrl = settings?.logoUrl || `${baseUrl}/logo.png`;

  // Schemas Automáticos (BlogPosting e BreadcrumbList)
  const schemas: any[] = [];

  // BreadcrumbList Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${baseUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `${baseUrl}/blog/${article.slug}`
      }
    ]
  });

  // BlogPosting Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${article.slug}`
    },
    "headline": article.title,
    "description": article.metaDescription || article.title,
    "image": article.image || logoUrl,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": settings?.siteTitle?.split(' - ')[0] || "ConsultasBrasil",
      "logo": {
        "@type": "ImageObject",
        "url": logoUrl
      }
    },
    "datePublished": article.createdAt.toISOString(),
    "dateModified": article.updatedAt.toISOString()
  });

  const formattedDate = new Date(article.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedUpdateDate = new Date(article.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Extrai styles para renderização no SSR (evitando flashes e garantindo CSS inicial)
  const styles: string[] = [];
  article.content.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    if (css.trim()) styles.push(css.trim());
    return '';
  });

  // Limpa tags estruturais para não renderizá-las literalmente
  const cleanHtml = article.content
    .replace(/<!DOCTYPE html>/gi, '')
    .replace(/<\/?(html|head|body)\b[^>]*>/gi, '')
    .trim();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-x-hidden">
      {/* ===================== NAVBAR ===================== */}
      <NavbarClient logoUrl={settings?.logoUrl} siteTitle={settings?.siteTitle} menuPages={menuPages} />

      {/* ===================== ARTICLE CONTAINER ===================== */}
      <main className="flex-1 py-10 bg-white">
        {/* Estilos customizados para formatar o artigo do blog e resolver espaçamentos colados */}
        <style dangerouslySetInnerHTML={{ __html: `
          .article-content {
            font-size: 17px;
            line-height: 1.75;
            color: #334155;
          }

          .article-content p {
            margin: 0 0 22px;
          }

          .article-content h2 {
            margin-top: 52px;
            margin-bottom: 18px;
            font-size: 30px;
            line-height: 1.25;
            font-weight: 750;
            color: #1f3b5b;
          }

          .article-content h3 {
            margin-top: 34px;
            margin-bottom: 14px;
            font-size: 22px;
            line-height: 1.35;
            font-weight: 700;
            color: #1f3b5b;
          }

          .article-content ul,
          .article-content ol {
            margin: 20px 0 28px;
            padding-left: 30px;
          }

          .article-content ul {
            list-style-type: disc;
          }

          .article-content ol {
            list-style-type: decimal;
          }

          .article-content li {
            margin-bottom: 10px;
            line-height: 1.65;
          }

          .article-content nav.article-index {
            margin: 34px 0 44px;
            padding: 24px 28px;
            border: 1px solid #dbe7f3;
            border-radius: 16px;
            background: #f7faff;
          }

          .article-content nav.article-index p {
            margin-bottom: 12px;
          }

          .article-content nav.article-index ul {
            margin: 0;
          }

          .article-content .article-cta {
            margin: 42px 0;
            padding: 28px;
            border: 1px solid #cfe0ff;
            border-radius: 18px;
            background: #f4f8ff;
          }

          .article-content .article-cta p {
            margin-bottom: 14px;
          }

          .article-content .article-cta p:last-child {
            margin-bottom: 0;
          }

          .article-content .cta-title {
            font-size: 22px;
            line-height: 1.35;
            color: #1f3b5b;
            font-weight: 700;
          }

          .article-content a {
            color: #1463df;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .article-content blockquote {
            margin: 32px 0;
            padding: 20px 24px;
            border-left: 4px solid #2878f0;
            background: #f8fafc;
            border-radius: 0 12px 12px 0;
          }

          .article-content hr {
            margin: 48px 0;
            border: 0;
            border-top: 1px solid #e2e8f0;
          }

          @media (max-width: 768px) {
            .article-content {
              font-size: 16px;
              line-height: 1.72;
            }

            .article-content p {
              margin-bottom: 20px;
            }

            .article-content h2 {
              margin-top: 42px;
              margin-bottom: 16px;
              font-size: 25px;
            }

            .article-content h3 {
              margin-top: 30px;
              margin-bottom: 12px;
              font-size: 20px;
            }

            .article-content nav.article-index,
            .article-content .article-cta {
              margin: 32px 0;
              padding: 20px;
            }
          }
        ` }} />
        <article className="max-w-[820px] mx-auto px-6">
          
          {/* Navegação Breadcrumb Física (HTML) */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8 border-b border-slate-100 pb-4">
            <Link href="/" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/blog" className="hover:text-blue-600 transition-colors">
              Blog
            </Link>
            {article.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-500 font-semibold">{article.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-600 truncate max-w-[200px]">
              {article.title}
            </span>
          </nav>

          {/* Link voltar */}
          <div className="mb-6">
            <Link 
              href="/blog" 
              className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors w-fit group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para o Blog
            </Link>
          </div>

          {/* Header do Artigo */}
          <header className="mb-10 space-y-4">
            {article.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/50 text-[#2872fa] text-[10px] font-extrabold uppercase tracking-wide">
                <Tag className="w-3 h-3" />
                {article.category.name}
              </span>
            )}

            {article.h1 ? (
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#243b56] tracking-tight leading-tight">
                {article.h1}
              </h1>
            ) : (
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#243b56] tracking-tight leading-tight">
                {article.title}
              </h1>
            )}

            {article.excerpt && (
              <p className="text-slate-500 text-lg leading-relaxed pt-2">
                {article.excerpt}
              </p>
            )}

            {/* Autor e Datas */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                  {article.author.slice(0, 2)}
                </div>
                Por <strong>{article.author}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                Publicado em {formattedDate}
              </span>
              {article.createdAt.getTime() !== article.updatedAt.getTime() && (
                <span className="text-xs text-slate-400 italic">
                  (Atualizado em {formattedUpdateDate})
                </span>
              )}
            </div>
          </header>

          {/* Imagem do Artigo */}
          {article.image && (
            <div className="mb-12 rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
              <img 
                src={article.image} 
                alt={article.imageAlt || article.title}
                className="w-full h-auto object-cover max-h-[480px]"
              />
            </div>
          )}

          {/* Estilos renderizados no SSR extraídos do artigo (para evitar flashes) */}
          {styles.map((css, idx) => (
            <style key={`custom-css-${idx}`} dangerouslySetInnerHTML={{ __html: css }} />
          ))}

          {/* Conteúdo HTML Rico (Suporta scripts do widget + Estilização padrão do Blog) */}
          <div className="article-content">
            <SeoPageContent html={cleanHtml} isAdminCreated={true} />
          </div>

          {/* Schemas Auto-gerados */}
          {schemas.map((schema, index) => (
            <script
              key={`schema-auto-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          ))}

          {/* Artigo JSON-LD Customizado */}
          {article.jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: article.jsonLd }}
            />
          )}

        </article>
      </main>

      {/* ===================== ARTIGOS RELACIONADOS ===================== */}
      {relatedArticles.length > 0 && (
        <section className="bg-slate-50 border-t border-b border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h3 className="text-2xl font-bold text-[#243b56] mb-8">Artigos Relacionados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <div key={rel.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    {rel.category && (
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase">
                        {rel.category.name}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
                      <Link href={`/blog/${rel.slug}`} className="hover:text-blue-600">
                        {rel.title}
                      </Link>
                    </h4>
                  </div>
                  <Link 
                    href={`/blog/${rel.slug}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-4"
                  >
                    Ler artigo
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== FOOTER ===================== */}
      <Footer logoUrl={settings?.logoUrl} />
    </div>
  );
}

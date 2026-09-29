import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = 'https://consultasbrasil.net';
  
  try {
    const settings = await prisma.systemSetting.findFirst();
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
  } catch (err) {
    console.error('Erro ao ler sitemap settings:', err);
  }

  // 1. Rotas estáticas indexáveis (exclui login, cadastro, painel, etc.)
  const staticRoutes = [
    '',
    '/home2',
    '/protecao-de-dados',
    '/termos',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const now = new Date();
    // 2. Páginas comerciais e institucionais dinâmicas
    const pages = await prisma.page.findMany({
      where: {
        published: true,
        robotsIndex: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: now } }
        ]
      },
      select: {
        slug: true,
        updatedAt: true,
        canonical: true,
      }
    });

    pages.forEach((page) => {
      // Se a página tem um canonical externo (aponta para fora do site), não listamos no sitemap
      if (page.canonical && !page.canonical.startsWith(baseUrl)) {
        return;
      }
      sitemapEntries.push({
        url: `${baseUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    // 3. Artigos de Blog dinâmicos
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        robotsIndex: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: now } }
        ]
      },
      select: {
        slug: true,
        updatedAt: true,
        canonical: true,
      }
    });

    articles.forEach((article) => {
      if (article.canonical && !article.canonical.startsWith(baseUrl)) {
        return;
      }
      sitemapEntries.push({
        url: `${baseUrl}/blog/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (err) {
    console.error('Erro ao gerar rotas dinâmicas do sitemap:', err);
  }

  return sitemapEntries;
}

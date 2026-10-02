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

  // Map para garantir unicidade estrita de cada URL no sitemap
  const sitemapMap = new Map<string, MetadataRoute.Sitemap[number]>();

  // 1. Rotas estáticas indexáveis base
  const staticRoutes = [
    { route: '', priority: 1.0, changeFrequency: 'daily' as const },
    { route: '/home2', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  staticRoutes.forEach(({ route, priority, changeFrequency }) => {
    const fullUrl = `${baseUrl}${route}`;
    sitemapMap.set(fullUrl, {
      url: fullUrl,
      lastModified: new Date(),
      changeFrequency,
      priority,
    });
  });

  try {
    const now = new Date();
    // 2. Páginas comerciais e institucionais dinâmicas cadastradas
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
      // Se a página tem canonical externo diferente do domínio, não inclui
      if (page.canonical && !page.canonical.startsWith(baseUrl)) {
        return;
      }
      const fullUrl = `${baseUrl}/${page.slug.replace(/^\//, '')}`;
      sitemapMap.set(fullUrl, {
        url: fullUrl,
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
      const fullUrl = `${baseUrl}/blog/${article.slug.replace(/^\//, '')}`;
      sitemapMap.set(fullUrl, {
        url: fullUrl,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (err) {
    console.error('Erro ao gerar rotas dinâmicas do sitemap:', err);
  }

  return Array.from(sitemapMap.values());
}

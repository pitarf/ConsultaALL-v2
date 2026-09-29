'use server';

import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import DOMPurify from 'isomorphic-dompurify';

// Helper de segurança
async function checkAdmin() {
  const session = await verifySession();
  if (!session) throw new Error('Não autenticado');
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SEO')) throw new Error('Acesso negado');
  return user;
}

// 1. SANITIZAÇÃO DE HTML (isomorphic-dompurify com allowlist restrita + RegExp secundária)
function sanitizeHtmlContent(html: string): string {
  if (!html) return '';
  
  // 1. Extrai blocos <style> e <script> para protegê-los do DOMPurify
  const styleBlocks: string[] = [];
  const scriptBlocks: string[] = [];
  
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  
  // Substitui styles temporariamente
  let htmlWithoutProtected = html.replace(styleRegex, (match) => {
    styleBlocks.push(match);
    return `__STYLE_BLOCK_PLACEHOLDER_${styleBlocks.length - 1}__`;
  });

  // Substitui scripts temporariamente
  htmlWithoutProtected = htmlWithoutProtected.replace(scriptRegex, (match) => {
    scriptBlocks.push(match);
    return `__SCRIPT_BLOCK_PLACEHOLDER_${scriptBlocks.length - 1}__`;
  });

  // 2. Limpeza robusta via biblioteca confiável no backend
  const clean = DOMPurify.sanitize(htmlWithoutProtected, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 
      'ol', 'ul', 'li', 'a', 'img', 'span', 'div', 'table', 'thead', 'tbody', 
      'tr', 'th', 'td', 'blockquote', 'code', 'pre',
      'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
      'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'clipPath',
      'input', 'button', 'form', 'label', 'textarea', 'select', 'option',
      'details', 'summary'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'className', 'target', 'rel', 'style', 'width', 'height',
      'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'viewBox', 'xmlns', 
      'cx', 'cy', 'r', 'x', 'y', 'type', 'placeholder', 'value', 'name', 'required', 'id', 'for', 
      'maxLength', 'inputMode', 'spellCheck', 'autoComplete', 'autoCapitalize', 'autoCorrect',
      'open', 'aria-hidden', 'aria-label', 'aria-live', 'aria-current', 'aria-invalid', 'aria-describedby'
    ],
    ALLOW_DATA_ATTR: true, // Crucial para seletores Tailwind dinâmicos (data-*)
    ADD_ATTR: ['target'],
    LIMIT_ATTR_VALS: ['target'],
  });

  // Camada extra via regex para garantir remoção de tags estruturais e manipuladores de eventos
  // ATENÇÃO: Executado ANTES de restaurar os scripts/styles protegidos para não corromper o código JS/CSS
  const cleanWithRegex = clean
    .replace(/<\/?(html|body|head|title|meta|link|canonical)\b[^>]*>/gi, '') // Remove tags proibidas
    .replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^>\s]+)/gi, ''); // Remove onerror, onload, etc.

  // 3. Restaura as tags <style> e <script> originais no HTML limpo
  let finalHtml = cleanWithRegex;
  styleBlocks.forEach((styleBlock, index) => {
    finalHtml = finalHtml.replace(`__STYLE_BLOCK_PLACEHOLDER_${index}__`, () => styleBlock);
  });

  scriptBlocks.forEach((scriptBlock, index) => {
    finalHtml = finalHtml.replace(`__SCRIPT_BLOCK_PLACEHOLDER_${index}__`, () => scriptBlock);
  });

  return finalHtml;
}

// 2. NORMALIZAÇÃO DE SLUG (Remove acentos, espaços e maiúsculas)
function normalizeSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-_/]/g, '') // Apenas alfanuméricos, hífen, underline e barra
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-') 
    .replace(/^\/+|\/+$/g, ''); 
}

// Lista de rotas reservadas do sistema
const RESERVED_SLUGS = [
  'admin', 'admin-login', 'api', 'dashboard', 'login', 'cadastro', 'esqueceu-senha', 
  'resetar-senha', 'blog', 'faturas', 'historico', 
  'empresas', 'veiculos', 'perfil', 'promocoes', 'sw.js', 'sitemap.xml', 'robots.txt'
];

// ==========================================
// 3. GERENCIADOR DE PÁGINAS (CMS)
// ==========================================

export async function getPages() {
  await checkAdmin();
  return prisma.page.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function getPageBySlug(slug: string) {
  return prisma.page.findFirst({
    where: { slug }
  });
}

export async function createPage(data: {
  slug: string;
  title: string;
  metaDescription?: string | null;
  h1?: string | null;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  imageAlt?: string | null;
  canonical?: string | null;
  robotsIndex: boolean;
  showInMenu: boolean;
  showInFooter: boolean;
  jsonLd?: string | null;
  openGraph?: string | null;
  published: boolean;
  publishedAt?: string | null;
}) {
  await checkAdmin();
  
  const cleanSlug = normalizeSlug(data.slug);

  if (RESERVED_SLUGS.includes(cleanSlug)) {
    return { error: 'Este slug é uma rota reservada do sistema e não pode ser utilizada.' };
  }

  const existing = await prisma.page.findUnique({ where: { slug: cleanSlug } });
  if (existing) return { error: 'Uma página com este slug já existe.' };

  const sanitizedContent = sanitizeHtmlContent(data.content);

  try {
    const page = await prisma.page.create({
      data: {
        ...data,
        slug: cleanSlug,
        content: sanitizedContent,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      }
    });

    revalidatePath('/sitemap.xml');
    revalidatePath('/[slug]');
    revalidatePath('/');
    return { success: true, page };
  } catch (err: any) {
    console.error('Erro ao criar página:', err);
    return { error: 'Erro interno ao criar página.' };
  }
}

export async function updatePage(id: string, data: {
  slug: string;
  title: string;
  metaDescription?: string | null;
  h1?: string | null;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  imageAlt?: string | null;
  canonical?: string | null;
  robotsIndex: boolean;
  showInMenu: boolean;
  showInFooter: boolean;
  jsonLd?: string | null;
  openGraph?: string | null;
  published: boolean;
  publishedAt?: string | null;
}) {
  await checkAdmin();

  const cleanSlug = normalizeSlug(data.slug);

  if (RESERVED_SLUGS.includes(cleanSlug)) {
    return { error: 'Este slug é uma rota reservada do sistema e não pode ser utilizada.' };
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return { error: 'Página não encontrada.' };

  // Valida duplicidade se o slug mudou
  if (page.slug !== cleanSlug) {
    const existing = await prisma.page.findUnique({ where: { slug: cleanSlug } });
    if (existing) return { error: 'Uma página com este slug já existe.' };

    // Criar redirecionamento 301
    await create301Redirect(page.slug, cleanSlug, 'PAGE');
  }

  const sanitizedContent = sanitizeHtmlContent(data.content);

  try {
    await prisma.page.update({
      where: { id },
      data: {
        ...data,
        slug: cleanSlug,
        content: sanitizedContent,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      }
    });

    revalidatePath('/sitemap.xml');
    revalidatePath(`/${page.slug}`);
    revalidatePath(`/${cleanSlug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Erro ao atualizar página:', err);
    return { error: 'Erro interno ao atualizar página.' };
  }
}

export async function duplicatePage(id: string) {
  await checkAdmin();
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return { error: 'Página não encontrada.' };

  const timestamp = Date.now();
  const newSlug = `${page.slug}-copia-${timestamp}`;
  const newTitle = `${page.title} (Cópia)`;

  try {
    const { id: _, createdAt: __, updatedAt: ___, ...pageData } = page;
    const duplicated = await prisma.page.create({
      data: {
        ...pageData,
        slug: newSlug,
        title: newTitle,
        published: false,
        publishedAt: null
      }
    });
    revalidatePath('/');
    return { success: true, page: duplicated };
  } catch (err) {
    console.error('Erro ao duplicar página:', err);
    return { error: 'Erro ao duplicar página.' };
  }
}

export async function togglePagePublish(id: string, published: boolean) {
  await checkAdmin();
  try {
    const page = await prisma.page.update({
      where: { id },
      data: { 
        published,
        publishedAt: published ? new Date() : null
      }
    });
    revalidatePath('/sitemap.xml');
    revalidatePath(`/${page.slug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao alternar publicação da página.' };
  }
}

export async function deletePage(id: string) {
  await checkAdmin();
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return { error: 'Página não encontrada.' };

  try {
    await prisma.page.delete({ where: { id } });
    await prisma.redirect.deleteMany({ where: { newSlug: page.slug } });

    revalidatePath('/sitemap.xml');
    revalidatePath(`/${page.slug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar página:', err);
    return { error: 'Erro ao excluir página.' };
  }
}

// ==========================================
// 4. GERENCIADOR DO BLOG
// ==========================================

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createCategory(name: string) {
  await checkAdmin();
  const slug = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  try {
    const category = await prisma.category.create({
      data: { name, slug }
    });
    return { success: true, category };
  } catch (err) {
    return { error: 'Categoria já existe.' };
  }
}

export async function deleteCategory(id: string) {
  await checkAdmin();
  try {
    await prisma.category.delete({ where: { id } });
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao deletar categoria. Certifique-se de que não há artigos nela.' };
  }
}

export async function getArticles(onlyPublished = false) {
  const now = new Date();
  return prisma.article.findMany({
    where: onlyPublished 
      ? { 
          published: true,
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: now } }
          ]
        } 
      : {},
    orderBy: { createdAt: 'desc' },
    include: { category: true }
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug },
    include: { category: true }
  });
}

export async function createArticle(data: {
  slug: string;
  title: string;
  metaDescription?: string | null;
  h1?: string | null;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  imageAlt?: string | null;
  canonical?: string | null;
  robotsIndex: boolean;
  jsonLd?: string | null;
  openGraph?: string | null;
  published: boolean;
  publishedAt?: string | null;
  author: string;
  categoryId?: string | null;
}) {
  await checkAdmin();

  const cleanSlug = normalizeSlug(data.slug);

  const existing = await prisma.article.findUnique({ where: { slug: cleanSlug } });
  if (existing) return { error: 'Um artigo com este slug já existe.' };

  const sanitizedContent = sanitizeHtmlContent(data.content);

  try {
    const article = await prisma.article.create({
      data: {
        ...data,
        slug: cleanSlug,
        content: sanitizedContent,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      }
    });

    revalidatePath('/sitemap.xml');
    revalidatePath('/blog');
    revalidatePath('/blog/[slug]');
    revalidatePath('/');
    return { success: true, article };
  } catch (err) {
    console.error('Erro ao criar artigo:', err);
    return { error: 'Erro ao criar artigo.' };
  }
}

export async function updateArticle(id: string, data: {
  slug: string;
  title: string;
  metaDescription?: string | null;
  h1?: string | null;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  imageAlt?: string | null;
  canonical?: string | null;
  robotsIndex: boolean;
  jsonLd?: string | null;
  openGraph?: string | null;
  published: boolean;
  publishedAt?: string | null;
  author: string;
  categoryId?: string | null;
}) {
  await checkAdmin();

  const cleanSlug = normalizeSlug(data.slug);

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return { error: 'Artigo não encontrado.' };

  if (article.slug !== cleanSlug) {
    const existing = await prisma.article.findUnique({ where: { slug: cleanSlug } });
    if (existing) return { error: 'Um artigo com este slug já existe.' };

    // Criar redirecionamento 301
    await create301Redirect(article.slug, cleanSlug, 'ARTICLE');
  }

  const sanitizedContent = sanitizeHtmlContent(data.content);

  try {
    await prisma.article.update({
      where: { id },
      data: {
        ...data,
        slug: cleanSlug,
        content: sanitizedContent,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      }
    });

    revalidatePath('/sitemap.xml');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    revalidatePath(`/blog/${cleanSlug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Erro ao atualizar artigo:', err);
    return { error: 'Erro ao atualizar artigo.' };
  }
}

export async function duplicateArticle(id: string) {
  await checkAdmin();
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return { error: 'Artigo não encontrado.' };

  const timestamp = Date.now();
  const newSlug = `${article.slug}-copia-${timestamp}`;
  const newTitle = `${article.title} (Cópia)`;

  try {
    const { id: _, createdAt: __, updatedAt: ___, ...articleData } = article;
    const duplicated = await prisma.article.create({
      data: {
        ...articleData,
        slug: newSlug,
        title: newTitle,
        published: false,
        publishedAt: null
      }
    });
    revalidatePath('/blog');
    return { success: true, article: duplicated };
  } catch (err) {
    console.error('Erro ao duplicar artigo:', err);
    return { error: 'Erro ao duplicar artigo.' };
  }
}

export async function toggleArticlePublish(id: string, published: boolean) {
  await checkAdmin();
  try {
    const article = await prisma.article.update({
      where: { id },
      data: { 
        published,
        publishedAt: published ? new Date() : null
      }
    });
    revalidatePath('/sitemap.xml');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao alternar status do artigo.' };
  }
}

export async function deleteArticle(id: string) {
  await checkAdmin();
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return { error: 'Artigo não encontrado.' };

  try {
    await prisma.article.delete({ where: { id } });
    await prisma.redirect.deleteMany({ where: { newSlug: article.slug } });

    revalidatePath('/sitemap.xml');
    revalidatePath('/blog');
    revalidatePath(`/blog/${article.slug}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar artigo:', err);
    return { error: 'Erro ao deletar artigo.' };
  }
}

// ==========================================
// 5. UPLOAD DE IMAGEM OTIMIZADA WEB_PREVIEW
// ==========================================

export async function saveUploadedImage(base64Data: string, originalName: string) {
  await checkAdmin();
  try {
    const base64Matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!base64Matches) {
      return { error: 'Formato de imagem inválido.' };
    }

    const mime = base64Matches[1].toLowerCase();
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    
    // A. Validação de MIME Type (Rejeita SVG para mitigar riscos de XSS)
    if (!allowedMimes.includes(mime)) {
      return { error: 'Formato de arquivo não permitido. Apenas imagens JPG, PNG, WebP, GIF e AVIF são aceitas.' };
    }

    const buffer = Buffer.from(base64Matches[2], 'base64');

    // B. Validação da Assinatura Real do Arquivo (Magic Bytes)
    if (!validateImageSignature(buffer)) {
      return { error: 'Assinatura de imagem inválida. O arquivo enviado não é um formato de imagem real e seguro.' };
    }
    
    // C. Limite de Tamanho da Imagem (Tamanho máximo de 3MB)
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      return { error: 'A imagem excede o limite de tamanho permitido de 3MB.' };
    }

    let extension = 'webp';
    if (mime.includes('png')) extension = 'png';
    else if (mime.includes('gif')) extension = 'gif';
    else if (mime.includes('avif')) extension = 'avif';
    else if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';

    // Normaliza o nome do arquivo para segurança total
    const cleanName = originalName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');

    const filename = `${path.parse(cleanName).name}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return { success: true, url: `/uploads/${filename}` };
  } catch (err: any) {
    console.error('Erro ao salvar imagem de upload:', err);
    return { error: 'Erro interno ao salvar arquivo no servidor.' };
  }
}

// Helper para validar assinatura real da imagem (Magic Bytes/Header signature)
function validateImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG/JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return true;
  }

  // GIF: GIF8 (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: RIFF (52 49 46 46) + WEBP (57 45 42 50) at offset 8
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return true;
  }

  // AVIF: ftypavif (check 'ftypavif' at index 4 to 11)
  const ftyp = buffer.toString('ascii', 4, 12);
  if (ftyp === 'ftypavif' || ftyp === 'ftypavis') {
    return true;
  }

  return false;
}

// ==========================================
// 6. PROTEÇÃO CONTRA LOOPS E REDIRECIONAMENTOS 301 SEGUROS
// ==========================================

async function create301Redirect(oldSlug: string, newSlug: string, type: 'PAGE' | 'ARTICLE') {
  const cleanOld = oldSlug.trim().toLowerCase();
  const cleanNew = newSlug.trim().toLowerCase();

  // A. Evita redirecionar para o mesmo slug
  if (cleanOld === cleanNew) return;

  // B. Bloqueia redirecionamentos externos sem autorização
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consultasbrasil.net';
  if (cleanNew.startsWith('http://') || cleanNew.startsWith('https://') || cleanNew.startsWith('//')) {
    if (!cleanNew.startsWith(baseUrl)) {
      console.warn('Bloqueado redirecionamento externo não autorizado:', cleanNew);
      return; 
    }
  }

  // C. Evita loops (ciclos) de redirecionamento (A -> B, B -> A ou A -> B -> C -> A)
  let currentTarget = cleanNew;
  const visited = new Set<string>();
  visited.add(cleanOld);

  while (currentTarget) {
    if (visited.has(currentTarget)) {
      console.warn(`Loop de redirecionamento detectado para o slug "${currentTarget}". Abortando operação.`);
      return; // Interrompe o processo para não quebrar o site
    }
    visited.add(currentTarget);

    const nextRedirect = await prisma.redirect.findUnique({
      where: { oldSlug: currentTarget }
    });

    if (nextRedirect) {
      currentTarget = nextRedirect.newSlug.trim().toLowerCase();
    } else {
      break;
    }
  }

  try {
    // Insere ou atualiza o redirecionamento
    await prisma.redirect.upsert({
      where: { oldSlug: cleanOld },
      update: { newSlug: cleanNew, type },
      create: { oldSlug: cleanOld, newSlug: cleanNew, type }
    });

    // Resolve as cadeias existentes para diminuir saltos desnecessários (X -> old e old -> new vira X -> new)
    await prisma.redirect.updateMany({
      where: { newSlug: cleanOld },
      data: { newSlug: cleanNew }
    });
  } catch (err) {
    console.error('Erro ao processar redirecionamento 301:', err);
  }
}

export async function findRedirect(slug: string) {
  return prisma.redirect.findUnique({
    where: { oldSlug: slug }
  });
}

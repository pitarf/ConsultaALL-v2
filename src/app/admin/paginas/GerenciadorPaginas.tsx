'use client';

import { useState } from 'react';
import { createPage, updatePage, deletePage, duplicatePage, togglePagePublish, saveUploadedImage } from '@/app/actions/cms';
import { toast } from 'sonner';
import { 
  Plus, Search, Edit2, Trash2, Eye, ExternalLink, X, HelpCircle, Save, Loader2, Sparkles, Check, Globe, Copy, Upload, ToggleLeft, ToggleRight, Calendar
} from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';

interface GerenciadorPaginasProps {
  initialPages: any[];
}

export default function GerenciadorPaginas({ initialPages }: GerenciadorPaginasProps) {
  const [pages, setPages] = useState<any[]>(initialPages);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [h1, setH1] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [canonical, setCanonical] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [showInMenu, setShowInMenu] = useState(false);
  const [showInFooter, setShowInFooter] = useState(false);
  const [jsonLd, setJsonLd] = useState('');
  const [openGraph, setOpenGraph] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingPage(null);
    setTitle('');
    setSlug('');
    setH1('');
    setMetaDescription('');
    setExcerpt('');
    setContent(`<h2>Título de Seção</h2>\n<p>Escreva o conteúdo da sua página aqui em formato HTML...</p>`);
    setImage('');
    setImageAlt('');
    setCanonical('');
    setRobotsIndex(true);
    setShowInMenu(false);
    setShowInFooter(false);
    setJsonLd('');
    setOpenGraph('');
    setPublished(true);
    setPublishedAt('');
    setModalOpen(true);
  };

  const openEditModal = (page: any) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setH1(page.h1 || '');
    setMetaDescription(page.metaDescription || '');
    setExcerpt(page.excerpt || '');
    setContent(page.content);
    setImage(page.image || '');
    setImageAlt(page.imageAlt || '');
    setCanonical(page.canonical || '');
    setRobotsIndex(page.robotsIndex);
    setShowInMenu(page.showInMenu);
    setShowInFooter(page.showInFooter);
    setJsonLd(page.jsonLd || '');
    setOpenGraph(page.openGraph || '');
    setPublished(page.published);
    
    // Formata data ISO para datetime-local
    if (page.publishedAt) {
      const date = new Date(page.publishedAt);
      const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
      setPublishedAt(isoString.slice(0, 16));
    } else {
      setPublishedAt('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      toast.error('Preencha os campos obrigatórios: Título, Slug e Conteúdo.');
      return;
    }

    setLoading(true);
    const data = {
      title,
      slug,
      h1: h1 || null,
      metaDescription: metaDescription || null,
      excerpt: excerpt || null,
      content,
      image: image || null,
      imageAlt: imageAlt || null,
      canonical: canonical || null,
      robotsIndex,
      showInMenu,
      showInFooter,
      jsonLd: jsonLd || null,
      openGraph: openGraph || null,
      published,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null
    };

    try {
      if (editingPage) {
        const res = await updatePage(editingPage.id, data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Página atualizada com sucesso!');
          setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...data, updatedAt: new Date() } : p));
          setModalOpen(false);
        }
      } else {
        const res = await createPage(data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Página criada com sucesso!');
          if (res.page) setPages([res.page, ...pages]);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar página:', err);
      toast.error(`Falha técnica ao salvar: ${err.message || 'Excesso de tamanho do conteúdo ou oscilação de rede.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, pageTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a página "${pageTitle}"? Isso também removerá redirecionamentos vinculados.`)) return;

    setLoading(true);
    try {
      const res = await deletePage(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Página excluída com sucesso!');
        setPages(pages.filter(p => p.id !== id));
      }
    } catch (err) {
      toast.error('Erro ao excluir página.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setLoading(true);
    try {
      const res = await duplicatePage(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Página duplicada com sucesso!');
        if (res.page) setPages([res.page, ...pages]);
      }
    } catch (err) {
      toast.error('Erro ao duplicar página.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const res = await togglePagePublish(id, newStatus);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(newStatus ? 'Página publicada!' : 'Página definida como rascunho!');
        setPages(pages.map(p => p.id === id ? { ...p, published: newStatus } : p));
      }
    } catch (err) {
      toast.error('Erro ao alternar status da página.');
    }
  };

  const handleSlugBlur = () => {
    if (!slug && title) {
      const formatted = title.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(formatted);
    }
  };

  // Otimização e Conversão de Imagem Cliente-Side para WebP
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpBase64 = canvas.toDataURL('image/webp', 0.82);
          
          const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setUploadingImage(true);
          toast.promise(
            saveUploadedImage(webpBase64, `${nameWithoutExt}.webp`).then((res) => {
              if (res.error) throw new Error(res.error);
              if (res.url) {
                setImage(res.url);
              }
            }),
            {
              loading: 'Otimizando e enviando imagem (WebP)...',
              success: 'Imagem otimizada WebP carregada!',
              error: (err) => `Falha no envio: ${err.message}`,
              finally: () => setUploadingImage(false)
            }
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Barra superior de ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por título ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 text-sm transition-all shadow-sm"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Nova Página SEO
        </button>
      </div>

      {/* Tabela de Páginas */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
            <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase text-slate-500 dark:text-gray-500 font-bold border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">Título / H1</th>
                <th className="px-6 py-4">Slug (URL)</th>
                <th className="px-6 py-4">Filtros Meta</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Última Atualização</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent dark:bg-black/10">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-gray-500">
                    Nenhuma página cadastrada ou encontrada.
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {page.title}
                        </span>
                        {page.h1 && (
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">
                            H1: {page.h1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      /{page.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center w-fit gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          page.robotsIndex 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}>
                          {page.robotsIndex ? 'INDEX, FOLLOW' : 'NOINDEX, NOFOLLOW'}
                        </span>
                        <div className="flex gap-1 text-[9px] font-mono text-slate-400">
                          {page.showInMenu && <span className="bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded border border-slate-200 dark:border-white/5">MENU</span>}
                          {page.showInFooter && <span className="bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded border border-slate-200 dark:border-white/5">FOOTER</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(page.id, page.published)}
                        className="flex items-center gap-1 cursor-pointer focus:outline-none"
                        title={page.published ? 'Clique para despublicar (Rascunho)' : 'Clique para publicar'}
                      >
                        {page.published ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">
                            PUBLICADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black">
                            RASCUNHO
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-gray-400 whitespace-nowrap text-xs">
                      {new Date(page.updatedAt).toLocaleDateString('pt-BR')} às {new Date(page.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <a 
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors inline-flex"
                        title="Ver no Site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDuplicate(page.id)}
                        disabled={loading}
                        className="p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors inline-flex"
                        title="Duplicar Página"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(page)}
                        disabled={loading}
                        className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white rounded transition-colors inline-flex"
                        title="Editar Página"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(page.id, page.title)}
                        disabled={loading}
                        className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors inline-flex"
                        title="Excluir Página"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar Página */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#243b56] dark:text-white flex items-center gap-2">
                <Globe className="text-emerald-500 w-5 h-5" />
                {editingPage ? 'Editar Página SEO' : 'Criar Nova Página SEO'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* Título e Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Título da Página (Meta Title) *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSlugBlur}
                    required
                    placeholder="Ex: Consultar CPF Online - Rápido e Seguro"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Slug da URL *
                    <Tooltip text="O endereço final da página. Ex: consulta-cpf (normalizado automaticamente)">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                    </Tooltip>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400 font-mono text-xs select-none">
                      /
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      placeholder="consulta-cpf"
                      className="w-full px-4 py-3 rounded-r-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* H1 Principal */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  Título Principal H1 (Título Interno do Corpo da Página)
                  <Tooltip text="Se deixado em branco, o meta title acima será usado como H1 principal.">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  value={h1}
                  onChange={(e) => setH1(e.target.value)}
                  placeholder="Ex: Consulta Completa de CPF na Receita Federal"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                />
              </div>

              {/* Excerpt / Resumo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Resumo / Excerpt (Fica no Header da Página)</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="Um breve resumo que será exibido abaixo do título principal..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all resize-none"
                />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Meta Description (Resumo para Google) *</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  maxLength={160}
                  placeholder="Escreva uma descrição chamativa de até 160 caracteres..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all resize-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-gray-500 flex justify-end font-mono mt-1">
                  {metaDescription.length}/160 caracteres
                </span>
              </div>

              {/* Conteúdo Rico HTML */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  Conteúdo da Página (Suporta Tags HTML) *
                  <Tooltip text="Será automaticamente sanitizado para impedir scripts maliciosos. Suporta tags padrão <h2>, <p>, <ul>, etc.">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                  </Tooltip>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                  placeholder="<h2>Subtítulo</h2><p>Parágrafo explicativo...</p>"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-y"
                />
                
                {/* Upload Direto de Arquivo HTML */}
                <div className="mt-2.5 flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-black/10 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>Importar arquivo HTML completo (.html, .txt)?</span>
                  </div>
                  <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1">
                    <span>Escolher Arquivo</span>
                    <input 
                      type="file" 
                      accept=".html,.txt,.htm" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result as string;
                            setContent(text);
                            toast.success('Arquivo importado com sucesso!');
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Imagem de Destaque com Otimização */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Imagem de Destaque / OG
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Ex: /uploads/nome-imagem.webp ou URL externa"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-white cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingImage ? 'Processando...' : 'Fazer Upload e Otimizar (WebP)'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">ALT da Imagem (Acessibilidade / SEO)</label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Ex: Ilustração de uma pessoa analisando dados cadastrais"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Parâmetros avançados de SEO */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="text-amber-500 w-4.5 h-4.5" />
                  SEO Avançado & Configurações de Meta Tags
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* URL Canonical */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      URL Canonical Personalizada
                      <Tooltip text="Se deixado em branco, o sistema preencherá automaticamente com a própria URL da página (autorreferente). Só preencha se desejar apontar para outra página.">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      value={canonical}
                      onChange={(e) => setCanonical(e.target.value)}
                      placeholder="Autopreenchido com a própria URL"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                    />
                  </div>

                  {/* Publicação Programada */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      Agendar Publicação (Data e Hora)
                      <Tooltip text="Selecione data futura para programar a publicação automática. Deixe vazio para publicar imediatamente.">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                      </Tooltip>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Robots Indexation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Robots Indexation</label>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setRobotsIndex(!robotsIndex)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${robotsIndex ? 'bg-green-500' : 'bg-red-500'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${robotsIndex ? 'left-6' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
                        {robotsIndex ? 'INDEX' : 'NOINDEX'}
                      </span>
                    </div>
                  </div>

                  {/* Exibir no Menu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Exibir no Menu Superior</label>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowInMenu(!showInMenu)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${showInMenu ? 'bg-green-500' : 'bg-slate-300 dark:bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showInMenu ? 'left-6' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
                        {showInMenu ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>

                  {/* Exibir no Rodapé */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Exibir no Rodapé</label>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowInFooter(!showInFooter)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${showInFooter ? 'bg-green-500' : 'bg-slate-300 dark:bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showInFooter ? 'left-6' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
                        {showInFooter ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>

                  {/* Status de Publicação */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Status Inicial</label>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        type="button"
                        onClick={() => setPublished(!published)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${published ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${published ? 'left-6' : 'left-1'}`}></div>
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
                        {published ? 'PUBLICADO' : 'RASCUNHO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured JSON-LD Data & OpenGraph Custom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      JSON-LD estruturado extra (FAQ, HowTo, etc.)
                      <Tooltip text="Os schemas padrão de WebPage e Service são gerados automaticamente. Adicione FAQ ou outros customizados aqui.">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                      </Tooltip>
                    </label>
                    <textarea
                      value={jsonLd}
                      onChange={(e) => setJsonLd(e.target.value)}
                      rows={4}
                      placeholder="Script de Schema JSON-LD adicional..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      Open Graph Customizado Extra (JSON)
                      <Tooltip text="Customizações adicionais das meta tags em formato JSON. Ex: { 'og:site_name': 'ConsultasBrasil' }">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                      </Tooltip>
                    </label>
                    <textarea
                      value={openGraph}
                      onChange={(e) => setOpenGraph(e.target.value)}
                      rows={4}
                      placeholder="{ 'og:type': 'article' }"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                    />
                  </div>
                </div>

              </div>

            </form>

            {/* Footer com Ações */}
            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 rounded-b-3xl flex justify-between gap-3 items-center">
              <div>
                {editingPage && (
                  <a
                    href={`/${editingPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-white rounded-xl transition-all shadow-sm flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pré-visualizar Página
                  </a>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || uploadingImage}
                  className="px-6 py-3 text-xs md:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                  {editingPage ? 'Salvar Alterações' : 'Criar Página'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

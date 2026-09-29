'use client';

import { useState } from 'react';
import { 
  createArticle, updateArticle, deleteArticle, createCategory, deleteCategory, duplicateArticle, toggleArticlePublish, saveUploadedImage 
} from '@/app/actions/cms';
import { toast } from 'sonner';
import { 
  Plus, Search, Edit2, Trash2, X, HelpCircle, Save, Loader2, Sparkles, FolderPlus, BookOpen, User, Calendar, ExternalLink, Copy, Upload, ToggleLeft, ToggleRight, Eye
} from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';

interface GerenciadorBlogProps {
  initialArticles: any[];
  initialCategories: any[];
}

export default function GerenciadorBlog({ initialArticles, initialCategories }: GerenciadorBlogProps) {
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<'articles' | 'categories'>('articles');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);

  // Estados do artigo
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
  const [jsonLd, setJsonLd] = useState('');
  const [openGraph, setOpenGraph] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [author, setAuthor] = useState('Redação');
  const [categoryId, setCategoryId] = useState('');

  // Estado de criação de categoria
  const [newCategoryName, setNewCategoryName] = useState('');

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSlug('');
    setH1('');
    setMetaDescription('');
    setExcerpt('');
    setContent(`<h2>Título do Artigo</h2>\n<p>Escreva o conteúdo do seu artigo aqui em formato HTML...</p>`);
    setImage('');
    setImageAlt('');
    setCanonical('');
    setRobotsIndex(true);
    setJsonLd('');
    setOpenGraph('');
    setPublished(true);
    setPublishedAt('');
    setAuthor('Redação');
    setCategoryId(categories[0]?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (article: any) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setH1(article.h1 || '');
    setMetaDescription(article.metaDescription || '');
    setExcerpt(article.excerpt || '');
    setContent(article.content);
    setImage(article.image || '');
    setImageAlt(article.imageAlt || '');
    setCanonical(article.canonical || '');
    setRobotsIndex(article.robotsIndex);
    setJsonLd(article.jsonLd || '');
    setOpenGraph(article.openGraph || '');
    setPublished(article.published);
    setAuthor(article.author || 'Redação');
    setCategoryId(article.categoryId || '');
    
    // Formata data ISO para datetime-local
    if (article.publishedAt) {
      const date = new Date(article.publishedAt);
      if (!isNaN(date.getTime())) {
        const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
        setPublishedAt(isoString.slice(0, 16));
      } else {
        setPublishedAt('');
      }
    } else {
      setPublishedAt('');
    }
    setModalOpen(true);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
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
      jsonLd: jsonLd || null,
      openGraph: openGraph || null,
      published,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      author,
      categoryId: categoryId || null
    };

    try {
      if (editingArticle) {
        const res = await updateArticle(editingArticle.id, data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Artigo atualizado com sucesso!');
          setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...data, category: categories.find(c => c.id === categoryId), updatedAt: new Date() } : a));
          setModalOpen(false);
        }
      } else {
        const res = await createArticle(data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Artigo criado com sucesso!');
          if (res.article) {
            setArticles([{ ...res.article, category: categories.find(c => c.id === categoryId) }, ...articles]);
          }
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar artigo:', err);
      toast.error(`Falha técnica ao salvar: ${err.message || 'Excesso de tamanho do conteúdo ou oscilação de rede.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string, articleTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o artigo "${articleTitle}"?`)) return;

    setLoading(true);
    try {
      const res = await deleteArticle(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Artigo excluído com sucesso!');
        setArticles(articles.filter(a => a.id !== id));
      }
    } catch (err) {
      toast.error('Erro ao excluir artigo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateArticle = async (id: string) => {
    setLoading(true);
    try {
      const res = await duplicateArticle(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Artigo duplicado com sucesso!');
        if (res.article) {
          setArticles([{ ...res.article, category: categories.find(c => c.id === res.article.categoryId) }, ...articles]);
        }
      }
    } catch (err) {
      toast.error('Erro ao duplicar artigo.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArticlePublish = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const res = await toggleArticlePublish(id, newStatus);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(newStatus ? 'Artigo publicado!' : 'Artigo definido como rascunho!');
        setArticles(articles.map(a => a.id === id ? { ...a, published: newStatus } : a));
      }
    } catch (err) {
      toast.error('Erro ao alternar status do artigo.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const res = await createCategory(newCategoryName.trim());
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Categoria criada com sucesso!');
        if (res.category) setCategories([...categories, res.category]);
        setNewCategoryName('');
      }
    } catch (err) {
      toast.error('Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Artigos vinculados a ela ficarão "Sem Categoria".`)) return;

    setLoading(true);
    try {
      const res = await deleteCategory(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Categoria excluída!');
        setCategories(categories.filter(c => c.id !== id));
        setArticles(articles.map(a => a.categoryId === id ? { ...a, categoryId: null, category: null } : a));
      }
    } catch (err) {
      toast.error('Erro ao excluir categoria.');
    } finally {
      setLoading(false);
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
              success: 'Imagem do post carregada e otimizada!',
              error: (err) => `Erro ao fazer upload: ${err.message}`,
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
    <div className="space-y-6">
      
      {/* Abas */}
      <div className="flex border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'articles'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Artigos Publicados ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          Categorias ({categories.length})
        </button>
      </div>

      {activeTab === 'articles' ? (
        <>
          {/* Ações superiores */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
              />
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              Novo Artigo do Blog
            </button>
          </div>

          {/* Tabela de Artigos */}
          <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
                <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase text-slate-500 font-bold border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4">Artigo</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Autor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Indexação</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent dark:bg-black/10">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        Nenhum artigo encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {art.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              /blog/{art.slug}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/5">
                            {art.category?.name || 'Sem Categoria'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {art.author}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleArticlePublish(art.id, art.published)}
                            className="flex items-center cursor-pointer focus:outline-none"
                            title={art.published ? 'Clique para despublicar' : 'Clique para publicar'}
                          >
                            {art.published ? (
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
                        <td className="px-6 py-4 text-xs">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            art.robotsIndex 
                              ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                              : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}>
                            {art.robotsIndex ? 'INDEX' : 'NOINDEX'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          <a 
                            href={`/blog/${art.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 rounded transition-colors inline-flex"
                            title="Ver Artigo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDuplicateArticle(art.id)}
                            disabled={loading}
                            className="p-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 rounded transition-colors inline-flex"
                            title="Duplicar Artigo"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(art)}
                            disabled={loading}
                            className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 rounded transition-colors inline-flex"
                            title="Editar Artigo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            disabled={loading}
                            className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 rounded transition-colors inline-flex"
                            title="Excluir Artigo"
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
        </>
      ) : (
        /* Categorias do Blog */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Criar Categoria */}
          <div className="glass-panel border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-card space-y-4">
            <h3 className="text-base font-bold text-[#243b56] dark:text-white">Criar Nova Categoria</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: LGPD & Privacidade"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar Categoria
              </button>
            </form>
          </div>

          {/* Listagem de Categorias */}
          <div className="md:col-span-2 glass-panel border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-card">
            <h3 className="text-base font-bold text-[#243b56] dark:text-white mb-4">Categorias Cadastradas</h3>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">Nenhuma categoria criada.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Slug: {cat.slug}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors cursor-pointer"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Artigo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#243b56] dark:text-white flex items-center gap-2">
                <BookOpen className="text-emerald-500 w-5 h-5" />
                {editingArticle ? 'Editar Artigo' : 'Escrever Novo Artigo'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmitArticle} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* Título e Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Título do Post *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSlugBlur}
                    required
                    placeholder="Ex: Como funciona a análise cadastral?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Slug da URL *
                    <Tooltip text="O endereço final do post do blog. Ex: como-evitar-golpes">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                    </Tooltip>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-400 font-mono text-xs select-none">
                      /blog/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      required
                      placeholder="como-evitar-golpes"
                      className="w-full px-4 py-3 rounded-r-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* H1 Principal e Autor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Título Principal H1 (H1 do corpo do artigo)
                    <Tooltip text="Se deixado em branco, o título acima será usado como H1.">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    value={h1}
                    onChange={(e) => setH1(e.target.value)}
                    placeholder="Se vazio, usa o título do post"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Autor Estruturado</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Redação / Investigador"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Categoria do Artigo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Categoria do Blog</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all cursor-pointer"
                >
                  <option value="">Sem Categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Resumo / Excerpt */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">Resumo Rápido / Excerpt (Fica no Header do Post)</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="Um breve parágrafo introdutório que resume o post..."
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
                  placeholder="Escreva uma descrição atraente de até 160 caracteres..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all resize-none"
                />
                <span className="text-[10px] text-slate-400 dark:text-gray-500 flex justify-end font-mono mt-1">
                  {metaDescription.length}/160 caracteres
                </span>
              </div>

              {/* Conteúdo HTML Rico */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  Conteúdo do Artigo (Suporta Tags HTML) *
                  <Tooltip text="Escreva seu artigo completo usando tags HTML básicas para formatação (ex: <h2>, <p>, <ul>, etc.)">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-help inline-block ml-1" />
                  </Tooltip>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                  placeholder="<h2>Título</h2><p>Escreva o conteúdo aqui...</p>"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-y"
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

              {/* Imagem e ALT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">URL da Imagem do Post / Destaque</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Ex: /uploads/post-seguranca.webp ou URL externa"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-white cursor-pointer transition-colors shadow-sm animate-all">
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
                  <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2">ALT da Imagem (SEO)</label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Ex: Homem de terno pesquisando dados em um laptop"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              {/* Configurações de SEO avançado do Artigo */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="text-amber-500 w-4.5 h-4.5" />
                  SEO Avançado & Configurações de Metatags do Artigo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Canonical */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      URL Canonical Personalizada
                      <Tooltip text="Se deixado em branco, o sistema preencherá automaticamente com a própria URL do post (autorreferente).">
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
                      <Tooltip text="Data e hora que o artigo ficará online automaticamente. Deixe em branco para publicar na hora.">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Indexação */}
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
                      JSON-LD estruturado extra (FAQ, etc.)
                      <Tooltip text="Os schemas padrão de Article e Breadcrumb são gerados automaticamente. Adicione outros customizados aqui.">
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
                      <Tooltip text="Substitua ou acrescente tags Open Graph estruturadas em formato JSON.">
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
                {editingArticle && (
                  <a
                    href={`/blog/${editingArticle.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-white rounded-xl transition-all shadow-sm flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar no Blog
                  </a>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitArticle}
                  disabled={loading || uploadingImage}
                  className="px-6 py-3 text-xs md:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                  {editingArticle ? 'Salvar Alterações' : 'Criar Artigo'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

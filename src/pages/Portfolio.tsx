import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Eye,
  ExternalLink,
  Tag,
  Calendar,
  Award,
  Image as ImageIcon,
  Star,
  Sparkles,
  Layers,
  TrendingUp,
  Users,
  CheckCircle,
  Trash2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import Sidebar from '../components/Sidebar';
import ModalVisualizarPortfolio from '../components/ModalVisualizarPortfolio';
import ModalAdicionarPortfolio from '../components/ModalAdicionarPortfolio';
import ModalEditarPortfolio from '../components/ModalEditarPortfolio';
import ModalDeletarPortfolio from '../components/ModalDeletarPortfolio';
import { getProjetos, getClientes } from '../services/dataIntegration';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster } from '../services/adminService';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

type CategoriaPortfolio = 'branding' | 'web' | 'social' | 'marketing' | 'design' | 'video' | 'todos';

interface ItemPortfolio {
  id: string;
  projetoId: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaPortfolio;
  autorizadoPublicacao: boolean;
  imagemCapa: string;
  imagensGaleria: string[];
  tags: string[];
  destaque: boolean;
  dataFinalizacao: string;
  resultados?: {
    alcance?: number;
    engajamento?: number;
    conversao?: number;
    roi?: string;
  };
  testemunho?: {
    texto: string;
    autor: string;
    cargo: string;
  };
  criadoEm: string;
}

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userIsWebmaster = user?.email ? isWebmaster(user.email) : false;
  
  // Verifica se está vindo do portal do cliente
  const isClientView = location.state?.fromClient === true;
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<CategoriaPortfolio>('todos');
  const [filterDestaque, setFilterDestaque] = useState(false);
  
  // Estados dos Modais
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false);
  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDeletarOpen, setModalDeletarOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemPortfolio | null>(null);

  const handleVoltar = () => {
    if (isClientView) {
      navigate('/client-portal');
    } else {
      navigate('/dashboard');
    }
  };

  // ============================================================================
  // ESTADO INICIAL
  // ============================================================================

  const [portfolio, setPortfolio] = useState<ItemPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const safeLocalStorageSet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`⚠️ localStorage cheio; não foi possível salvar '${key}'. Tentando limpar cache...`, e);
      try {
        // Recupera de um estado comum: base64 antigo gravado no cache.
        localStorage.removeItem('portfolio_v1');
        localStorage.removeItem('portfolio_backup');
        localStorage.setItem(key, value);
        return true;
      } catch (e2) {
        console.warn(`⚠️ Ainda não foi possível salvar '${key}' após limpeza`, e2);
        return false;
      }
    }
  };

  const safeLocalStorageGet = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`⚠️ localStorage indisponível; não foi possível ler '${key}'`, e);
      return null;
    }
  };

  const clearPortfolioCache = () => {
    try {
      localStorage.removeItem('portfolio_v1');
      localStorage.removeItem('portfolio_backup');
      setCacheNotice('Cache limpo');
      setTimeout(() => setCacheNotice(null), 2500);
    } catch (e) {
      console.warn('⚠️ Não foi possível limpar cache do Portfólio:', e);
      setCacheNotice('Não foi possível limpar');
      setTimeout(() => setCacheNotice(null), 2500);
    }
  };

  // Listener em tempo real para portfólio do Firestore
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const portfolioRef = collection(db, 'portfolio');
    
    // Se for webmaster, vê tudo. Se não, vê apenas os seus.
    const q = userIsWebmaster 
      ? query(portfolioRef)
      : query(portfolioRef, where('adminId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemPortfolio[];
      
      setPortfolio(docs);
      setLoading(false);
      
      // Sincronizar com localStorage para cache
      safeLocalStorageSet('portfolio_v1', JSON.stringify(docs));
    }, (error) => {
      console.error('Erro ao escutar portfólio:', error);
      const stored = safeLocalStorageGet('portfolio_v1');
      if (stored) setPortfolio(JSON.parse(stored));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, userIsWebmaster]);

  // Salva no localStorage quando portfolio mudar
  useEffect(() => {
    safeLocalStorageSet('portfolio_v1', JSON.stringify(portfolio));
    console.log('💾 Portfolio: Salvou', portfolio.length, 'itens');
  }, [portfolio]);

  // ============================================================================
  // FILTROS
  // ============================================================================

  const portfolioFiltrado = portfolio.filter(item => {
    const matchSearch = item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchCategoria = filterCategoria === 'todos' || item.categoria === filterCategoria;
    const matchDestaque = !filterDestaque || item.destaque;

    return matchSearch && matchCategoria && matchDestaque;
  });

  const itensDestaque = portfolio.filter(item => item.destaque);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleVisualizarItem = (item: ItemPortfolio) => {
    setItemSelecionado(item);
    setModalVisualizarOpen(true);
  };

  const handleCloseModalVisualizar = () => {
    setModalVisualizarOpen(false);
    setItemSelecionado(null);
  };

  const handleEditarItem = (item?: ItemPortfolio) => {
    if (item) setItemSelecionado(item);
    setModalVisualizarOpen(false);
    setModalEditarOpen(true);
  };

  const handleDeletarItem = (item?: ItemPortfolio) => {
    if (item) setItemSelecionado(item);
    setModalVisualizarOpen(false);
    setModalDeletarOpen(true);
  };

  // Converte ItemPortfolio para o formato do modal
  const converterItemParaModal = (item: ItemPortfolio) => {
    return {
      ...item,
      alcance: item.resultados?.alcance?.toString() || '',
      engajamento: item.resultados?.engajamento?.toString() || '',
      conversao: item.resultados?.conversao?.toString() || '',
      roi: item.resultados?.roi || '',
      testemunhoTexto: item.testemunho?.texto || '',
      testemunhoAutor: item.testemunho?.autor || '',
      testemunhoCargo: item.testemunho?.cargo || ''
    };
  };

  const handleSalvarEdicao = async (itemEditado: any) => {
    if (!itemSelecionado) return;

    // Converte o formato do modal para o formato do Portfolio
    const itemAtualizado: any = {
      ...itemEditado,
      categoria: itemEditado.categoria as CategoriaPortfolio,
      atualizadoEm: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'portfolio', itemSelecionado.id), itemAtualizado);
      setModalEditarOpen(false);
      setItemSelecionado(null);
    } catch (error) {
      console.error('Erro ao editar item do portfólio no Firestore:', error);
      setPortfolio(portfolio.map(item => 
        item.id === itemSelecionado.id ? { ...item, ...itemAtualizado } : item
      ));
      setModalEditarOpen(false);
      setItemSelecionado(null);
    }
  };

  const handleConfirmarDelecao = async () => {
    if (!itemSelecionado) return;

    try {
      await deleteDoc(doc(db, 'portfolio', itemSelecionado.id));
      setModalDeletarOpen(false);
      setItemSelecionado(null);
    } catch (error) {
      console.error('Erro ao deletar item do portfólio no Firestore:', error);
      setPortfolio(portfolio.filter(item => item.id !== itemSelecionado.id));
      setModalDeletarOpen(false);
      setItemSelecionado(null);
    }
  };

  const handleAdicionarItem = async (novoItem: any) => {
    console.log('🚀 handleAdicionarItem chamado com:', novoItem);
    
    const itemData = {
      ...novoItem,
      adminId: user?.uid,
      criadoEm: new Date().toISOString()
    };

    console.log('📦 Dados preparados para salvar:', itemData);

    // Evita gravar base64 (estoura limites do Firestore e do localStorage)
    const hasBase64 =
      (typeof itemData.imagemCapa === 'string' && itemData.imagemCapa.startsWith('data:image/')) ||
      (Array.isArray(itemData.imagensGaleria) && itemData.imagensGaleria.some((u: any) => typeof u === 'string' && u.startsWith('data:image/')));
    if (hasBase64) {
      alert('As imagens precisam ser enviadas antes de salvar (URLs). Tente reenviar as imagens.');
      return;
    }

    try {
      console.log('💾 Tentando salvar no Firestore...');
      const docRef = await addDoc(collection(db, 'portfolio'), itemData);
      console.log('✅ Item de portfólio criado no Firestore:', docRef.id);
      setModalAdicionarOpen(false);
    } catch (error) {
      console.error('❌ Erro ao adicionar item ao portfólio no Firestore:', error);
      console.error('❌ Detalhes do erro:', error);
      
      // Fallback local com tratamento de erro
      try {
        const item: ItemPortfolio = {
          ...itemData,
          id: `PF-${Date.now()}`,
          projetoId: itemData.projetoId || '',
          clienteId: itemData.clienteId || ''
        } as ItemPortfolio;
        
        console.log('🔄 Salvando localmente como fallback:', item);
        setPortfolio([...portfolio, item]);
        setModalAdicionarOpen(false);
        
        // Salvar também no localStorage como backup
        const portfolioAtual = JSON.parse(safeLocalStorageGet('portfolio_backup') || '[]');
        portfolioAtual.push(item);
        safeLocalStorageSet('portfolio_backup', JSON.stringify(portfolioAtual));
        console.log('💾 Item salvo no localStorage como backup');
        
      } catch (localError) {
        console.error('❌ Erro também no fallback local:', localError);
        alert('Erro ao salvar portfólio. Tente novamente.');
      }
    }
  };

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const stats = {
    totalProjetos: portfolio.length,
    projetosDestaque: itensDestaque.length,
    categorias: new Set(portfolio.map(p => p.categoria)).size,
    alcanceTotal: portfolio.reduce((sum, p) => sum + (p.resultados?.alcance || 0), 0)
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    });
  };

  const formatarNumero = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getCategoriaInfo = (categoria: CategoriaPortfolio) => {
    const infos = {
      branding: { label: 'Branding', color: 'purple', icon: Sparkles },
      web: { label: 'Web Design', color: 'blue', icon: Layers },
      social: { label: 'Social Media', color: 'pink', icon: TrendingUp },
      marketing: { label: 'Marketing', color: 'green', icon: Users },
      design: { label: 'Design', color: 'orange', icon: Award },
      video: { label: 'Vídeo', color: 'red', icon: ImageIcon },
      todos: { label: 'Todos', color: 'gray', icon: Grid3x3 }
    };
    return infos[categoria];
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-500">
      {/* Sidebar de Navegação - Apenas se não for visualização de cliente */}
      {!isClientView && <Sidebar />}
      
      {/* Conteúdo Principal */}
      <main className={`flex-1 min-h-screen ${!isClientView ? 'lg:ml-0' : ''}`}>
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isClientView && (
                <button
                  onClick={handleVoltar}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Portfolio Criativo
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isClientView ? 'Conheça nossos trabalhos' : 'Showcase de projetos incríveis'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificacoesBell />
              <ThemeToggle />
              {!isClientView && (
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm('Limpar o cache local do Portfólio? (Isso não apaga dados do sistema)');
                    if (ok) clearPortfolioCache();
                  }}
                  title="Limpar cache do Portfólio (local)"
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {!isClientView && (
                <button
                  onClick={() => setModalAdicionarOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Novo Projeto
                </button>
              )}
            </div>
          </div>
          {cacheNotice && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {cacheNotice}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Projetos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProjetos}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Layers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Destaques</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.projetosDestaque}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categorias</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.categorias}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Grid3x3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Alcance Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatarNumero(stats.alcanceTotal)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ferramentas */}
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Busca */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, descrição ou tags..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Filtros e View Mode */}
            <div className="flex items-center gap-3">
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value as CategoriaPortfolio)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              >
                <option value="todos">Todas Categorias</option>
                <option value="branding">Branding</option>
                <option value="web">Web Design</option>
                <option value="social">Social Media</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="video">Vídeo</option>
              </select>

              <button
                onClick={() => setFilterDestaque(!filterDestaque)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  filterDestaque
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Star className="w-4 h-4" />
                Destaques
              </button>

              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid/List de Portfolio */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioFiltrado.map((item) => {
              const categoriaInfo = getCategoriaInfo(item.categoria);
              const CategoriaIcon = categoriaInfo.icon;

              return (
                <div
                  key={item.id}
                  className="group backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {/* Imagem Capa */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.imagemCapa}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <button 
                          onClick={() => handleVisualizarItem(item)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </button>
                        <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors">
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {item.destaque && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Destaque
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {item.titulo}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.clienteEmpresa}
                        </p>
                      </div>
                      <div className={`p-2 bg-${categoriaInfo.color}-100 dark:bg-${categoriaInfo.color}-900/30 rounded-lg`}>
                        <CategoriaIcon className={`w-5 h-5 text-${categoriaInfo.color}-600 dark:text-${categoriaInfo.color}-400`} />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {item.descricao}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Resultados */}
                    {item.resultados && (
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        {item.resultados.alcance && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Alcance</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatarNumero(item.resultados.alcance)}
                            </p>
                          </div>
                        )}
                        {item.resultados.engajamento && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Engajamento</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatarNumero(item.resultados.engajamento)}
                            </p>
                          </div>
                        )}
                        {item.resultados.roi && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">ROI</p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                              {item.resultados.roi}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatarData(item.dataFinalizacao)}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                          Finalizado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {portfolioFiltrado.map((item) => {
              const categoriaInfo = getCategoriaInfo(item.categoria);
              const CategoriaIcon = categoriaInfo.icon;

              return (
                <div
                  key={item.id}
                  className="group backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Imagem */}
                    <div className="relative w-full md:w-80 h-64 md:h-auto overflow-hidden flex-shrink-0">
                      <img
                        src={item.imagemCapa}
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {item.destaque && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Destaque
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {item.titulo}
                            </h3>
                            <span className={`px-3 py-1 bg-${categoriaInfo.color}-100 dark:bg-${categoriaInfo.color}-900/30 text-${categoriaInfo.color}-700 dark:text-${categoriaInfo.color}-300 rounded-full text-xs font-semibold flex items-center gap-1`}>
                              <CategoriaIcon className="w-3 h-3" />
                              {categoriaInfo.label}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {item.clienteEmpresa}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            {item.descricao}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Resultados */}
                      {item.resultados && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                          {item.resultados.alcance && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Alcance</p>
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {formatarNumero(item.resultados.alcance)}
                              </p>
                            </div>
                          )}
                          {item.resultados.engajamento && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Engajamento</p>
                              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                                {formatarNumero(item.resultados.engajamento)}
                              </p>
                            </div>
                          )}
                          {item.resultados.conversao && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conversão</p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {item.resultados.conversao}%
                              </p>
                            </div>
                          )}
                          {item.resultados.roi && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {item.resultados.roi}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Testemunho */}
                      {item.testemunho && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
                            "{item.testemunho.texto}"
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {item.testemunho.autor.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {item.testemunho.autor}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.testemunho.cargo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatarData(item.dataFinalizacao)}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleVisualizarItem(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Completo
                          </button>
                          <button className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {portfolioFiltrado.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ajuste os filtros ou adicione novos projetos ao portfolio
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      {itemSelecionado && (
        <ModalVisualizarPortfolio
          isOpen={modalVisualizarOpen}
          onClose={handleCloseModalVisualizar}
          item={itemSelecionado}
          onEditar={!isClientView ? handleEditarItem : undefined}
          onDeletar={!isClientView ? handleDeletarItem : undefined}
        />
      )}

      {!isClientView && (
        <>
          <ModalAdicionarPortfolio
            isOpen={modalAdicionarOpen}
            onClose={() => setModalAdicionarOpen(false)}
            onSalvar={handleAdicionarItem}
          />

          {itemSelecionado && (
            <ModalEditarPortfolio
              isOpen={modalEditarOpen}
              onClose={() => {
                setModalEditarOpen(false);
                setItemSelecionado(null);
              }}
              onSalvar={handleSalvarEdicao}
              item={converterItemParaModal(itemSelecionado) as any}
            />
          )}

          {itemSelecionado && (
            <ModalDeletarPortfolio
              isOpen={modalDeletarOpen}
              onClose={() => {
                setModalDeletarOpen(false);
                setItemSelecionado(null);
              }}
              onConfirmar={handleConfirmarDelecao}
              item={itemSelecionado}
            />
          )}

          {/* Tutorial Overlay */}
          <TutorialOverlay page="portfolio" />
        </>
      )}
      </main>
    </div>
  );
};

export default Portfolio;

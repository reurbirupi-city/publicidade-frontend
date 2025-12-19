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
  CheckCircle
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import ModalVisualizarPortfolio from '../components/ModalVisualizarPortfolio';
import ModalAdicionarPortfolio from '../components/ModalAdicionarPortfolio';
import ModalEditarPortfolio from '../components/ModalEditarPortfolio';
import ModalDeletarPortfolio from '../components/ModalDeletarPortfolio';
import { getProjetos, getClientes } from '../services/dataIntegration';

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
  // DADOS MOCK INICIAIS
  // ============================================================================

  const PORTFOLIO_MOCK: ItemPortfolio[] = [
    {
      id: 'PORT-001',
      projetoId: 'PROJ-2025-001',
      clienteId: '1',
      clienteNome: 'Maria Silva',
      clienteEmpresa: 'Tech Innovations',
      titulo: 'Campanha Digital Q1 - Tech Innovations',
      descricao: 'Campanha completa de marketing digital para lançamento de produto tech com foco em geração Z. Incluiu identidade visual, estratégia de conteúdo para Instagram, TikTok e LinkedIn, produção de 50+ artes e 12 vídeos.',
      categoria: 'social',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop'
      ],
      tags: ['Social Media', 'Marketing Digital', 'Branding', 'Conteúdo Visual'],
      destaque: true,
      dataFinalizacao: '2025-12-15',
      resultados: {
        alcance: 250000,
        engajamento: 15000,
        conversao: 8.5,
        roi: '450%'
      },
      testemunho: {
        texto: 'O trabalho superou todas as expectativas! A campanha gerou resultados incríveis e nossa marca ganhou visibilidade que jamais imaginamos.',
        autor: 'Maria Silva',
        cargo: 'CEO Tech Innovations'
      },
      criadoEm: '2025-12-15T10:00:00'
    },
    {
      id: 'PORT-002',
      projetoId: 'PROJ-2025-002',
      clienteId: '2',
      clienteNome: 'João Santos',
      clienteEmpresa: 'Tech Solutions',
      titulo: 'Rebranding Tech Solutions - Identidade Visual Completa',
      descricao: 'Redesign total da marca incluindo novo logo, paleta de cores, tipografia, manual de marca e aplicações em diversos materiais digitais e impressos.',
      categoria: 'branding',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611224885990-ab7363d1f2a8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800&h=600&fit=crop'
      ],
      tags: ['Branding', 'Identidade Visual', 'Logo Design', 'Manual de Marca'],
      destaque: true,
      dataFinalizacao: '2025-12-10',
      resultados: {
        alcance: 50000,
        engajamento: 3500,
        roi: '320%'
      },
      testemunho: {
        texto: 'A nova identidade visual elevou nossa marca a outro patamar. Recebemos elogios de todos os stakeholders!',
        autor: 'João Santos',
        cargo: 'Diretor Tech Solutions'
      },
      criadoEm: '2025-12-10T14:00:00'
    },
    {
      id: 'PORT-003',
      projetoId: 'PROJ-2025-003',
      clienteId: '3',
      clienteNome: 'Ana Costa',
      clienteEmpresa: 'Costa Marketing',
      titulo: 'Website Institucional Costa Marketing',
      descricao: 'Desenvolvimento de website responsivo moderno com CMS, integração com redes sociais, formulários de contato e área de blog.',
      categoria: 'web',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop'
      ],
      tags: ['Web Design', 'Desenvolvimento', 'Responsivo', 'UX/UI'],
      destaque: false,
      dataFinalizacao: '2025-11-30',
      resultados: {
        alcance: 15000,
        conversao: 12.3,
        roi: '280%'
      },
      criadoEm: '2025-11-30T16:00:00'
    },
    {
      id: 'PORT-004',
      projetoId: 'PROJ-2025-004',
      clienteId: '1',
      clienteNome: 'Maria Silva',
      clienteEmpresa: 'Tech Innovations',
      titulo: 'E-commerce Moda Primavera/Verão',
      descricao: 'Plataforma completa de e-commerce com sistema de pagamento, gestão de estoque, painel administrativo e integração com marketplaces.',
      categoria: 'web',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
      ],
      tags: ['E-commerce', 'Desenvolvimento', 'UX/UI', 'Pagamentos'],
      destaque: true,
      dataFinalizacao: '2025-12-05',
      resultados: {
        alcance: 80000,
        conversao: 18.7,
        roi: '520%'
      },
      testemunho: {
        texto: 'A plataforma superou nossas expectativas! As vendas online cresceram 400% no primeiro mês.',
        autor: 'Maria Silva',
        cargo: 'CEO Tech Innovations'
      },
      criadoEm: '2025-12-05T11:00:00'
    },
    {
      id: 'PORT-005',
      projetoId: 'PROJ-2025-005',
      clienteId: '2',
      clienteNome: 'João Santos',
      clienteEmpresa: 'Tech Solutions',
      titulo: 'Campanha de Lançamento Produto Tech',
      descricao: 'Estratégia completa de marketing para lançamento incluindo teaser, vídeos promocionais, landing page e ativações em redes sociais.',
      categoria: 'marketing',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop'
      ],
      tags: ['Marketing', 'Lançamento', 'Vídeo', 'Landing Page'],
      destaque: false,
      dataFinalizacao: '2025-11-25',
      resultados: {
        alcance: 180000,
        engajamento: 22000,
        conversao: 14.2,
        roi: '380%'
      },
      criadoEm: '2025-11-25T09:00:00'
    },
    {
      id: 'PORT-006',
      projetoId: 'PROJ-2025-006',
      clienteId: '3',
      clienteNome: 'Ana Costa',
      clienteEmpresa: 'Costa Marketing',
      titulo: 'Design System para Aplicativo Mobile',
      descricao: 'Criação de design system completo com componentes, guia de estilo, iconografia e protótipos interativos para aplicativo iOS e Android.',
      categoria: 'design',
      autorizadoPublicacao: true,
      imagemCapa: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
      imagensGaleria: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=600&fit=crop'
      ],
      tags: ['Design System', 'UI/UX', 'Mobile', 'Protótipo'],
      destaque: false,
      dataFinalizacao: '2025-11-20',
      resultados: {
        alcance: 25000,
        engajamento: 1800,
        roi: '240%'
      },
      criadoEm: '2025-11-20T13:00:00'
    }
  ];

  const [portfolio, setPortfolio] = useState<ItemPortfolio[]>(() => {
    const storageKey = 'portfolio_v1';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      console.log('✅ Portfolio: Carregado do localStorage');
      return JSON.parse(stored);
    }
    console.log('📦 Portfolio: Usando dados mock iniciais');
    localStorage.setItem(storageKey, JSON.stringify(PORTFOLIO_MOCK));
    return PORTFOLIO_MOCK;
  });

  // Salva no localStorage quando portfolio mudar
  useEffect(() => {
    localStorage.setItem('portfolio_v1', JSON.stringify(portfolio));
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

  const handleEditarItem = () => {
    setModalVisualizarOpen(false);
    setModalEditarOpen(true);
  };

  const handleDeletarItem = () => {
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

  const handleSalvarEdicao = (itemEditado: any) => {
    // Converte o formato do modal para o formato do Portfolio
    const itemAtualizado: ItemPortfolio = {
      ...itemEditado,
      categoria: itemEditado.categoria as CategoriaPortfolio,
      resultados: {
        alcance: itemEditado.alcance ? Number(itemEditado.alcance.replace(/\D/g, '')) : undefined,
        engajamento: itemEditado.engajamento ? Number(itemEditado.engajamento.replace('%', '')) : undefined,
        conversao: itemEditado.conversao ? Number(itemEditado.conversao.replace('%', '')) : undefined,
        roi: itemEditado.roi
      },
      testemunho: itemEditado.testemunhoTexto ? {
        texto: itemEditado.testemunhoTexto,
        autor: itemEditado.testemunhoAutor || '',
        cargo: itemEditado.testemunhoCargo || ''
      } : undefined
    };

    setPortfolio(portfolio.map(item => 
      item.id === itemAtualizado.id ? itemAtualizado : item
    ));
    localStorage.setItem('portfolio_v1', JSON.stringify(
      portfolio.map(item => item.id === itemAtualizado.id ? itemAtualizado : item)
    ));
    setModalEditarOpen(false);
    setItemSelecionado(null);
  };

  const handleConfirmarDelecao = () => {
    if (itemSelecionado) {
      setPortfolio(portfolio.filter(item => item.id !== itemSelecionado.id));
      localStorage.setItem('portfolio_v1', JSON.stringify(
        portfolio.filter(item => item.id !== itemSelecionado.id)
      ));
      setModalDeletarOpen(false);
      setItemSelecionado(null);
    }
  };

  const handleAdicionarItem = (novoItem: any) => {
    const itemCompleto: ItemPortfolio = {
      id: `PORT-${String(portfolio.length + 1).padStart(3, '0')}`,
      projetoId: `PROJ-2025-${String(portfolio.length + 1).padStart(3, '0')}`,
      clienteId: String(portfolio.length + 1),
      clienteNome: novoItem.clienteNome,
      clienteEmpresa: novoItem.clienteEmpresa,
      titulo: novoItem.titulo,
      descricao: novoItem.descricao,
      categoria: novoItem.categoria,
      autorizadoPublicacao: novoItem.autorizadoPublicacao,
      imagemCapa: novoItem.imagemCapa,
      imagensGaleria: novoItem.imagensGaleria,
      tags: novoItem.tags,
      destaque: novoItem.destaque,
      dataFinalizacao: novoItem.dataFinalizacao,
      resultados: novoItem.alcance || novoItem.engajamento ? {
        alcance: novoItem.alcance ? parseInt(novoItem.alcance) : undefined,
        engajamento: novoItem.engajamento ? parseInt(novoItem.engajamento) : undefined,
        conversao: novoItem.conversao ? parseFloat(novoItem.conversao) : undefined,
        roi: novoItem.roi || undefined
      } : undefined,
      testemunho: novoItem.testemunhoTexto ? {
        texto: novoItem.testemunhoTexto,
        autor: novoItem.testemunhoAutor || novoItem.clienteNome,
        cargo: novoItem.testemunhoCargo || 'Cliente'
      } : undefined,
      criadoEm: new Date().toISOString()
    };

    setPortfolio([itemCompleto, ...portfolio]);
    console.log('✅ Item adicionado ao portfolio:', itemCompleto.id);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-500">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVoltar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
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
                  onClick={() => setModalAdicionarOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Novo Projeto
                </button>
              )}
            </div>
          </div>
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
                  <div className="p-6">
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
        </>
      )}
    </div>
  );
};

export default Portfolio;

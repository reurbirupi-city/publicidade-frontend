import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Package,
  DollarSign,
  Clock,
  Star,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Zap,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import ModalCriarEditarServico from '../components/ModalCriarEditarServico';
import { TutorialOverlay } from '../components/TutorialOverlay';

// Tipos
interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  tempo_estimado: string;
  destaque: boolean;
  ativo: boolean;
  recursos: string[];
  padrao?: boolean;
  customizado?: boolean;
}

// Catálogo padrão de serviços
const SERVICOS_PADRAO: Servico[] = [
  // Branding e Identidade Visual
  {
    id: 'srv-001',
    nome: 'Criação de Logo',
    descricao: 'Design de logotipo profissional com manual de aplicação',
    categoria: 'branding',
    preco: 1500,
    tempo_estimado: '7-10 dias',
    destaque: true,
    ativo: true,
    recursos: ['3 propostas iniciais', 'Revisões ilimitadas', 'Manual de marca', 'Arquivos em alta resolução'],
    padrao: true
  },
  {
    id: 'srv-002',
    nome: 'Identidade Visual Completa',
    descricao: 'Branding completo incluindo logo, paleta de cores, tipografia e aplicações',
    categoria: 'branding',
    preco: 4500,
    tempo_estimado: '20-30 dias',
    destaque: true,
    ativo: true,
    recursos: ['Logo + variações', 'Paleta de cores', 'Tipografia', 'Papelaria básica', 'Manual de marca completo'],
    padrao: true
  },
  {
    id: 'srv-003',
    nome: 'Redesign de Marca',
    descricao: 'Modernização e atualização da identidade visual existente',
    categoria: 'branding',
    preco: 2500,
    tempo_estimado: '15-20 dias',
    destaque: false,
    ativo: true,
    recursos: ['Análise da marca atual', 'Propostas de modernização', 'Implementação gradual'],
    padrao: true
  },
  // Social Media
  {
    id: 'srv-004',
    nome: 'Gestão de Redes Sociais - Básico',
    descricao: 'Gerenciamento mensal de 1 rede social com 12 posts',
    categoria: 'social-media',
    preco: 1200,
    tempo_estimado: 'Mensal',
    destaque: false,
    ativo: true,
    recursos: ['12 posts/mês', '1 rede social', 'Calendário editorial', 'Relatório mensal'],
    padrao: true
  },
  {
    id: 'srv-005',
    nome: 'Gestão de Redes Sociais - Completo',
    descricao: 'Gerenciamento mensal de até 3 redes sociais com 30 posts',
    categoria: 'social-media',
    preco: 3500,
    tempo_estimado: 'Mensal',
    destaque: true,
    ativo: true,
    recursos: ['30 posts/mês', 'Até 3 redes sociais', 'Stories diários', 'Calendário editorial', 'Relatório mensal', 'Gestão de comunidade'],
    padrao: true
  },
  {
    id: 'srv-006',
    nome: 'Pack de Posts Instagram',
    descricao: 'Pacote com 15 artes para feed do Instagram',
    categoria: 'social-media',
    preco: 800,
    tempo_estimado: '5-7 dias',
    destaque: false,
    ativo: true,
    recursos: ['15 artes para feed', 'Legendas sugeridas', 'Hashtags otimizadas'],
    padrao: true
  },
  {
    id: 'srv-007',
    nome: 'Estratégia de Conteúdo',
    descricao: 'Planejamento estratégico de conteúdo para redes sociais',
    categoria: 'social-media',
    preco: 2000,
    tempo_estimado: '10-15 dias',
    destaque: false,
    ativo: true,
    recursos: ['Análise de mercado', 'Persona definida', 'Calendário de 3 meses', 'Guidelines de conteúdo'],
    padrao: true
  },
  // Web Development
  {
    id: 'srv-008',
    nome: 'Landing Page',
    descricao: 'Página de conversão otimizada para campanhas',
    categoria: 'web',
    preco: 2500,
    tempo_estimado: '7-10 dias',
    destaque: true,
    ativo: true,
    recursos: ['Design responsivo', 'Otimização SEO básica', 'Formulário de contato', 'Integração com analytics'],
    padrao: true
  },
  {
    id: 'srv-009',
    nome: 'Site Institucional',
    descricao: 'Website completo com até 10 páginas',
    categoria: 'web',
    preco: 6000,
    tempo_estimado: '20-30 dias',
    destaque: true,
    ativo: true,
    recursos: ['Até 10 páginas', 'Design responsivo', 'SEO completo', 'Blog integrado', 'Painel administrativo'],
    padrao: true
  },
  {
    id: 'srv-010',
    nome: 'E-commerce Básico',
    descricao: 'Loja virtual com até 50 produtos',
    categoria: 'web',
    preco: 8000,
    tempo_estimado: '30-45 dias',
    destaque: false,
    ativo: true,
    recursos: ['Até 50 produtos', 'Carrinho de compras', 'Checkout seguro', 'Integração com pagamentos', 'Painel de gestão'],
    padrao: true
  },
  {
    id: 'srv-011',
    nome: 'Manutenção de Site',
    descricao: 'Serviço mensal de manutenção e atualizações',
    categoria: 'web',
    preco: 500,
    tempo_estimado: 'Mensal',
    destaque: false,
    ativo: true,
    recursos: ['Atualizações de segurança', 'Backup semanal', 'Pequenas alterações', 'Suporte por email'],
    padrao: true
  },
  // Marketing Digital
  {
    id: 'srv-012',
    nome: 'Gestão de Google Ads',
    descricao: 'Gerenciamento mensal de campanhas no Google Ads',
    categoria: 'marketing',
    preco: 1500,
    tempo_estimado: 'Mensal',
    destaque: true,
    ativo: true,
    recursos: ['Criação de campanhas', 'Otimização contínua', 'Relatórios semanais', 'Ajuste de lances', '+ investimento em mídia'],
    padrao: true
  },
  {
    id: 'srv-013',
    nome: 'Gestão de Meta Ads',
    descricao: 'Gerenciamento mensal de campanhas no Facebook e Instagram',
    categoria: 'marketing',
    preco: 1200,
    tempo_estimado: 'Mensal',
    destaque: true,
    ativo: true,
    recursos: ['Criação de campanhas', 'Públicos personalizados', 'A/B Testing', 'Relatórios mensais', '+ investimento em mídia'],
    padrao: true
  },
  {
    id: 'srv-014',
    nome: 'Email Marketing',
    descricao: 'Configuração e gestão de campanhas de email',
    categoria: 'marketing',
    preco: 800,
    tempo_estimado: 'Mensal',
    destaque: false,
    ativo: true,
    recursos: ['4 campanhas/mês', 'Templates personalizados', 'Automações básicas', 'Relatório de performance'],
    padrao: true
  },
  {
    id: 'srv-015',
    nome: 'SEO Completo',
    descricao: 'Otimização completa para mecanismos de busca',
    categoria: 'marketing',
    preco: 2500,
    tempo_estimado: 'Mensal',
    destaque: false,
    ativo: true,
    recursos: ['Auditoria técnica', 'Otimização on-page', 'Link building', 'Relatórios mensais', 'Análise de concorrência'],
    padrao: true
  },
  // Design Gráfico
  {
    id: 'srv-016',
    nome: 'Design de Cartão de Visita',
    descricao: 'Criação de cartão de visita profissional',
    categoria: 'design',
    preco: 300,
    tempo_estimado: '3-5 dias',
    destaque: false,
    ativo: true,
    recursos: ['2 propostas iniciais', 'Frente e verso', 'Arquivo para impressão'],
    padrao: true
  },
  {
    id: 'srv-017',
    nome: 'Design de Apresentação',
    descricao: 'Criação de apresentação profissional até 30 slides',
    categoria: 'design',
    preco: 1200,
    tempo_estimado: '5-7 dias',
    destaque: false,
    ativo: true,
    recursos: ['Até 30 slides', 'Template personalizado', 'Ícones e gráficos', 'Arquivo editável'],
    padrao: true
  },
  {
    id: 'srv-018',
    nome: 'Design de Catálogo/Folder',
    descricao: 'Criação de material impresso para divulgação',
    categoria: 'design',
    preco: 800,
    tempo_estimado: '5-7 dias',
    destaque: false,
    ativo: true,
    recursos: ['Design personalizado', 'Até 8 páginas', 'Arquivo para impressão', 'Revisões incluídas'],
    padrao: true
  },
  {
    id: 'srv-019',
    nome: 'Design de Embalagem',
    descricao: 'Criação de design de embalagem para produtos',
    categoria: 'design',
    preco: 2000,
    tempo_estimado: '10-15 dias',
    destaque: false,
    ativo: true,
    recursos: ['Mockups 3D', 'Arquivo para produção', 'Adequação às normas', 'Revisões incluídas'],
    padrao: true
  },
  // Vídeo e Animação
  {
    id: 'srv-020',
    nome: 'Vídeo Institucional',
    descricao: 'Produção de vídeo institucional até 2 minutos',
    categoria: 'video',
    preco: 5000,
    tempo_estimado: '15-20 dias',
    destaque: false,
    ativo: true,
    recursos: ['Roteiro', 'Captação de imagens', 'Edição profissional', 'Trilha sonora', 'Correção de cor'],
    padrao: true
  },
  {
    id: 'srv-021',
    nome: 'Motion Graphics',
    descricao: 'Animação com motion graphics até 1 minuto',
    categoria: 'video',
    preco: 2500,
    tempo_estimado: '10-15 dias',
    destaque: false,
    ativo: true,
    recursos: ['Storyboard', 'Animação 2D', 'Trilha sonora', 'Locução opcional'],
    padrao: true
  },
  {
    id: 'srv-022',
    nome: 'Edição de Vídeo para Redes',
    descricao: 'Pacote com 10 vídeos editados para redes sociais',
    categoria: 'video',
    preco: 1500,
    tempo_estimado: '7-10 dias',
    destaque: false,
    ativo: true,
    recursos: ['10 vídeos curtos', 'Cortes dinâmicos', 'Legendas', 'Música de fundo'],
    padrao: true
  }
];

// Mapeamento de categorias
const CATEGORIAS: Record<string, { nome: string; cor: string; icone: React.ReactNode }> = {
  'branding': { nome: 'Branding', cor: 'purple', icone: <Award className="w-4 h-4" /> },
  'social-media': { nome: 'Social Media', cor: 'pink', icone: <Zap className="w-4 h-4" /> },
  'web': { nome: 'Web', cor: 'blue', icone: <Package className="w-4 h-4" /> },
  'marketing': { nome: 'Marketing', cor: 'green', icone: <TrendingUp className="w-4 h-4" /> },
  'design': { nome: 'Design', cor: 'orange', icone: <Star className="w-4 h-4" /> },
  'video': { nome: 'Vídeo', cor: 'red', icone: <Eye className="w-4 h-4" /> }
};

const Servicos: React.FC = () => {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [showModal, setShowModal] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Carregar serviços do Firestore e localStorage
  const carregarServicos = async () => {
    setLoading(true);
    try {
      // Primeiro carregar do localStorage (cache)
      const cached = localStorage.getItem('servicos_catalogo');
      if (cached) {
        setServicos(JSON.parse(cached));
      }

      // Depois sincronizar com Firestore
      const servicosRef = collection(db, 'servicos_catalogo');
      const snapshot = await getDocs(servicosRef);
      
      if (snapshot.empty) {
        // Primeiro acesso - salvar serviços padrão no Firestore
        for (const servico of SERVICOS_PADRAO) {
          await setDoc(doc(db, 'servicos_catalogo', servico.id), servico);
        }
        setServicos(SERVICOS_PADRAO);
        localStorage.setItem('servicos_catalogo', JSON.stringify(SERVICOS_PADRAO));
      } else {
        const servicosFirestore = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Servico[];
        setServicos(servicosFirestore);
        localStorage.setItem('servicos_catalogo', JSON.stringify(servicosFirestore));
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      // Fallback para serviços padrão se falhar
      setServicos(SERVICOS_PADRAO);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarServicos();
  }, []);

  // Salvar serviço (criar ou editar)
  const salvarServico = async (servico: Servico) => {
    try {
      await setDoc(doc(db, 'servicos_catalogo', servico.id), servico);
      await carregarServicos();
      setShowModal(false);
      setServicoEditando(null);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço. Tente novamente.');
    }
  };

  // Deletar serviço
  const deletarServico = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'servicos_catalogo', id));
      await carregarServicos();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      alert('Erro ao deletar serviço. Tente novamente.');
    }
  };

  // Handlers
  const handleCreate = () => {
    setServicoEditando(null);
    setShowModal(true);
  };

  const handleEdit = (servico: Servico) => {
    setServicoEditando(servico);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deletarServico(showDeleteConfirm);
    }
  };

  const handleSave = (dadosServico: Partial<Servico>) => {
    const id = servicoEditando?.id || `srv-custom-${Date.now()}`;
    const servico: Servico = {
      id,
      nome: dadosServico.nome || '',
      descricao: dadosServico.descricao || '',
      categoria: dadosServico.categoria || 'design',
      preco: dadosServico.preco || 0,
      tempo_estimado: dadosServico.tempo_estimado || '',
      destaque: dadosServico.destaque || false,
      ativo: dadosServico.ativo !== false,
      recursos: dadosServico.recursos || [],
      padrao: servicoEditando?.padrao || false,
      customizado: !servicoEditando?.padrao
    };
    salvarServico(servico);
  };

  // Filtrar serviços
  const filteredServicos = servicos.filter(servico => {
    const matchSearch = servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       servico.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === 'todas' || servico.categoria === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  // Estatísticas
  const stats = {
    total: servicos.length,
    ativos: servicos.filter(s => s.ativo).length,
    destaque: servicos.filter(s => s.destaque).length,
    customizados: servicos.filter(s => s.customizado).length
  };

  // Obter cor do badge da categoria
  const getCategoriaColor = (categoria: string) => {
    const cores: Record<string, string> = {
      'branding': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'social-media': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'web': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'marketing': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'design': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'video': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return cores[categoria] || 'bg-gray-100 text-gray-800';
  };

  // Obter cor da borda esquerda baseada na categoria
  const getCategoriaBorderColor = (categoria: string) => {
    const cores: Record<string, string> = {
      'branding': 'border-l-purple-500',
      'social-media': 'border-l-pink-500',
      'web': 'border-l-blue-500',
      'marketing': 'border-l-green-500',
      'design': 'border-l-orange-500',
      'video': 'border-l-red-500'
    };
    return cores[categoria] || 'border-l-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header com Navegação */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gerencie os serviços oferecidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Serviço
              </button>
              <ThemeToggle />
              <NotificacoesBell />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.ativos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Destaque</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.destaque}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customizados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.customizados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="todas">Todas as Categorias</option>
            {Object.entries(CATEGORIAS).map(([key, { nome }]) => (
              <option key={key} value={key}>{nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServicos.map(servico => (
          <div
            key={servico.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${getCategoriaBorderColor(servico.categoria)} overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${!servico.ativo ? 'opacity-60' : ''}`}
          >
            {/* Header do Card */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{servico.nome}</h3>
                    {servico.destaque && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {servico.padrao && (
                      <span title="Serviço padrão do sistema">
                        <Lock className="w-3 h-3 text-gray-400" />
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoriaColor(servico.categoria)}`}>
                    {CATEGORIAS[servico.categoria]?.icone}
                    {CATEGORIAS[servico.categoria]?.nome || servico.categoria}
                  </span>
                </div>
                {!servico.ativo && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    Inativo
                  </span>
                )}
              </div>
            </div>

            {/* Body do Card */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{servico.descricao}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">R$ {servico.preco.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{servico.tempo_estimado}</span>
                </div>
              </div>

              {/* Recursos */}
              {servico.recursos && servico.recursos.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Inclui:</p>
                  <div className="flex flex-wrap gap-1">
                    {servico.recursos.slice(0, 3).map((recurso, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {recurso}
                      </span>
                    ))}
                    {servico.recursos.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        +{servico.recursos.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Card - Ações */}
            <div className="p-4 pt-0 flex items-center justify-end gap-2">
              <button
                onClick={() => handleEdit(servico)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Editar serviço"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {!servico.padrao && (
                <button
                  onClick={() => handleDelete(servico.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Deletar serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem se não houver serviços */}
      {filteredServicos.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || categoriaFiltro !== 'todas'
              ? 'Tente ajustar os filtros de busca'
              : 'Clique em "Novo Serviço" para adicionar o primeiro serviço'}
          </p>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showModal && (
        <ModalCriarEditarServico
          servico={servicoEditando}
          categorias={Object.entries(CATEGORIAS).map(([key, { nome }]) => ({ id: key, nome }))}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setServicoEditando(null);
          }}
        />
      )}

      {/* Modal de Confirmação de Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay page="servicos" />
      </div>
    </div>
  );
};

export default Servicos;

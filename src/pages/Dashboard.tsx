import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Megaphone, 
  Image,
  TrendingUp,
  Clock,
  AlertCircle,
  Sparkles,
  LogOut,
  Home,
  ArrowUpRight,
  Activity,
  Zap,
  Target,
  ChevronRight,
  Package,
  Bell,
  Settings,
  Plus,
  BarChart3,
  Cpu,
  Crown,
  UserPlus,
  Link2,
  Copy,
  Check,
  FileText,
  MessageSquare
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import ModalGestaoAdmins from '../components/ModalGestaoAdmins';
import { TutorialOverlay, TutorialSettingsButton } from '../components/TutorialOverlay';
import { getSystemStats } from '../services/dataIntegration';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import { isWebmaster, getAdminByEmail, Admin } from '../services/adminService';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showGestaoAdmins, setShowGestaoAdmins] = useState(false);
  const [adminData, setAdminData] = useState<Admin | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [linkAdminCopiado, setLinkAdminCopiado] = useState(false);
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: 'success' | 'info' | 'warning';
    message: string;
    time: string;
    icon: React.ComponentType<{ className?: string }>;
  }>>([]);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { setUserType } = useTutorial();
  const userIsWebmaster = user?.email ? isWebmaster(user.email) : false;
  
  // Definir tipo de usuário como admin para o tutorial
  useEffect(() => {
    setUserType('admin');
  }, [setUserType]);
  
  // Carrega estatísticas integradas do sistema
  const systemStats = getSystemStats();

  // Função para formatar tempo relativo
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  // Buscar atividades recentes do Firebase
  useEffect(() => {
    const buscarAtividades = async () => {
      try {
        const atividadesReais: Array<{
          id: string;
          type: 'success' | 'info' | 'warning';
          message: string;
          time: string;
          icon: React.ComponentType<{ className?: string }>;
          timestamp: Date;
        }> = [];

        // Buscar projetos recentes
        const projetosQuery = query(
          collection(db, 'projetos'),
          orderBy('dataCriacao', 'desc'),
          limit(3)
        );
        const projetosSnap = await getDocs(projetosQuery);
        projetosSnap.forEach(doc => {
          const data = doc.data();
          const dataCriacao = data.dataCriacao instanceof Timestamp 
            ? data.dataCriacao.toDate() 
            : new Date(data.dataCriacao);
          atividadesReais.push({
            id: `proj-${doc.id}`,
            type: 'success',
            message: `Projeto criado: ${data.nome || data.titulo || 'Novo projeto'}`,
            time: formatTimeAgo(dataCriacao),
            icon: Briefcase,
            timestamp: dataCriacao
          });
        });

        // Buscar solicitações recentes
        const solicitacoesQuery = query(
          collection(db, 'solicitacoes_clientes'),
          orderBy('dataCriacao', 'desc'),
          limit(3)
        );
        const solicitacoesSnap = await getDocs(solicitacoesQuery);
        solicitacoesSnap.forEach(doc => {
          const data = doc.data();
          const dataCriacao = data.dataCriacao instanceof Timestamp 
            ? data.dataCriacao.toDate() 
            : new Date(data.dataCriacao);
          atividadesReais.push({
            id: `sol-${doc.id}`,
            type: 'info',
            message: `Nova solicitação: ${data.tipo || data.servico || 'Solicitação de cliente'}`,
            time: formatTimeAgo(dataCriacao),
            icon: MessageSquare,
            timestamp: dataCriacao
          });
        });

        // Buscar transações financeiras recentes
        const financeiroQuery = query(
          collection(db, 'financeiro'),
          orderBy('data', 'desc'),
          limit(3)
        );
        const financeiroSnap = await getDocs(financeiroQuery);
        financeiroSnap.forEach(doc => {
          const data = doc.data();
          const dataTransacao = data.data instanceof Timestamp 
            ? data.data.toDate() 
            : new Date(data.data);
          const isPago = data.status === 'pago' || data.pago;
          atividadesReais.push({
            id: `fin-${doc.id}`,
            type: isPago ? 'success' : 'warning',
            message: isPago 
              ? `Pagamento recebido: ${data.descricao || 'Transação'}` 
              : `Pagamento pendente: ${data.descricao || 'Transação'}`,
            time: formatTimeAgo(dataTransacao),
            icon: DollarSign,
            timestamp: dataTransacao
          });
        });

        // Buscar conteúdos de social media recentes
        const socialQuery = query(
          collection(db, 'socialMedia'),
          orderBy('dataCriacao', 'desc'),
          limit(2)
        );
        const socialSnap = await getDocs(socialQuery);
        socialSnap.forEach(doc => {
          const data = doc.data();
          const dataCriacao = data.dataCriacao instanceof Timestamp 
            ? data.dataCriacao.toDate() 
            : new Date(data.dataCriacao);
          atividadesReais.push({
            id: `social-${doc.id}`,
            type: 'success',
            message: `Post ${data.status === 'publicado' ? 'publicado' : 'agendado'}: ${data.titulo || data.plataforma || 'Conteúdo'}`,
            time: formatTimeAgo(dataCriacao),
            icon: Megaphone,
            timestamp: dataCriacao
          });
        });

        // Ordenar por timestamp e pegar os 5 mais recentes
        atividadesReais.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const top5 = atividadesReais.slice(0, 5).map(({ timestamp, ...rest }) => rest);
        
        // Se não houver atividades, mostrar mensagem padrão
        if (top5.length === 0) {
          setActivities([{
            id: 'empty',
            type: 'info',
            message: 'Nenhuma atividade recente',
            time: 'Aguardando dados...',
            icon: Activity
          }]);
        } else {
          setActivities(top5);
        }
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        setActivities([{
          id: 'error',
          type: 'warning',
          message: 'Erro ao carregar atividades',
          time: 'Tente novamente',
          icon: AlertCircle
        }]);
      }
    };

    buscarAtividades();
  }, []);

  // Carregar dados do admin logado
  useEffect(() => {
    const carregarAdmin = async () => {
      if (user?.email) {
        const admin = await getAdminByEmail(user.email);
        setAdminData(admin);
      }
    };
    carregarAdmin();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  const stats = [
    { 
      label: 'Clientes Ativos', 
      value: systemStats.clientesAtivos.toString(), 
      change: `${systemStats.totalClientes} total`, 
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Projetos em Andamento', 
      value: systemStats.projetosAtivos.toString(), 
      change: `${systemStats.totalProjetos} total`, 
      changeType: 'positive' as const,
      icon: Briefcase,
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Receita Contratada', 
      value: `R$ ${(systemStats.valorTotalContratos / 1000).toFixed(1)}K`, 
      change: `${((systemStats.valorTotalPago / systemStats.valorTotalContratos) * 100).toFixed(0)}% recebido`, 
      changeType: 'positive' as const,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Eventos Hoje', 
      value: systemStats.eventosHoje.toString(), 
      change: `${systemStats.totalEventos} total`, 
      changeType: 'positive' as const,
      icon: Calendar,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const modules = [
    {
      icon: Users,
      title: 'CRM',
      description: 'Gestão de Clientes',
      count: `${systemStats.clientesAtivos} ativos`,
      gradient: 'from-blue-500 to-cyan-500',
      path: '/crm',
      status: 'active' as const
    },
    {
      icon: Briefcase,
      title: 'Projetos',
      description: 'Gerenciamento',
      count: `${systemStats.projetosAtivos} ativos`,
      gradient: 'from-purple-500 to-pink-500',
      path: '/projetos',
      status: 'active' as const
    },
    {
      icon: DollarSign,
      title: 'Financeiro',
      description: 'Controle Financeiro',
      count: `R$ ${(systemStats.valorTotalContratos / 1000).toFixed(1)}K`,
      gradient: 'from-green-500 to-emerald-500',
      path: '/financeiro',
      status: 'normal' as const
    },
    {
      icon: Calendar,
      title: 'Agenda',
      description: 'Compromissos',
      count: `${systemStats.eventosHoje} hoje`,
      gradient: 'from-orange-500 to-red-500',
      path: '/agenda',
      status: systemStats.eventosHoje > 0 ? 'warning' as const : 'normal' as const
    },
    {
      icon: Megaphone,
      title: 'Social Media',
      description: 'Gestão de Redes',
      count: '8 campanhas',
      gradient: 'from-pink-500 to-rose-500',
      path: '/social-media',
      status: 'active' as const
    },
    {
      icon: Image,
      title: 'Portfólio',
      description: 'Trabalhos',
      count: `${systemStats.totalProjetos} projetos`,
      gradient: 'from-indigo-500 to-purple-500',
      path: '/portfolio',
      status: 'normal' as const
    },
    {
      icon: Package,
      title: 'Serviços',
      description: 'Catálogo',
      count: '21+ serviços',
      gradient: 'from-teal-500 to-cyan-500',
      path: '/servicos',
      status: 'normal' as const
    },
    {
      icon: Bell,
      title: 'Solicitações',
      description: 'Pedidos de Clientes',
      count: '0 novas',
      gradient: 'from-red-500 to-orange-500',
      path: '/solicitacoes',
      status: 'normal' as const
    }
  ];

  const tips = [
    'Use atalhos de teclado para agilizar seu trabalho',
    'Revise seus projetos semanalmente para manter o controle',
    'Configure lembretes para não perder prazos importantes'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-gray-950 dark:via-purple-950/30 dark:to-blue-950/30 transition-colors duration-500"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-purple-500/30 sticky top-0 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Cpu className="w-8 h-8 text-purple-500 animate-pulse" />
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    GESTÃO CRIATIVA
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Dashboard Neural</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">{/* Clock */}
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-mono">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString('pt-BR')}
              </div>

              <ThemeToggle />

              {/* Notifications */}
              <NotificacoesBell />

              {/* Tutorial Settings */}
              <TutorialSettingsButton />

              {/* Settings */}
              <div className="relative z-[60]" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSettingsMenu 
                      ? 'bg-purple-100 dark:bg-purple-900/50' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Settings className={`w-5 h-5 transition-transform ${
                    showSettingsMenu ? 'rotate-90 text-purple-600' : 'text-gray-600 dark:text-gray-300'
                  }`} />
                </button>

                {/* Settings Dropdown */}
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Configurações</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>

                    {/* Opção de Gestão de Admins - apenas para webmaster */}
                    {userIsWebmaster && (
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          setShowGestaoAdmins(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
                      >
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Gestão de Admins</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cadastrar e gerenciar administradores</p>
                        </div>
                      </button>
                    )}

                    {/* Link de Convite para Clientes - para todos os admins */}
                    {adminData?.codigoConvite && (
                      <div className="mx-4 my-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">LINK PARA CLIENTES</span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500 mb-2 break-all font-mono">
                          {window.location.origin}/register?ref={adminData.codigoConvite}
                        </p>
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/register?ref=${adminData.codigoConvite}`;
                            navigator.clipboard.writeText(link);
                            setLinkCopiado(true);
                            setTimeout(() => setLinkCopiado(false), 2000);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all"
                        >
                          {linkCopiado ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Link Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copiar Link de Cadastro
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Badge de Webmaster com Link para Novos Admins */}
                    {userIsWebmaster && (
                      <div className="mx-4 my-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">WEBMASTER</span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mb-2">Acesso total ao sistema</p>
                        
                        {/* Link para cadastrar novos admins */}
                        {adminData?.codigoConvite && (
                          <>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-mono break-all mb-2">
                              {window.location.origin}/register?ref={adminData.codigoConvite}&type=admin
                            </p>
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/register?ref=${adminData.codigoConvite}&type=admin`;
                                navigator.clipboard.writeText(link);
                                setLinkAdminCopiado(true);
                                setTimeout(() => setLinkAdminCopiado(false), 2000);
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all"
                            >
                              {linkAdminCopiado ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Link de Admin Copiado!
                                </>
                              ) : (
                                <>
                                  <Crown className="w-3.5 h-3.5" />
                                  Copiar Link para Novo Admin
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-600 dark:text-gray-300"
                      >
                        <Home className="w-4 h-4" />
                        <span className="text-sm">Voltar ao Início</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Home */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Início</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Bem-vindo de volta! 👋
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Aqui está um resumo do seu dia</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl" 
                   style={{ background: `linear-gradient(135deg, ${stat.gradient})` }}></div>
              <div className="relative backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-l-4 border-l-purple-500 dark:border-l-amber-500 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:border-l-purple-600 dark:hover:border-l-amber-400 hover:shadow-purple-500/20 dark:hover:shadow-amber-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-500' : 
                    stat.changeType === 'negative' ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Modules Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Módulos</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all hover:scale-105">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Novo</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {modules.map((module, index) => (
                <div
                  key={index}
                  onClick={() => navigate(module.path)}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl" 
                       style={{ background: `linear-gradient(135deg, ${module.gradient})` }}></div>
                  <div className="relative backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-l-4 border-l-blue-500 dark:border-l-amber-500 rounded-lg p-6 transition-all hover:scale-105 hover:shadow-2xl hover:border-l-blue-600 dark:hover:border-l-amber-400 hover:shadow-blue-500/20 dark:hover:shadow-amber-500/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg`}>
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        module.status === 'active' ? 'bg-green-500 animate-pulse' :
                        module.status === 'warning' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`}></div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{module.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-600 dark:text-amber-400">{module.count}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 dark:group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-t-4 border-t-pink-500 dark:border-t-amber-500 rounded-xl p-6 transition-all hover:border-t-pink-600 dark:hover:border-t-amber-400">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-pink-500 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Atividades Recentes</h3>
              </div>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      activity.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      activity.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-amber-500/10 dark:to-orange-500/10 border border-purple-200 dark:border-gray-800 border-t-4 border-t-purple-500 dark:border-t-amber-500 rounded-xl p-6 transition-all hover:border-t-purple-600 dark:hover:border-t-amber-400">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dicas Rápidas</h3>
              </div>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-purple-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-t-4 border-t-green-500 dark:border-t-amber-500 rounded-xl p-6 transition-all hover:border-t-green-600 dark:hover:border-t-amber-400">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-green-500 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Status do Sistema</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                  <span className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <span className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sync</span>
                  <span className="flex items-center gap-2 text-blue-500 text-sm font-semibold">
                    <Zap className="w-3 h-3" />
                    Sincronizado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Gestão de Admins */}
      <ModalGestaoAdmins
        isOpen={showGestaoAdmins}
        onClose={() => setShowGestaoAdmins(false)}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay page="dashboard" />
    </div>
  );
};

export default Dashboard;

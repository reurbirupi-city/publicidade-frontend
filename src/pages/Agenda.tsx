import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bell,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
  Target,
  Users,
  Briefcase,
  Zap,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Rocket,
  Flame,
  Coffee,
  Sun,
  Moon,
  Sunset,
  Star,
  Award,
  BarChart3,
  ArrowUpRight,
  MessageSquare,
  FileText,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Timer,
  Activity,
  Eye,
  ExternalLink,
  Settings,
  Crown,
  Link2,
  Copy,
  Check
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import ModalGestaoAdmins from '../components/ModalGestaoAdmins';
import { TutorialOverlay } from '../components/TutorialOverlay';
import ModalCriarEvento, { NovoEvento } from '../components/ModalCriarEvento';
import { useAuth } from '../contexts/AuthContext';
import { getProjetos, getClientes, getSystemStats, getEventos, saveEventos } from '../services/dataIntegration';
import { isWebmaster, getAdminByEmail, Admin } from '../services/adminService';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import { notificarEventoAgenda } from '../services/notificacoes';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// ============================================================================
// INTERFACES
// ============================================================================

interface RecorrenciaEvento {
  ativa: boolean;
  tipo: 'diaria' | 'semanal' | 'mensal';
  intervalo: number;
  diasSemana?: number[];
  diaDoMes?: number;
  dataFim?: string;
  ocorrencias?: number;
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: 'reuniao' | 'deadline' | 'foco' | 'ligacao' | 'outro';
  prioridade: 'alta' | 'media' | 'baixa';
  cliente?: string;
  projeto?: string;
  projetoId?: string;
  etapaProjeto?: 'briefing' | 'criacao' | 'revisao' | 'ajustes' | 'aprovacao' | 'entrega';
  local?: string;
  participantes?: string[];
  cor: string;
  concluido: boolean;
  alertaMinutos?: number;
  recorrencia?: RecorrenciaEvento;
  eventoRecorrentePaiId?: string;
  templateId?: string;
  adminId?: string;
}

interface ProjetoIntegrado {
  id: string;
  titulo: string;
  clienteNome: string;
  clienteEmpresa: string;
  progresso: number;
  prazoEstimado: string;
  status: string;
  prioridade: string;
  valorContratado: number;
}

interface TransacaoPendente {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  clienteNome?: string;
  status: string;
  tipo: 'receita' | 'despesa';
}

// ============================================================================
// COMPONENTE PRINCIPAL - COMMAND CENTER
// ============================================================================

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notificacoes } = useNotificacoes();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState(0);
  const [isFocusRunning, setIsFocusRunning] = useState(false);

  // Estados para Gestão de Admins e Convites
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showGestaoAdmins, setShowGestaoAdmins] = useState(false);
  const [adminData, setAdminData] = useState<Admin | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [linkAdminCopiado, setLinkAdminCopiado] = useState(false);
  const settingsRef = React.useRef<HTMLDivElement>(null);
  const userIsWebmaster = user?.email ? isWebmaster(user.email) : false;

  // Eventos - Carregados do Firestore com fallback para localStorage
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  // Listener em tempo real para eventos do Firestore
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingEventos(true);
    const eventosRef = collection(db, 'eventos');
    
    // Se for webmaster, vê tudo. Se não, vê apenas os seus.
    const q = userIsWebmaster 
      ? query(eventosRef)
      : query(eventosRef, where('adminId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evento[];
      
      setEventos(docs);
      setLoadingEventos(false);
      
      // Sincronizar com localStorage para offline/cache
      saveEventos(docs);
    }, (error) => {
      console.error('Erro ao escutar eventos:', error);
      // Fallback para localStorage em caso de erro
      const saved = localStorage.getItem('agendaEventos');
      if (saved) setEventos(JSON.parse(saved));
      setLoadingEventos(false);
    });

    return () => unsubscribe();
  }, [user?.uid, userIsWebmaster]);

  // Transações pendentes - Carregadas do localStorage
  const [transacoesPendentes, setTransacoesPendentes] = useState<TransacaoPendente[]>(() => {
    const saved = localStorage.getItem('financeiro_v1');
    if (saved) {
      const allTransacoes = JSON.parse(saved);
      return allTransacoes
        .filter((t: any) => t.status === 'pendente')
        .map((t: any) => ({
          id: t.id,
          descricao: t.descricao,
          valor: t.valor,
          dataVencimento: t.dataVencimento,
          clienteNome: t.clienteNome,
          status: t.status,
          tipo: t.tipo
        }));
    }
    return [];
  });

  // Data integration
  const projetosBase = getProjetos();
  const projetos: ProjetoIntegrado[] = projetosBase.map(p => ({
    ...p,
    progresso: (p as any).progresso || 0,
    prazoEstimado: (p as any).prazoEstimado || p.dataInicio,
    prioridade: (p as any).prioridade || 'media'
  }));
  const clientes = getClientes();
  const systemStats = getSystemStats();

  // Função auxiliar para converter Date para string sem problema de fuso horário
  const dateToLocalString = (date: Date): string => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

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

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Focus Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusRunning && focusTimer > 0) {
      interval = setInterval(() => {
        setFocusTimer(prev => prev - 1);
      }, 1000);
    } else if (focusTimer === 0 && isFocusRunning) {
      setIsFocusRunning(false);
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTimer]);

  // Calcular período do dia
  const getPeriodoDia = () => {
    const hora = currentTime.getHours();
    if (hora >= 5 && hora < 12) return { label: 'Bom dia', icon: Sun, gradient: 'from-amber-400 to-orange-500' };
    if (hora >= 12 && hora < 18) return { label: 'Boa tarde', icon: Sunset, gradient: 'from-orange-400 to-red-500' };
    return { label: 'Boa noite', icon: Moon, gradient: 'from-indigo-500 to-purple-600' };
  };

  const periodo = getPeriodoDia();

  // Eventos do dia atual
  const eventosHoje = useMemo(() => {
    const hoje = dateToLocalString(currentDate);
    return eventos.filter(e => e.data === hoje).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [eventos, currentDate]);

  // Próximo evento
  const proximoEvento = useMemo(() => {
    const agora = currentTime.getHours() * 60 + currentTime.getMinutes();
    return eventosHoje.find(e => {
      const [hora, minuto] = e.horaInicio.split(':').map(Number);
      return hora * 60 + minuto > agora && !e.concluido;
    });
  }, [eventosHoje, currentTime]);

  // Tempo até próximo evento
  const tempoAteProximo = useMemo(() => {
    if (!proximoEvento) return null;
    const [hora, minuto] = proximoEvento.horaInicio.split(':').map(Number);
    const eventoMinutos = hora * 60 + minuto;
    const agoraMinutos = currentTime.getHours() * 60 + currentTime.getMinutes();
    const diff = eventoMinutos - agoraMinutos;
    if (diff <= 0) return null;
    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return horas > 0 ? `${horas}h ${mins}min` : `${mins} min`;
  }, [proximoEvento, currentTime]);

  // Progresso do dia
  const progressoDia = useMemo(() => {
    const total = eventosHoje.length;
    const concluidos = eventosHoje.filter(e => e.concluido).length;
    return total > 0 ? Math.round((concluidos / total) * 100) : 0;
  }, [eventosHoje]);

  // Cores dos eventos
  const getEventosCor = (cor: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'border-blue-500 bg-blue-500/10',
      purple: 'border-purple-500 bg-purple-500/10',
      red: 'border-red-500 bg-red-500/10',
      green: 'border-green-500 bg-green-500/10',
      yellow: 'border-yellow-500 bg-yellow-500/10',
      pink: 'border-pink-500 bg-pink-500/10',
      orange: 'border-orange-500 bg-orange-500/10'
    };
    return colorMap[cor] || colorMap.blue;
  };

  const getEventoGradient = (cor: string) => {
    const gradients: { [key: string]: string } = {
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-pink-500',
      red: 'from-red-500 to-orange-500',
      green: 'from-green-500 to-emerald-500',
      yellow: 'from-yellow-500 to-amber-500',
      pink: 'from-pink-500 to-rose-500',
      orange: 'from-orange-500 to-red-500'
    };
    return gradients[cor] || gradients.blue;
  };

  const getTipoIcon = (tipo: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      reuniao: Users,
      deadline: AlertCircle,
      foco: Target,
      ligacao: MessageSquare,
      outro: Calendar
    };
    return icons[tipo] || Calendar;
  };

  const toggleConcluido = async (id: string) => {
    const evento = eventos.find(e => e.id === id);
    if (!evento) return;

    try {
      await updateDoc(doc(db, 'eventos', id), {
        concluido: !evento.concluido
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      // Fallback local se falhar Firestore
      setEventos(eventos.map(e => 
        e.id === id ? { ...e, concluido: !e.concluido } : e
      ));
    }
  };

  // Função para criar novo evento a partir do modal
  const handleCriarEvento = async (novoEvento: NovoEvento) => {
    const eventoData = {
      ...novoEvento,
      cliente: novoEvento.clienteId ? clientes.find(c => c.id === novoEvento.clienteId)?.nome : undefined,
      projeto: novoEvento.projetoId ? projetos.find(p => p.id === novoEvento.projetoId)?.titulo : undefined,
      cor: novoEvento.cor || getCorByTipo(novoEvento.tipo),
      concluido: false,
      adminId: user?.uid, // Individualização
      criadoEm: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'eventos'), eventoData);
      console.log('✅ Evento criado no Firestore:', docRef.id);
      
      // Notificar sobre o novo evento
      if (user?.uid) {
        await notificarEventoAgenda(
          user.uid,
          novoEvento.titulo,
          `${novoEvento.data} às ${novoEvento.horaInicio}`,
          docRef.id
        );
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao criar evento no Firestore:', error);
      // Fallback local
      const evento: Evento = {
        id: `EVT-${Date.now()}`,
        ...eventoData
      } as Evento;
      setEventos([...eventos, evento]);
      setShowModal(false);
    }
  };

  // Função auxiliar para obter cor por tipo
  const getCorByTipo = (tipo: Evento['tipo']): string => {
    const cores: Record<Evento['tipo'], string> = {
      reuniao: 'from-blue-500 to-indigo-600',
      deadline: 'from-red-500 to-pink-600',
      foco: 'from-purple-500 to-violet-600',
      ligacao: 'from-green-500 to-emerald-600',
      outro: 'from-orange-500 to-amber-600'
    };
    return cores[tipo] || 'from-gray-500 to-gray-600';
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

  const navegarData = (direcao: 'prev' | 'next') => {
    const novaData = new Date(currentDate);
    novaData.setDate(novaData.getDate() + (direcao === 'next' ? 1 : -1));
    setCurrentDate(novaData);
  };

  const startFocusTimer = (minutos: number) => {
    setFocusTimer(minutos * 60);
    setIsFocusRunning(true);
    setFocusMode(true);
  };

  const formatFocusTimer = () => {
    const mins = Math.floor(focusTimer / 60);
    const secs = focusTimer % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-0">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 dark:from-gray-950 dark:via-orange-950/20 dark:to-red-950/20 transition-colors duration-500" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Greeting Section */}
              <div className="flex items-center gap-4 ml-14 lg:ml-0">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${periodo.gradient} flex items-center justify-center shadow-lg`}>
                  <periodo.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {periodo.label}, <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Profissional</span>
                    </h1>
                    <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {formatarData(currentDate)}
                  </p>
                </div>
              </div>

              {/* Live Clock */}
              <div className="hidden md:flex items-baseline gap-1">
                <div className="text-2xl font-mono font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent tabular-nums">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  :{String(currentTime.getSeconds()).padStart(2, '0')}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className={`p-3 rounded-xl transition-all ${
                    focusMode 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Modo Foco"
                >
                  <Target className="w-5 h-5" />
                </button>
                
                <NotificacoesBell />
                <ThemeToggle />

                {/* Settings Dropdown */}
                <div className="relative z-[60]" ref={settingsRef}>
                  <button 
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className={`p-3 rounded-xl transition-all ${
                      showSettingsMenu 
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title="Configurações e Convites"
                  >
                    <Settings className={`w-5 h-5 transition-transform ${showSettingsMenu ? 'rotate-90' : ''}`} />
                  </button>

                  {showSettingsMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Configurações</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>

                      {/* Gestão de Admins - Webmaster */}
                      {userIsWebmaster && (
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            setShowGestaoAdmins(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-left"
                        >
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg shadow-orange-500/20">
                            <Crown className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Gestão de Admins</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Cadastrar e gerenciar equipe</p>
                          </div>
                        </button>
                      )}

                      {/* Link para Clientes */}
                      {adminData?.codigoConvite && (
                        <div className="mx-4 my-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">Link para Clientes</span>
                          </div>
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/register?ref=${adminData.codigoConvite}`;
                              navigator.clipboard.writeText(link);
                              setLinkCopiado(true);
                              setTimeout(() => setLinkCopiado(false), 2000);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold py-2 px-3 rounded-lg border border-blue-200 dark:border-blue-800 transition-all shadow-sm"
                          >
                            {linkCopiado ? (
                              <><Check className="w-3.5 h-3.5" /> Copiado!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copiar Link de Cadastro</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Link para Novos Admins - Webmaster */}
                      {userIsWebmaster && adminData?.codigoConvite && (
                        <div className="mx-4 my-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Convite para Admins</span>
                          </div>
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/register?ref=${adminData.codigoConvite}&role=admin`;
                              navigator.clipboard.writeText(link);
                              setLinkAdminCopiado(true);
                              setTimeout(() => setLinkAdminCopiado(false), 2000);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold py-2 px-3 rounded-lg border border-amber-200 dark:border-amber-800 transition-all shadow-sm"
                          >
                            {linkAdminCopiado ? (
                              <><Check className="w-3.5 h-3.5" /> Copiado!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copiar Link Admin</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Focus Mode Overlay */}
          {focusMode && (
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Modo Foco Ativo</h2>
                    <p className="text-white/80">Concentre-se no que importa</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {focusTimer > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="text-5xl font-mono font-bold">{formatFocusTimer()}</div>
                      <button
                        onClick={() => setIsFocusRunning(!isFocusRunning)}
                        className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        {isFocusRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={() => { setFocusTimer(0); setIsFocusRunning(false); }}
                        className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <RefreshCw className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {[25, 45, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => startFocusTimer(mins)}
                          className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors font-semibold"
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setFocusMode(false); setFocusTimer(0); setIsFocusRunning(false); }}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Timeline */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Day Progress Card */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navegarData('prev')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {formatarData(currentDate)}
                    </h2>
                    <button
                      onClick={() => navegarData('next')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {dateToLocalString(currentDate) !== dateToLocalString(new Date()) && (
                      <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                      >
                        Hoje
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress Ring */}
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          className="text-gray-200 dark:text-gray-800"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className="text-orange-500"
                          strokeWidth="4"
                          strokeDasharray={28 * 2 * Math.PI}
                          strokeDashoffset={28 * 2 * Math.PI * (1 - progressoDia / 100)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {progressoDia}%
                      </span>
                    </div>

                    <button
                      onClick={() => { setModalMode('create'); setShowModal(true); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl transition-all hover:scale-105 font-semibold shadow-lg shadow-orange-500/30"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Novo Evento</span>
                    </button>
                  </div>
                </div>

                {/* Next Event Banner */}
                {proximoEvento && tempoAteProximo && (
                  <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${getEventoGradient(proximoEvento.cor)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative flex items-center justify-between text-white flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                          <Timer className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-white/80">Próximo compromisso em</p>
                          <p className="text-xl font-bold">{tempoAteProximo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{proximoEvento.titulo}</p>
                        <p className="text-sm text-white/80">{proximoEvento.horaInicio} - {proximoEvento.horaFim}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-3">
                  {eventosHoje.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        <Coffee className="w-10 h-10 text-orange-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dia livre!</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Nenhum compromisso agendado. Que tal planejar algo?
                      </p>
                      <button
                        onClick={() => { setModalMode('create'); setShowModal(true); }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                      >
                        <Plus className="w-5 h-5" />
                        Criar primeiro evento
                      </button>
                    </div>
                  ) : (
                    eventosHoje.map((evento) => {
                      const TipoIcon = getTipoIcon(evento.tipo);
                      
                      return (
                        <div
                          key={evento.id}
                          className={`group relative flex gap-4 p-4 rounded-xl border-l-4 ${getEventosCor(evento.cor)} backdrop-blur transition-all hover:scale-[1.02] cursor-pointer ${
                            evento.concluido ? 'opacity-60' : ''
                          }`}
                          onClick={() => { setSelectedEvento(evento); setModalMode('view'); setShowModal(true); }}
                        >
                          {/* Time Column */}
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{evento.horaInicio}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{evento.horaFim}</div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getEventoGradient(evento.cor)}`}>
                                    <TipoIcon className="w-4 h-4 text-white" />
                                  </div>
                                  <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${
                                    evento.concluido ? 'line-through' : ''
                                  }`}>
                                    {evento.titulo}
                                  </h3>
                                  {evento.prioridade === 'alta' && (
                                    <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  {evento.cliente && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                      <Users className="w-3 h-3" />
                                      {evento.cliente}
                                    </span>
                                  )}
                                  {evento.projeto && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                      <Briefcase className="w-3 h-3" />
                                      {evento.projeto}
                                    </span>
                                  )}
                                  {evento.local && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                      <ExternalLink className="w-3 h-3" />
                                      {evento.local}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleConcluido(evento.id); }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    evento.concluido 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-500 hover:text-white'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Widgets */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/projetos')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.projetosAtivos || projetos.filter(p => p.status === 'em_andamento').length || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Projetos Ativos</div>
                </div>

                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/financeiro')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    R${((systemStats.valorTotalContratos || 0) / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Contratos</div>
                </div>

                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/crm')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.clientesAtivos || clientes.length || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Clientes</div>
                </div>

                <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{eventosHoje.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Eventos Hoje</div>
                </div>
              </div>

              {/* Pending Payments */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    A Receber
                  </h3>
                  <button
                    onClick={() => navigate('/financeiro')}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    Ver tudo
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {transacoesPendentes.slice(0, 3).map(transacao => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
                      onClick={() => navigate('/financeiro')}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{transacao.descricao}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{transacao.clienteNome}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          R$ {transacao.valor.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transacao.dataVencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Pendente</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {transacoesPendentes.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Projects */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                    Projetos Ativos
                  </h3>
                  <button
                    onClick={() => navigate('/projetos')}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    Ver tudo
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {(projetos.length > 0 ? projetos.slice(0, 3) : [
                    { id: '1', titulo: 'Campanha Digital Q1', clienteEmpresa: 'Silva & Associados', progresso: 45, prioridade: 'alta' },
                    { id: '2', titulo: 'Rebranding Tech Solutions', clienteEmpresa: 'Tech Solutions', progresso: 90, prioridade: 'media' },
                  ]).map((projeto: any) => (
                    <div
                      key={projeto.id}
                      className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => navigate('/projetos')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{projeto.titulo}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          projeto.prioridade === 'alta' || projeto.prioridade === 'urgente'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}>
                          {projeto.prioridade}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{projeto.clienteEmpresa}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${projeto.progresso}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{projeto.progresso}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivational Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-6 h-6" />
                    <span className="font-bold">Dica do Dia</span>
                  </div>
                  <p className="text-sm text-white/90 mb-4">
                    "A produtividade não é sobre fazer mais coisas, mas sobre fazer as coisas certas."
                  </p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal View */}
      {showModal && modalMode === 'view' && selectedEvento && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Evento</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleConcluido(selectedEvento.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedEvento.concluido
                      ? 'bg-green-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-600 hover:border-green-500'
                  }`}
                >
                  {selectedEvento.concluido && <CheckCircle2 className="w-6 h-6" />}
                </button>
                <div>
                  <h3 className={`text-2xl font-bold text-gray-900 dark:text-white ${
                    selectedEvento.concluido ? 'line-through opacity-60' : ''
                  }`}>
                    {selectedEvento.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getEventoGradient(selectedEvento.cor)} text-white`}>
                      {selectedEvento.tipo}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEvento.prioridade === 'alta' 
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400' 
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedEvento.prioridade}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEvento.descricao && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-700 dark:text-gray-300">{selectedEvento.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Horário</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedEvento.horaInicio} - {selectedEvento.horaFim}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Data</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {new Date(selectedEvento.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              {(selectedEvento.cliente || selectedEvento.projeto) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedEvento.cliente && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Cliente</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedEvento.cliente}</p>
                    </div>
                  )}

                  {selectedEvento.projeto && (
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm font-medium">Projeto</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedEvento.projeto}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl transition-colors font-semibold"
                >
                  Fechar
                </button>
                <button
                  onClick={() => { toggleConcluido(selectedEvento.id); setShowModal(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold ${
                    selectedEvento.concluido
                      ? 'bg-orange-600 hover:bg-orange-500 text-white'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {selectedEvento.concluido ? 'Reabrir' : 'Concluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create - Novo Modal com Templates Inteligentes */}
      <ModalCriarEvento
        isOpen={showModal && modalMode === 'create'}
        onClose={() => setShowModal(false)}
        onSave={handleCriarEvento}
        dataInicial={dateToLocalString(currentDate)}
      />

      {/* Modal Gestão de Admins */}
      <ModalGestaoAdmins 
        isOpen={showGestaoAdmins} 
        onClose={() => setShowGestaoAdmins(false)} 
      />

      {/* Tutorial */}
      <TutorialOverlay page="agenda" />
    </div>
  );
};

export default Agenda;

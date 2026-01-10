import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  X,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hash,
  CalendarPlus,
  Info,
  Sparkles,
  Target,
  CalendarCheck
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import Sidebar from '../components/Sidebar';
import { getClientes } from '../services/dataIntegration';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster } from '../services/adminService';
import ModalCriarConteudo from '../components/ModalCriarConteudo';
import ModalVisualizarConteudo from '../components/ModalVisualizarConteudo';
import ModalEditarConteudo from '../components/ModalEditarConteudo';
import ModalDeletarConteudo from '../components/ModalDeletarConteudo';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

type RedeSocial = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
type StatusConteudo = 'planejado' | 'em_criacao' | 'aprovado' | 'publicado' | 'cancelado';
type TipoConteudo = 'post' | 'stories' | 'reels' | 'carrossel' | 'video' | 'artigo';

interface ConteudoSocial {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  projetoId?: string;
  projetoTitulo?: string;
  redeSocial: RedeSocial;
  tipoConteudo: TipoConteudo;
  dataPublicacao: string; // YYYY-MM-DD
  horaPublicacao?: string; // HH:MM
  status: StatusConteudo;
  copy?: string;
  hashtags?: string[];
  urlImagem?: string;
  urlVideo?: string;
  linkExterno?: string;
  observacoes?: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
  publicadoEm?: string;
  eventoVinculadoId?: string; // ID do evento na agenda
  metricas?: {
    alcance?: number;
    engajamento?: number;
    cliques?: number;
    compartilhamentos?: number;
  };
  criadoEm: string;
  atualizadoEm: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const SocialMedia: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userIsWebmaster = user?.email ? isWebmaster(user.email) : false;
  const [viewMode, setViewMode] = useState<'calendario' | 'kanban' | 'lista' | 'analytics'>('calendario');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRede, setFilterRede] = useState<RedeSocial | 'todas'>('todas');
  const [filterStatus, setFilterStatus] = useState<StatusConteudo | 'todos'>('todos');
  const [filterCliente, setFilterCliente] = useState<string>('todos');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [conteudos, setConteudos] = useState<ConteudoSocial[]>([]);
  const [loading, setLoading] = useState(true);

  // Listener em tempo real para conteúdos do Firestore
  useEffect(() => {
    if (!user?.uid) return;

    console.log('📱 Social Media - Usuário:', user.email, '| isWebmaster:', userIsWebmaster);

    setLoading(true);
    const conteudosRef = collection(db, 'social_media');
    
    // Se for webmaster, vê tudo. Se não, vê apenas os seus.
    const q = userIsWebmaster 
      ? query(conteudosRef)
      : query(conteudosRef, where('adminId', '==', user.uid));

    console.log('🔍 Social Media - Iniciando listener', userIsWebmaster ? 'SEM filtro (webmaster)' : 'COM filtro adminId');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ConteudoSocial[];
      
      console.log('✅ Social Media - Conteúdos carregados:', docs.length);
      setConteudos(docs);
      setLoading(false);
      
      // Sincronizar com localStorage para cache
      localStorage.setItem('social_media_v1', JSON.stringify(docs));
    }, (error) => {
      console.error('❌ Social Media - Erro ao escutar conteúdos:', error);
      console.error('❌ Social Media - Código:', error.code);
      console.error('❌ Social Media - Mensagem:', error.message);
      const stored = localStorage.getItem('social_media_v1');
      if (stored) setConteudos(JSON.parse(stored));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, userIsWebmaster]);

  // Salva no localStorage quando conteudos mudar
  useEffect(() => {
    localStorage.setItem('social_media_v1', JSON.stringify(conteudos));
    console.log('💾 Social Media: Salvou', conteudos.length, 'conteúdos');
  }, [conteudos]);

  // Carrega clientes
  const clientes = getClientes();

  // ============================================================================
  // ESTADOS DOS MODAIS
  // ============================================================================
  
  const [modalCriarOpen, setModalCriarOpen] = useState(false);
  const [modalVisualizarOpen, setModalVisualizarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDeletarOpen, setModalDeletarOpen] = useState(false);
  const [conteudoSelecionado, setConteudoSelecionado] = useState<ConteudoSocial | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ============================================================================
  // HANDLERS DOS MODAIS
  // ============================================================================
  
  const handleCriar = () => {
    setModalCriarOpen(true);
  };

  const handleConteudoCriado = async (novoConteudo: ConteudoSocial) => {
    // Criar objeto base apenas com campos obrigatórios
    const conteudoData: any = {
      titulo: novoConteudo.titulo,
      descricao: novoConteudo.descricao,
      clienteId: novoConteudo.clienteId,
      clienteNome: novoConteudo.clienteNome,
      clienteEmpresa: novoConteudo.clienteEmpresa,
      redeSocial: novoConteudo.redeSocial,
      tipoConteudo: novoConteudo.tipoConteudo,
      dataPublicacao: novoConteudo.dataPublicacao,
      status: novoConteudo.status,
      adminId: user?.uid,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    // Adicionar campos opcionais apenas se tiverem valor
    if (novoConteudo.projetoId) conteudoData.projetoId = novoConteudo.projetoId;
    if (novoConteudo.projetoTitulo) conteudoData.projetoTitulo = novoConteudo.projetoTitulo;
    if (novoConteudo.horaPublicacao) conteudoData.horaPublicacao = novoConteudo.horaPublicacao;
    if (novoConteudo.copy) conteudoData.copy = novoConteudo.copy;
    if (novoConteudo.hashtags?.length) conteudoData.hashtags = novoConteudo.hashtags;
    if (novoConteudo.urlImagem) conteudoData.urlImagem = novoConteudo.urlImagem;
    if (novoConteudo.urlVideo) conteudoData.urlVideo = novoConteudo.urlVideo;
    if (novoConteudo.linkExterno) conteudoData.linkExterno = novoConteudo.linkExterno;
    if (novoConteudo.observacoes) conteudoData.observacoes = novoConteudo.observacoes;

    console.log('💾 Tentando salvar conteúdo:', conteudoData);

    try {
      const docRef = await addDoc(collection(db, 'social_media'), conteudoData);
      console.log('✅ Conteúdo criado no Firestore:', docRef.id);
      setModalCriarOpen(false);
    } catch (error) {
      console.error('❌ Erro ao criar conteúdo no Firestore:', error);
      console.error('❌ Detalhes do erro:', error);
      // Fallback local
      const conteudo: ConteudoSocial = {
        ...conteudoData,
        id: `SM-${Date.now()}`
      } as ConteudoSocial;
      setConteudos([...conteudos, conteudo]);
      setModalCriarOpen(false);
    }
  };

  const handleVisualizar = (conteudo: ConteudoSocial) => {
    setConteudoSelecionado(conteudo);
    setModalVisualizarOpen(true);
  };

  const handleEditar = (conteudo: ConteudoSocial) => {
    setConteudoSelecionado(conteudo);
    setModalVisualizarOpen(false);
    setModalEditarOpen(true);
  };

  const handleConteudoAtualizado = async (conteudoAtualizado: ConteudoSocial) => {
    console.log('✅ Conteúdo atualizado:', conteudoAtualizado.id);

    // Criar objeto limpo removendo campos undefined
    const updateData: any = {
      titulo: conteudoAtualizado.titulo,
      descricao: conteudoAtualizado.descricao,
      clienteId: conteudoAtualizado.clienteId,
      clienteNome: conteudoAtualizado.clienteNome,
      clienteEmpresa: conteudoAtualizado.clienteEmpresa,
      redeSocial: conteudoAtualizado.redeSocial,
      tipoConteudo: conteudoAtualizado.tipoConteudo,
      dataPublicacao: conteudoAtualizado.dataPublicacao,
      status: conteudoAtualizado.status,
      atualizadoEm: new Date().toISOString()
    };

    // Adicionar campos opcionais apenas se tiverem valor
    if (conteudoAtualizado.projetoId) updateData.projetoId = conteudoAtualizado.projetoId;
    if (conteudoAtualizado.projetoTitulo) updateData.projetoTitulo = conteudoAtualizado.projetoTitulo;
    if (conteudoAtualizado.horaPublicacao) updateData.horaPublicacao = conteudoAtualizado.horaPublicacao;
    if (conteudoAtualizado.copy) updateData.copy = conteudoAtualizado.copy;
    if (conteudoAtualizado.hashtags?.length) updateData.hashtags = conteudoAtualizado.hashtags;
    if (conteudoAtualizado.urlImagem) updateData.urlImagem = conteudoAtualizado.urlImagem;
    if (conteudoAtualizado.urlVideo) updateData.urlVideo = conteudoAtualizado.urlVideo;
    if (conteudoAtualizado.linkExterno) updateData.linkExterno = conteudoAtualizado.linkExterno;
    if (conteudoAtualizado.observacoes) updateData.observacoes = conteudoAtualizado.observacoes;

    try {
      await updateDoc(doc(db, 'social_media', conteudoAtualizado.id), updateData);
      setModalEditarOpen(false);
      setConteudoSelecionado(null);
    } catch (error) {
      console.error('Erro ao editar conteúdo no Firestore:', error);
      setModalEditarOpen(false);
      setConteudoSelecionado(null);
    }
  };

  const handleDeletar = (conteudo: ConteudoSocial) => {
    setConteudoSelecionado(conteudo);
    setModalVisualizarOpen(false);
    setModalDeletarOpen(true);
  };

  const handleConteudoDeletado = async () => {
    if (!conteudoSelecionado) return;

    try {
      // Se tem evento vinculado, deletar também
      if (conteudoSelecionado.eventoVinculadoId) {
        console.log('🗑️ Deletando evento vinculado:', conteudoSelecionado.eventoVinculadoId);
        try {
          await deleteDoc(doc(db, 'eventos', conteudoSelecionado.eventoVinculadoId));
          console.log('✅ Evento vinculado deletado com sucesso');
        } catch (errorEvento) {
          console.warn('⚠️ Erro ao deletar evento vinculado (pode já ter sido deletado):', errorEvento);
        }
      }

      // Deletar o conteúdo
      await deleteDoc(doc(db, 'social_media', conteudoSelecionado.id));
      console.log('✅ Conteúdo social media deletado com sucesso');
      setModalDeletarOpen(false);
      setConteudoSelecionado(null);
    } catch (error) {
      console.error('❌ Erro ao deletar conteúdo no Firestore:', error);
      setConteudos(conteudos.filter(c => c.id !== conteudoSelecionado.id));
      setModalDeletarOpen(false);
      setConteudoSelecionado(null);
    }
  };

  // Função para criar compromisso na agenda a partir do conteúdo
  const handleCriarCompromisso = async (conteudo: ConteudoSocial) => {
    try {
      // Calcular horários baseado no horário de publicação
      const [hora, minuto] = (conteudo.horaPublicacao || '10:00').split(':');
      const horaFim = String(parseInt(hora) + 1).padStart(2, '0');
      
      // Criar objeto limpo sem undefined
      const eventoData: any = {
        titulo: `📱 ${conteudo.titulo}`,
        descricao: `${conteudo.descricao}\n\n🔗 Rede: ${conteudo.redeSocial}\n📋 Tipo: ${conteudo.tipoConteudo}\n🏢 Cliente: ${conteudo.clienteEmpresa}`,
        data: conteudo.dataPublicacao,
        horaInicio: `${hora}:${minuto}`,
        horaFim: `${horaFim}:${minuto}`,
        tipo: 'outro',
        prioridade: conteudo.status === 'aprovado' ? 'alta' : 'media',
        cor: '#ec4899',
        concluido: conteudo.status === 'publicado',
        adminId: user?.uid,
        criadoEm: new Date().toISOString(),
        // Vincular com o conteúdo social media
        socialMediaId: conteudo.id
      };

      // Adicionar cliente apenas se existir
      if (conteudo.clienteNome) {
        eventoData.cliente = conteudo.clienteNome;
      }

      // Adicionar projeto se existir
      if (conteudo.projetoId) {
        eventoData.projetoId = conteudo.projetoId;
        if (conteudo.projetoTitulo) {
          eventoData.projeto = conteudo.projetoTitulo;
        }
      }

      console.log('📅 Criando evento vinculado:', eventoData);

      const docRef = await addDoc(collection(db, 'eventos'), eventoData);
      
      // Atualizar o conteúdo com o ID do evento
      await updateDoc(doc(db, 'social_media', conteudo.id), {
        eventoVinculadoId: docRef.id
      });

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      console.log('✅ Compromisso criado e vinculado:', docRef.id);
    } catch (error) {
      console.error('❌ Erro ao criar compromisso:', error);
      alert('Erro ao criar compromisso na agenda');
    }
  };

  // ============================================================================
  // CONFIGURAÇÕES DE REDES SOCIAIS
  // ============================================================================

  const redesSociais = [
    { value: 'instagram' as const, label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
    { value: 'facebook' as const, label: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-600' },
    { value: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
    { value: 'twitter' as const, label: 'Twitter', icon: Twitter, color: 'from-sky-400 to-blue-500' },
    { value: 'youtube' as const, label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  ];

  const statusConfig = {
    planejado: { label: 'Planejado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
    em_criacao: { label: 'Em Criação', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: FileText },
    aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
    publicado: { label: 'Publicado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: TrendingUp },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle }
  };

  const tiposConteudo = [
    { value: 'post', label: 'Post', icon: FileText },
    { value: 'stories', label: 'Stories', icon: Clock },
    { value: 'reels', label: 'Reels', icon: TrendingUp },
    { value: 'carrossel', label: 'Carrossel', icon: Calendar },
    { value: 'video', label: 'Vídeo', icon: Youtube },
    { value: 'artigo', label: 'Artigo', icon: FileText }
  ];

  // Helper para renderizar botão IA (leva ao modal de edição)
  const renderIAButton = (conteudo: ConteudoSocial, className: string = '') => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditar(conteudo);
        }}
        className={`relative z-10 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-md transition-all ${className}`}
        title="Editar e usar IA"
      >
        <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-300" />
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">IA</span>
      </button>
    );
  };

  // Helper para renderizar botão de agenda
  const renderAgendaButton = (conteudo: ConteudoSocial, className: string = '') => {
    if (conteudo.eventoVinculadoId) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/agenda');
          }}
          className={`p-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded transition-all ${className}`}
          title="Ver evento na agenda"
        >
          <CalendarCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
        </button>
      );
    }
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCriarCompromisso(conteudo);
        }}
        className={`opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all ${className}`}
        title="Adicionar à Agenda"
      >
        <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      </button>
    );
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getRedeIcon = (rede: RedeSocial) => {
    const config = redesSociais.find(r => r.value === rede);
    return config?.icon || Instagram;
  };

  const getRedeColor = (rede: RedeSocial) => {
    const config = redesSociais.find(r => r.value === rede);
    return config?.color || 'from-gray-500 to-gray-600';
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  // ============================================================================
  // FILTROS E BUSCA
  // ============================================================================

  const conteudosFiltrados = conteudos.filter(conteudo => {
    const matchSearch = conteudo.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       conteudo.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       conteudo.clienteEmpresa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRede = filterRede === 'todas' || conteudo.redeSocial === filterRede;
    const matchStatus = filterStatus === 'todos' || conteudo.status === filterStatus;
    const matchCliente = filterCliente === 'todos' || conteudo.clienteId === filterCliente;
    return matchSearch && matchRede && matchStatus && matchCliente;
  });

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const stats = {
    total: conteudos.length,
    planejados: conteudos.filter(c => c.status === 'planejado').length,
    emCriacao: conteudos.filter(c => c.status === 'em_criacao').length,
    aprovados: conteudos.filter(c => c.status === 'aprovado').length,
    publicados: conteudos.filter(c => c.status === 'publicado').length,
    porRede: redesSociais.map(rede => ({
      rede: rede.label,
      total: conteudos.filter(c => c.redeSocial === rede.value).length
    }))
  };

  // ============================================================================
  // CALENDÁRIO - FUNÇÕES AUXILIARES
  // ============================================================================

  const getDiasDoMes = (date: Date) => {
    const ano = date.getFullYear();
    const mes = date.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const primeiroDiaSemana = primeiroDia.getDay(); // 0 = domingo

    const dias: (Date | null)[] = [];
    
    // Adiciona espaços vazios antes do primeiro dia
    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push(null);
    }
    
    // Adiciona os dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }
    
    return dias;
  };

  const getConteudosData = (date: Date) => {
    const dataStr = date.toISOString().split('T')[0];
    return conteudosFiltrados.filter(c => c.dataPublicacao === dataStr);
  };

  const mudarMes = (direcao: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direcao === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const mesAnoTexto = currentMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  // ============================================================================
  // KANBAN - FUNÇÕES DRAG & DROP
  // ============================================================================

  const handleDragStart = (e: React.DragEvent, conteudoId: string) => {
    e.dataTransfer.setData('conteudoId', conteudoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, novoStatus: StatusConteudo) => {
    e.preventDefault();
    const conteudoId = e.dataTransfer.getData('conteudoId');
    
    const conteudo = conteudos.find(c => c.id === conteudoId);
    if (conteudo && conteudo.status !== novoStatus) {
      const conteudoAtualizado = {
        ...conteudo,
        status: novoStatus,
        atualizadoEm: new Date().toISOString()
      };
      handleConteudoAtualizado(conteudoAtualizado);
      console.log(`📦 Conteúdo ${conteudoId} movido para ${novoStatus}`);
    }
  };

  const conteudosPorStatus = {
    planejado: conteudosFiltrados.filter(c => c.status === 'planejado'),
    em_criacao: conteudosFiltrados.filter(c => c.status === 'em_criacao'),
    aprovado: conteudosFiltrados.filter(c => c.status === 'aprovado'),
    publicado: conteudosFiltrados.filter(c => c.status === 'publicado'),
    cancelado: conteudosFiltrados.filter(c => c.status === 'cancelado')
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-500">
      {/* Sidebar de Navegação */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <main className="flex-1 min-h-screen lg:ml-0">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Social Media
                  </h1>
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Como usar esta página"
                  >
                    <Info className="w-5 h-5 text-gray-400 hover:text-pink-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calendário Editorial e Gestão de Conteúdo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
                title="Ir para Command Center"
              >
                <Target className="w-5 h-5" />
                Command Center
              </button>
              <NotificacoesBell />
              <ThemeToggle />
              <button
                onClick={handleCriar}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Novo Conteúdo
              </button>
            </div>
          </div>
          
          {/* Guia de Funcionalidades */}
          {showGuide && (
            <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  <h3 className="font-bold mb-2">Como usar Social Media:</h3>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 dark:text-pink-400">•</span>
                      <span><strong>Calendário:</strong> Visualize todos os conteúdos organizados por data de publicação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 dark:text-pink-400">•</span>
                      <span><strong>Kanban:</strong> Arraste conteúdos entre status (Planejado → Em Criação → Aprovado → Publicado)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 dark:text-pink-400">•</span>
                      <span><strong>Criar Compromisso:</strong> Use o botão 📅 em cada conteúdo para adicionar à sua agenda no Command Center</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 dark:text-pink-400">•</span>
                      <span><strong>Filtros:</strong> Use os filtros para visualizar por rede social, status ou cliente específico</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-1 hover:bg-pink-200 dark:hover:bg-pink-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Mensagem de sucesso */}
          {showSuccessMessage && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Compromisso adicionado à agenda com sucesso!
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planejados</p>
                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.planejados}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Em Criação</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.emCriacao}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.aprovados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Publicados</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.publicados}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters and View Modes */}
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, descrição, cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterRede}
                onChange={(e) => setFilterRede(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="todas">Todas as Redes</option>
                {redesSociais.map(rede => (
                  <option key={rede.value} value={rede.value}>{rede.label}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="todos">Todos os Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="todos">Todos os Clientes</option>
                {clientes.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>{cliente.empresa}</option>
                ))}
              </select>
            </div>

            {/* View Modes */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendario')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'calendario' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Calendário"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Kanban"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'lista' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Lista"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Analytics"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'calendario' && (
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => mudarMes('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {mesAnoTexto}
              </h3>
              
              <button
                onClick={() => mudarMes('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-2">
              {/* Cabeçalho dos dias da semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                <div key={dia} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2 text-sm">
                  {dia}
                </div>
              ))}

              {/* Dias do mês */}
              {getDiasDoMes(currentMonth).map((dia, index) => {
                if (!dia) {
                  return <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50 dark:bg-gray-800/50 rounded-lg" />;
                }

                const conteudosDoDia = getConteudosData(dia);
                const isHoje = dia.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dia.toISOString()}
                    className={`min-h-[100px] border-2 rounded-lg p-2 transition-colors ${
                      isHoje
                        ? 'border-pink-500 dark:border-purple-500 bg-pink-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      isHoje ? 'text-pink-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {dia.getDate()}
                    </div>

                    <div className="space-y-1">
                      {conteudosDoDia.slice(0, 3).map(conteudo => {
                        const RedeIcon = getRedeIcon(conteudo.redeSocial);
                        return (
                          <div
                            key={conteudo.id}
                            onClick={() => handleVisualizar(conteudo)}
                            className={`group text-xs p-1.5 rounded cursor-pointer transition-all hover:scale-105 bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)} text-white flex items-center gap-1`}
                            title={conteudo.titulo}
                          >
                            <RedeIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate flex-1">{conteudo.titulo}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditar(conteudo);
                              }}
                              className="p-0.5 rounded hover:bg-white/25 flex-shrink-0"
                              title="Editar e usar IA"
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        );
                      })}
                      {conteudosDoDia.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                          +{conteudosDoDia.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Legenda:</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {redesSociais.map(rede => {
                  const RedeIcon = rede.icon;
                  return (
                    <div key={rede.value} className={`flex items-center gap-2 text-xs p-2 rounded-lg bg-gradient-to-r ${rede.color} text-white`}>
                      <RedeIcon className="w-4 h-4" />
                      <span>{rede.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Coluna Planejado */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'planejado')}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-gray-300 dark:border-gray-700 rounded-xl p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Planejado</h3>
                </div>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                  {conteudosPorStatus.planejado.length}
                </span>
              </div>
              <div className="space-y-3">
                {conteudosPorStatus.planejado.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  return (
                    <div
                      key={conteudo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conteudo.id)}
                      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-lg transition-all"
                    >
                      <div 
                        onClick={() => handleVisualizar(conteudo)}
                        className="flex items-start gap-2 mb-2"
                      >
                        <div className={`p-2 rounded bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {conteudo.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {conteudo.clienteEmpresa}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{formatarData(conteudo.dataPublicacao)}</span>
                        <div className="flex items-center gap-2">
                          {conteudo.hashtags && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Hash className="w-3 h-3" />
                              {conteudo.hashtags.length}
                            </span>
                          )}
                          {renderIAButton(conteudo)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCriarCompromisso(conteudo);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                            title="Adicionar à Agenda"
                          >
                            <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Em Criação */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'em_criacao')}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Em Criação</h3>
                </div>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {conteudosPorStatus.em_criacao.length}
                </span>
              </div>
              <div className="space-y-3">
                {conteudosPorStatus.em_criacao.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  return (
                    <div
                      key={conteudo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conteudo.id)}
                      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-lg transition-all"
                    >
                      <div 
                        onClick={() => handleVisualizar(conteudo)}
                        className="flex items-start gap-2 mb-2"
                      >
                        <div className={`p-2 rounded bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {conteudo.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {conteudo.clienteEmpresa}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{formatarData(conteudo.dataPublicacao)}</span>
                        <div className="flex items-center gap-2">
                          {conteudo.hashtags && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Hash className="w-3 h-3" />
                              {conteudo.hashtags.length}
                            </span>
                          )}
                          {renderIAButton(conteudo)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCriarCompromisso(conteudo);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                            title="Adicionar à Agenda"
                          >
                            <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Aprovado */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'aprovado')}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Aprovado</h3>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                  {conteudosPorStatus.aprovado.length}
                </span>
              </div>
              <div className="space-y-3">
                {conteudosPorStatus.aprovado.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  return (
                    <div
                      key={conteudo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conteudo.id)}
                      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-lg transition-all"
                    >
                      <div 
                        onClick={() => handleVisualizar(conteudo)}
                        className="flex items-start gap-2 mb-2"
                      >
                        <div className={`p-2 rounded bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {conteudo.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {conteudo.clienteEmpresa}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{formatarData(conteudo.dataPublicacao)}</span>
                        <div className="flex items-center gap-2">
                          {conteudo.hashtags && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Hash className="w-3 h-3" />
                              {conteudo.hashtags.length}
                            </span>
                          )}
                          {renderIAButton(conteudo)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCriarCompromisso(conteudo);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                            title="Adicionar à Agenda"
                          >
                            <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Publicado */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'publicado')}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Publicado</h3>
                </div>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                  {conteudosPorStatus.publicado.length}
                </span>
              </div>
              <div className="space-y-3">
                {conteudosPorStatus.publicado.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  return (
                    <div
                      key={conteudo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conteudo.id)}
                      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-lg transition-all"
                    >
                      <div 
                        onClick={() => handleVisualizar(conteudo)}
                        className="flex items-start gap-2 mb-2"
                      >
                        <div className={`p-2 rounded bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {conteudo.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {conteudo.clienteEmpresa}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{formatarData(conteudo.dataPublicacao)}</span>
                        <div className="flex items-center gap-2">
                          {conteudo.hashtags && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Hash className="w-3 h-3" />
                              {conteudo.hashtags.length}
                            </span>
                          )}
                          {renderIAButton(conteudo)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCriarCompromisso(conteudo);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                            title="Adicionar à Agenda"
                          >
                            <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Cancelado */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'cancelado')}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Cancelado</h3>
                </div>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                  {conteudosPorStatus.cancelado.length}
                </span>
              </div>
              <div className="space-y-3">
                {conteudosPorStatus.cancelado.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  return (
                    <div
                      key={conteudo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conteudo.id)}
                      className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-lg transition-all"
                    >
                      <div 
                        onClick={() => handleVisualizar(conteudo)}
                        className="flex items-start gap-2 mb-2"
                      >
                        <div className={`p-2 rounded bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {conteudo.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {conteudo.clienteEmpresa}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{formatarData(conteudo.dataPublicacao)}</span>
                        <div className="flex items-center gap-2">
                          {conteudo.hashtags && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Hash className="w-3 h-3" />
                              {conteudo.hashtags.length}
                            </span>
                          )}
                          {renderIAButton(conteudo)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCriarCompromisso(conteudo);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                            title="Adicionar à Agenda"
                          >
                            <CalendarPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            {conteudosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Nenhum conteúdo encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conteudosFiltrados.map(conteudo => {
                  const RedeIcon = getRedeIcon(conteudo.redeSocial);
                  
                  return (
                    <div
                      key={conteudo.id}
                      className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${getRedeColor(conteudo.redeSocial)}`}>
                          <RedeIcon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div 
                              onClick={() => handleVisualizar(conteudo)}
                              className="flex-1 cursor-pointer"
                            >
                              <h3 className="font-semibold text-gray-900 dark:text-white">{conteudo.titulo}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{conteudo.clienteEmpresa}</p>
                              {conteudo.projetoTitulo && (
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                  📁 {conteudo.projetoTitulo}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[conteudo.status].color}`}>
                                {statusConfig[conteudo.status].label}
                              </span>
                              {renderIAButton(conteudo)}
                              {renderAgendaButton(conteudo, 'p-2')}
                            </div>
                          </div>
                          
                          <p 
                            onClick={() => handleVisualizar(conteudo)}
                            className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 cursor-pointer"
                          >
                            {conteudo.descricao}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatarData(conteudo.dataPublicacao)}
                            </div>
                            {conteudo.horaPublicacao && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {conteudo.horaPublicacao}
                              </div>
                            )}
                            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                              {tiposConteudo.find(t => t.value === conteudo.tipoConteudo)?.label || conteudo.tipoConteudo}
                            </div>
                            {conteudo.hashtags && conteudo.hashtags.length > 0 && (
                              <div className="text-pink-600 dark:text-pink-400">
                                {conteudo.hashtags.length} hashtags
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'analytics' && (
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Analytics em desenvolvimento...</p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <ModalCriarConteudo
        isOpen={modalCriarOpen}
        onClose={() => setModalCriarOpen(false)}
        onSuccess={handleConteudoCriado}
      />

      <ModalVisualizarConteudo
        isOpen={modalVisualizarOpen}
        onClose={() => setModalVisualizarOpen(false)}
        conteudo={conteudoSelecionado}
        onEdit={handleEditar}
        onDelete={handleDeletar}
      />

      <ModalEditarConteudo
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        conteudo={conteudoSelecionado}
        onSuccess={handleConteudoAtualizado}
      />

      <ModalDeletarConteudo
        isOpen={modalDeletarOpen}
        onClose={() => setModalDeletarOpen(false)}
        conteudo={conteudoSelecionado}
        onConfirm={handleConteudoDeletado}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay page="social-media" />
      </main>
    </div>
  );
};

export default SocialMedia;

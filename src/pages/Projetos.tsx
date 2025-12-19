import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  Play,
  Eye,
  Trash2,
  MessageSquare,
  FileText,
  CheckSquare,
  TrendingUp,
  Briefcase,
  BarChart3,
  Layers
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import ModalCriarProjeto from '../components/ModalCriarProjeto';
import ModalVisualizarProjeto from '../components/ModalVisualizarProjeto';
import ModalEditarProjeto from '../components/ModalEditarProjeto';
import ModalDeleteProjeto from '../components/ModalDeleteProjeto';
import {
  getProjetos,
  saveProjetos,
} from '../services/dataIntegration';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { notificarAguardandoAprovacao, notificarProjetoAtualizado } from '../services/notificacoes';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface Arquivo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploadPor: string;
  uploadEm: string;
  versao: number;
  aprovado: boolean;
  aprovadoPor?: string;
  aprovadoEm?: string;
}

interface Comentario {
  id: string;
  autor: string;
  autorTipo: 'interno' | 'cliente';
  texto: string;
  dataHora: string;
  arquivosAnexos?: string[];
}

interface Revisao {
  id: string;
  numero: number;
  solicitadoEm: string;
  solicitadoPor: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  concluidaEm?: string;
  tempoGasto?: number; // em horas
}

interface Aprovacao {
  id: string;
  etapa: EtapaProjeto;
  solicitadaEm: string;
  aprovadaPor?: string;
  aprovadaEm?: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  comentarios?: string;
  assinaturaDigital?: string;
}

type StatusProjeto = 'planejamento' | 'em_andamento' | 'pausado' | 'revisao' | 'aprovacao' | 'concluido' | 'cancelado';
type EtapaProjeto = 'briefing' | 'criacao' | 'revisao' | 'ajustes' | 'aprovacao' | 'entrega';
type PrioridadeProjeto = 'baixa' | 'media' | 'alta' | 'urgente';

interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  
  // Serviços e Valores
  servicosContratados: string[];
  valorContratado: number;
  valorPago: number;
  
  // Status e Prioridade
  status: StatusProjeto;
  prioridade: PrioridadeProjeto;
  etapaAtual: EtapaProjeto;
  progresso: number; // 0-100%
  
  // Prazos
  dataInicio: string;
  prazoEstimado: string;
  prazoReal?: string;
  dataEntrega?: string;
  diasRestantes?: number;
  
  // Revisões
  revisoes: Revisao[];
  limiteRevisoes: number;
  revisoesUsadas: number;
  
  // Equipe
  responsavel: string;
  equipe: string[];
  
  // Arquivos e Comunicação
  arquivos: Arquivo[];
  comentariosInternos: Comentario[];
  comentariosCliente: Comentario[];
  
  // Aprovações
  aprovacoes: Aprovacao[];
  
  // Métricas
  horasEstimadas: number;
  horasTrabalhadas: number;
  satisfacaoCliente?: number; // 1-5
  
  // Tags e categorias
  tags: string[];
  categoria: string;
  
  // Timestamps
  criadoEm: string;
  atualizadoEm: string;
  
  // Campos para workflow de aprovação
  descricaoFaseAtual?: string;
  faseAtualizadaEm?: string;
  aguardandoAprovacaoCliente?: boolean;
}

// ============================================================================
// COMPONENTE KANBAN CARD
// ============================================================================

interface KanbanCardProps {
  projeto: Projeto;
  onDragStart: (e: React.DragEvent, projectId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ projeto, onDragStart, onDragEnd }) => {
  const getPrioridadeColor = (prioridade: PrioridadeProjeto) => {
    const colors = {
      baixa: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      media: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      alta: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      urgente: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    };
    return colors[prioridade];
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isConcluido = projeto.status === 'concluido';

  return (
    <div
      draggable={!isConcluido}
      onDragStart={(e) => !isConcluido && onDragStart(e, projeto.id)}
      onDragEnd={onDragEnd}
      className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all group ${
        isConcluido 
          ? 'cursor-not-allowed opacity-90 ring-2 ring-green-500/50' 
          : 'cursor-move hover:shadow-xl hover:scale-105'
      }`}
      title={isConcluido ? '🔒 Projeto concluído - não pode ser movido' : 'Arraste para mover'}
    >
      {/* Indicador de bloqueio para concluídos */}
      {isConcluido && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
          🔒 Finalizado
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {projeto.id}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPrioridadeColor(projeto.prioridade)}`}>
          {projeto.prioridade === 'urgente' ? '🔥' : ''}
          {projeto.prioridade.toUpperCase()}
        </span>
      </div>

      {/* Título */}
      <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-amber-500 transition-colors">
        {projeto.titulo}
      </h4>

      {/* Cliente */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <Users className="w-3 h-3" />
        <span className="truncate">{projeto.clienteEmpresa}</span>
      </div>

      {/* Progresso */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progresso</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{projeto.progresso}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
            style={{ width: `${projeto.progresso}%` }}
          />
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(projeto.prazoEstimado).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span>{projeto.comentariosInternos.length + projeto.comentariosCliente.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          <span>{projeto.arquivos.length}</span>
        </div>
      </div>

      {/* Valor */}
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Valor</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {formatarMoeda(projeto.valorContratado)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Projetos: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'lista' | 'timeline' | 'analytics'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusProjeto | 'todos'>('todos');
  const [filterPrioridade, setFilterPrioridade] = useState<PrioridadeProjeto | 'todas'>('todas');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  
  // Estados dos modais
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [showModalVisualizar, setShowModalVisualizar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  
  // Modal de descrição de fase para aprovação
  const [showModalFase, setShowModalFase] = useState(false);
  const [projetoParaAprovacao, setProjetoParaAprovacao] = useState<string | null>(null);
  const [descricaoFase, setDescricaoFase] = useState('');
  const [novoStatusPendente, setNovoStatusPendente] = useState<StatusProjeto | null>(null);

  /* Mock data desativado
  // ============================================================================
  // DADOS MOCK - Em produção virá do Firebase
  // ============================================================================

  // Dados mock para inicialização
  const PROJETOS_MOCK: Projeto[] = [
    {
      id: 'PROJ-2025-001',
      titulo: 'Campanha Digital Q1 2025',
      descricao: 'Desenvolvimento de campanha completa para redes sociais incluindo artes, copies e estratégia de conteúdo',
      clienteId: '1',
      clienteNome: 'Maria Silva',
      clienteEmpresa: 'Silva & Associados',
      servicosContratados: ['Social Media', 'Design Gráfico', 'Copywriting', 'Planejamento Estratégico'],
      valorContratado: 15000,
      valorPago: 7500,
      status: 'em_andamento',
      prioridade: 'alta',
      etapaAtual: 'criacao',
      progresso: 45,
      dataInicio: '2025-12-01',
      prazoEstimado: '2025-12-30',
      diasRestantes: 15,
      revisoes: [
        {
          id: 'REV-001',
          numero: 1,
          solicitadoEm: '2025-12-10',
          solicitadoPor: 'Maria Silva',
          descricao: 'Ajustar cores do logo e aumentar fonte nos posts',
          status: 'concluida',
          concluidaEm: '2025-12-12',
          tempoGasto: 3
        }
      ],
      limiteRevisoes: 3,
      revisoesUsadas: 1,
      responsavel: 'João Designer',
      equipe: ['João Designer', 'Ana Copywriter', 'Carlos Social Media'],
      arquivos: [
        {
          id: 'ARQ-001',
          nome: 'briefing_campanha_q1.pdf',
          tipo: 'application/pdf',
          tamanho: 2048576,
          url: '/uploads/briefing_001.pdf',
          uploadPor: 'Maria Silva',
          uploadEm: '2025-12-01',
          versao: 1,
          aprovado: true,
          aprovadoPor: 'João Designer',
          aprovadoEm: '2025-12-01'
        },
        {
          id: 'ARQ-002',
          nome: 'artes_instagram_v2.zip',
          tipo: 'application/zip',
          tamanho: 15728640,
          url: '/uploads/artes_v2.zip',
          uploadPor: 'João Designer',
          uploadEm: '2025-12-13',
          versao: 2,
          aprovado: false
        }
      ],
      comentariosInternos: [
        {
          id: 'COM-INT-001',
          autor: 'João Designer',
          autorTipo: 'interno',
          texto: 'Artes finalizadas, aguardando revisão da Ana antes de enviar ao cliente',
          dataHora: '2025-12-13 14:30'
        },
        {
          id: 'COM-INT-002',
          autor: 'Ana Copywriter',
          autorTipo: 'interno',
          texto: 'Copies aprovadas! Pode enviar para o cliente',
          dataHora: '2025-12-14 10:15'
        }
      ],
      comentariosCliente: [
        {
          id: 'COM-CLI-001',
          autor: 'Maria Silva',
          autorTipo: 'cliente',
          texto: 'Adorei as artes! Apenas ajustar a cor azul para um tom mais escuro',
          dataHora: '2025-12-10 16:20'
        }
      ],
      aprovacoes: [
        {
          id: 'APR-001',
          etapa: 'briefing',
          solicitadaEm: '2025-12-01',
          aprovadaPor: 'Maria Silva',
          aprovadaEm: '2025-12-01',
          status: 'aprovada',
          comentarios: 'Briefing perfeito, pode seguir!',
          assinaturaDigital: 'MS-20251201-143022'
        }
      ],
      horasEstimadas: 80,
      horasTrabalhadas: 36,
      satisfacaoCliente: 5,
      tags: ['Social Media', 'Urgente', 'Recorrente'],
      categoria: 'Marketing Digital',
      criadoEm: '2025-12-01',
      atualizadoEm: '2025-12-15'
    },
    {
      id: 'PROJ-2025-002',
      titulo: 'Rebranding Tech Solutions',
      descricao: 'Redesign completo da identidade visual incluindo logo, manual de marca e aplicações',
      clienteId: '2',
      clienteNome: 'João Santos',
      clienteEmpresa: 'Tech Solutions',
      servicosContratados: ['Branding', 'Design Gráfico', 'Manual da Marca'],
      valorContratado: 25000,
      valorPago: 25000,
      status: 'aprovacao',
      prioridade: 'media',
      etapaAtual: 'aprovacao',
      progresso: 90,
      dataInicio: '2025-11-15',
      prazoEstimado: '2025-12-20',
      diasRestantes: 5,
      revisoes: [
        {
          id: 'REV-002',
          numero: 1,
          solicitadoEm: '2025-12-05',
          solicitadoPor: 'João Santos',
          descricao: 'Testar logo em fundo escuro',
          status: 'concluida',
          concluidaEm: '2025-12-07',
          tempoGasto: 2
        },
        {
          id: 'REV-003',
          numero: 2,
          solicitadoEm: '2025-12-12',
          solicitadoPor: 'João Santos',
          descricao: 'Ajustar tipografia do slogan',
          status: 'concluida',
          concluidaEm: '2025-12-14',
          tempoGasto: 1.5
        }
      ],
      limiteRevisoes: 2,
      revisoesUsadas: 2,
      responsavel: 'Paula Brand Designer',
      equipe: ['Paula Brand Designer', 'Roberto Ilustrador'],
      arquivos: [
        {
          id: 'ARQ-003',
          nome: 'manual_marca_techsolutions.pdf',
          tipo: 'application/pdf',
          tamanho: 52428800,
          url: '/uploads/manual_marca.pdf',
          uploadPor: 'Paula Brand Designer',
          uploadEm: '2025-12-14',
          versao: 3,
          aprovado: false
        }
      ],
      comentariosInternos: [
        {
          id: 'COM-INT-003',
          autor: 'Paula Brand Designer',
          autorTipo: 'interno',
          texto: 'Manual finalizado! Versão 3 incorpora todos os ajustes solicitados',
          dataHora: '2025-12-14 18:00'
        }
      ],
      comentariosCliente: [
        {
          id: 'COM-CLI-002',
          autor: 'João Santos',
          autorTipo: 'cliente',
          texto: 'Ficou incrível! Vou revisar com a diretoria e dou retorno amanhã',
          dataHora: '2025-12-14 19:30'
        }
      ],
      aprovacoes: [
        {
          id: 'APR-002',
          etapa: 'aprovacao',
          solicitadaEm: '2025-12-14',
          status: 'pendente'
        }
      ],
      horasEstimadas: 120,
      horasTrabalhadas: 108,
      satisfacaoCliente: 5,
      tags: ['Branding', 'Estratégico'],
      categoria: 'Identidade Visual',
      criadoEm: '2025-11-15',
      atualizadoEm: '2025-12-15'
    },
    {
      id: 'PROJ-2025-003',
      titulo: 'Website Institucional Costa Marketing',
      descricao: 'Desenvolvimento de site institucional responsivo com CMS integrado',
      clienteId: '3',
      clienteNome: 'Ana Costa',
      clienteEmpresa: 'Costa Marketing',
      servicosContratados: ['Web Design', 'Desenvolvimento Front-end', 'UX/UI'],
      valorContratado: 18000,
      valorPago: 0,
      status: 'planejamento',
      prioridade: 'media',
      etapaAtual: 'briefing',
      progresso: 10,
      dataInicio: '2025-12-14',
      prazoEstimado: '2026-01-31',
      diasRestantes: 47,
      revisoes: [],
      limiteRevisoes: 3,
      revisoesUsadas: 0,
      responsavel: 'Lucas Dev',
      equipe: ['Lucas Dev', 'Mariana UX'],
      arquivos: [],
      comentariosInternos: [
        {
          id: 'COM-INT-004',
          autor: 'Lucas Dev',
          autorTipo: 'interno',
          texto: 'Agendada reunião de briefing para dia 16/12',
          dataHora: '2025-12-14 11:00'
        }
      ],
      comentariosCliente: [],
      aprovacoes: [],
      horasEstimadas: 160,
      horasTrabalhadas: 8,
      tags: ['Website', 'Desenvolvimento'],
      categoria: 'Desenvolvimento Web',
      criadoEm: '2025-12-14',
      atualizadoEm: '2025-12-15'
    },
    {
      id: 'PROJ-2025-004',
      titulo: 'E-commerce Moda Primavera/Verão',
      descricao: 'Loja virtual completa com integração de pagamento e sistema de gestão de estoque',
      clienteId: '1',
      clienteNome: 'Maria Silva',
      clienteEmpresa: 'Silva & Associados',
      servicosContratados: ['E-commerce', 'Design', 'Desenvolvimento', 'Fotografia de Produto'],
      valorContratado: 45000,
      valorPago: 15000,
      status: 'em_andamento',
      prioridade: 'urgente',
      etapaAtual: 'criacao',
      progresso: 60,
      dataInicio: '2025-11-01',
      prazoEstimado: '2025-12-25',
      diasRestantes: 10,
      revisoes: [
        {
          id: 'REV-004',
          numero: 1,
          solicitadoEm: '2025-12-08',
          solicitadoPor: 'Maria Silva',
          descricao: 'Alterar fluxo de checkout - simplificar para 2 etapas',
          status: 'em_andamento',
          tempoGasto: 5
        }
      ],
      limiteRevisoes: 4,
      revisoesUsadas: 1,
      responsavel: 'Rafael Full Stack',
      equipe: ['Rafael Full Stack', 'Camila Designer', 'Pedro Fotógrafo'],
      arquivos: [
        {
          id: 'ARQ-004',
          nome: 'wireframes_ecommerce.fig',
          tipo: 'application/figma',
          tamanho: 10485760,
          url: '/uploads/wireframes.fig',
          uploadPor: 'Camila Designer',
          uploadEm: '2025-11-10',
          versao: 1,
          aprovado: true,
          aprovadoPor: 'Maria Silva',
          aprovadoEm: '2025-11-12'
        }
      ],
      comentariosInternos: [
        {
          id: 'COM-INT-005',
          autor: 'Rafael Full Stack',
          autorTipo: 'interno',
          texto: 'Integração com gateway de pagamento concluída e testada',
          dataHora: '2025-12-13 16:45'
        }
      ],
      comentariosCliente: [
        {
          id: 'COM-CLI-003',
          autor: 'Maria Silva',
          autorTipo: 'cliente',
          texto: 'Está ficando ótimo! Vamos precisar adiantar o prazo em 3 dias se possível',
          dataHora: '2025-12-12 09:00'
        }
      ],
      aprovacoes: [],
      horasEstimadas: 200,
      horasTrabalhadas: 120,
      satisfacaoCliente: 4,
      tags: ['E-commerce', 'Urgente', 'Alta Prioridade'],
      categoria: 'Desenvolvimento Web',
      criadoEm: '2025-11-01',
      atualizadoEm: '2025-12-15'
    }
  ];
  */

  // Inicializa estado com função lazy - carrega do localStorage ou começa vazio
  const [projetos, setProjetos] = useState<Projeto[]>(() => {
    const stored = getProjetos() as any[];
    if (stored && Array.isArray(stored) && stored.length > 0) {
      console.log('✅ Projetos carregados do localStorage:', stored.length);
      return stored as Projeto[];
    }
    console.log('⚠️ Nenhum projeto encontrado, iniciando lista vazia');
    return [];
  });

  // Persiste projetos no localStorage sempre que mudarem
  useEffect(() => {
    saveProjetos(projetos);
    console.log('💾 Projetos salvos no localStorage:', projetos.length);
  }, [projetos]);

  // Listener em tempo real para sincronizar aprovações do cliente
  useEffect(() => {
    const projetosRef = collection(db, 'projetos');
    const unsubscribe = onSnapshot(projetosRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const projetoAtualizado = { id: change.doc.id, ...change.doc.data() } as any;
          
          // Se o projeto foi aprovado pelo cliente (mudou para concluído)
          if (projetoAtualizado.aprovadoPorCliente && projetoAtualizado.status === 'concluido') {
            console.log('✅ Cliente aprovou projeto:', projetoAtualizado.id);
            
            // Atualiza o estado local
            setProjetos(prev => prev.map(p => 
              p.id === projetoAtualizado.id 
                ? { ...p, status: 'concluido' as StatusProjeto, aprovadoPorCliente: true, aprovadoEm: projetoAtualizado.aprovadoEm }
                : p
            ));
          }
        }
      });
    }, (error) => {
      console.error('❌ Erro no listener de projetos:', error);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  const getStatusColor = (status: StatusProjeto) => {
    const colors = {
      planejamento: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      em_andamento: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      pausado: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      revisao: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
      aprovacao: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      concluido: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      cancelado: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    };
    return colors[status];
  };

  const getStatusLabel = (status: StatusProjeto) => {
    const labels = {
      planejamento: 'Planejamento',
      em_andamento: 'Em Andamento',
      pausado: 'Pausado',
      revisao: 'Em Revisão',
      aprovacao: 'Aguardando Aprovação',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    return labels[status];
  };

  const getPrioridadeColor = (prioridade: PrioridadeProjeto) => {
    const colors = {
      baixa: 'text-gray-600 dark:text-gray-400',
      media: 'text-blue-600 dark:text-blue-400',
      alta: 'text-orange-600 dark:text-orange-400',
      urgente: 'text-red-600 dark:text-red-400'
    };
    return colors[prioridade];
  };

  // Funções utilitárias comentadas para uso futuro
  // const getEtapaIcon = (etapa: EtapaProjeto) => {
  //   const icons = { briefing: Briefcase, criacao: Zap, revisao: Eye, ajustes: Edit, aprovacao: CheckCircle2, entrega: CheckSquare };
  //   return icons[etapa];
  // };
  
  // const calcularDiasRestantes = (prazo: string) => {
  //   const hoje = new Date();
  //   const dataP = new Date(prazo);
  //   const diff = dataP.getTime() - hoje.getTime();
  //   return Math.ceil(diff / (1000 * 60 * 60 * 24));
  // };
  
  // const formatarTamanhoArquivo = (bytes: number) => {
  //   if (bytes < 1024) return bytes + ' B';
  //   if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  //   return (bytes / 1048576).toFixed(1) + ' MB';
  // };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setShowModalCriar(true);
  };

  const handleView = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowModalVisualizar(true);
  };

  const handleEdit = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowModalEditar(true);
  };

  const handleDelete = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowModalDelete(true);
  };

  const handleProjetoCreated = (novoProjeto: any) => {
    setProjetos(prev => [...prev, novoProjeto]);
    console.log('✅ Projeto adicionado ao estado:', novoProjeto.id);
  };

  const handleProjetoUpdated = (projetoAtualizado: any) => {
    setProjetos(prev => 
      prev.map(p => p.id === projetoAtualizado.id ? projetoAtualizado : p)
    );
    console.log('✅ Projeto atualizado no estado:', projetoAtualizado.id);
    
    // Fecha modal de edição e abre de visualização
    setShowModalEditar(false);
    setSelectedProjeto(projetoAtualizado);
    setShowModalVisualizar(true);
  };

  const handleProjetoDeleted = () => {
    // Recarrega do localStorage após delete
    const projetosAtualizados = getProjetos() as any[];
    setProjetos(projetosAtualizados);
    console.log('✅ Lista de projetos atualizada após exclusão');
  };

  const handleResetData = () => {
    if (confirm('⚠️ Tem certeza que deseja resetar todos os projetos para os dados iniciais?\n\nIsso apagará todas as alterações feitas!')) {
      setProjetos([]);
      saveProjetos([]);
      console.log('🔄 Projetos resetados para lista vazia');
      alert('✅ Projetos resetados. Adicione novos projetos reais.');
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    // Verifica se o projeto está concluído - não permite arrastar
    const projeto = projetos.find(p => p.id === projectId);
    if (projeto?.status === 'concluido') {
      e.preventDefault();
      alert('🔒 Projetos concluídos não podem ser movidos.');
      return;
    }
    
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedProject(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: StatusProjeto) => {
    e.preventDefault();
    
    if (!draggedProject) return;

    // Verifica se o projeto já está concluído - não permite mover
    const projetoAtual = projetos.find(p => p.id === draggedProject);
    if (projetoAtual?.status === 'concluido') {
      alert('🔒 Projetos concluídos não podem ser movidos.');
      setDraggedProject(null);
      return;
    }

    // Se está movendo para "aprovação", abrir modal para descrever o que foi feito
    if (newStatus === 'aprovacao') {
      setProjetoParaAprovacao(draggedProject);
      setNovoStatusPendente(newStatus);
      setDescricaoFase('');
      setShowModalFase(true);
      setDraggedProject(null);
      return;
    }

    // Para outros status, atualizar normalmente
    await atualizarStatusProjeto(draggedProject, newStatus);
    setDraggedProject(null);
  };

  // Função para atualizar status do projeto
  const atualizarStatusProjeto = async (projetoId: string, newStatus: StatusProjeto, descricaoAprovacao?: string) => {
    // Atualiza o status do projeto arrastado
    const projetosAtualizados = projetos.map(p =>
      p.id === projetoId
        ? { 
            ...p, 
            status: newStatus, 
            atualizadoEm: new Date().toISOString(),
            descricaoFaseAtual: descricaoAprovacao || p.descricaoFaseAtual,
            faseAtualizadaEm: descricaoAprovacao ? new Date().toISOString() : p.faseAtualizadaEm
          }
        : p
    );

    setProjetos(projetosAtualizados);
    saveProjetos(projetosAtualizados);
    
    // Sincronizar com Firestore
    try {
      const projetoAtualizado = projetosAtualizados.find(p => p.id === projetoId);
      if (projetoAtualizado) {
        await updateDoc(doc(db, 'projetos', projetoId), {
          status: newStatus,
          atualizadoEm: new Date().toISOString(),
          syncedAt: new Date().toISOString(),
          descricaoFaseAtual: descricaoAprovacao || null,
          faseAtualizadaEm: descricaoAprovacao ? new Date().toISOString() : null,
          aguardandoAprovacaoCliente: newStatus === 'aprovacao'
        });
        console.log(`✅ Projeto ${projetoId} atualizado no Firestore para status: ${newStatus}`);
        
        // Notificar cliente quando projeto vai para aprovação
        if (newStatus === 'aprovacao' && projetoAtualizado.clienteId) {
          await notificarAguardandoAprovacao(
            projetoAtualizado.clienteId,
            projetoAtualizado.titulo,
            descricaoAprovacao || 'Fase concluída aguardando aprovação',
            projetoId
          );
          console.log('🔔 Notificação enviada ao cliente: aguardando aprovação');
        } else if (projetoAtualizado.clienteId) {
          // Notificar sobre atualização geral do projeto
          await notificarProjetoAtualizado(
            projetoAtualizado.clienteId,
            projetoAtualizado.titulo,
            newStatus,
            projetoId
          );
          console.log('🔔 Notificação enviada ao cliente: projeto atualizado');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto no Firestore:', error);
    }

    console.log(`✅ Projeto ${projetoId} movido para ${newStatus}`);
  };

  // Handler para confirmar mudança de fase com descrição
  const handleConfirmarFase = async () => {
    if (!projetoParaAprovacao || !novoStatusPendente) return;
    
    if (!descricaoFase.trim()) {
      alert('Por favor, descreva o que foi realizado nesta fase.');
      return;
    }

    await atualizarStatusProjeto(projetoParaAprovacao, novoStatusPendente, descricaoFase);
    
    setShowModalFase(false);
    setProjetoParaAprovacao(null);
    setDescricaoFase('');
    setNovoStatusPendente(null);
  };

  // ============================================================================
  // ESTATÍSTICAS E FILTROS
  // ============================================================================

  // Estatísticas rápidas para os cards do topo
  const totalProjetos = projetos.length;
  const emAndamento = projetos.filter(p => p.status === 'em_andamento').length;
  const valorContratadoTotal = projetos.reduce((acc, p) => acc + (p.valorContratado || 0), 0);
  const progressoMedio = projetos.length
    ? Math.round(projetos.reduce((acc, p) => acc + (p.progresso || 0), 0) / projetos.length)
    : 0;

  const stats = [
    {
      label: 'Projetos',
      value: totalProjetos,
      icon: Layers,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      color: 'from-orange-500 to-red-500'
    },
    {
      label: 'Em andamento',
      value: emAndamento,
      icon: Play,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Valor contratado',
      value: valorContratadoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: DollarSign,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Progresso médio',
      value: `${progressoMedio}%`,
      icon: TrendingUp,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  // Filtros aplicados
  const projetosFiltrados = projetos.filter(projeto => {
    // Filtro de busca
    const matchSearch = searchQuery === '' || 
      projeto.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projeto.clienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projeto.clienteEmpresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projeto.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro de status
    const matchStatus = filterStatus === 'todos' || projeto.status === filterStatus;

    // Filtro de prioridade
    const matchPrioridade = filterPrioridade === 'todas' || projeto.prioridade === filterPrioridade;

    return matchSearch && matchStatus && matchPrioridade;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-8 h-8 text-orange-600 dark:text-amber-500" />
                  Gestão de Projetos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Controle completo de trabalhos criativos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificacoesBell />
              <ThemeToggle />
              
              {/* Botão Debug - Reset */}
              <button
                onClick={handleResetData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all text-sm"
                title="Resetar dados para valores iniciais"
              >
                🔄 Reset
              </button>
              
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Novo Projeto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="backdrop-blur-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="backdrop-blur-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar projetos por título, cliente ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
              >
                <option value="todos">Todos os Status</option>
                <option value="planejamento">Planejamento</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="pausado">Pausado</option>
                <option value="revisao">Em Revisão</option>
                <option value="aprovacao">Aguardando Aprovação</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <select
                value={filterPrioridade}
                onChange={(e) => setFilterPrioridade(e.target.value as any)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
              >
                <option value="todas">Todas as Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'lista'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'analytics'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
            {/* Coluna: Planejamento */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'planejamento')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Planejamento
                </h3>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'planejamento').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'planejamento')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Em Andamento */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'em_andamento')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Em Andamento
                </h3>
                <span className="text-xs bg-blue-200 dark:bg-blue-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'em_andamento').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'em_andamento')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Pausado */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'pausado')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pausado
                </h3>
                <span className="text-xs bg-yellow-200 dark:bg-yellow-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'pausado').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'pausado')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Em Revisão */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'revisao')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Em Revisão
                </h3>
                <span className="text-xs bg-purple-200 dark:bg-purple-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'revisao').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'revisao')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Aguardando Aprovação */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'aprovacao')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Aguardando Aprovação
                </h3>
                <span className="text-xs bg-orange-200 dark:bg-orange-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'aprovacao').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'aprovacao')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Concluído */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'concluido')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluído
                </h3>
                <span className="text-xs bg-green-200 dark:bg-green-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'concluido').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'concluido')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>

            {/* Coluna: Cancelado */}
            <div
              className="min-w-[280px] backdrop-blur-xl bg-gradient-to-b from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'cancelado')}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Cancelado
                </h3>
                <span className="text-xs bg-red-200 dark:bg-red-700 px-2 py-1 rounded-full font-semibold">
                  {projetosFiltrados.filter(p => p.status === 'cancelado').length}
                </span>
              </div>
              <div className="space-y-3">
                {projetosFiltrados
                  .filter(p => p.status === 'cancelado')
                  .map(projeto => (
                    <KanbanCard key={projeto.id} projeto={projeto} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="space-y-4">
            {projetosFiltrados.map(projeto => (
              <div
                key={projeto.id}
                onClick={() => handleView(projeto)}
                className="backdrop-blur-xl bg-white dark:bg-gray-900 border-l-4 border-orange-500 dark:border-amber-500 rounded-xl p-6 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {projeto.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(projeto.status)}`}>
                        {getStatusLabel(projeto.status)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getPrioridadeColor(projeto.prioridade)}`}>
                        {projeto.prioridade.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {projeto.titulo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {projeto.clienteEmpresa} • {projeto.clienteNome}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                      {projeto.descricao}
                    </p>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {projeto.progresso}%
                    </div>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-red-600 rounded-full transition-all"
                        style={{ width: `${projeto.progresso}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatarData(projeto.prazoEstimado)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {projeto.equipe.length} membros
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {projeto.arquivos.length} arquivos
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {projeto.comentariosInternos.length + projeto.comentariosCliente.length} comentários
                    </div>
                  </div>
                  
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatarMoeda(projeto.valorContratado)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <ModalCriarProjeto
        isOpen={showModalCriar}
        onClose={() => setShowModalCriar(false)}
        onSuccess={handleProjetoCreated}
      />

      <ModalVisualizarProjeto
        isOpen={showModalVisualizar}
        onClose={() => {
          setShowModalVisualizar(false);
          setSelectedProjeto(null);
        }}
        projeto={selectedProjeto as any}
        onEdit={handleEdit as any}
        onDelete={handleDelete as any}
      />

      <ModalEditarProjeto
        isOpen={showModalEditar}
        onClose={() => {
          setShowModalEditar(false);
          setSelectedProjeto(null);
        }}
        projeto={selectedProjeto}
        onSuccess={handleProjetoUpdated}
      />

      <ModalDeleteProjeto
        isOpen={showModalDelete}
        onClose={() => {
          setShowModalDelete(false);
          setSelectedProjeto(null);
        }}
        projeto={selectedProjeto}
        onSuccess={handleProjetoDeleted}
      />

      {/* Modal de Descrição de Fase para Aprovação */}
      {showModalFase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Enviar para Aprovação</h2>
                  <p className="text-amber-100 text-sm">Descreva o que foi realizado nesta fase</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  O que foi realizado? *
                </label>
                <textarea
                  value={descricaoFase}
                  onChange={(e) => setDescricaoFase(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white resize-none"
                  placeholder="Ex: Finalizamos as artes do feed de Instagram com as 15 peças solicitadas. Todas as imagens estão em alta resolução e seguem a identidade visual aprovada..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Esta descrição será visível para o cliente na área de aprovação
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-100 dark:bg-amber-800 rounded">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">O que acontece agora?</p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      O cliente receberá uma notificação para revisar e aprovar esta fase. 
                      Após a aprovação, o projeto será movido para "Concluído".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowModalFase(false);
                  setProjetoParaAprovacao(null);
                  setDescricaoFase('');
                  setNovoStatusPendente(null);
                }}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarFase}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors font-semibold"
              >
                <CheckCircle2 className="w-5 h-5" />
                Enviar para Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay page="projetos" />
    </div>
  );
};

export default Projetos;

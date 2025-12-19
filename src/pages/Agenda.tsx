import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
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
  CheckCircle2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';

interface RecorrenciaEvento {
  ativa: boolean;
  tipo: 'diaria' | 'semanal' | 'mensal';
  intervalo: number; // a cada X dias/semanas/meses
  diasSemana?: number[]; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  diaDoMes?: number; // dia específico do mês (1-31)
  dataFim?: string; // data limite da recorrência
  ocorrencias?: number; // ou número de ocorrências
}

interface EventoTemplate {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'reuniao' | 'deadline' | 'foco' | 'ligacao' | 'outro';
  duracaoMinutos: number;
  cor: string;
  checklist?: string[];
  materiaisNecessarios?: string[];
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
  eventoRecorrentePaiId?: string; // ID do evento original que gera recorrências
  templateId?: string; // ID do template usado para criar este evento
}

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Função auxiliar para converter Date para string sem problema de fuso horário
  const dateToLocalString = (date: Date): string => {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [eventos, setEventos] = useState<Evento[]>([
    {
      id: '1',
      titulo: 'Reunião com Cliente - Silva & Associados',
      descricao: 'Apresentação da campanha digital Q1 2025',
      data: '2025-12-15',
      horaInicio: '09:00',
      horaFim: '10:30',
      tipo: 'reuniao',
      prioridade: 'alta',
      cliente: 'Maria Silva',
      projeto: 'Campanha Digital Q1',
      projetoId: 'PROJ-2025-001',
      etapaProjeto: 'briefing',
      local: 'Zoom',
      participantes: ['Maria Silva', 'João Designer'],
      cor: 'blue',
      concluido: false,
      alertaMinutos: 15
    },
    {
      id: '2',
      titulo: 'Bloco de Foco - Design',
      descricao: 'Desenvolvimento de artes para Instagram\n\nChecklist:\n- [ ] Apresentar portfólio\n- [ ] Entender objetivo do projeto\n- [ ] Definir público-alvo',
      data: '2025-12-15',
      horaInicio: '14:00',
      horaFim: '17:00',
      tipo: 'foco',
      prioridade: 'alta',
      projeto: 'Social Media - Tech Solutions',
      projetoId: 'PROJ-2025-002',
      etapaProjeto: 'criacao',
      cor: 'purple',
      concluido: false,
      alertaMinutos: 5,
      templateId: 'temp-3'
    },
    {
      id: '3',
      titulo: 'Deadline - Entrega Proposta',
      descricao: 'Proposta comercial Costa Marketing',
      data: '2025-12-15',
      horaInicio: '18:00',
      horaFim: '18:30',
      tipo: 'deadline',
      prioridade: 'alta',
      cliente: 'Ana Costa',
      projeto: 'Proposta Q1',
      projetoId: 'PROJ-2025-003',
      etapaProjeto: 'aprovacao',
      cor: 'red',
      concluido: false,
      alertaMinutos: 30
    },
    {
      id: '4',
      titulo: 'Stand-up Diário - Equipe',
      descricao: 'Reunião rápida de alinhamento diário com a equipe',
      data: '2025-12-16',
      horaInicio: '09:00',
      horaFim: '09:15',
      tipo: 'reuniao',
      prioridade: 'alta',
      participantes: ['Equipe completa'],
      local: 'Sala de Reuniões',
      cor: 'blue',
      concluido: false,
      alertaMinutos: 5,
      recorrencia: {
        ativa: true,
        tipo: 'semanal',
        intervalo: 1,
        diasSemana: [1, 2, 3, 4, 5], // Seg-Sex
        ocorrencias: 20
      }
    },
    {
      id: '5',
      titulo: 'Review Semanal de Projetos',
      descricao: 'Revisão de status de todos os projetos em andamento',
      data: '2025-12-16',
      horaInicio: '16:00',
      horaFim: '17:00',
      tipo: 'reuniao',
      prioridade: 'media',
      participantes: ['Equipe Gestão'],
      local: 'Zoom',
      cor: 'purple',
      concluido: false,
      alertaMinutos: 15,
      recorrencia: {
        ativa: true,
        tipo: 'semanal',
        intervalo: 1,
        diasSemana: [5], // Sexta-feira
        dataFim: '2025-12-31'
      }
    },
    {
      id: '6',
      titulo: 'Relatório Mensal de Performance',
      descricao: 'Compilar e apresentar métricas do mês',
      data: '2025-12-17',
      horaInicio: '14:00',
      horaFim: '15:30',
      tipo: 'foco',
      prioridade: 'alta',
      cor: 'orange',
      concluido: false,
      alertaMinutos: 60,
      recorrencia: {
        ativa: true,
        tipo: 'mensal',
        intervalo: 1,
        diaDoMes: 1,
        ocorrencias: 12
      }
    }
  ]);

  // Templates de eventos pré-configurados
  const [templates] = useState<EventoTemplate[]>([
    {
      id: 'temp-1',
      nome: 'Briefing com Cliente',
      descricao: 'Reunião inicial para entender necessidades e expectativas',
      tipo: 'reuniao',
      duracaoMinutos: 60,
      cor: 'blue',
      checklist: [
        'Apresentar portfólio',
        'Entender objetivo do projeto',
        'Definir público-alvo',
        'Estabelecer orçamento',
        'Alinhar prazos'
      ],
      materiaisNecessarios: ['Apresentação comercial', 'Contrato', 'Proposta de valor']
    },
    {
      id: 'temp-2',
      nome: 'Apresentação de Proposta',
      descricao: 'Apresentação formal da proposta comercial',
      tipo: 'reuniao',
      duracaoMinutos: 90,
      cor: 'purple',
      checklist: [
        'Revisar proposta',
        'Preparar apresentação',
        'Projeção de custos',
        'Timeline do projeto',
        'Termos e condições'
      ],
      materiaisNecessarios: ['Proposta comercial', 'Cronograma', 'Portfólio similar']
    },
    {
      id: 'temp-3',
      nome: 'Bloco de Criação',
      descricao: 'Tempo dedicado à criação e desenvolvimento',
      tipo: 'foco',
      duracaoMinutos: 180,
      cor: 'purple',
      checklist: [
        'Revisar briefing',
        'Pesquisar referências',
        'Desenvolver conceito',
        'Criar protótipo',
        'Preparar apresentação'
      ],
      materiaisNecessarios: ['Briefing aprovado', 'Referências visuais', 'Assets do cliente']
    },
    {
      id: 'temp-4',
      nome: 'Aprovação de Material',
      descricao: 'Reunião para aprovação final do material criado',
      tipo: 'reuniao',
      duracaoMinutos: 45,
      cor: 'green',
      checklist: [
        'Apresentar versão final',
        'Coletar feedback',
        'Ajustes finais',
        'Aprovação formal',
        'Definir entrega'
      ],
      materiaisNecessarios: ['Material finalizado', 'Mockups', 'Termo de aprovação']
    },
    {
      id: 'temp-5',
      nome: 'Planejamento de Publicação',
      descricao: 'Organizar calendário de publicações sociais',
      tipo: 'foco',
      duracaoMinutos: 120,
      cor: 'pink',
      checklist: [
        'Definir datas',
        'Escolher conteúdos',
        'Escrever copies',
        'Agendar posts',
        'Configurar métricas'
      ],
      materiaisNecessarios: ['Calendário editorial', 'Banco de conteúdos', 'Ferramentas de agendamento']
    }
  ]);

  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Função para gerar eventos recorrentes
  const gerarEventosRecorrentes = (eventoBase: Evento): Evento[] => {
    if (!eventoBase.recorrencia || !eventoBase.recorrencia.ativa) {
      return [eventoBase];
    }

    const eventos: Evento[] = [eventoBase];
    const recorrencia = eventoBase.recorrencia;
    const dataInicio = new Date(eventoBase.data);
    let dataAtual = new Date(dataInicio);
    let contador = 0;

    // Limite máximo de 100 ocorrências para evitar loops infinitos
    const maxOcorrencias = recorrencia.ocorrencias || 100;
    const dataLimite = recorrencia.dataFim ? new Date(recorrencia.dataFim) : new Date(dataInicio.getFullYear() + 2, 11, 31);

    while (contador < maxOcorrencias) {
      // Calcular próxima data baseado no tipo de recorrência
      switch (recorrencia.tipo) {
        case 'diaria':
          dataAtual.setDate(dataAtual.getDate() + recorrencia.intervalo);
          break;
        case 'semanal':
          dataAtual.setDate(dataAtual.getDate() + (7 * recorrencia.intervalo));
          // Se tem dias específicos da semana, ajustar
          if (recorrencia.diasSemana && recorrencia.diasSemana.length > 0) {
            // Implementação simplificada - pode ser expandida
            const diaAtual = dataAtual.getDay();
            if (!recorrencia.diasSemana.includes(diaAtual)) {
              continue;
            }
          }
          break;
        case 'mensal':
          dataAtual.setMonth(dataAtual.getMonth() + recorrencia.intervalo);
          // Se tem dia específico do mês, ajustar
          if (recorrencia.diaDoMes) {
            dataAtual.setDate(recorrencia.diaDoMes);
          }
          break;
      }

      // Verificar se passou da data limite
      if (dataAtual > dataLimite) {
        break;
      }

      // Criar novo evento recorrente
      const novoEvento: Evento = {
        ...eventoBase,
        id: `${eventoBase.id}-rec-${contador + 1}`,
        data: dateToLocalString(dataAtual),
        eventoRecorrentePaiId: eventoBase.id,
        concluido: false
      };

      eventos.push(novoEvento);
      contador++;
    }

    return eventos;
  };

  // Função para criar evento a partir de template
  const criarEventoDeTemplate = (template: EventoTemplate, data: string, horaInicio: string) => {
    const duracaoHoras = Math.floor(template.duracaoMinutos / 60);
    const duracaoMinutos = template.duracaoMinutos % 60;
    
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const horaFim = `${String(hora + duracaoHoras).padStart(2, '0')}:${String(minuto + duracaoMinutos).padStart(2, '0')}`;

    const novoEvento: Evento = {
      id: Date.now().toString(),
      titulo: template.nome,
      descricao: template.descricao + '\n\nChecklist:\n' + (template.checklist?.map(item => `- [ ] ${item}`).join('\n') || ''),
      data,
      horaInicio,
      horaFim,
      tipo: template.tipo,
      prioridade: 'media',
      cor: template.cor,
      concluido: false,
      alertaMinutos: 15,
      templateId: template.id
    };

    return novoEvento;
  };

  const [formData, setFormData] = useState<Partial<Evento>>({
    titulo: '',
    descricao: '',
    data: dateToLocalString(new Date()),
    horaInicio: '09:00',
    horaFim: '10:00',
    tipo: 'reuniao',
    prioridade: 'media',
    cor: 'blue',
    concluido: false,
    alertaMinutos: 15
  });

  const tiposEvento = [
    { value: 'reuniao', label: 'Reunião', icon: Users, color: 'blue' },
    { value: 'deadline', label: 'Deadline', icon: AlertCircle, color: 'red' },
    { value: 'foco', label: 'Bloco de Foco', icon: Target, color: 'purple' },
    { value: 'ligacao', label: 'Ligação', icon: Clock, color: 'green' },
    { value: 'outro', label: 'Outro', icon: Calendar, color: 'gray' }
  ];

  const cores = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' }
  ];

  const getEventosCor = (cor: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      pink: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
      orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
    };
    return colorMap[cor] || colorMap.blue;
  };

  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'text-red-600 dark:text-red-400';
      case 'media': return 'text-yellow-600 dark:text-yellow-400';
      case 'baixa': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getEventosData = (data: Date) => {
    // Usar função auxiliar para evitar problema de fuso horário
    const dataStr = dateToLocalString(data);
    return eventos.filter(e => e.data === dataStr).sort((a, b) => 
      a.horaInicio.localeCompare(b.horaInicio)
    );
  };

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navegarData = (direcao: 'prev' | 'next') => {
    const novaData = new Date(currentDate);
    if (viewMode === 'dia') {
      novaData.setDate(novaData.getDate() + (direcao === 'next' ? 1 : -1));
    } else if (viewMode === 'semana') {
      novaData.setDate(novaData.getDate() + (direcao === 'next' ? 7 : -7));
    } else {
      novaData.setMonth(novaData.getMonth() + (direcao === 'next' ? 1 : -1));
    }
    setCurrentDate(novaData);
  };

  const getSemanaDias = () => {
    const dias = [];
    const inicio = new Date(currentDate);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      titulo: '',
      descricao: '',
      data: dateToLocalString(currentDate),
      horaInicio: '09:00',
      horaFim: '10:00',
      tipo: 'reuniao',
      prioridade: 'media',
      cor: 'blue',
      concluido: false,
      alertaMinutos: 15
    });
    setShowModal(true);
  };

  const handleEdit = (evento: Evento) => {
    setModalMode('edit');
    setSelectedEvento(evento);
    setFormData(evento);
    setShowModal(true);
  };

  const handleView = (evento: Evento) => {
    setModalMode('view');
    setSelectedEvento(evento);
    setShowModal(true);
  };

  const handleDelete = (evento: Evento) => {
    setSelectedEvento(evento);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedEvento) {
      setEventos(eventos.filter(e => e.id !== selectedEvento.id));
      setShowDeleteConfirm(false);
      setSelectedEvento(null);
    }
  };

  const handleSave = () => {
    if (modalMode === 'create') {
      const novoEvento: Evento = {
        ...formData as Evento,
        id: Date.now().toString()
      };
      
      // Se tem recorrência ativa, gerar eventos recorrentes
      if (novoEvento.recorrencia?.ativa) {
        const eventosRecorrentes = gerarEventosRecorrentes(novoEvento);
        setEventos([...eventos, ...eventosRecorrentes]);
      } else {
        setEventos([...eventos, novoEvento]);
      }
    } else if (modalMode === 'edit' && selectedEvento) {
      setEventos(eventos.map(e => 
        e.id === selectedEvento.id ? { ...formData as Evento, id: e.id } : e
      ));
    }
    setShowModal(false);
    setSelectedEvento(null);
  };

  const toggleConcluido = (id: string) => {
    setEventos(eventos.map(e => 
      e.id === id ? { ...e, concluido: !e.concluido } : e
    ));
  };

  const stats = [
    {
      label: 'Hoje',
      value: getEventosData(new Date()).length.toString(),
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Esta Semana',
      value: eventos.filter(e => {
        const eventDate = new Date(e.data);
        const weekDays = getSemanaDias();
        return eventDate >= weekDays[0] && eventDate <= weekDays[6];
      }).length.toString(),
      icon: Clock,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Pendentes',
      value: eventos.filter(e => !e.concluido).length.toString(),
      icon: AlertCircle,
      color: 'from-orange-500 to-red-500'
    },
    {
      label: 'Concluídos',
      value: eventos.filter(e => e.concluido).length.toString(),
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 dark:from-gray-950 dark:via-orange-950/30 dark:to-red-950/30 transition-colors duration-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 sticky top-0">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gestão do Tempo</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificacoesBell />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="relative group">
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-l-4 border-l-orange-500 dark:border-l-amber-500 rounded-xl p-4 transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navegarData('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-[250px] text-center">
                <h2 className="font-bold text-gray-900 dark:text-white capitalize">
                  {formatarData(currentDate)}
                </h2>
              </div>
              <button
                onClick={() => navegarData('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Hoje
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('dia')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'dia'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setViewMode('semana')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'semana'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('mes')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'mes'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Mês
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-400 dark:hover:to-pink-400 text-white rounded-lg transition-all hover:scale-105 font-semibold"
                >
                  <Zap className="w-5 h-5" />
                  Usar Template
                </button>
                
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Novo Evento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vista Dia */}
        {viewMode === 'dia' && (
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="space-y-3">
              {getEventosData(currentDate).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum evento para hoje</p>
                </div>
              ) : (
                getEventosData(currentDate).map((evento) => (
                  <div
                    key={evento.id}
                    className={`border-l-4 ${getEventosCor(evento.cor)} rounded-lg p-4 transition-all hover:shadow-lg cursor-pointer ${
                      evento.concluido ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleView(evento)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleConcluido(evento.id);
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              evento.concluido
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                            }`}
                          >
                            {evento.concluido && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                          <h3 className={`font-bold text-gray-900 dark:text-white ${
                            evento.concluido ? 'line-through' : ''
                          }`}>
                            {evento.titulo}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded ${getPrioridadeCor(evento.prioridade)} bg-current/10`}>
                            {evento.prioridade}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ml-8">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {evento.horaInicio} - {evento.horaFim}
                          </div>
                          {evento.cliente && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {evento.cliente}
                            </div>
                          )}
                          {evento.alertaMinutos && (
                            <div className="flex items-center gap-1">
                              <Bell className="w-4 h-4" />
                              {evento.alertaMinutos} min antes
                            </div>
                          )}
                          {evento.recorrencia?.ativa && (
                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <Clock className="w-4 h-4" />
                              Recorrente
                            </div>
                          )}
                          {evento.projetoId && (
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Briefcase className="w-4 h-4" />
                              Projeto
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(evento);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(evento);
                          }}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Vista Semana */}
        {viewMode === 'semana' && (
          <div className="grid grid-cols-7 gap-2">
            {getSemanaDias().map((dia, index) => {
              const eventosdia = getEventosData(dia);
              const isToday = dia.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border ${
                    isToday ? 'border-orange-500 dark:border-amber-500 border-2' : 'border-gray-200 dark:border-gray-800'
                  } rounded-xl p-3 min-h-[200px]`}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {dia.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-bold ${
                      isToday ? 'text-orange-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {dia.getDate()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {eventosdia.map((evento) => (
                      <div
                        key={evento.id}
                        onClick={() => handleView(evento)}
                        className={`text-xs p-2 rounded border-l-2 ${getEventosCor(evento.cor)} cursor-pointer hover:shadow transition-all ${
                          evento.concluido ? 'opacity-60' : ''
                        }`}
                      >
                        <p className={`font-semibold text-gray-900 dark:text-white truncate ${
                          evento.concluido ? 'line-through' : ''
                        }`}>
                          {evento.titulo}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {evento.horaInicio}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista Mês */}
        {viewMode === 'mes' && (
          <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Vista mensal em desenvolvimento</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Use as vistas de Dia ou Semana para visualizar seus eventos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && modalMode !== 'view' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' ? 'Novo Evento' : 'Editar Evento'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  placeholder="Nome do evento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white resize-none"
                  placeholder="Detalhes do evento..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Início *
                  </label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fim *
                  </label>
                  <input
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  >
                    {tiposEvento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: cor.value })}
                      className={`w-10 h-10 rounded-lg ${cor.class} ${
                        formData.cor === cor.value ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''
                      }`}
                      title={cor.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alerta (minutos antes)
                </label>
                <select
                  value={formData.alertaMinutos || 0}
                  onChange={(e) => setFormData({ ...formData, alertaMinutos: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                >
                  <option value="0">Sem alerta</option>
                  <option value="5">5 minutos</option>
                  <option value="10">10 minutos</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.cliente || ''}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Projeto
                  </label>
                  <input
                    type="text"
                    value={formData.projeto || ''}
                    onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                    placeholder="Nome do projeto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={formData.local || ''}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                  placeholder="Local ou link da reunião"
                />
              </div>

              {/* Integração com Projetos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Integração com Projetos
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ID do Projeto
                    </label>
                    <input
                      type="text"
                      value={formData.projetoId || ''}
                      onChange={(e) => setFormData({ ...formData, projetoId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                      placeholder="ID do projeto vinculado"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Etapa do Projeto
                    </label>
                    <select
                      value={formData.etapaProjeto || ''}
                      onChange={(e) => setFormData({ ...formData, etapaProjeto: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                    >
                      <option value="">Nenhuma etapa</option>
                      <option value="briefing">Briefing</option>
                      <option value="criacao">Criação</option>
                      <option value="revisao">Revisão</option>
                      <option value="ajustes">Ajustes</option>
                      <option value="aprovacao">Aprovação</option>
                      <option value="entrega">Entrega</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Vincule este evento a um projeto e etapa específica para sincronização automática
                </p>
              </div>

              {/* Recorrência */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recorrência
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.recorrencia?.ativa || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        recorrencia: {
                          ativa: e.target.checked,
                          tipo: 'semanal',
                          intervalo: 1
                        }
                      })}
                      className="w-5 h-5 text-orange-600 dark:text-amber-500 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ativar recorrência
                    </span>
                  </label>
                </div>

                {formData.recorrencia?.ativa && (
                  <div className="space-y-4 pl-4 border-l-4 border-orange-500 dark:border-amber-500">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Recorrência
                        </label>
                        <select
                          value={formData.recorrencia?.tipo || 'semanal'}
                          onChange={(e) => setFormData({
                            ...formData,
                            recorrencia: {
                              ...formData.recorrencia!,
                              tipo: e.target.value as any
                            }
                          })}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        >
                          <option value="diaria">Diária</option>
                          <option value="semanal">Semanal</option>
                          <option value="mensal">Mensal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Intervalo
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={formData.recorrencia?.intervalo || 1}
                          onChange={(e) => setFormData({
                            ...formData,
                            recorrencia: {
                              ...formData.recorrencia!,
                              intervalo: parseInt(e.target.value) || 1
                            }
                          })}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {formData.recorrencia?.tipo === 'semanal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dias da Semana
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                const diasAtual = formData.recorrencia?.diasSemana || [];
                                const novos = diasAtual.includes(index)
                                  ? diasAtual.filter(d => d !== index)
                                  : [...diasAtual, index];
                                setFormData({
                                  ...formData,
                                  recorrencia: {
                                    ...formData.recorrencia!,
                                    diasSemana: novos
                                  }
                                });
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                formData.recorrencia?.diasSemana?.includes(index)
                                  ? 'bg-orange-600 dark:bg-amber-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {dia}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.recorrencia?.tipo === 'mensal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dia do Mês
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.recorrencia?.diaDoMes || 1}
                          onChange={(e) => setFormData({
                            ...formData,
                            recorrencia: {
                              ...formData.recorrencia!,
                              diaDoMes: parseInt(e.target.value) || 1
                            }
                          })}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                          placeholder="Dia do mês (1-31)"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Data Fim (opcional)
                        </label>
                        <input
                          type="date"
                          value={formData.recorrencia?.dataFim || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            recorrencia: {
                              ...formData.recorrencia!,
                              dataFim: e.target.value
                            }
                          })}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ou Nº de Ocorrências
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.recorrencia?.ocorrencias || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            recorrencia: {
                              ...formData.recorrencia!,
                              ocorrencias: parseInt(e.target.value) || undefined
                            }
                          })}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                          placeholder="Número de vezes"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🔄 Este evento se repetirá automaticamente conforme configuração
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all hover:scale-105 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => toggleConcluido(selectedEvento.id)}
                  className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedEvento.concluido
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                  }`}
                >
                  {selectedEvento.concluido && <CheckCircle2 className="w-6 h-6 text-white" />}
                </button>
                <div>
                  <h3 className={`text-2xl font-bold text-gray-900 dark:text-white ${
                    selectedEvento.concluido ? 'line-through' : ''
                  }`}>
                    {selectedEvento.titulo}
                  </h3>
                  <span className={`text-sm px-2 py-1 rounded ${getPrioridadeCor(selectedEvento.prioridade)} bg-current/10`}>
                    Prioridade {selectedEvento.prioridade}
                  </span>
                </div>
              </div>

              {selectedEvento.descricao && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Descrição</label>
                  <p className="text-gray-900 dark:text-white">{selectedEvento.descricao}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Data</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedEvento.data).toLocaleDateString('pt-BR', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Horário</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedEvento.horaInicio} - {selectedEvento.horaFim}
                  </p>
                </div>
                {selectedEvento.cliente && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Cliente</label>
                    <p className="text-gray-900 dark:text-white">{selectedEvento.cliente}</p>
                  </div>
                )}
                {selectedEvento.projeto && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Projeto</label>
                    <p className="text-gray-900 dark:text-white">{selectedEvento.projeto}</p>
                  </div>
                )}
                {selectedEvento.local && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Local</label>
                    <p className="text-gray-900 dark:text-white">{selectedEvento.local}</p>
                  </div>
                )}
                {selectedEvento.alertaMinutos && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Alerta</label>
                    <p className="text-gray-900 dark:text-white">{selectedEvento.alertaMinutos} minutos antes</p>
                  </div>
                )}
                {selectedEvento.projetoId && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      Integração com Projeto
                    </label>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <strong>Projeto ID:</strong> {selectedEvento.projetoId}
                      </p>
                      {selectedEvento.etapaProjeto && (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          <strong>Etapa:</strong> {selectedEvento.etapaProjeto.charAt(0).toUpperCase() + selectedEvento.etapaProjeto.slice(1)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {selectedEvento.recorrencia?.ativa && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Recorrência
                    </label>
                    <div className="mt-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <strong>Tipo:</strong> {selectedEvento.recorrencia.tipo.charAt(0).toUpperCase() + selectedEvento.recorrencia.tipo.slice(1)}
                        {' '}• <strong>Intervalo:</strong> a cada {selectedEvento.recorrencia.intervalo} {
                          selectedEvento.recorrencia.tipo === 'diaria' ? 'dia(s)' :
                          selectedEvento.recorrencia.tipo === 'semanal' ? 'semana(s)' :
                          'mês(es)'
                        }
                      </p>
                      {selectedEvento.recorrencia.diasSemana && selectedEvento.recorrencia.diasSemana.length > 0 && (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          <strong>Dias:</strong> {selectedEvento.recorrencia.diasSemana.map(d => 
                            ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]
                          ).join(', ')}
                        </p>
                      )}
                      {selectedEvento.recorrencia.dataFim && (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          <strong>Até:</strong> {new Date(selectedEvento.recorrencia.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {selectedEvento.recorrencia.ocorrencias && (
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          <strong>Ocorrências:</strong> {selectedEvento.recorrencia.ocorrencias}x
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {selectedEvento.templateId && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Criado a partir de template
                    </label>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {templates.find(t => t.id === selectedEvento.templateId)?.nome || 'Template'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleEdit(selectedEvento);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
                >
                  <Edit className="w-5 h-5" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleDelete(selectedEvento);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-semibold"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEvento && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Excluir Evento?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tem certeza que deseja excluir <strong>{selectedEvento.titulo}</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEvento(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-semibold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Templates */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Escolha um Template
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Crie eventos rapidamente com configurações pré-definidas
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const TipoIcon = tiposEvento.find(t => t.value === template.tipo)?.icon || Calendar;
                const corClass = cores.find(c => c.value === template.cor)?.class || 'bg-blue-500';
                
                return (
                  <div
                    key={template.id}
                    onClick={() => {
                      const novoEvento = criarEventoDeTemplate(
                        template,
                        dateToLocalString(currentDate),
                        '09:00'
                      );
                      setFormData(novoEvento);
                      setShowTemplateModal(false);
                      setModalMode('create');
                      setShowModal(true);
                    }}
                    className="group cursor-pointer backdrop-blur-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 ${corClass} rounded-lg`}>
                        <TipoIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {template.nome}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.descricao}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-3">
                          <Clock className="w-4 h-4" />
                          {template.duracaoMinutos} minutos
                        </div>

                        {template.checklist && template.checklist.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Checklist ({template.checklist.length} itens)
                            </p>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                              {template.checklist.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-purple-500">•</span>
                                  {item}
                                </li>
                              ))}
                              {template.checklist.length > 3 && (
                                <li className="text-purple-500 font-medium">
                                  +{template.checklist.length - 3} mais...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {tiposEvento.find(t => t.value === template.tipo)?.label}
                      </span>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                        Usar template →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-center">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >n                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay page="agenda" />
    </div>
  );
};

export default Agenda;

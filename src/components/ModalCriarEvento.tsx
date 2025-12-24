import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Save,
  Sparkles,
  Calendar,
  Clock,
  Users,
  Target,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Coffee,
  Video,
  Phone,
  FileText,
  Palette,
  Megaphone,
  DollarSign,
  Rocket,
  Heart,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Bell,
  MapPin,
  Tag,
  Repeat,
  ArrowRight,
  Search,
  Filter,
  Layout,
  Layers,
  Settings,
  PlusCircle
} from 'lucide-react';
import { getClientes, getProjetos } from '../services/dataIntegration';

// ============================================================================
// INTERFACES
// ============================================================================

export interface RecorrenciaEvento {
  ativa: boolean;
  tipo: 'diaria' | 'semanal' | 'mensal';
  intervalo: number;
  diasSemana?: number[];
  diaDoMes?: number;
  dataFim?: string;
  ocorrencias?: number;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: 'reuniao' | 'deadline' | 'foco' | 'ligacao' | 'outro';
  prioridade: 'alta' | 'media' | 'baixa';
  cliente?: string;
  clienteId?: string;
  projeto?: string;
  projetoId?: string;
  etapaProjeto?: 'briefing' | 'criacao' | 'revisao' | 'ajustes' | 'aprovacao' | 'entrega';
  local?: string;
  participantes?: string[];
  cor: string;
  concluido: boolean;
  alertaMinutos?: number;
  recorrencia?: RecorrenciaEvento;
  templateId?: string;
}

// Tipo para criar novo evento (sem id)
export type NovoEvento = Omit<Evento, 'id' | 'concluido'>;

export interface TemplateEvento {
  id: string;
  nome: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  cor: string;
  gradient: string;
  tipo: Evento['tipo'];
  duracao: number; // em minutos
  prioridade: Evento['prioridade'];
  alertaMinutos: number;
  categoria: 'produtividade' | 'cliente' | 'criativo' | 'administrativo' | 'pessoal';
  padrao: boolean; // template padrão do sistema
  customizado?: boolean;
}

// Alias para compatibilidade
export type EventoTemplate = TemplateEvento;

export interface ModalCriarEventoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evento: NovoEvento) => void;
  dataInicial?: string;
  eventoParaEditar?: Evento | null;
}

// ============================================================================
// TEMPLATES PADRÃO DO SISTEMA
// ============================================================================

const TEMPLATES_PADRAO: EventoTemplate[] = [
  // Produtividade
  {
    id: 'focus-deep',
    nome: 'Deep Work',
    descricao: 'Bloco de foco profundo sem interrupções',
    icon: Target,
    cor: 'purple',
    gradient: 'from-purple-500 to-indigo-600',
    tipo: 'foco',
    duracao: 120,
    prioridade: 'alta',
    alertaMinutos: 5,
    categoria: 'produtividade',
    padrao: true
  },
  {
    id: 'focus-quick',
    nome: 'Sprint Criativo',
    descricao: 'Sessão rápida e intensa de criação',
    icon: Zap,
    cor: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    tipo: 'foco',
    duracao: 45,
    prioridade: 'alta',
    alertaMinutos: 2,
    categoria: 'produtividade',
    padrao: true
  },
  {
    id: 'pomodoro',
    nome: 'Pomodoro',
    descricao: 'Técnica 25min foco + 5min pausa',
    icon: Clock,
    cor: 'red',
    gradient: 'from-red-500 to-pink-500',
    tipo: 'foco',
    duracao: 25,
    prioridade: 'media',
    alertaMinutos: 1,
    categoria: 'produtividade',
    padrao: true
  },

  // Cliente
  {
    id: 'reuniao-cliente',
    nome: 'Reunião com Cliente',
    descricao: 'Apresentação ou alinhamento com cliente',
    icon: Users,
    cor: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    tipo: 'reuniao',
    duracao: 60,
    prioridade: 'alta',
    alertaMinutos: 15,
    categoria: 'cliente',
    padrao: true
  },
  {
    id: 'call-rapida',
    nome: 'Call Rápida',
    descricao: 'Ligação rápida para alinhamento',
    icon: Phone,
    cor: 'green',
    gradient: 'from-green-500 to-emerald-500',
    tipo: 'ligacao',
    duracao: 15,
    prioridade: 'media',
    alertaMinutos: 5,
    categoria: 'cliente',
    padrao: true
  },
  {
    id: 'apresentacao',
    nome: 'Apresentação',
    descricao: 'Apresentação de proposta ou projeto',
    icon: Briefcase,
    cor: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    tipo: 'reuniao',
    duracao: 45,
    prioridade: 'alta',
    alertaMinutos: 30,
    categoria: 'cliente',
    padrao: true
  },

  // Criativo
  {
    id: 'criacao-design',
    nome: 'Criação de Design',
    descricao: 'Desenvolvimento de peças visuais',
    icon: Palette,
    cor: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    tipo: 'foco',
    duracao: 180,
    prioridade: 'alta',
    alertaMinutos: 10,
    categoria: 'criativo',
    padrao: true
  },
  {
    id: 'brainstorm',
    nome: 'Brainstorm',
    descricao: 'Sessão de ideias e criatividade',
    icon: Sparkles,
    cor: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    tipo: 'reuniao',
    duracao: 60,
    prioridade: 'media',
    alertaMinutos: 10,
    categoria: 'criativo',
    padrao: true
  },
  {
    id: 'revisao-conteudo',
    nome: 'Revisão de Conteúdo',
    descricao: 'Revisar e aprovar materiais',
    icon: FileText,
    cor: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    tipo: 'foco',
    duracao: 45,
    prioridade: 'media',
    alertaMinutos: 5,
    categoria: 'criativo',
    padrao: true
  },

  // Administrativo
  {
    id: 'deadline',
    nome: 'Deadline',
    descricao: 'Prazo de entrega importante',
    icon: AlertCircle,
    cor: 'red',
    gradient: 'from-red-600 to-orange-500',
    tipo: 'deadline',
    duracao: 30,
    prioridade: 'alta',
    alertaMinutos: 60,
    categoria: 'administrativo',
    padrao: true
  },
  {
    id: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Pagamentos, cobranças, orçamentos',
    icon: DollarSign,
    cor: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
    tipo: 'outro',
    duracao: 30,
    prioridade: 'media',
    alertaMinutos: 15,
    categoria: 'administrativo',
    padrao: true
  },

  // Pessoal
  {
    id: 'pausa-cafe',
    nome: 'Pausa para Café',
    descricao: 'Intervalo para descanso mental',
    icon: Coffee,
    cor: 'orange',
    gradient: 'from-orange-400 to-amber-500',
    tipo: 'outro',
    duracao: 15,
    prioridade: 'baixa',
    alertaMinutos: 0,
    categoria: 'pessoal',
    padrao: true
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ModalCriarEvento: React.FC<ModalCriarEventoProps> = ({
  isOpen,
  onClose,
  onSave,
  dataInicial,
  eventoParaEditar
}) => {
  const navigate = useNavigate();
  
  // Estados
  const [step, setStep] = useState<'templates' | 'form' | 'criar-template'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EventoTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // Templates customizados salvos no localStorage
  const [templatesCustomizados, setTemplatesCustomizados] = useState<EventoTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('evento_templates_custom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Todos os templates
  const allTemplates = useMemo(() => {
    return [...TEMPLATES_PADRAO, ...templatesCustomizados];
  }, [templatesCustomizados]);

  // Templates filtrados
  const templatesFiltrados = useMemo(() => {
    return allTemplates.filter(t => {
      const matchSearch = t.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategoria = filterCategoria === 'todos' || t.categoria === filterCategoria;
      return matchSearch && matchCategoria;
    });
  }, [allTemplates, searchQuery, filterCategoria]);

  // Form data
  const [formData, setFormData] = useState<{
    titulo: string;
    descricao: string;
    data: string;
    horaInicio: string;
    horaFim: string;
    tipo: Evento['tipo'];
    prioridade: Evento['prioridade'];
    clienteId: string;
    projetoId: string;
    local: string;
    alertaMinutos: number;
    cor: string;
    recorrencia: RecorrenciaEvento;
  }>({
    titulo: '',
    descricao: '',
    data: dataInicial || new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFim: '10:00',
    tipo: 'outro',
    prioridade: 'media',
    clienteId: '',
    projetoId: '',
    local: '',
    alertaMinutos: 15,
    cor: 'blue',
    recorrencia: { ativa: false, tipo: 'semanal', intervalo: 1 }
  });

  // Novo template sendo criado
  const [novoTemplate, setNovoTemplate] = useState<Partial<EventoTemplate>>({
    nome: '',
    descricao: '',
    cor: 'blue',
    tipo: 'outro',
    duracao: 60,
    prioridade: 'media',
    alertaMinutos: 15,
    categoria: 'produtividade'
  });

  // Dados integrados
  const clientes = getClientes();
  const projetos = getProjetos();

  // Projetos filtrados por cliente
  const projetosFiltrados = useMemo(() => {
    if (!formData.clienteId) return projetos;
    return projetos.filter(p => p.clienteId === formData.clienteId);
  }, [projetos, formData.clienteId]);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (eventoParaEditar) {
        // Modo edição
        setFormData({
          titulo: eventoParaEditar.titulo,
          descricao: eventoParaEditar.descricao,
          data: eventoParaEditar.data,
          horaInicio: eventoParaEditar.horaInicio,
          horaFim: eventoParaEditar.horaFim,
          tipo: eventoParaEditar.tipo,
          prioridade: eventoParaEditar.prioridade,
          clienteId: eventoParaEditar.clienteId || '',
          projetoId: eventoParaEditar.projetoId || '',
          local: eventoParaEditar.local || '',
          alertaMinutos: eventoParaEditar.alertaMinutos || 15,
          cor: eventoParaEditar.cor,
          recorrencia: eventoParaEditar.recorrencia || { ativa: false, tipo: 'semanal', intervalo: 1 }
        });
        setStep('form');
      } else {
        setStep('templates');
        setSelectedTemplate(null);
      }
    }
  }, [isOpen, eventoParaEditar, dataInicial]);

  // Salvar templates customizados
  useEffect(() => {
    localStorage.setItem('evento_templates_custom', JSON.stringify(templatesCustomizados));
  }, [templatesCustomizados]);

  // Aplicar template selecionado
  const aplicarTemplate = (template: EventoTemplate) => {
    setSelectedTemplate(template);
    
    // Calcular hora fim baseado na duração
    const [hora, minuto] = formData.horaInicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto + template.duracao;
    const horaFim = `${String(Math.floor(totalMinutos / 60) % 24).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;

    setFormData(prev => ({
      ...prev,
      titulo: template.nome,
      descricao: template.descricao,
      tipo: template.tipo,
      prioridade: template.prioridade,
      cor: template.cor,
      alertaMinutos: template.alertaMinutos,
      horaFim
    }));
    setStep('form');
  };

  // Criar novo template
  const salvarNovoTemplate = () => {
    if (!novoTemplate.nome) return;

    const template: EventoTemplate = {
      id: `custom-${Date.now()}`,
      nome: novoTemplate.nome || '',
      descricao: novoTemplate.descricao || '',
      icon: getIconForType(novoTemplate.tipo || 'outro'),
      cor: novoTemplate.cor || 'blue',
      gradient: getGradientForColor(novoTemplate.cor || 'blue'),
      tipo: (novoTemplate.tipo as Evento['tipo']) || 'outro',
      duracao: novoTemplate.duracao || 60,
      prioridade: (novoTemplate.prioridade as Evento['prioridade']) || 'media',
      alertaMinutos: novoTemplate.alertaMinutos || 15,
      categoria: (novoTemplate.categoria as EventoTemplate['categoria']) || 'produtividade',
      padrao: false,
      customizado: true
    };

    setTemplatesCustomizados(prev => [...prev, template]);
    setNovoTemplate({
      nome: '',
      descricao: '',
      cor: 'blue',
      tipo: 'outro',
      duracao: 60,
      prioridade: 'media',
      alertaMinutos: 15,
      categoria: 'produtividade'
    });
    setStep('templates');
  };

  // Deletar template customizado
  const deletarTemplate = (templateId: string) => {
    setTemplatesCustomizados(prev => prev.filter(t => t.id !== templateId));
  };

  // Helper para obter ícone por tipo
  const getIconForType = (tipo: string): React.ComponentType<{ className?: string }> => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      reuniao: Users,
      deadline: AlertCircle,
      foco: Target,
      ligacao: Phone,
      outro: Calendar
    };
    return icons[tipo] || Calendar;
  };

  // Helper para obter gradiente por cor
  const getGradientForColor = (cor: string): string => {
    const gradients: Record<string, string> = {
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-indigo-600',
      red: 'from-red-500 to-pink-500',
      green: 'from-green-500 to-emerald-500',
      yellow: 'from-yellow-500 to-orange-500',
      pink: 'from-pink-500 to-rose-500',
      orange: 'from-orange-500 to-red-500',
      indigo: 'from-indigo-500 to-purple-500',
      teal: 'from-teal-500 to-cyan-500',
      amber: 'from-amber-500 to-yellow-500',
      emerald: 'from-emerald-500 to-green-500'
    };
    return gradients[cor] || gradients.blue;
  };

  // Salvar evento
  const handleSave = () => {
    const cliente = clientes.find(c => c.id === formData.clienteId);
    const projeto = projetos.find(p => p.id === formData.projetoId);

    const evento: Omit<Evento, 'id'> = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: formData.data,
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      tipo: formData.tipo,
      prioridade: formData.prioridade,
      cliente: cliente?.nome,
      clienteId: formData.clienteId,
      projeto: projeto?.titulo,
      projetoId: formData.projetoId,
      local: formData.local,
      alertaMinutos: formData.alertaMinutos,
      cor: formData.cor,
      concluido: false,
      recorrencia: formData.recorrencia.ativa ? formData.recorrencia : undefined,
      templateId: selectedTemplate?.id
    };

    onSave(evento);
    onClose();
  };

  // Categorias para filtro
  const categorias = [
    { id: 'todos', label: 'Todos', icon: Layout },
    { id: 'produtividade', label: 'Produtividade', icon: Target },
    { id: 'cliente', label: 'Cliente', icon: Users },
    { id: 'criativo', label: 'Criativo', icon: Palette },
    { id: 'administrativo', label: 'Admin', icon: Briefcase },
    { id: 'pessoal', label: 'Pessoal', icon: Heart }
  ];

  // Cores disponíveis
  const cores = [
    { id: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { id: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { id: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { id: 'green', label: 'Verde', class: 'bg-green-500' },
    { id: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
    { id: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { id: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { id: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
    { id: 'teal', label: 'Teal', class: 'bg-teal-500' },
    { id: 'amber', label: 'Âmbar', class: 'bg-amber-500' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col">
        
        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== 'templates' && (
                <button
                  onClick={() => setStep('templates')}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  {step === 'templates' && 'Escolha um Template'}
                  {step === 'form' && (eventoParaEditar ? 'Editar Evento' : 'Criar Evento')}
                  {step === 'criar-template' && 'Novo Template'}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {step === 'templates' && 'Templates inteligentes para acelerar sua produtividade'}
                  {step === 'form' && 'Personalize os detalhes do seu evento'}
                  {step === 'criar-template' && 'Crie um template personalizado para uso futuro'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENT */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto">
          
          {/* STEP: TEMPLATES */}
          {step === 'templates' && (
            <div className="p-4 sm:p-6 space-y-6">
              
              {/* Ação Rápida - Evento em Branco */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center group-hover:from-orange-500 group-hover:to-red-500 transition-all">
                      <Plus className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">Evento em Branco</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Criar do zero</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setStep('criar-template')}
                  className="flex-1 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                      <PlusCircle className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">Criar Template</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Salvar para reusar</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Busca e Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Categorias */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategoria(cat.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                      ${filterCategoria === cat.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid de Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templatesFiltrados.map(template => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => aplicarTemplate(template)}
                      className="group relative p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-xl transition-all text-left overflow-hidden"
                    >
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {template.customizado && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletarTemplate(template.id);
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {template.nome}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {template.descricao}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                            <Clock className="w-3 h-3" />
                            {template.duracao}min
                          </span>
                          <span className={`px-2 py-1 rounded-full ${
                            template.prioridade === 'alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                            template.prioridade === 'media' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}>
                            {template.prioridade}
                          </span>
                          {template.customizado && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                              Meu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className={`w-5 h-5 text-transparent bg-gradient-to-r ${template.gradient} bg-clip-text`} style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {templatesFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Nenhum template encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: FORM */}
          {step === 'form' && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Template selecionado */}
              {selectedTemplate && (
                <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedTemplate.gradient} bg-opacity-10 border border-current/20`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedTemplate.gradient} flex items-center justify-center`}>
                      <selectedTemplate.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Template: {selectedTemplate.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.descricao}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título do Evento *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Reunião com cliente, Deadline projeto..."
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Detalhes adicionais..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white placeholder-gray-500 resize-none"
                    />
                  </div>

                  {/* Data e Hora */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Data
                      </label>
                      <input
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Início
                      </label>
                      <input
                        type="time"
                        value={formData.horaInicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fim
                      </label>
                      <input
                        type="time"
                        value={formData.horaFim}
                        onChange={(e) => setFormData(prev => ({ ...prev, horaFim: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Tipo e Prioridade */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as Evento['tipo'] }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                      >
                        <option value="reuniao">Reunião</option>
                        <option value="deadline">Deadline</option>
                        <option value="foco">Foco</option>
                        <option value="ligacao">Ligação</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={formData.prioridade}
                        onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value as Evento['prioridade'] }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Cliente (opcional)
                    </label>
                    <select
                      value={formData.clienteId}
                      onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value, projetoId: '' }))}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} - {c.empresa}</option>
                      ))}
                    </select>
                    {clientes.length === 0 && (
                      <button
                        onClick={() => navigate('/crm')}
                        className="mt-2 text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Cadastrar cliente no CRM
                      </button>
                    )}
                  </div>

                  {/* Projeto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Projeto (opcional)
                    </label>
                    <select
                      value={formData.projetoId}
                      onChange={(e) => setFormData(prev => ({ ...prev, projetoId: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione um projeto</option>
                      {projetosFiltrados.map(p => (
                        <option key={p.id} value={p.id}>{p.titulo}</option>
                      ))}
                    </select>
                    {projetos.length === 0 && (
                      <button
                        onClick={() => navigate('/projetos')}
                        className="mt-2 text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Criar projeto
                      </button>
                    )}
                  </div>

                  {/* Local */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Local / Link
                    </label>
                    <input
                      type="text"
                      value={formData.local}
                      onChange={(e) => setFormData(prev => ({ ...prev, local: e.target.value }))}
                      placeholder="Ex: Zoom, Google Meet, Escritório..."
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Alerta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Bell className="w-4 h-4 inline mr-1" />
                      Lembrete antes
                    </label>
                    <select
                      value={formData.alertaMinutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, alertaMinutos: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    >
                      <option value={0}>Sem lembrete</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={1440}>1 dia</option>
                    </select>
                  </div>

                  {/* Cor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Cor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cores.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setFormData(prev => ({ ...prev, cor: c.id }))}
                          className={`w-8 h-8 rounded-lg ${c.class} transition-all ${
                            formData.cor === c.id 
                              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110' 
                              : 'hover:scale-110'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recorrência */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.recorrencia.ativa}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recorrencia: { ...prev.recorrencia, ativa: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <Repeat className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Evento recorrente
                      </span>
                    </label>

                    {formData.recorrencia.ativa && (
                      <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={formData.recorrencia.tipo}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recorrencia: { ...prev.recorrencia, tipo: e.target.value as any }
                            }))}
                            className="px-3 py-2 bg-white dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white"
                          >
                            <option value="diaria">Diário</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensal">Mensal</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            value={formData.recorrencia.intervalo}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recorrencia: { ...prev.recorrencia, intervalo: Number(e.target.value) }
                            }))}
                            className="px-3 py-2 bg-white dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white"
                            placeholder="Intervalo"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP: CRIAR TEMPLATE */}
          {step === 'criar-template' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Template *
                    </label>
                    <input
                      type="text"
                      value={novoTemplate.nome}
                      onChange={(e) => setNovoTemplate(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Reunião semanal, Sprint review..."
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={novoTemplate.descricao}
                      onChange={(e) => setNovoTemplate(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descreva quando usar este template..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        value={novoTemplate.tipo}
                        onChange={(e) => setNovoTemplate(prev => ({ ...prev, tipo: e.target.value as Evento['tipo'] }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                      >
                        <option value="reuniao">Reunião</option>
                        <option value="deadline">Deadline</option>
                        <option value="foco">Foco</option>
                        <option value="ligacao">Ligação</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duração (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={novoTemplate.duracao}
                        onChange={(e) => setNovoTemplate(prev => ({ ...prev, duracao: Number(e.target.value) }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={novoTemplate.prioridade}
                        onChange={(e) => setNovoTemplate(prev => ({ ...prev, prioridade: e.target.value as Evento['prioridade'] }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                      </label>
                      <select
                        value={novoTemplate.categoria}
                        onChange={(e) => setNovoTemplate(prev => ({ ...prev, categoria: e.target.value as EventoTemplate['categoria'] }))}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                      >
                        <option value="produtividade">Produtividade</option>
                        <option value="cliente">Cliente</option>
                        <option value="criativo">Criativo</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="pessoal">Pessoal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lembrete antes (minutos)
                    </label>
                    <select
                      value={novoTemplate.alertaMinutos}
                      onChange={(e) => setNovoTemplate(prev => ({ ...prev, alertaMinutos: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    >
                      <option value={0}>Sem lembrete</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cores.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setNovoTemplate(prev => ({ ...prev, cor: c.id }))}
                          className={`w-8 h-8 rounded-lg ${c.class} transition-all ${
                            novoTemplate.cor === c.id 
                              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110' 
                              : 'hover:scale-110'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      Preview do Template
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientForColor(novoTemplate.cor || 'blue')} flex items-center justify-center shadow-lg`}>
                        {React.createElement(getIconForType(novoTemplate.tipo || 'outro'), { className: 'w-6 h-6 text-white' })}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {novoTemplate.nome || 'Nome do template'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {novoTemplate.duracao}min • {novoTemplate.prioridade}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* FOOTER */}
        {/* ============================================================ */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            
            {step === 'form' && (
              <button
                onClick={handleSave}
                disabled={!formData.titulo}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {eventoParaEditar ? 'Salvar Alterações' : 'Criar Evento'}
              </button>
            )}

            {step === 'criar-template' && (
              <button
                onClick={salvarNovoTemplate}
                disabled={!novoTemplate.nome}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Salvar Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCriarEvento;

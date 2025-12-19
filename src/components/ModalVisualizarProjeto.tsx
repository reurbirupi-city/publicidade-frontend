import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock, 
  User, 
  Users, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  Target
} from 'lucide-react';
import Modal from './Modal';
import { getEventosByProjeto } from '../services/dataIntegration';

interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  servicosContratados: string[];
  valorContratado: number;
  valorPago: number;
  status: string;
  prioridade: string;
  etapaAtual: string;
  progresso: number;
  dataInicio: string;
  prazoEstimado: string;
  diasRestantes?: number;
  revisoes?: any[];
  limiteRevisoes: number;
  revisoesUsadas?: number;
  responsavel: string;
  equipe?: string[];
  arquivos?: any[];
  comentariosInternos?: any[];
  comentariosCliente?: any[];
  aprovacoes?: any[];
  horasEstimadas: number;
  horasTrabalhadas?: number;
  tags: string[];
  categoria: string;
  criadoEm: string;
  atualizadoEm: string;
  [key: string]: any;
}

interface ModalVisualizarProjetoProps {
  isOpen: boolean;
  onClose: () => void;
  projeto: Projeto | null;
  onEdit?: (projeto: Projeto) => void;
  onDelete?: (projeto: Projeto) => void;
}

const ModalVisualizarProjeto: React.FC<ModalVisualizarProjetoProps> = ({
  isOpen,
  onClose,
  projeto,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'detalhes' | 'arquivos' | 'comentarios' | 'revisoes' | 'aprovacoes' | 'timeline'>('detalhes');

  if (!projeto) return null;

  const eventos = getEventosByProjeto(projeto.id);
  
  const prioridadeColors = {
    baixa: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    media: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgente: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  const statusLabels = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    pausado: 'Pausado',
    revisao: 'Revisão',
    aprovacao: 'Aprovação',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  const etapaLabels = {
    briefing: 'Briefing',
    criacao: 'Criação',
    revisao: 'Revisão',
    ajustes: 'Ajustes',
    aprovacao: 'Aprovação',
    entrega: 'Entrega',
  };

  const tabs = [
    { id: 'detalhes', label: 'Detalhes', icon: FileText },
    { id: 'arquivos', label: 'Arquivos', icon: Briefcase, count: projeto.arquivos?.length || 0 },
    { id: 'comentarios', label: 'Comentários', icon: MessageSquare, count: (projeto.comentariosInternos?.length || 0) + (projeto.comentariosCliente?.length || 0) },
    { id: 'revisoes', label: 'Revisões', icon: AlertCircle, count: projeto.revisoes?.length || 0 },
    { id: 'aprovacoes', label: 'Aprovações', icon: CheckCircle, count: projeto.aprovacoes?.length || 0 },
    { id: 'timeline', label: 'Timeline', icon: TrendingUp },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={projeto.titulo} size="xl">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              {projeto.id}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${prioridadeColors[projeto.prioridade as keyof typeof prioridadeColors]}`}>
              {projeto.prioridade.toUpperCase()}
            </span>
            {projeto.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(projeto)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Editar projeto"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(projeto)}
                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Excluir projeto"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das tabs */}
        <div className="min-h-[400px] max-h-[60vh] overflow-y-auto">
          {activeTab === 'detalhes' && (
            <div className="space-y-6">
              {/* Cliente */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cliente</h3>
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{projeto.clienteNome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{projeto.clienteEmpresa}</p>
                  </div>
                </div>
              </div>

              {/* Progresso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{projeto.progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${projeto.progresso}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Status: <span className="font-semibold">{statusLabels[projeto.status as keyof typeof statusLabels]}</span>
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Etapa: <span className="font-semibold">{etapaLabels[projeto.etapaAtual as keyof typeof etapaLabels]}</span>
                  </span>
                </div>
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoria */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Categoria</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{projeto.categoria}</p>
                  </div>
                </div>

                {/* Responsável */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Responsável</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{projeto.responsavel}</p>
                  </div>
                </div>

                {/* Data Início */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Data de Início</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(projeto.dataInicio)}</p>
                  </div>
                </div>

                {/* Prazo */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Prazo Estimado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(projeto.prazoEstimado)}</p>
                    {projeto.diasRestantes !== undefined && (
                      <p className={`text-xs mt-1 ${
                        projeto.diasRestantes < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : projeto.diasRestantes < 7 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {projeto.diasRestantes < 0 
                          ? `${Math.abs(projeto.diasRestantes)} dias atrasado` 
                          : `${projeto.diasRestantes} dias restantes`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Valor Contratado */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Valor Contratado</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projeto.valorContratado)}</p>
                  </div>
                </div>

                {/* Valor Pago */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Valor Pago</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projeto.valorPago)}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(projeto.valorPago / projeto.valorContratado) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Horas Estimadas */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Horas Estimadas</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{projeto.horasEstimadas}h</p>
                  </div>
                </div>

                {/* Horas Trabalhadas */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Horas Trabalhadas</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{projeto.horasTrabalhadas || 0}h</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(((projeto.horasTrabalhadas || 0) / projeto.horasEstimadas) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {projeto.descricao && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {projeto.descricao}
                  </p>
                </div>
              )}

              {/* Serviços Contratados */}
              {projeto.servicosContratados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Serviços Contratados</h3>
                  <div className="flex flex-wrap gap-2">
                    {projeto.servicosContratados.map((servico, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                        {servico}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipe */}
              {projeto.equipe && projeto.equipe.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Equipe
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {projeto.equipe.map((membro, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{membro}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revisões */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Revisões Usadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{projeto.revisoesUsadas || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Limite de Revisões</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{projeto.limiteRevisoes}</p>
                </div>
                <div className="col-span-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (projeto.revisoesUsadas || 0) >= projeto.limiteRevisoes
                          ? 'bg-red-500'
                          : (projeto.revisoesUsadas || 0) / projeto.limiteRevisoes > 0.7
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(((projeto.revisoesUsadas || 0) / projeto.limiteRevisoes) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Eventos vinculados */}
              {eventos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Eventos Vinculados ({eventos.length})
                  </h3>
                  <div className="space-y-2">
                    {eventos.slice(0, 5).map((evento: any) => (
                      <div key={evento.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{evento.titulo}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDateTime(evento.dataHora)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {eventos.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        + {eventos.length - 5} eventos
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Metadados */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Criado em: {formatDateTime(projeto.criadoEm)}</p>
                <p>Atualizado em: {formatDateTime(projeto.atualizadoEm)}</p>
              </div>
            </div>
          )}

          {activeTab === 'arquivos' && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum arquivo anexado</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {projeto.arquivos?.length || 0} arquivo(s) no total
              </p>
            </div>
          )}

          {activeTab === 'comentarios' && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum comentário</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {(projeto.comentariosInternos?.length || 0) + (projeto.comentariosCliente?.length || 0)} comentário(s) no total
              </p>
            </div>
          )}

          {activeTab === 'revisoes' && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhuma revisão registrada</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {projeto.revisoes?.length || 0} revisão(ões) no total
              </p>
            </div>
          )}

          {activeTab === 'aprovacoes' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhuma aprovação registrada</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {projeto.aprovacoes?.length || 0} aprovação(ões) no total
              </p>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Timeline em desenvolvimento</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Histórico de alterações e atividades do projeto
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModalVisualizarProjeto;

import React, { useState } from 'react';
import { X, DollarSign, Calendar, User, FileText, CreditCard, Tag, Clock, CheckCircle, AlertCircle, Building2, Briefcase, ArrowUpRight, ArrowDownRight, Edit2, Trash2, RefreshCw } from 'lucide-react';

type TipoTransacao = 'receita' | 'despesa';
type CategoriaReceita = 'projeto' | 'mensalidade' | 'consultoria' | 'outros';
type CategoriaDespesa = 'equipe' | 'ferramentas' | 'marketing' | 'infraestrutura' | 'impostos' | 'outros';
type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
type FormaPagamento = 'pix' | 'transferencia' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'dinheiro';

interface Transacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  categoria: CategoriaReceita | CategoriaDespesa;
  status: StatusPagamento;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: FormaPagamento;
  clienteId?: string;
  clienteNome?: string;
  projetoId?: string;
  projetoTitulo?: string;
  recorrente: boolean;
  observacoes?: string;
  comprovante?: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface ModalVisualizarTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  transacao: Transacao | null;
  onEdit: (transacao: Transacao) => void;
  onDelete: (transacao: Transacao) => void;
}

const ModalVisualizarTransacao: React.FC<ModalVisualizarTransacaoProps> = ({
  isOpen,
  onClose,
  transacao,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'detalhes' | 'historico'>('detalhes');

  if (!isOpen || !transacao) return null;

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatarDataHora = (data: string): string => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: StatusPagamento) => {
    const infos = {
      pendente: {
        label: 'Pendente',
        icon: Clock,
        color: 'yellow',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-300 dark:border-yellow-700'
      },
      pago: {
        label: 'Pago',
        icon: CheckCircle,
        color: 'green',
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-300 dark:border-green-700'
      },
      atrasado: {
        label: 'Atrasado',
        icon: AlertCircle,
        color: 'red',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700'
      },
      cancelado: {
        label: 'Cancelado',
        icon: X,
        color: 'gray',
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-700'
      }
    };
    return infos[status];
  };

  const getCategoriaLabel = (cat: string): string => {
    const labels: Record<string, string> = {
      projeto: '💼 Projeto',
      mensalidade: '📅 Mensalidade',
      consultoria: '🎓 Consultoria',
      equipe: '👥 Equipe',
      ferramentas: '🛠️ Ferramentas',
      marketing: '📢 Marketing',
      infraestrutura: '🏗️ Infraestrutura',
      impostos: '📋 Impostos',
      outros: '📦 Outros'
    };
    return labels[cat] || cat;
  };

  const getFormaPagamentoLabel = (forma: string): string => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      transferencia: 'Transferência',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      boleto: 'Boleto',
      dinheiro: 'Dinheiro'
    };
    return labels[forma] || forma;
  };

  const statusInfo = getStatusInfo(transacao.status);
  const StatusIcon = statusInfo.icon;

  const diasAteVencimento = Math.ceil(
    (new Date(transacao.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r ${
          transacao.tipo === 'receita'
            ? 'from-green-500 to-emerald-500'
            : 'from-red-500 to-orange-500'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {transacao.tipo === 'receita' ? (
                <ArrowUpRight className="w-8 h-8 text-white flex-shrink-0" />
              ) : (
                <ArrowDownRight className="w-8 h-8 text-white flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </h2>
                  <span className="text-xs font-mono text-white/80 bg-white/20 px-2 py-1 rounded">
                    {transacao.id}
                  </span>
                  {transacao.recorrente && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-white bg-purple-500/50 px-2 py-1 rounded">
                      <RefreshCw className="w-3 h-3" />
                      Recorrente
                    </span>
                  )}
                </div>
                <p className="text-lg text-white/90 mb-3">
                  {transacao.descricao}
                </p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${statusInfo.bg} ${statusInfo.border}`}>
                  <StatusIcon className={`w-4 h-4 ${statusInfo.text}`} />
                  <span className={`text-sm font-semibold ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('detalhes')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'detalhes'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Detalhes
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'historico'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Histórico
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
          {activeTab === 'detalhes' && (
            <div className="space-y-6">
              {/* Valor Destaque */}
              <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Valor</p>
                <p className={`text-5xl font-bold ${
                  transacao.tipo === 'receita'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transacao.tipo === 'receita' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                </p>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoria */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Categoria
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getCategoriaLabel(transacao.categoria)}
                  </p>
                </div>

                {/* Data Vencimento */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Vencimento
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatarData(transacao.dataVencimento)}
                  </p>
                  {transacao.status === 'pendente' && (
                    <p className={`text-sm mt-1 ${
                      diasAteVencimento < 0
                        ? 'text-red-600 dark:text-red-400'
                        : diasAteVencimento <= 3
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {diasAteVencimento < 0
                        ? `${Math.abs(diasAteVencimento)} dias atrasado`
                        : `Vence em ${diasAteVencimento} ${diasAteVencimento === 1 ? 'dia' : 'dias'}`
                      }
                    </p>
                  )}
                </div>

                {/* Cliente */}
                {transacao.clienteNome && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Cliente
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {transacao.clienteNome}
                    </p>
                  </div>
                )}

                {/* Projeto */}
                {transacao.projetoTitulo && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Projeto
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {transacao.projetoTitulo}
                    </p>
                  </div>
                )}
              </div>

              {/* Informações de Pagamento */}
              {transacao.status === 'pago' && transacao.dataPagamento && (
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-green-900 dark:text-green-200 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Informações de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                        Data do Pagamento
                      </p>
                      <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                        {formatarData(transacao.dataPagamento)}
                      </p>
                    </div>
                    {transacao.formaPagamento && (
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                          Forma de Pagamento
                        </p>
                        <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                          {getFormaPagamentoLabel(transacao.formaPagamento)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {transacao.observacoes && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Observações
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {transacao.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Transação criada
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatarDataHora(transacao.criadoEm)}
                  </p>
                </div>
              </div>

              {transacao.atualizadoEm !== transacao.criadoEm && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Última atualização
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatarDataHora(transacao.atualizadoEm)}
                    </p>
                  </div>
                </div>
              )}

              {transacao.status === 'pago' && transacao.dataPagamento && (
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Pagamento confirmado
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatarData(transacao.dataPagamento)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <button
            onClick={() => onDelete(transacao)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold border border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-5 h-5" />
            Deletar
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit(transacao)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all hover:scale-105 shadow-lg"
            >
              <Edit2 className="w-5 h-5" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVisualizarTransacao;

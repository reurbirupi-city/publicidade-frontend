import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, Calendar, User, Briefcase, Tag } from 'lucide-react';

type TipoTransacao = 'receita' | 'despesa';
type CategoriaReceita = 'projeto' | 'mensalidade' | 'consultoria' | 'outros';
type CategoriaDespesa = 'equipe' | 'ferramentas' | 'marketing' | 'infraestrutura' | 'impostos' | 'outros';
type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

interface Transacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  categoria: CategoriaReceita | CategoriaDespesa;
  status: StatusPagamento;
  dataVencimento: string;
  dataPagamento?: string;
  clienteNome?: string;
  projetoTitulo?: string;
  recorrente: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

interface ModalDeletarTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  transacao: Transacao | null;
  onConfirm: (transacao: Transacao) => void;
}

const ModalDeletarTransacao: React.FC<ModalDeletarTransacaoProps> = ({
  isOpen,
  onClose,
  transacao,
  onConfirm
}) => {
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');

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
      month: 'short',
      year: 'numeric'
    });
  };

  const handleConfirmar = () => {
    if (confirmacao.toUpperCase() !== 'EXCLUIR') {
      setErro('Digite "EXCLUIR" para confirmar');
      return;
    }

    onConfirm(transacao);
    setConfirmacao('');
    setErro('');
    onClose();
  };

  const handleClose = () => {
    setConfirmacao('');
    setErro('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-red-500 dark:border-red-600">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-500 to-orange-500">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Confirmar Exclusão
                </h2>
                <p className="text-white/90">
                  Esta ação não poderá ser desfeita
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Alerta */}
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-900 dark:text-red-200 font-semibold mb-2">
              ⚠️ Atenção! Você está prestes a excluir esta transação:
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Todos os dados serão permanentemente removidos e não poderão ser recuperados.
            </p>
          </div>

          {/* Detalhes da Transação */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <DollarSign className={`w-5 h-5 ${
                  transacao.tipo === 'receita' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {transacao.descricao}
                  </p>
                </div>
              </div>
              <p className={`text-xl font-bold ${
                transacao.tipo === 'receita'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {transacao.tipo === 'receita' ? '+' : '-'}{formatarMoeda(transacao.valor)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoria</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {transacao.categoria}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Vencimento</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatarData(transacao.dataVencimento)}
                </p>
              </div>

              {transacao.clienteNome && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Cliente</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {transacao.clienteNome}
                  </p>
                </div>
              )}

              {transacao.projetoTitulo && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Projeto</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {transacao.projetoTitulo}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Status
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                transacao.status === 'pago'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : transacao.status === 'pendente'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : transacao.status === 'atrasado'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                {transacao.status === 'pago' && '✅ Pago'}
                {transacao.status === 'pendente' && '⏳ Pendente'}
                {transacao.status === 'atrasado' && '❌ Atrasado'}
                {transacao.status === 'cancelado' && '🚫 Cancelado'}
              </span>
            </div>

            {transacao.recorrente && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-900 dark:text-purple-200 font-semibold">
                  🔁 Transação Recorrente
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Esta transação se repete mensalmente
                </p>
              </div>
            )}
          </div>

          {/* Impactos */}
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
              📊 Impactos da exclusão:
            </p>
            <ul className="space-y-1">
              <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>
                  O {transacao.tipo === 'receita' ? 'saldo' : 'total de despesas'} será 
                  {transacao.tipo === 'receita' ? ' reduzido' : ' aumentado'} em {formatarMoeda(transacao.valor)}
                </span>
              </li>
              {transacao.status === 'pago' && (
                <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>
                    O histórico de pagamentos será afetado
                  </span>
                </li>
              )}
              {transacao.projetoTitulo && (
                <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>
                    O vínculo com o projeto "{transacao.projetoTitulo}" será removido
                  </span>
                </li>
              )}
              {transacao.recorrente && (
                <li className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>
                    Apenas esta ocorrência será excluída (não afeta futuras recorrências)
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Campo de Confirmação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Para confirmar, digite <span className="text-red-600 dark:text-red-400 font-mono">EXCLUIR</span> abaixo:
            </label>
            <input
              type="text"
              value={confirmacao}
              onChange={(e) => {
                setConfirmacao(e.target.value);
                setErro('');
              }}
              className={`w-full px-4 py-3 rounded-lg border-2 ${
                erro
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-700'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent font-mono uppercase`}
              placeholder="EXCLUIR"
            />
            {erro && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {erro}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={confirmacao.toUpperCase() !== 'EXCLUIR'}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 shadow-lg"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDeletarTransacao;

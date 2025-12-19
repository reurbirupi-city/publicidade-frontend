import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, FileText, CreditCard, Tag, AlertCircle, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { getClientes, getProjetos } from '../services/dataIntegration';

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

interface ModalEditarTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  transacao: Transacao | null;
  onSave: (transacao: Transacao) => void;
}

const ModalEditarTransacao: React.FC<ModalEditarTransacaoProps> = ({ isOpen, onClose, transacao, onSave }) => {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState<CategoriaReceita | CategoriaDespesa>('projeto');
  const [status, setStatus] = useState<StatusPagamento>('pendente');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [clienteId, setClienteId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [erros, setErros] = useState<string[]>([]);

  const clientes = getClientes();
  const projetos = getProjetos();

  // Preenche form quando abre ou transacao muda
  useEffect(() => {
    if (isOpen && transacao) {
      setDescricao(transacao.descricao);
      setValor(transacao.valor.toString().replace('.', ','));
      setCategoria(transacao.categoria);
      setStatus(transacao.status);
      setDataVencimento(transacao.dataVencimento);
      setDataPagamento(transacao.dataPagamento || '');
      setFormaPagamento(transacao.formaPagamento || 'pix');
      setClienteId(transacao.clienteId || '');
      setProjetoId(transacao.projetoId || '');
      setRecorrente(transacao.recorrente);
      setObservacoes(transacao.observacoes || '');
      setErros([]);
    }
  }, [isOpen, transacao]);

  const categoriasReceita: { value: CategoriaReceita; label: string }[] = [
    { value: 'projeto', label: '💼 Projeto' },
    { value: 'mensalidade', label: '📅 Mensalidade' },
    { value: 'consultoria', label: '🎓 Consultoria' },
    { value: 'outros', label: '📦 Outros' }
  ];

  const categoriasDespesa: { value: CategoriaDespesa; label: string }[] = [
    { value: 'equipe', label: '👥 Equipe' },
    { value: 'ferramentas', label: '🛠️ Ferramentas' },
    { value: 'marketing', label: '📢 Marketing' },
    { value: 'infraestrutura', label: '🏗️ Infraestrutura' },
    { value: 'impostos', label: '📋 Impostos' },
    { value: 'outros', label: '📦 Outros' }
  ];

  const formasPagamento: { value: FormaPagamento; label: string }[] = [
    { value: 'pix', label: 'PIX' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'dinheiro', label: 'Dinheiro' }
  ];

  const validarFormulario = (): boolean => {
    const novosErros: string[] = [];

    if (!descricao.trim()) {
      novosErros.push('Descrição é obrigatória');
    }

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (!valor || isNaN(valorNum) || valorNum <= 0) {
      novosErros.push('Valor deve ser maior que zero');
    }

    if (!dataVencimento) {
      novosErros.push('Data de vencimento é obrigatória');
    }

    if (status === 'pago' && !dataPagamento) {
      novosErros.push('Data de pagamento é obrigatória quando status é "Pago"');
    }

    if (status === 'pago' && !formaPagamento) {
      novosErros.push('Forma de pagamento é obrigatória quando status é "Pago"');
    }

    if (transacao?.tipo === 'receita' && !clienteId) {
      novosErros.push('Cliente é obrigatório para receitas');
    }

    setErros(novosErros);
    return novosErros.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transacao || !validarFormulario()) {
      return;
    }

    const clienteSelecionado = clientes.find(c => c.id === clienteId);
    const projetoSelecionado = projetos.find(p => p.id === projetoId);

    const transacaoAtualizada: Transacao = {
      ...transacao,
      descricao: descricao.trim(),
      valor: parseFloat(valor.replace(',', '.')),
      categoria,
      status,
      dataVencimento,
      dataPagamento: status === 'pago' ? dataPagamento : undefined,
      formaPagamento: status === 'pago' ? formaPagamento : undefined,
      clienteId: clienteId || undefined,
      clienteNome: clienteSelecionado ? `${clienteSelecionado.nome} ${clienteSelecionado.sobrenome}` : undefined,
      projetoId: projetoId || undefined,
      projetoTitulo: projetoSelecionado?.titulo,
      recorrente,
      observacoes: observacoes.trim() || undefined,
      atualizadoEm: new Date().toISOString()
    };

    onSave(transacaoAtualizada);
    onClose();
  };

  if (!isOpen || !transacao) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r ${
          transacao.tipo === 'receita' 
            ? 'from-green-500 to-emerald-500' 
            : 'from-red-500 to-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {transacao.tipo === 'receita' ? (
                <ArrowUpRight className="w-8 h-8 text-white" />
              ) : (
                <ArrowDownRight className="w-8 h-8 text-white" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Editar {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </h2>
                <p className="text-sm text-white/80 font-mono">{transacao.id}</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Erros */}
          {erros.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-200 mb-1">
                    Corrija os seguintes erros:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {erros.map((erro, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300">
                        {erro}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Descrição *
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            {/* Valor e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Valor *
                </label>
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9,]/g, '');
                    setValor(val);
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaReceita | CategoriaDespesa)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                >
                  {transacao.tipo === 'receita'
                    ? categoriasReceita.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))
                    : categoriasDespesa.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* Cliente e Projeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Cliente {transacao.tipo === 'receita' && '*'}
                </label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.sobrenome} {cliente.empresa && `- ${cliente.empresa}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Projeto (opcional)
                </label>
                <select
                  value={projetoId}
                  onChange={(e) => setProjetoId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  disabled={!clienteId}
                >
                  <option value="">Nenhum projeto</option>
                  {projetos
                    .filter(p => p.clienteId === clienteId)
                    .map(projeto => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.titulo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Status e Data Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusPagamento)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                >
                  <option value="pendente">⏳ Pendente</option>
                  <option value="pago">✅ Pago</option>
                  <option value="atrasado">❌ Atrasado</option>
                  <option value="cancelado">🚫 Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data Vencimento *
                </label>
                <input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Data Pagamento e Forma de Pagamento (se status = pago) */}
            {status === 'pago' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Pagamento *
                  </label>
                  <input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Forma de Pagamento *
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  >
                    {formasPagamento.map(forma => (
                      <option key={forma.value} value={forma.value}>
                        {forma.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Recorrente */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <input
                type="checkbox"
                id="recorrente-edit"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="recorrente-edit" className="flex-1 cursor-pointer">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Transação Recorrente
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta {transacao.tipo} se repete mensalmente
                </p>
              </label>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none"
                placeholder="Informações adicionais..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all hover:scale-105 shadow-lg"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarTransacao;

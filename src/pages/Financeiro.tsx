import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  PieChart,
  BarChart3,
  Receipt,
  Building2,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import Sidebar from '../components/Sidebar';
import ModalCriarTransacao from '../components/ModalCriarTransacao';
import ModalVisualizarTransacao from '../components/ModalVisualizarTransacao';
import ModalEditarTransacao from '../components/ModalEditarTransacao';
import ModalDeletarTransacao from '../components/ModalDeletarTransacao';
import { getClientes, getProjetos } from '../services/dataIntegration';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster } from '../services/adminService';
import { notificarNovaTransacao } from '../services/notificacoes';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

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

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusPagamento;
  transacaoId: string;
}

const Financeiro: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userIsWebmaster = user?.email ? isWebmaster(user.email) : false;
  const [viewMode, setViewMode] = useState<'dashboard' | 'receitas' | 'despesas' | 'fluxo' | 'relatorios'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusPagamento | 'todos'>('todos');
  const [filterPeriodo, setFilterPeriodo] = useState<'mes' | 'trimestre' | 'ano' | 'tudo'>('mes');
  const [filterCliente, setFilterCliente] = useState<string>('todos');

  // Estados dos modais
  const [modalCriar, setModalCriar] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDeletar, setModalDeletar] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transacao | null>(null);

  // Carrega dados
  const clientes = getClientes();
  const projetos = getProjetos();

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Função para atualizar e sincronizar todos os dados financeiros
  const handleAtualizarFinanceiro = async () => {
    setAtualizando(true);
    console.log('🔄 Iniciando atualização completa do financeiro...');
    
    try {
      // Verificar se usuário está autenticado
      if (!user?.uid) {
        console.error('❌ Usuário não autenticado');
        alert('Erro: Usuário não autenticado. Faça login novamente.');
        setAtualizando(false);
        return;
      }

      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];
      
      // 1. Buscar todas as transações
      const transacoesRef = collection(db, 'transacoes');
      const qTransacoes = userIsWebmaster 
        ? query(transacoesRef)
        : query(transacoesRef, where('adminId', '==', user.uid));
      
      const snapshotTransacoes = await getDocs(qTransacoes);
      const transacoesData = snapshotTransacoes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transacao[];
      
      // 2. Buscar todas as parcelas
      const parcelasRef = collection(db, 'parcelas');
      const qParcelas = userIsWebmaster
        ? query(parcelasRef)
        : query(parcelasRef, where('adminId', '==', user.uid));
      
      const snapshotParcelas = await getDocs(qParcelas);
      const parcelasData = snapshotParcelas.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      console.log(`📊 Encontradas ${transacoesData.length} transações e ${parcelasData.length} parcelas`);
      
      // 3. Verificar e atualizar status de vencidas
      let countAtrasadas = 0;
      const updatePromises: Promise<void>[] = [];
      
      // Atualizar transações vencidas
      for (const transacao of transacoesData) {
        if (transacao.status === 'pendente' && transacao.dataVencimento) {
          const dataVenc = new Date(transacao.dataVencimento);
          if (dataVenc < hoje) {
            updatePromises.push(
              updateDoc(doc(db, 'transacoes', transacao.id), {
                status: 'atrasado',
                atualizadoEm: hoje.toISOString()
              })
            );
            transacao.status = 'atrasado';
            countAtrasadas++;
          }
        }
      }
      
      // Atualizar parcelas vencidas
      for (const parcela of parcelasData) {
        if (parcela.status === 'pendente' && parcela.dataVencimento) {
          const dataVenc = new Date(parcela.dataVencimento);
          if (dataVenc < hoje) {
            updatePromises.push(
              updateDoc(doc(db, 'parcelas', parcela.id), {
                status: 'atrasado',
                atualizadoEm: hoje.toISOString()
              })
            );
            countAtrasadas++;
          }
        }
      }
      
      // Executar todas as atualizações
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`⚠️ ${countAtrasadas} itens marcados como atrasados`);
      }
      
      // 4. Atualizar estado local
      setTransacoes(transacoesData);
      localStorage.setItem('financeiro_v1', JSON.stringify(transacoesData));
      
      // 5. Calcular estatísticas atualizadas
      const totalReceitas = transacoesData.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
      const totalDespesas = transacoesData.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
      const pagas = transacoesData.filter(t => t.status === 'pago').length;
      const pendentes = transacoesData.filter(t => t.status === 'pendente').length;
      const atrasadas = transacoesData.filter(t => t.status === 'atrasado').length;
      
      console.log('✅ Atualização concluída:', {
        transacoes: transacoesData.length,
        parcelas: parcelasData.length,
        receitas: totalReceitas,
        despesas: totalDespesas,
        pagas,
        pendentes,
        atrasadas: countAtrasadas
      });
      
      alert(`✅ Financeiro Atualizado!\n\n📊 ${transacoesData.length} transações\n💰 ${parcelasData.length} parcelas\n✓ ${pagas} pagas\n⏳ ${pendentes} pendentes${countAtrasadas > 0 ? `\n⚠️ ${countAtrasadas} atrasadas` : ''}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar financeiro:', error);
      alert('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setAtualizando(false);
    }
  };

  // Listener em tempo real para transações do Firestore
  useEffect(() => {
    if (!user?.uid) {
      console.log('⏳ Financeiro: Aguardando autenticação do usuário...');
      return;
    }

    console.log('🔥 Financeiro: Iniciando listener de transações para:', user.uid);
    setLoading(true);
    const transacoesRef = collection(db, 'transacoes');
    
    // Se for webmaster, vê tudo. Se não, vê apenas as suas.
    const q = userIsWebmaster 
      ? query(transacoesRef)
      : query(transacoesRef, where('adminId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transacao[];
      
      console.log(`💾 Financeiro: Salvou ${docs.length} transações`);
      setTransacoes(docs);
      setLoading(false);
      
      // Sincronizar com localStorage para cache
      localStorage.setItem('financeiro_v1', JSON.stringify(docs));
    }, (error) => {
      console.error(' Erro ao escutar transações:', error);
      const stored = localStorage.getItem('financeiro_v1');
      if (stored) setTransacoes(JSON.parse(stored));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, userIsWebmaster]);

  // Handlers de Modais
  const handleCriarTransacao = async (novaTransacao: any) => {
    const transacaoData = {
      ...novaTransacao,
      adminId: user?.uid,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'transacoes'), transacaoData);
      console.log('✅ Transação criada no Firestore:', docRef.id);
      
      // Notificar
      if (user?.uid) {
        await notificarNovaTransacao(
          user.uid,
          novaTransacao.descricao,
          novaTransacao.valor,
          novaTransacao.tipo
        );
      }
      
      setModalCriar(false);
    } catch (error) {
      console.error('Erro ao criar transação no Firestore:', error);
      // Fallback local
      const transacao: Transacao = {
        id: `TR-${Date.now()}`,
        ...transacaoData
      } as Transacao;
      setTransacoes([...transacoes, transacao]);
      setModalCriar(false);
    }
  };

  const handleEditarTransacao = async (transacaoEditada: any) => {
    if (!transacaoSelecionada) return;

    try {
      await updateDoc(doc(db, 'transacoes', transacaoSelecionada.id), {
        ...transacaoEditada,
        atualizadoEm: new Date().toISOString()
      });
      setModalEditar(false);
      setTransacaoSelecionada(null);
    } catch (error) {
      console.error('Erro ao editar transação no Firestore:', error);
      setTransacoes(transacoes.map(t => 
        t.id === transacaoSelecionada.id ? { ...t, ...transacaoEditada } : t
      ));
      setModalEditar(false);
      setTransacaoSelecionada(null);
    }
  };

  const handleDeletarTransacao = async () => {
    if (!transacaoSelecionada) return;

    try {
      await deleteDoc(doc(db, 'transacoes', transacaoSelecionada.id));
      setModalDeletar(false);
      setTransacaoSelecionada(null);
    } catch (error) {
      console.error('Erro ao deletar transação no Firestore:', error);
      setTransacoes(transacoes.filter(t => t.id !== transacaoSelecionada.id));
      setModalDeletar(false);
      setTransacaoSelecionada(null);
    }
  };

  // Salva no localStorage quando transações mudar
  useEffect(() => {
    localStorage.setItem('financeiro_v1', JSON.stringify(transacoes));
    console.log('💾 Financeiro: Salvou', transacoes.length, 'transações');
  }, [transacoes]);

  // ============================================================================
  // HANDLERS DOS MODAIS
  // ============================================================================

  const handleVisualizarTransacao = (transacao: Transacao) => {
    setTransacaoSelecionada(transacao);
    setModalVisualizar(true);
  };

  const handleSalvarEdicao = (transacaoAtualizada: Transacao) => {
    setTransacoes(prev => 
      prev.map(t => t.id === transacaoAtualizada.id ? transacaoAtualizada : t)
    );
    console.log('✅ Transação atualizada:', transacaoAtualizada.id);
  };

  const handleDeletarTransacaoModal = (transacao: Transacao) => {
    setTransacaoSelecionada(transacao);
    setModalVisualizar(false);
    setModalDeletar(true);
  };

  const handleConfirmarDelecao = (transacao: Transacao) => {
    setTransacoes(prev => prev.filter(t => t.id !== transacao.id));
    console.log('🗑️ Transação deletada:', transacao.id);
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

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

  const getStatusColor = (status: StatusPagamento) => {
    const colors = {
      pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      pago: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      cancelado: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };
    return colors[status];
  };

  const getStatusLabel = (status: StatusPagamento) => {
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      atrasado: 'Atrasado',
      cancelado: 'Cancelado'
    };
    return labels[status];
  };

  const getFormaPagamentoLabel = (forma: FormaPagamento) => {
    const labels = {
      pix: 'PIX',
      transferencia: 'Transferência',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      boleto: 'Boleto',
      dinheiro: 'Dinheiro'
    };
    return labels[forma];
  };

  // ============================================================================
  // FILTROS
  // ============================================================================

  const transacoesFiltradas = transacoes.filter(t => {
    const matchSearch = t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (t.clienteNome && t.clienteNome.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus;
    const matchCliente = filterCliente === 'todos' || t.clienteId === filterCliente;
    
    // Filtro de período
    let matchPeriodo = true;
    if (filterPeriodo !== 'tudo') {
      const hoje = new Date();
      const dataVenc = new Date(t.dataVencimento);
      
      if (filterPeriodo === 'mes') {
        matchPeriodo = dataVenc.getMonth() === hoje.getMonth() && 
                      dataVenc.getFullYear() === hoje.getFullYear();
      } else if (filterPeriodo === 'trimestre') {
        const mesAtual = hoje.getMonth();
        const trimestre = Math.floor(mesAtual / 3);
        const mesTrans = dataVenc.getMonth();
        const trimestreTrans = Math.floor(mesTrans / 3);
        matchPeriodo = trimestre === trimestreTrans && 
                      dataVenc.getFullYear() === hoje.getFullYear();
      } else if (filterPeriodo === 'ano') {
        matchPeriodo = dataVenc.getFullYear() === hoje.getFullYear();
      }
    }
    
    return matchSearch && matchStatus && matchCliente && matchPeriodo;
  });

  const receitas = transacoesFiltradas.filter(t => t.tipo === 'receita');
  const despesas = transacoesFiltradas.filter(t => t.tipo === 'despesa');

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  const stats = {
    totalReceitas: receitas.reduce((sum, t) => sum + t.valor, 0),
    totalDespesas: despesas.reduce((sum, t) => sum + t.valor, 0),
    receitasPagas: receitas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0),
    receitasPendentes: receitas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0),
    despesasPagas: despesas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0),
    despesasPendentes: despesas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0),
    saldoAtual: 0, // Será calculado
    lucroLiquido: 0 // Será calculado
  };

  stats.saldoAtual = stats.receitasPagas - stats.despesasPagas;
  stats.lucroLiquido = stats.totalReceitas - stats.totalDespesas;

  // Receitas por categoria
  const receitasPorCategoria = {
    projeto: receitas.filter(r => r.categoria === 'projeto').reduce((sum, r) => sum + r.valor, 0),
    mensalidade: receitas.filter(r => r.categoria === 'mensalidade').reduce((sum, r) => sum + r.valor, 0),
    consultoria: receitas.filter(r => r.categoria === 'consultoria').reduce((sum, r) => sum + r.valor, 0),
    outros: receitas.filter(r => r.categoria === 'outros').reduce((sum, r) => sum + r.valor, 0)
  };

  // Despesas por categoria
  const despesasPorCategoria = {
    equipe: despesas.filter(d => d.categoria === 'equipe').reduce((sum, d) => sum + d.valor, 0),
    ferramentas: despesas.filter(d => d.categoria === 'ferramentas').reduce((sum, d) => sum + d.valor, 0),
    marketing: despesas.filter(d => d.categoria === 'marketing').reduce((sum, d) => sum + d.valor, 0),
    infraestrutura: despesas.filter(d => d.categoria === 'infraestrutura').reduce((sum, d) => sum + d.valor, 0),
    impostos: despesas.filter(d => d.categoria === 'impostos').reduce((sum, d) => sum + d.valor, 0),
    outros: despesas.filter(d => d.categoria === 'outros').reduce((sum, d) => sum + d.valor, 0)
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900 transition-colors duration-500">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Gestão Financeira
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Controle completo de receitas e despesas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAtualizarFinanceiro}
                disabled={atualizando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Atualizar dados financeiros"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <NotificacoesBell />
              <ThemeToggle />
              <button
                onClick={() => setModalCriar(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards Dashboard */}
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Cards Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Saldo Atual */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="w-8 h-8 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                    Atual
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo Atual</p>
                <p className={`text-2xl font-bold ${stats.saldoAtual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(stats.saldoAtual)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Pago vs Recebido</span>
                </div>
              </div>

              {/* Receitas Totais */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <ArrowUpRight className="w-8 h-8 text-green-500" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    +{formatarMoeda(stats.totalReceitas)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Receitas</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatarMoeda(stats.receitasPagas)}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatarMoeda(stats.receitasPendentes)} pendente</span>
                </div>
              </div>

              {/* Despesas Totais */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <ArrowDownRight className="w-8 h-8 text-red-500" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                    -{formatarMoeda(stats.totalDespesas)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Despesas</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatarMoeda(stats.despesasPagas)}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatarMoeda(stats.despesasPendentes)} pendente</span>
                </div>
              </div>

              {/* Lucro Líquido */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    {((stats.lucroLiquido / stats.totalReceitas) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${stats.lucroLiquido >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatarMoeda(stats.lucroLiquido)}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <PieChart className="w-3 h-3" />
                  <span>Receitas - Despesas</span>
                </div>
              </div>
            </div>

            {/* Gráficos e Análises */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receitas por Categoria */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                  Receitas por Categoria
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Projetos</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(receitasPorCategoria.projeto)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${(receitasPorCategoria.projeto / stats.totalReceitas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Mensalidades</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(receitasPorCategoria.mensalidade)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${(receitasPorCategoria.mensalidade / stats.totalReceitas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Consultoria</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(receitasPorCategoria.consultoria)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${(receitasPorCategoria.consultoria / stats.totalReceitas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Outros</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(receitasPorCategoria.outros)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${(receitasPorCategoria.outros / stats.totalReceitas) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Despesas por Categoria */}
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                  Despesas por Categoria
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Equipe</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.equipe)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.equipe / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ferramentas</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.ferramentas)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.ferramentas / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Marketing</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.marketing)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.marketing / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Infraestrutura</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.infraestrutura)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.infraestrutura / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Impostos</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.impostos)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-gray-500 to-slate-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.impostos / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Outros</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatarMoeda(despesasPorCategoria.outros)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full"
                        style={{ width: `${(despesasPorCategoria.outros / stats.totalDespesas) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximos Vencimentos */}
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Próximos Vencimentos
              </h3>
              <div className="space-y-3">
                {transacoes
                  .filter(t => t.status === 'pendente')
                  .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
                  .slice(0, 5)
                  .map(transacao => {
                    const diasRestantes = Math.ceil((new Date(transacao.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isAtrasado = diasRestantes < 0;
                    const isProximo = diasRestantes <= 3 && diasRestantes >= 0;

                    return (
                      <div
                        key={transacao.id}
                        onClick={() => handleVisualizarTransacao(transacao)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                          isAtrasado
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600'
                            : isProximo
                            ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transacao.tipo === 'receita'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {transacao.tipo === 'receita' ? (
                              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{transacao.descricao}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              {transacao.clienteNome && (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>{transacao.clienteNome}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transacao.tipo === 'receita'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transacao.tipo === 'receita' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                          </p>
                          <p className={`text-xs font-semibold ${
                            isAtrasado
                              ? 'text-red-600 dark:text-red-400'
                              : isProximo
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {isAtrasado
                              ? `${Math.abs(diasRestantes)} dias atrasado`
                              : `Vence em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <ModalCriarTransacao
        isOpen={modalCriar}
        onClose={() => setModalCriar(false)}
        onSave={handleCriarTransacao}
      />

      <ModalVisualizarTransacao
        isOpen={modalVisualizar}
        onClose={() => {
          setModalVisualizar(false);
          setTransacaoSelecionada(null);
        }}
        transacao={transacaoSelecionada}
        onEdit={handleEditarTransacao}
        onDelete={handleDeletarTransacao}
      />

      <ModalEditarTransacao
        isOpen={modalEditar}
        onClose={() => {
          setModalEditar(false);
          setTransacaoSelecionada(null);
        }}
        transacao={transacaoSelecionada}
        onSave={handleSalvarEdicao}
      />

      <ModalDeletarTransacao
        isOpen={modalDeletar}
        onClose={() => {
          setModalDeletar(false);
          setTransacaoSelecionada(null);
        }}
        transacao={transacaoSelecionada}
        onConfirm={handleConfirmarDelecao}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay page="financeiro" />
      </main>
    </div>
  );
};

export default Financeiro;

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp,
  Calendar,
  Send,
  FileSignature,
  Package,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface Metrica {
  solicitacoesPendentes: number;
  propostasAguardandoResposta: number;
  contratosAguardandoAssinatura: number;
  parcelasVencendoHoje: number;
  parcelasAtrasadas: number;
  projetosEmAndamento: number;
  receitaMensal: number;
  receitaPendente: number;
  totalClientes: number;
  novosClientesMes: number;
}

interface Solicitacao {
  id: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  categoria: string;
  valor?: number;
  status: string;
  prioridade: 'baixa' | 'media' | 'alta';
  dataSolicitacao: string;
}

interface AtividadeRecente {
  id: string;
  tipo: string;
  acao: string;
  descricao: string;
  userNome: string;
  userRole: 'admin' | 'cliente';
  dataAcao: string;
}

export default function AdminDashboard() {
  const [metricas, setMetricas] = useState<Metrica>({
    solicitacoesPendentes: 0,
    propostasAguardandoResposta: 0,
    contratosAguardandoAssinatura: 0,
    parcelasVencendoHoje: 0,
    parcelasAtrasadas: 0,
    projetosEmAndamento: 0,
    receitaMensal: 0,
    receitaPendente: 0,
    totalClientes: 0,
    novosClientesMes: 0
  });

  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<Solicitacao[]>([]);

  const [atividadesRecentes, setAtividadesRecentes] = useState<AtividadeRecente[]>([]);

  const [filtroSolicitacoes, setFiltroSolicitacoes] = useState('todas');

  useEffect(() => {
    // TODO: Buscar dados reais da API
    // fetchMetricas();
    // fetchSolicitacoesPendentes();
    // fetchAtividadesRecentes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviada': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'analise': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'proposta-enviada': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'media': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'baixa': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral do sistema e atividades recentes</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Solicitações Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metricas.solicitacoesPendentes}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitações Pendentes</h3>
        </div>

        {/* Propostas Aguardando */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {metricas.propostasAguardandoResposta}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Propostas Aguardando</h3>
        </div>

        {/* Contratos Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FileSignature className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {metricas.contratosAguardandoAssinatura}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos Pendentes</h3>
        </div>

        {/* Parcelas Atrasadas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metricas.parcelasAtrasadas}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Parcelas Atrasadas</h3>
        </div>

        {/* Receita Mensal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {(metricas.receitaMensal / 1000).toFixed(0)}k
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Mensal</h3>
        </div>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.projetosEmAndamento}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Projetos Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.totalClientes}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+{metricas.novosClientesMes}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Novos Este Mês</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {(metricas.receitaPendente / 1000).toFixed(1)}k</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">A Receber</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solicitações Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-600" />
              Solicitações Pendentes
            </h2>
          </div>

          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {solicitacoesPendentes.map((solicitacao) => (
              <div 
                key={solicitacao.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{solicitacao.id}</p>
                    <h3 className="font-bold text-gray-900 dark:text-white">{solicitacao.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{solicitacao.clienteNome}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPrioridadeColor(solicitacao.prioridade)}`}>
                    {solicitacao.prioridade.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(solicitacao.status)}`}>
                    {solicitacao.status}
                  </span>
                  {solicitacao.valor && (
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      R$ {solicitacao.valor.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Criar Proposta
                  </button>
                  <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Atividades Recentes
            </h2>
          </div>

          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {atividadesRecentes.map((atividade) => (
              <div 
                key={atividade.id}
                className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  atividade.userRole === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {atividade.userRole === 'admin' ? (
                    <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {atividade.descricao}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {atividade.userNome}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatarData(atividade.dataAcao)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

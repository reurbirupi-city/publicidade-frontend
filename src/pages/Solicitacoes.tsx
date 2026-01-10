import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster, getAdminByEmail, getClientesDoAdmin } from '../services/adminService';
import {
  notificarPropostaEnviada,
  notificarNovaMensagem,
  notificarContratoDisponivel
} from '../services/notificacoes';
import {
  ArrowLeft,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Send,
  X,
  FileText,
  Paperclip,
  User,
  DollarSign,
  Calendar,
  MessageSquare,
  Loader
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import ChatWhatsAppAdmin from '../components/ChatWhatsAppAdmin';
import { getClientes, getProjetos, saveProjetos, atualizarStatusCliente } from '../services/dataIntegration';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

// Função para baixar contrato assinado do Firestore
const baixarContratoAssinado = async (solicitacaoId: string) => {
  try {
    // Buscar contrato na coleção contratos_assinados
    const q = query(
      collection(db, 'contratos_assinados'),
      where('solicitacaoId', '==', solicitacaoId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      alert('Contrato não encontrado');
      return;
    }
    
    const contratoData = snapshot.docs[0].data();
    
    if (contratoData.pdfBase64) {
      // Criar link de download do base64
      const link = document.createElement('a');
      link.href = contratoData.pdfBase64;
      link.download = contratoData.nomeArquivo || `Contrato_${solicitacaoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Download do contrato iniciado');
    } else if (contratoData.pdfUrl) {
      // Fallback para URL (caso tenha conseguido fazer upload)
      window.open(contratoData.pdfUrl, '_blank');
    } else {
      alert('PDF do contrato não disponível');
    }
  } catch (error) {
    console.error('❌ Erro ao baixar contrato:', error);
    alert('Erro ao baixar contrato. Tente novamente.');
  }
};

const Solicitacoes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [showPropostaModal, setShowPropostaModal] = useState(false);
  const [showResponderModal, setShowResponderModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [loading, setLoading] = useState(true);
  const [propostaData, setPropostaData] = useState({
    valor: '',
    descricao: '',
    prazo: ''
  });
  const [gerandoPropostaIA, setGerandoPropostaIA] = useState(false);
  const [resposta, setResposta] = useState('');

  const handleGerarPropostaIA = async () => {
    if (!selectedSolicitacao) return;
    if (!selectedSolicitacao.clienteId) {
      alert('Esta solicitação não possui clienteId vinculado. Não é possível gerar proposta com IA.');
      return;
    }

    try {
      setGerandoPropostaIA(true);

      const response = await api.post('/ia/propostas/gerar', {
        solicitacaoId: selectedSolicitacao.id,
        clienteId: selectedSolicitacao.clienteId,
        detalhes: {
          descricao: selectedSolicitacao.descricao || selectedSolicitacao.titulo || '',
          tipoServico: selectedSolicitacao.tipoServico || selectedSolicitacao.tipo || selectedSolicitacao.categoria || '',
          objetivo: selectedSolicitacao.objetivo || '',
          publico: selectedSolicitacao.publico || '',
          prazoEstimado: selectedSolicitacao.prazoEstimado || selectedSolicitacao.prazo || 30,
          complexidade: selectedSolicitacao.complexidade || 'media',
          escopo: selectedSolicitacao.escopo || 'completo'
        }
      });

      const proposta = response.data?.proposta;
      if (!proposta) {
        throw new Error('Resposta inválida do servidor (proposta ausente).');
      }

      setPropostaData((prev) => ({
        ...prev,
        descricao: proposta.descricao || prev.descricao,
        prazo: proposta.prazoEntrega ? String(proposta.prazoEntrega) : prev.prazo
      }));
    } catch (error: any) {
      console.error('❌ Erro ao gerar proposta com IA:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro desconhecido';
      alert(`Erro ao gerar proposta com IA: ${msg}`);
    } finally {
      setGerandoPropostaIA(false);
    }
  };

  useEffect(() => {
    const carregarSolicitacoes = async () => {
      if (!user?.email) return;
      
      try {
        setLoading(true);
        const colRef = collection(db, 'solicitacoes_clientes');
        let dados: any[] = [];
        
        // Verificar se é webmaster (vê tudo) ou admin comum (vê só seus clientes)
        if (isWebmaster(user.email)) {
          // Webmaster vê todas as solicitações
          const snapshot = await getDocs(colRef);
          dados = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('👑 Webmaster: carregando todas as solicitações:', dados.length);
        } else {
          // Admin comum: buscar apenas de seus clientes
          const admin = await getAdminByEmail(user.email);
          if (admin) {
            // Buscar IDs dos clientes do admin
            const clientesDoAdmin = await getClientesDoAdmin(admin.id);
            const clienteIds = clientesDoAdmin.map(c => c.id);
            
            if (clienteIds.length > 0) {
              // Buscar solicitações que pertencem aos clientes do admin
              const snapshot = await getDocs(colRef);
              dados = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((sol: any) => clienteIds.includes(sol.clienteId));
              console.log(`📋 Admin ${admin.nome}: carregando ${dados.length} solicitações de ${clienteIds.length} clientes`);
            } else {
              console.log('⚠️ Admin sem clientes vinculados');
              dados = [];
            }
          } else {
            // Fallback: carregar todas (para admins não cadastrados ainda)
            const snapshot = await getDocs(colRef);
            dados = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('⚠️ Admin não encontrado no sistema, mostrando todas:', dados.length);
          }
        }
        
        setSolicitacoes(dados);
      } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarSolicitacoes();
  }, [user]);

  const handleCriarProposta = (solicitacao: any) => {
    setSelectedSolicitacao(solicitacao);
    setShowPropostaModal(true);
  };

  const handleEnviarProposta = async () => {
    if (!propostaData.valor || !propostaData.descricao) {
      alert('Por favor, preencha todos os campos da proposta');
      return;
    }

    try {
      // Atualizar no Firestore
      const docRef = doc(db, 'solicitacoes_clientes', selectedSolicitacao.id);
      await updateDoc(docRef, {
        status: 'proposta-criada',
        propostaCriada: new Date().toLocaleDateString('pt-BR'),
        proposta: {
          valor: parseFloat(propostaData.valor),
          descricao: propostaData.descricao,
          prazo: propostaData.prazo,
          dataCriacao: new Date().toISOString()
        }
      });

      // Atualizar status do cliente para "proposta"
      const clientes = getClientes();
      const cliente = clientes.find(c => 
        c.nome.toLowerCase() === selectedSolicitacao.nomeCliente?.toLowerCase() ||
        c.email.toLowerCase() === selectedSolicitacao.emailCliente?.toLowerCase()
      );
      
      if (cliente) {
        await atualizarStatusCliente(cliente.id, 'prospect', 'proposta');
        console.log('✅ Status do cliente atualizado para "proposta"');
      }

      // Atualizar no estado local
      setSolicitacoes(prev =>
        prev.map(s =>
          s.id === selectedSolicitacao.id
            ? { ...s, status: 'proposta-criada', propostaCriada: new Date().toLocaleDateString('pt-BR') }
            : s
        )
      );

      console.log('✅ Proposta enviada e salva no Firestore');
      
      // Notificar cliente que proposta foi enviada
      if (selectedSolicitacao.clienteId) {
        await notificarPropostaEnviada(
          selectedSolicitacao.clienteId,
          selectedSolicitacao.nomeCliente || 'Cliente',
          parseFloat(propostaData.valor),
          selectedSolicitacao.id
        );
        console.log('🔔 Notificação enviada ao cliente: proposta disponível');
      }
      
      alert('✅ Proposta enviada com sucesso ao cliente!');
      
      setShowPropostaModal(false);
      setPropostaData({ valor: '', descricao: '', prazo: '' });
      setSelectedSolicitacao(null);
    } catch (error) {
      console.error('❌ Erro ao salvar proposta:', error);
      alert('Erro ao enviar proposta. Tente novamente.');
    }
  };

  const handleResponder = (solicitacao: any) => {
    setSelectedSolicitacao(solicitacao);
    setShowResponderModal(true);
  };

  // ✅ FUNÇÕES PARA O CHAT FLUTUANTE DO ADMIN
  const obterConversasParaChat = () => {
    return solicitacoes.map(sol => {
      const respostas = sol.respostas || [];
      const ultimaResposta = respostas.length > 0 ? respostas[respostas.length - 1] : null;
      const naoLidas = respostas.filter((r: any) => r.autor === 'Cliente' && !r.lidaPeloAdmin).length;
      
      return {
        id: sol.id,
        nomeCliente: sol.nomeCliente || 'Cliente',
        titulo: sol.titulo || 'Solicitação',
        ultimaMensagem: ultimaResposta?.texto?.substring(0, 50) + (ultimaResposta?.texto?.length > 50 ? '...' : ''),
        dataUltimaMensagem: ultimaResposta?.dataCriacao || sol.dataSolicitacao,
        naoLidas,
        respostas
      };
    }).sort((a, b) => {
      // Ordenar por data da última mensagem (mais recente primeiro)
      const dataA = a.dataUltimaMensagem ? new Date(a.dataUltimaMensagem).getTime() : 0;
      const dataB = b.dataUltimaMensagem ? new Date(b.dataUltimaMensagem).getTime() : 0;
      return dataB - dataA;
    });
  };

  const handleEnviarMensagemChatFlutuante = async (conversaId: string, texto: string) => {
    const solicitacao = solicitacoes.find(s => s.id === conversaId);
    if (!solicitacao || !texto.trim()) return;

    const novaResposta = {
      texto,
      dataCriacao: new Date().toISOString(),
      autor: 'Admin'
    };

    try {
      const docRef = doc(db, 'solicitacoes_clientes', conversaId);
      const respostasExistentes = solicitacao.respostas || [];
      
      await updateDoc(docRef, {
        respostas: [...respostasExistentes, novaResposta],
        ultimaResposta: new Date().toLocaleDateString('pt-BR')
      });

      // Atualiza estado local
      setSolicitacoes(prev => prev.map(s => 
        s.id === conversaId 
          ? { ...s, respostas: [...(s.respostas || []), novaResposta] }
          : s
      ));

      // Notificar cliente
      if (solicitacao.clienteId) {
        await notificarNovaMensagem(
          solicitacao.clienteId,
          solicitacao.clienteId,
          'Equipe',
          texto.substring(0, 50) + (texto.length > 50 ? '...' : ''),
          conversaId
        );
        console.log('🔔 Notificação enviada ao cliente via chat flutuante');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via chat flutuante:', error);
      throw error;
    }
  };

  const handleEnviarResposta = async () => {
    if (!resposta.trim()) {
      alert('Por favor, digite uma resposta');
      return;
    }

    try {
      // Adicionar resposta ao array de respostas no Firestore
      const docRef = doc(db, 'solicitacoes_clientes', selectedSolicitacao.id);
      
      const novaResposta = {
        texto: resposta,
        dataCriacao: new Date().toISOString(),
        autor: 'Admin'
      };

      // Se já existe array de respostas, atualizar; senão, criar
      const respostasExistentes = selectedSolicitacao.respostas || [];
      
      await updateDoc(docRef, {
        respostas: [...respostasExistentes, novaResposta],
        ultimaResposta: new Date().toLocaleDateString('pt-BR')
      });

      // Atualiza estado local e modal com a nova resposta
      setSolicitacoes(prev => prev.map(s =>
        s.id === selectedSolicitacao.id
          ? { ...s, respostas: [...(s.respostas || []), novaResposta] }
          : s
      ));
      setSelectedSolicitacao((prev: any) => prev ? { ...prev, respostas: [...(prev.respostas || []), novaResposta] } : prev);

      console.log('✅ Resposta salva no Firestore');
      
      // Notificar cliente sobre nova mensagem
      if (selectedSolicitacao.clienteId) {
        await notificarNovaMensagem(
          selectedSolicitacao.clienteId,
          selectedSolicitacao.clienteId,
          'Equipe',
          resposta.substring(0, 50) + (resposta.length > 50 ? '...' : ''),
          selectedSolicitacao.id
        );
        console.log('🔔 Notificação enviada ao cliente: nova mensagem');
      }
      
      alert('✅ Resposta enviada ao cliente!');
      setShowResponderModal(false);
      setResposta('');
    } catch (error) {
      console.error('❌ Erro ao salvar resposta:', error);
      alert('Erro ao enviar resposta. Tente novamente.');
    }
  };

  const handleIniciarProjeto = async (solicitacao: any) => {
    try {
      // Buscar clientes para encontrar o ID do cliente
      const clientes = getClientes();
      const cliente = clientes.find(c => 
        c.nome.toLowerCase() === solicitacao.nomeCliente.toLowerCase() ||
        c.email.toLowerCase() === solicitacao.emailCliente?.toLowerCase()
      );

      if (!cliente) {
        alert('❌ Cliente não encontrado no CRM. Por favor, cadastre o cliente primeiro.');
        return;
      }

      // Gerar ID único para o projeto
      const ano = new Date().getFullYear();
      const projetos = getProjetos();
      const numeroSequencial = projetos.length + 1;
      const projetoId = `PROJ-${ano}-${String(numeroSequencial).padStart(3, '0')}`;

      // Criar novo projeto baseado na solicitação
      const novoProjeto = {
        id: projetoId,
        titulo: solicitacao.titulo,
        descricao: solicitacao.descricao || 'Projeto iniciado a partir de solicitação do cliente',
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteEmpresa: cliente.empresa,
        
        // Serviços e Valores
        servicosContratados: solicitacao.categoria ? [solicitacao.categoria] : ['Serviço Geral'],
        valorContratado: solicitacao.proposta?.valor || solicitacao.valor || 0,
        valorPago: 0,
        
        // Status e Prioridade
        status: 'planejamento',
        prioridade: 'media',
        etapaAtual: 'briefing',
        progresso: 0,
        
        // Prazos
        dataInicio: new Date().toISOString().split('T')[0],
        prazoEstimado: solicitacao.proposta?.prazo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // Revisões
        revisoes: [],
        limiteRevisoes: 3,
        revisoesUsadas: 0,
        
        // Equipe
        responsavel: 'A definir',
        equipe: [],
        
        // Arquivos e Comunicação
        arquivos: [],
        comentariosInternos: [
          {
            id: 'COM-INT-001',
            autor: 'Sistema',
            autorTipo: 'interno',
            texto: `Projeto iniciado a partir da solicitação #${solicitacao.id}`,
            dataHora: new Date().toISOString()
          }
        ],
        comentariosCliente: [],
        
        // Aprovações
        aprovacoes: [],
        
        // Métricas
        horasEstimadas: 40,
        horasTrabalhadas: 0,
        
        // Tags e categorias
        tags: ['Novo Projeto', solicitacao.categoria || 'Geral'],
        categoria: solicitacao.categoria || 'Geral',
        
        // Timestamps
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        
        // Referência à solicitação
        solicitacaoId: solicitacao.id
      };

      // Salvar projeto no localStorage
      const projetosAtualizados = [...projetos, novoProjeto];
      saveProjetos(projetosAtualizados);

      // Atualizar status do cliente para "ativo" com etapa "contratado"
      await atualizarStatusCliente(cliente.id, 'ativo', 'contratado');
      console.log('✅ Status do cliente atualizado para "ativo" / "contratado"');

      // Atualizar status da solicitação para "em-projeto"
      const docRef = doc(db, 'solicitacoes_clientes', solicitacao.id);
      await updateDoc(docRef, {
        status: 'em-projeto',
        projetoId: projetoId,
        dataInicioProjeto: new Date().toISOString()
      });

      setSolicitacoes(prev => prev.map(s =>
        s.id === solicitacao.id
          ? { ...s, status: 'em-projeto', projetoId }
          : s
      ));

      console.log('✅ Projeto criado com sucesso:', projetoId);
      alert(`✅ Projeto ${projetoId} criado com sucesso!\n\nVocê será redirecionado para a página de projetos.`);
      
      // Redirecionar para a página de projetos
      navigate('/projetos');
    } catch (error) {
      console.error('❌ Erro ao iniciar projeto:', error);
      alert('Erro ao criar projeto. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nova':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'analisando':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'proposta-criada':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'aceita':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'contrato-pendente':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'contrato-assinado':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'concluida':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'em-projeto':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'rejeitada':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'nova':
        return 'Nova Solicitação';
      case 'analisando':
        return 'Analisando';
      case 'proposta-criada':
        return 'Proposta Enviada';
      case 'aceita':
        return 'Aceita';
      case 'contrato-pendente':
        return 'Contrato Pendente';
      case 'contrato-assinado':
        return 'Contrato Assinado ✅';
      case 'concluida':
        return 'Concluída';
      case 'em-projeto':
        return 'Em Projeto';
      case 'rejeitada':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nova':
        return AlertCircle;
      case 'analisando':
        return Clock;
      case 'proposta-criada':
        return FileText;
      case 'aceita':
        return CheckCircle;
      case 'contrato-pendente':
        return FileText;
      case 'contrato-assinado':
        return CheckCircle;
      case 'concluida':
        return CheckCircle;
      case 'rejeitada':
        return X;
      default:
        return AlertCircle;
    }
  };

  const solicitacoesFiltradas = filtroStatus === 'todas' 
    ? solicitacoes 
    : solicitacoes.filter(s => s.status === filtroStatus);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar de Navegação */}
      <Sidebar />
      
      {/* Conteúdo Principal */}
      <main className="flex-1 min-h-screen lg:ml-0">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Solicitações de Clientes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciar pedidos e enviar propostas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificacoesBell />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhuma solicitação de cliente ainda
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Quando clientes fizerem solicitações, elas aparecerão aqui
            </p>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {['todas', 'nova', 'analisando', 'proposta-criada', 'aceita', 'em-projeto'].map(status => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filtroStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'todas' ? 'Todas' : getStatusLabel(status)}
                </button>
              ))}
            </div>

            {/* Lista de Solicitações */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {solicitacoesFiltradas.map((solicitacao) => {
                const StatusIcon = getStatusIcon(solicitacao.status);
                
                // Cores por categoria
                const getCategoryGradient = (categoria: string) => {
                  const cat = (categoria || '').toLowerCase();
                  if (cat.includes('design')) return 'from-pink-500 to-rose-500';
                  if (cat.includes('social') || cat.includes('redes')) return 'from-blue-500 to-cyan-500';
                  if (cat.includes('video') || cat.includes('vídeo')) return 'from-purple-500 to-violet-500';
                  if (cat.includes('web') || cat.includes('site')) return 'from-emerald-500 to-teal-500';
                  if (cat.includes('marketing')) return 'from-orange-500 to-amber-500';
                  if (cat.includes('branding') || cat.includes('marca')) return 'from-indigo-500 to-blue-500';
                  if (cat.includes('contato')) return 'from-gray-500 to-slate-500';
                  return 'from-violet-500 to-purple-500';
                };

                const getCategoryBg = (categoria: string) => {
                  const cat = (categoria || '').toLowerCase();
                  if (cat.includes('design')) return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
                  if (cat.includes('social') || cat.includes('redes')) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                  if (cat.includes('video') || cat.includes('vídeo')) return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
                  if (cat.includes('web') || cat.includes('site')) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
                  if (cat.includes('marketing')) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
                  if (cat.includes('branding') || cat.includes('marca')) return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
                  if (cat.includes('contato')) return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
                  return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800';
                };

                return (
                  <div
                    key={solicitacao.id}
                    className={`rounded-2xl border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${getCategoryBg(solicitacao.categoria)}`}
                  >
                    {/* Header colorido */}
                    <div className={`bg-gradient-to-r ${getCategoryGradient(solicitacao.categoria)} px-5 py-4 text-white`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate mb-1">
                            {solicitacao.titulo}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {solicitacao.customizado && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur">
                                ⭐ Personalizado
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur">
                              {solicitacao.categoria}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                          <StatusIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-5 bg-white dark:bg-gray-800/50">
                      {/* Status Badge */}
                      <div className="mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(solicitacao.status)}`}>
                          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                          {getStatusLabel(solicitacao.status)}
                        </span>
                      </div>

                      {/* Descrição */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {solicitacao.descricao}
                      </p>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-semibold">Cliente</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{solicitacao.nomeCliente}</span>
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-semibold">Valor</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            {solicitacao.valor > 0 
                              ? `R$ ${solicitacao.valor.toLocaleString('pt-BR')}` 
                              : solicitacao.customizado 
                                ? 'A definir'
                                : 'R$ 0'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Data */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{solicitacao.dataSolicitacao}</span>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {solicitacao.status === 'nova' || solicitacao.status === 'analisando' ? (
                          <>
                            <button
                              onClick={() => handleCriarProposta(solicitacao)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-purple-500/25"
                            >
                              <Plus className="w-4 h-4" />
                              Proposta
                            </button>
                            <button
                              onClick={() => handleResponder(solicitacao)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-3 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-blue-500/25"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Responder
                            </button>
                          </>
                        ) : solicitacao.status === 'proposta-criada' ? (
                          <div className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2.5 rounded-xl font-semibold text-xs">
                            <CheckCircle className="w-4 h-4" />
                            Proposta Enviada
                          </div>
                        ) : solicitacao.status === 'aceita' ? (
                          <button
                            onClick={() => handleIniciarProjeto(solicitacao)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg shadow-orange-500/25 animate-pulse"
                          >
                            <Plus className="w-4 h-4" />
                            Iniciar Projeto
                          </button>
                        ) : solicitacao.status === 'contrato-assinado' || solicitacao.status === 'concluida' ? (
                          <div className="flex-1 flex gap-2">
                            <div className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-2.5 rounded-xl font-semibold text-xs">
                              <CheckCircle className="w-4 h-4" />
                              Contrato Assinado
                            </div>
                            <button
                              onClick={() => baixarContratoAssinado(solicitacao.id)}
                              className="flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-xl font-semibold text-xs transition-all"
                              title="Baixar Contrato Assinado"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                        <button
                          onClick={() => {
                            setSelectedSolicitacao(solicitacao);
                            setShowDetalhesModal(true);
                          }}
                          className="flex items-center justify-center gap-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Criar Proposta */}
      {showPropostaModal && selectedSolicitacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Criar Proposta
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGerarPropostaIA}
                  disabled={gerandoPropostaIA}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg font-medium transition-colors"
                  title="Gerar descrição e prazo com IA"
                >
                  {gerandoPropostaIA ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Gerar com IA
                </button>
                <button
                  onClick={() => {
                    setShowPropostaModal(false);
                    setPropostaData({ valor: '', descricao: '', prazo: '' });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Para: {selectedSolicitacao.nomeCliente}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSolicitacao.titulo}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Proposta *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">R$</span>
                  <input
                    type="number"
                    value={propostaData.valor}
                    onChange={(e) => setPropostaData({ ...propostaData, valor: e.target.value })}
                    placeholder="0,00"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição da Proposta *
                </label>
                <textarea
                  value={propostaData.descricao}
                  onChange={(e) => setPropostaData({ ...propostaData, descricao: e.target.value })}
                  placeholder="Descreva detalhes da proposta..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo (dias)
                </label>
                <input
                  type="number"
                  value={propostaData.prazo}
                  onChange={(e) => setPropostaData({ ...propostaData, prazo: e.target.value })}
                  placeholder="30"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPropostaModal(false);
                  setPropostaData({ valor: '', descricao: '', prazo: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarProposta}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar Proposta
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal de Detalhes da Solicitação (inclusive concluídas) */}
      {showDetalhesModal && selectedSolicitacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes da Solicitação</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedSolicitacao.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetalhesModal(false);
                  setSelectedSolicitacao(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedSolicitacao.nomeCliente}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSolicitacao.emailCliente}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white">{getStatusLabel(selectedSolicitacao.status)}</p>
                {selectedSolicitacao.contratoStatus && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Contrato: {selectedSolicitacao.contratoStatus}</p>
                )}
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                <p className="font-semibold text-gray-900 dark:text-white">R$ {selectedSolicitacao.valor?.toLocaleString('pt-BR')}</p>
                {selectedSolicitacao.valorProposta && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Proposta: R$ {selectedSolicitacao.valorProposta.toLocaleString('pt-BR')}</p>
                )}
              </div>
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500 dark:text-gray-400">Data</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedSolicitacao.dataSolicitacao}</p>
                {selectedSolicitacao.dataFinalizacao && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Concluída em {selectedSolicitacao.dataFinalizacao}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descrição</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedSolicitacao.descricao}</p>
            </div>

            {selectedSolicitacao.proposta && (
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Proposta
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Valor: R$ {selectedSolicitacao.proposta.valor?.toLocaleString('pt-BR')}</p>
                {selectedSolicitacao.proposta.descricao && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedSolicitacao.proposta.descricao}</p>
                )}
              </div>
            )}

            {selectedSolicitacao.contrato && (
              <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Contrato
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">ID: {selectedSolicitacao.contrato.id}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Valor: R$ {selectedSolicitacao.contrato.valor?.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Status: {selectedSolicitacao.contrato.status || selectedSolicitacao.contratoStatus}</p>
                {selectedSolicitacao.contrato.dataAssinatura && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Assinado em {selectedSolicitacao.contrato.dataAssinatura}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium disabled:opacity-60"
                    disabled={!selectedSolicitacao.contrato.arquivoUrl}
                    onClick={() => {
                      if (selectedSolicitacao.contrato.arquivoUrl) {
                        const url = selectedSolicitacao.contrato.arquivoUrl;
                        // Se não terminar com .pdf, alertar que o arquivo pode não ser PDF
                        if (!url.toLowerCase().includes('.pdf')) {
                          const continuar = window.confirm('O arquivo anexado não parece ser PDF. Deseja abrir assim mesmo?');
                          if (!continuar) return;
                        }
                        window.open(url, '_blank');
                      } else {
                        alert('Contrato assinado registrado, mas o arquivo PDF não foi anexado.');
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Baixar contrato (PDF)
                  </button>
                </div>
              </div>
            )}

            {/* Área de Documentos para capturar contrato assinado ou outros anexos */}
            {!selectedSolicitacao.contrato && (
              <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Paperclip className="w-4 h-4" />
                Nenhum contrato anexado ainda. O cliente deve assinar pelo portal e o arquivo aparecerá aqui.
              </div>
            )}

          </div>
        </div>
      )}

      {/* Chat WhatsApp Flutuante do Admin */}
      <ChatWhatsAppAdmin
        conversas={obterConversasParaChat()}
        onEnviarMensagem={handleEnviarMensagemChatFlutuante}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay page="solicitacoes" />
      </main>
    </div>
  );
};

export default Solicitacoes;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Star,
  ArrowLeft,
  X,
  Save,
  TrendingUp,
  DollarSign,
  Briefcase,
  FileText,
  FileSignature,
  ShoppingCart
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { getClientes, saveClientes } from '../services/dataIntegration';
import ModalCotacaoServicos from '../components/ModalCotacaoServicos';
import ModalGerarProposta from '../components/ModalGerarProposta';
import ModalContratoAssinatura from '../components/ModalContratoAssinatura';
import ModalFinalizarServico from '../components/ModalFinalizarServico';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster, getAdminByEmail } from '../services/adminService';
import { notificarNovoCliente } from '../services/notificacoes';

// Tipos auxiliares para o módulo de clientes
interface ServicoContratado {
  id: string;
  nome: string;
  categoria: 'branding' | 'social-media' | 'web' | 'marketing' | 'design' | 'video';
  valor: number;
  recorrente: boolean;
  dataContratacao: string;
  status: 'ativo' | 'pausado' | 'concluido';
}

interface Interacao {
  id: string;
  tipo: 'email' | 'reuniao' | 'ligacao' | 'whatsapp' | 'proposta' | 'contrato';
  data: string;
  descricao: string;
  responsavel: string;
  proximoFollowup?: string;
}

interface Documento {
  id: string;
  nome: string;
  tipo: 'contrato' | 'proposta' | 'briefing' | 'apresentacao' | 'outro';
  url: string;
  dataUpload: string;
  tamanho: string; // Ex: "150KB", "2MB"
  formato: string;
}

interface RedesSociais {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

interface Cliente {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  status: 'ativo' | 'inativo' | 'prospect';
  valorTotal: number;
  projetos: number;
  dataContato: string;
  observacoes: string;
  rating: number;
  adminId?: string;
  
  // Novos campos - Dados cadastrais expandidos
  tipoPessoa?: 'fisica' | 'juridica';
  cpf?: string;
  cnpj?: string;
  emailSecundario?: string;
  telefoneSecundario?: string;
  whatsapp?: string;
  site?: string;
  redesSociais?: RedesSociais;
  
  // Novos campos - Funil de vendas
  etapaFunil: 'prospect' | 'contato' | 'proposta' | 'negociacao' | 'contratado' | 'ativo' | 'inativo' | 'perdido';
  dataMudancaEtapa?: string;
  motivoPerdido?: string;
  
  // Novos campos - Contratação e assinatura
  contratoAssinado: boolean;
  contratoId?: string;
  dataAssinatura?: string;
  assinaturaBase64?: string;
  
  // Novos campos - Relacionamento e histórico
  servicosContratados: ServicoContratado[];
  historicoInteracoes: Interacao[];
  documentos: Documento[];
  
  // Novos campos - Portal do cliente
  portalAtivo: boolean;
  senhaPortal?: string;
  ultimoAcessoPortal?: string;
}

const CRM: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'inativo' | 'prospect'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estados para os novos modais do workflow de contratação
  const [showModalCotacao, setShowModalCotacao] = useState(false);
  const [showModalProposta, setShowModalProposta] = useState(false);
  const [showModalContrato, setShowModalContrato] = useState(false);
  const [showModalFinalizar, setShowModalFinalizar] = useState(false);
  
  // Dados temporários para fluxo entre modais
  const [servicosCotados, setServicosCotados] = useState<any[]>([]);
  const [cotacaoObservacoes, setCotacaoObservacoes] = useState('');
  const [valorTotalCotacao, setValorTotalCotacao] = useState({ total: 0, umaVez: 0, recorrente: 0 });
  const [servicoParaFinalizar, setServicoParaFinalizar] = useState<ServicoContratado | null>(null);
  
  // Estado carregado do localStorage - inicia vazio se não houver dados
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const clientesStorage = getClientes();
    if (clientesStorage && clientesStorage.length > 0) {
      console.log('✅ CRM: Carregado do localStorage:', clientesStorage.length, 'clientes');
      return clientesStorage as any[];
    }
    console.log('⚠️ CRM: Nenhum cliente encontrado no localStorage, iniciando lista vazia');
    return [];
  });

  // Carregar clientes do Firestore ao montar o componente
  const { user } = useAuth();
  
  useEffect(() => {
    const carregarClientesFirestore = async () => {
      if (!user?.email) return;
      
      try {
        console.log('🔄 CRM: Buscando clientes do Firestore...');
        let clientesFirestore: any[] = [];
        
        // Verificar se é webmaster (vê tudo) ou admin comum (vê só seus clientes)
        if (isWebmaster(user.email)) {
          // Webmaster vê todos os clientes
          const q = query(collection(db, 'clientes'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            clientesFirestore.push({ ...doc.data(), id: doc.id });
          });
          console.log('👑 Webmaster: carregando todos os clientes:', clientesFirestore.length);
        } else {
          // Admin comum: buscar apenas seus clientes
          const admin = await getAdminByEmail(user.email);
          if (admin) {
            const q = query(collection(db, 'clientes'), where('adminId', '==', admin.id));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              clientesFirestore.push({ ...doc.data(), id: doc.id });
            });
            console.log(`📋 Admin ${admin.nome}: carregando ${clientesFirestore.length} clientes`);
          } else {
            // Fallback: carregar todos (para admins não cadastrados ainda)
            const q = query(collection(db, 'clientes'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              clientesFirestore.push({ ...doc.data(), id: doc.id });
            });
            console.log('⚠️ Admin não encontrado no sistema, mostrando todos:', clientesFirestore.length);
          }
        }

        if (clientesFirestore.length > 0) {
          console.log('✅ CRM: Carregou', clientesFirestore.length, 'clientes do Firestore');
          
          // Mesclar com localStorage (priorizar Firestore)
          const clientesLocal = getClientes();
          const clientesMap = new Map();
          
          // Adicionar clientes locais primeiro (apenas se for webmaster)
          if (isWebmaster(user.email)) {
            clientesLocal.forEach(c => clientesMap.set(c.id, c));
          }
          
          // Sobrescrever com clientes do Firestore
          clientesFirestore.forEach(c => clientesMap.set(c.id, c));
          
          const clientesMesclados = Array.from(clientesMap.values());
          setClientes(clientesMesclados as any[]);
          saveClientes(clientesMesclados as any[]);
          console.log('✅ CRM: Total de', clientesMesclados.length, 'clientes mesclados');
        } else {
          console.log('⚠️ CRM: Nenhum cliente encontrado no Firestore');
          setClientes([]);
        }
      } catch (error) {
        console.error('❌ CRM: Erro ao carregar clientes do Firestore:', error);
      }
    };

    carregarClientesFirestore();
  }, [user]);

  // Salva no localStorage sempre que clientes mudar
  useEffect(() => {
    saveClientes(clientes as any[]);
    console.log('💾 CRM: Salvou', clientes.length, 'clientes no localStorage');
  }, [clientes]);

  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    status: 'prospect',
    valorTotal: 0,
    projetos: 0,
    observacoes: '',
    rating: 3,
    etapaFunil: 'prospect',
    contratoAssinado: false,
    servicosContratados: [],
    historicoInteracoes: [],
    documentos: [],
    portalAtivo: false
  });

  const stats = [
    {
      label: 'Total Clientes',
      value: clientes.length.toString(),
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Ativos',
      value: clientes.filter(c => c.status === 'ativo').length.toString(),
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Prospects',
      value: clientes.filter(c => c.status === 'prospect').length.toString(),
      icon: Star,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      label: 'Receita Total',
      value: `R$ ${(clientes.reduce((acc, c) => acc + c.valorTotal, 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = 
      cliente.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchFilter = filterStatus === 'todos' || cliente.status === filterStatus;
    
    return matchSearch && matchFilter;
  });

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      status: 'prospect',
      valorTotal: 0,
      projetos: 0,
      observacoes: '',
      rating: 3
    });
    setShowModal(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setModalMode('edit');
    setSelectedCliente(cliente);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleView = (cliente: Cliente) => {
    setModalMode('view');
    setSelectedCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedCliente) {
      try {
        await deleteDoc(doc(db, 'clientes', selectedCliente.id));
        setClientes(clientes.filter(c => c.id !== selectedCliente.id));
        setShowDeleteConfirm(false);
        setSelectedCliente(null);
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        // Fallback local
        setClientes(clientes.filter(c => c.id !== selectedCliente.id));
        setShowDeleteConfirm(false);
        setSelectedCliente(null);
      }
    }
  };

  const handleSave = async () => {
    if (modalMode === 'create') {
      const id = Date.now().toString();
      const newCliente: Cliente = {
        ...formData as Cliente,
        id,
        dataContato: new Date().toISOString().split('T')[0],
        adminId: user?.uid // Vincular ao admin que criou
      };

      try {
        await setDoc(doc(db, 'clientes', id), {
          ...newCliente,
          syncedAt: new Date().toISOString()
        });
        
        // Notificar
        await notificarNovoCliente(
          newCliente.nome, 
          newCliente.empresa, 
          newCliente.email, 
          newCliente.id, 
          user?.uid
        );
        
        setClientes([...clientes, newCliente]);
      } catch (error) {
        console.error('Erro ao salvar cliente no Firestore:', error);
        setClientes([...clientes, newCliente]);
      }
    } else if (modalMode === 'edit' && selectedCliente) {
      const updatedCliente = { ...formData as Cliente, id: selectedCliente.id };
      
      try {
        await setDoc(doc(db, 'clientes', selectedCliente.id), {
          ...updatedCliente,
          syncedAt: new Date().toISOString()
        });
        
        setClientes(clientes.map(c => 
          c.id === selectedCliente.id ? updatedCliente : c
        ));
      } catch (error) {
        console.error('Erro ao atualizar cliente no Firestore:', error);
        setClientes(clientes.map(c => 
          c.id === selectedCliente.id ? updatedCliente : c
        ));
      }
    }
    setShowModal(false);
    setSelectedCliente(null);
  };
  
  // Handlers para workflow de contratação
  const handleAbrirCotacao = () => {
    if (!selectedCliente) return;
    setShowModalCotacao(true);
  };
  
  const handleGerarProposta = (servicos: any[], observacoes: string, valorTotal: number) => {
    setServicosCotados(servicos);
    setCotacaoObservacoes(observacoes);
    setValorTotalCotacao({ total: valorTotal, umaVez: 0, recorrente: 0 }); // Armazena total simples
    setShowModalCotacao(false);
    setShowModalProposta(true);
  };
  
  const handleEnviarContrato = () => {
    if (!selectedCliente || servicosCotados.length === 0) return;
    setShowModalProposta(false);
    setShowModalContrato(true);
  };
  
  const handlePropostaGerada = (docId: string, filename: string) => {
    if (!selectedCliente) return;
    
    // Atualizar cliente com documento da proposta
    const novoDocumento: Documento = {
      id: docId,
      nome: filename,
      tipo: 'proposta',
      url: '#',
      dataUpload: new Date().toISOString().split('T')[0],
      tamanho: '150KB',
      formato: 'pdf'
    };
    
    const clienteAtualizado = {
      ...selectedCliente,
      documentos: [...(selectedCliente.documentos || []), novoDocumento]
    };
    
    setClientes(clientes.map(c => c.id === selectedCliente.id ? clienteAtualizado : c));
    setSelectedCliente(clienteAtualizado);
  };
  
  const handleContratoAssinado = (contratoId: string, assinaturaBase64: string, filename: string) => {
    if (!selectedCliente) return;
    
    // Criar documento do contrato
    const novoDocumento: Documento = {
      id: contratoId,
      nome: filename,
      tipo: 'contrato',
      url: '#',
      dataUpload: new Date().toISOString().split('T')[0],
      tamanho: '200KB',
      formato: 'pdf'
    };
    
    // Converter serviços cotados para serviços contratados
    const servicosContratados: ServicoContratado[] = servicosCotados.map(s => ({
      id: Date.now().toString() + Math.random(),
      nome: s.nome,
      categoria: s.categoria,
      valor: s.valorFinal,
      recorrente: s.recorrente,
      dataContratacao: new Date().toISOString().split('T')[0],
      status: 'ativo' as const
    }));
    
    // Atualizar cliente
    const clienteAtualizado: Cliente = {
      ...selectedCliente,
      contratoAssinado: true,
      assinaturaBase64: assinaturaBase64,
      documentos: [...(selectedCliente.documentos || []), novoDocumento],
      servicosContratados: [...(selectedCliente.servicosContratados || []), ...servicosContratados],
      status: 'ativo' as const,
      etapaFunil: 'contratado' as const
    };
    
    setClientes(clientes.map(c => c.id === selectedCliente.id ? clienteAtualizado : c));
    setSelectedCliente(clienteAtualizado);
    setShowModalContrato(false);
    
    // Limpar dados temporários
    setServicosCotados([]);
    setCotacaoObservacoes('');
    setValorTotalCotacao({ total: 0, umaVez: 0, recorrente: 0 });
  };
  
  // Handler para abrir modal de finalização de serviço
  const handleAbrirFinalizacao = (servico: ServicoContratado) => {
    setServicoParaFinalizar(servico);
    setShowModalFinalizar(true);
  };
  
  // Handler para finalizar serviço e adicionar ao portfólio
  const handleFinalizarServico = (servicoId: string, entregavel: any) => {
    if (!selectedCliente) return;
    
    // Atualizar status do serviço contratado
    const servicosAtualizados = selectedCliente.servicosContratados.map(s => 
      s.id === servicoId ? { ...s, status: 'concluido' as const } : s
    );
    
    // Criar item do portfólio
    const portfolioItem = {
      id: Date.now().toString() + Math.random(),
      projetoId: servicoId,
      clienteId: selectedCliente.id,
      clienteNome: selectedCliente.nome,
      clienteEmpresa: selectedCliente.empresa,
      titulo: entregavel.titulo,
      descricao: entregavel.descricao,
      categoria: servicoParaFinalizar?.categoria || 'marketing',
      imagemCapa: entregavel.imagemCapa,
      imagensGaleria: entregavel.imagensGaleria || [],
      tags: entregavel.tags || [],
      linkProjeto: entregavel.linkProjeto,
      arquivosEntregues: entregavel.arquivosEntregues || [],
      dataConclusao: new Date().toISOString().split('T')[0],
      resultados: entregavel.resultados,
      testemunho: entregavel.testemunho,
      autorizadoPublicacao: entregavel.autorizadoPublicacao,
      destaque: false
    };
    
    // Salvar no localStorage do portfólio
    const portfolioAtual = JSON.parse(localStorage.getItem('portfolio') || '[]');
    localStorage.setItem('portfolio', JSON.stringify([...portfolioAtual, portfolioItem]));
    
    // Atualizar cliente
    const clienteAtualizado = {
      ...selectedCliente,
      servicosContratados: servicosAtualizados
    };
    
    setClientes(clientes.map(c => c.id === selectedCliente.id ? clienteAtualizado : c));
    setSelectedCliente(clienteAtualizado);
    setShowModalFinalizar(false);
    setServicoParaFinalizar(null);
    
    alert('✅ Serviço finalizado e adicionado ao portfólio com sucesso!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inativo': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'prospect': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'prospect': return 'Prospect';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-0">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/30 transition-colors duration-500"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 sticky top-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 ml-14 lg:ml-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de Clientes</p>
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

        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="relative group">
              <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-l-4 border-l-blue-500 dark:border-l-amber-500 rounded-xl p-4 transition-all hover:scale-105">
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
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
              >
                <option value="todos">Todos Status</option>
                <option value="ativo">Ativos</option>
                <option value="prospect">Prospects</option>
                <option value="inativo">Inativos</option>
              </select>
              
              <button
                onClick={() => {
                  if (confirm('⚠️ Tem certeza que deseja limpar todos os dados mockados?\n\nIsso apagará todos os clientes atuais!')) {
                    setClientes([]);
                    saveClientes([]);
                    console.log('🔄 Dados mockados limpos do CRM');
                    alert('✅ Dados limpos! Agora você pode cadastrar clientes reais.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all text-sm font-medium"
                title="Limpar dados mockados"
              >
                🔄 Reset
              </button>
              
              <button
                onClick={() => {
                  const clientesRecarregados = getClientes();
                  setClientes(clientesRecarregados as any[]);
                  console.log('🔄 Recarregou', clientesRecarregados.length, 'clientes do localStorage');
                  alert(`✅ Recarregado! ${clientesRecarregados.length} cliente(s) encontrado(s).`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm font-medium"
                title="Recarregar dados do localStorage"
              >
                🔄 Recarregar
              </button>
              
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Novo Cliente
              </button>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 border-l-4 border-l-blue-500 dark:border-l-amber-500 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-xl group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {cliente.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{cliente.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.empresa}</p>
                  </div>
                </div>
                
                <div className="relative group/menu">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                    <button
                      onClick={() => handleView(cliente)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </button>
                    <button
                      onClick={() => handleEdit(cliente)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-300"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cliente)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${getStatusColor(cliente.status)}`}>
                {getStatusLabel(cliente.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  {cliente.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  {cliente.telefone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {cliente.cidade}, {cliente.estado}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Projetos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{cliente.projetos}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {(cliente.valorTotal / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < cliente.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClientes.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'view' ? 'Detalhes do Cliente' : modalMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {modalMode === 'view' && selectedCliente ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl">
                      {selectedCliente.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCliente.nome}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{selectedCliente.empresa}</p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(selectedCliente.status)}`}>
                        {getStatusLabel(selectedCliente.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Telefone</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.telefone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Cidade</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.cidade}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Estado</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.estado}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Endereço</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.endereco}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Data Contato</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedCliente.dataContato).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Projetos</label>
                      <p className="text-gray-900 dark:text-white">{selectedCliente.projetos}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Valor Total</label>
                      <p className="text-green-600 dark:text-green-400 font-bold">
                        R$ {selectedCliente.valorTotal.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Avaliação</label>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < selectedCliente.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Observações</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedCliente.observacoes}</p>
                  </div>
                  
                  {/* Botões de Ação - Workflow de Contratação */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Ações do Cliente
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={handleAbrirCotacao}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Cotar Serviços
                      </button>
                      
                      <button
                        onClick={() => servicosCotados.length > 0 ? setShowModalProposta(true) : alert('Primeiro faça uma cotação de serviços')}
                        disabled={servicosCotados.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-5 h-5" />
                        Gerar Proposta
                      </button>
                      
                      <button
                        onClick={handleEnviarContrato}
                        disabled={servicosCotados.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileSignature className="w-5 h-5" />
                        Enviar Contrato
                      </button>
                    </div>
                    
                    {selectedCliente.contratoAssinado && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-2">
                          <FileSignature className="w-5 h-5" />
                          Contrato assinado digitalmente
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Seção de Serviços Contratados */}
                  {selectedCliente.servicosContratados && selectedCliente.servicosContratados.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Serviços Contratados
                      </h4>
                      
                      <div className="space-y-3">
                        {selectedCliente.servicosContratados.map((servico) => (
                          <div 
                            key={servico.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="font-semibold text-gray-900 dark:text-white">
                                    {servico.nome}
                                  </h5>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    servico.status === 'ativo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    servico.status === 'pausado' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {servico.status === 'ativo' ? '🟢 Ativo' : 
                                     servico.status === 'pausado' ? '🟡 Pausado' : 
                                     '✅ Concluído'}
                                  </span>
                                  {servico.recorrente && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                      🔄 Recorrente
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="capitalize">
                                    📁 {servico.categoria.replace('-', ' ')}
                                  </span>
                                  <span>
                                    💰 R$ {servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {servico.recorrente && '/mês'}
                                  </span>
                                  <span>
                                    📅 {new Date(servico.dataContratacao).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                              
                              {servico.status === 'ativo' && (
                                <button
                                  onClick={() => handleAbrirFinalizacao(servico)}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                                >
                                  <FileSignature className="w-4 h-4" />
                                  Finalizar Serviço
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa *
                      </label>
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="Cidade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white"
                      >
                        <option value="prospect">Prospect</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Avaliação
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating })}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                rating <= (formData.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 text-gray-900 dark:text-white resize-none"
                        placeholder="Anotações sobre o cliente..."
                      />
                    </div>
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
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all hover:scale-105 font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Excluir Cliente?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tem certeza que deseja excluir <strong>{selectedCliente.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCliente(null);
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
      
      {/* Modais do Workflow de Contratação */}
      {showModalCotacao && selectedCliente && (
        <ModalCotacaoServicos
          isOpen={showModalCotacao}
          onClose={() => setShowModalCotacao(false)}
          clienteNome={selectedCliente.nome}
          onGerarProposta={handleGerarProposta}
        />
      )}
      
      {showModalProposta && selectedCliente && (
        <ModalGerarProposta
          isOpen={showModalProposta}
          onClose={() => setShowModalProposta(false)}
          cliente={{
            nome: selectedCliente.nome,
            empresa: selectedCliente.empresa,
            email: selectedCliente.email,
            telefone: selectedCliente.telefone,
            endereco: selectedCliente.endereco,
            cidade: selectedCliente.cidade,
            estado: selectedCliente.estado
          }}
          servicos={servicosCotados.map(s => ({
            id: s.id,
            nome: s.nome,
            categoria: s.categoria,
            descricao: s.descricao || '',
            valor: s.valorFinal || s.valorSugerido,
            recorrente: s.recorrente,
            unidade: s.unidade
          }))}
          observacoes={cotacaoObservacoes}
          valorTotal={valorTotalCotacao.total}
          onPropostaGerada={handlePropostaGerada}
        />
      )}
      
      {showModalContrato && selectedCliente && (
        <ModalContratoAssinatura
          isOpen={showModalContrato}
          onClose={() => setShowModalContrato(false)}
          cliente={{
            nome: selectedCliente.nome,
            empresa: selectedCliente.empresa,
            email: selectedCliente.email,
            telefone: selectedCliente.telefone,
            cpf: selectedCliente.cpf,
            cnpj: selectedCliente.cnpj,
            endereco: selectedCliente.endereco,
            cidade: selectedCliente.cidade,
            estado: selectedCliente.estado
          }}
          servicos={servicosCotados.map(s => ({
            id: s.id,
            nome: s.nome,
            categoria: s.categoria,
            valor: s.valorFinal || s.valorSugerido,
            recorrente: s.recorrente,
            unidade: s.unidade
          }))}
          valorTotal={valorTotalCotacao.total}
          onContratoAssinado={handleContratoAssinado}
        />
      )}
      
      {/* Modal de Finalização de Serviço */}
      {showModalFinalizar && servicoParaFinalizar && selectedCliente && (
        <ModalFinalizarServico
          isOpen={showModalFinalizar}
          onClose={() => {
            setShowModalFinalizar(false);
            setServicoParaFinalizar(null);
          }}
          servico={servicoParaFinalizar}
          cliente={{
            id: selectedCliente.id,
            nome: selectedCliente.nome,
            empresa: selectedCliente.empresa
          }}
          onFinalizar={handleFinalizarServico}
        />
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay page="crm" />
      </main>
    </div>
  );
};

export default CRM;

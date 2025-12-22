import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Check,
  CheckCheck,
  ChevronLeft,
  Users,
  Search,
  RefreshCw,
  MoreVertical,
  Trash2,
  XCircle,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notificarNovaMensagem } from '../services/notificacoes';
import { isWebmaster, getAdminByEmail, getClientesDoAdmin } from '../services/adminService';

interface Mensagem {
  id: string;
  texto: string;
  autor: 'Cliente' | 'Admin' | 'Sistema';
  dataCriacao: string;
  lida?: boolean;
}

interface Conversa {
  id: string;
  nomeCliente: string;
  titulo: string;
  ultimaMensagem?: string;
  dataUltimaMensagem?: string;
  naoLidas: number;
  respostas: any[];
  clienteId?: string;
  status?: 'ativa' | 'encerrada' | 'arquivada';
}

const ChatGlobalAdmin: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clienteIdsDoAdmin, setClienteIdsDoAdmin] = useState<string[]>([]);
  const [isWebmasterUser, setIsWebmasterUser] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    tipo: 'limpar' | 'encerrar' | 'excluir' | null;
    conversaId?: string;
  }>({ tipo: null });
  const [mostrarEncerradas, setMostrarEncerradas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Verificar se é admin e carregar IDs dos clientes do admin
  useEffect(() => {
    const verificarSeAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

      // Verificar se é webmaster
      const webmasterCheck = isWebmaster(user.email);
      setIsWebmasterUser(webmasterCheck);

      // Lista de emails conhecidos como admin/webmaster
      const emailsAdmin = [
        'admin@agencia.com',
        'admin@admin.com',
        'reurbirupi@gmail.com',
        'tributacao.irupi@gmail.com',
      ];
      
      // Verificação básica por email
      let adminCheck = emailsAdmin.some(email => user.email?.toLowerCase() === email.toLowerCase()) ||
        user.email.toLowerCase().includes('admin') ||
        localStorage.getItem('userRole') === 'admin' ||
        localStorage.getItem('userRole') === 'webmaster' ||
        webmasterCheck;
      
      // Verificar também na coleção admins do Firestore
      let adminData = null;
      if (user.uid) {
        try {
          const adminDoc = await getDocs(query(
            collection(db, 'admins'),
            where('email', '==', user.email)
          ));
          
          if (!adminDoc.empty) {
            adminCheck = true;
            adminData = { id: adminDoc.docs[0].id, ...adminDoc.docs[0].data() };
          }
        } catch (error) {
          console.log('⚠️ Erro ao verificar coleção admins:', error);
        }
      }
      
      // Carregar IDs dos clientes deste admin
      if (adminCheck && !webmasterCheck && adminData) {
        try {
          const clientes = await getClientesDoAdmin(adminData.id);
          const ids = clientes.map(c => c.id);
          setClienteIdsDoAdmin(ids);
          console.log(`📋 Chat: Admin tem ${ids.length} clientes vinculados`);
        } catch (error) {
          console.error('❌ Erro ao carregar clientes do admin:', error);
        }
      }
      
      console.log('🔐 ChatGlobalAdmin - User:', user?.email, '| isAdmin:', adminCheck, '| isWebmaster:', webmasterCheck);
      setIsAdmin(adminCheck);
    };

    verificarSeAdmin();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar conversas do Firestore em tempo real - filtradas por clientes do admin
  useEffect(() => {
    if (!isAdmin) return;
    
    // Se não é webmaster e não tem clientes, não carregar
    if (!isWebmasterUser && clienteIdsDoAdmin.length === 0) {
      console.log('⚠️ Admin sem clientes vinculados, aguardando...');
      setConversas([]);
      return;
    }

    console.log('🔍 Carregando conversas para o admin...', isWebmasterUser ? '(webmaster - todas)' : `(${clienteIdsDoAdmin.length} clientes)`);
    setCarregando(true);

    const q = query(
      collection(db, 'solicitacoes_clientes')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversasData: Conversa[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Filtrar: webmaster vê tudo, admin comum vê só seus clientes
        if (!isWebmasterUser && !clienteIdsDoAdmin.includes(data.clienteId)) {
          return; // Pular solicitações de clientes de outros admins
        }
        
        const respostas = data.respostas || [];
        const ultimaResposta = respostas.length > 0 ? respostas[respostas.length - 1] : null;
        const naoLidas = respostas.filter((r: any) => r.autor === 'Cliente' && !r.lidaPeloAdmin).length;
        
        conversasData.push({
          id: docSnap.id,
          nomeCliente: data.nomeCliente || 'Cliente',
          titulo: data.titulo || data.servicoTitulo || 'Solicitação',
          ultimaMensagem: ultimaResposta?.texto?.substring(0, 50) + (ultimaResposta?.texto?.length > 50 ? '...' : ''),
          dataUltimaMensagem: ultimaResposta?.dataCriacao || data.dataSolicitacao,
          naoLidas,
          respostas,
          clienteId: data.clienteId,
          status: data.status || 'ativa'
        });
      });

      // Ordenar por data da última mensagem
      conversasData.sort((a, b) => {
        const dataA = a.dataUltimaMensagem ? new Date(a.dataUltimaMensagem).getTime() : 0;
        const dataB = b.dataUltimaMensagem ? new Date(b.dataUltimaMensagem).getTime() : 0;
        return dataB - dataA;
      });

      console.log('✅ Conversas carregadas:', conversasData.length);
      setConversas(conversasData);
      setCarregando(false);

      // Atualizar conversa selecionada se existir
      if (conversaSelecionada) {
        const atualizada = conversasData.find(c => c.id === conversaSelecionada.id);
        if (atualizada) {
          setConversaSelecionada(atualizada);
        }
      }
    }, (error) => {
      console.error('❌ Erro ao carregar conversas:', error);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [isAdmin, isWebmasterUser, clienteIdsDoAdmin]);

  // Marcar mensagens como lidas quando abrir a conversa
  useEffect(() => {
    const marcarComoLidas = async () => {
      if (!conversaSelecionada) return;
      
      // Verificar se há mensagens não lidas do cliente
      const temNaoLidas = conversaSelecionada.respostas?.some(
        (r: any) => r.autor === 'Cliente' && !r.lidaPeloAdmin
      );
      
      if (temNaoLidas) {
        try {
          const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
          const respostasAtualizadas = conversaSelecionada.respostas.map((r: any) => 
            r.autor === 'Cliente' ? { ...r, lidaPeloAdmin: true } : r
          );
          
          await updateDoc(docRef, { respostas: respostasAtualizadas });
          console.log('✅ Mensagens marcadas como lidas');
        } catch (error) {
          console.error('❌ Erro ao marcar mensagens como lidas:', error);
        }
      }
      
      scrollToBottom();
      inputRef.current?.focus();
    };
    
    marcarComoLidas();
  }, [conversaSelecionada]);

  const handleEnviar = async () => {
    if (!novaMensagem.trim() || enviando || !conversaSelecionada) return;
    
    setEnviando(true);
    try {
      const novaResposta = {
        texto: novaMensagem.trim(),
        dataCriacao: new Date().toISOString(),
        autor: 'Admin'
      };

      const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
      const respostasExistentes = conversaSelecionada.respostas || [];
      
      await updateDoc(docRef, {
        respostas: [...respostasExistentes, novaResposta],
        ultimaResposta: new Date().toLocaleDateString('pt-BR')
      });

      // Notificar cliente
      if (conversaSelecionada.clienteId) {
        await notificarNovaMensagem(
          'cliente',  // destinatarioTipo
          conversaSelecionada.clienteId,  // destinatarioId
          'Equipe',
          novaMensagem.trim().substring(0, 50) + (novaMensagem.length > 50 ? '...' : ''),
          conversaSelecionada.id
        );
        console.log('🔔 Notificação enviada ao cliente');
      }

      setNovaMensagem('');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpar conversa (remove mensagens, mantém conversa)
  const handleLimparConversa = async () => {
    if (!conversaSelecionada) return;
    
    try {
      const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
      await updateDoc(docRef, { 
        respostas: [],
        ultimaResposta: null
      });
      
      setModalConfirmacao({ tipo: null });
      setMenuAberto(false);
      console.log('✅ Conversa limpa com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar conversa:', error);
      alert('Erro ao limpar conversa');
    }
  };

  // Encerrar conversa (marca como encerrada)
  const handleEncerrarConversa = async () => {
    if (!conversaSelecionada) return;
    
    try {
      const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
      
      // Adicionar mensagem do sistema
      const mensagemSistema = {
        texto: '📌 Conversa encerrada pela equipe.',
        dataCriacao: new Date().toISOString(),
        autor: 'Sistema'
      };
      
      await updateDoc(docRef, { 
        status: 'encerrada',
        dataEncerramento: new Date().toISOString(),
        respostas: [...(conversaSelecionada.respostas || []), mensagemSistema]
      });
      
      setModalConfirmacao({ tipo: null });
      setMenuAberto(false);
      setConversaSelecionada(null);
      console.log('✅ Conversa encerrada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao encerrar conversa:', error);
      alert('Erro ao encerrar conversa');
    }
  };

  // Excluir conversa permanentemente
  const handleExcluirConversa = async () => {
    if (!conversaSelecionada) return;
    
    try {
      const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
      await deleteDoc(docRef);
      
      setModalConfirmacao({ tipo: null });
      setMenuAberto(false);
      setConversaSelecionada(null);
      console.log('✅ Conversa excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir conversa:', error);
      alert('Erro ao excluir conversa');
    }
  };

  // Reabrir conversa encerrada
  const handleReabrirConversa = async () => {
    if (!conversaSelecionada) return;
    
    try {
      const docRef = doc(db, 'solicitacoes_clientes', conversaSelecionada.id);
      
      const mensagemSistema = {
        texto: '🔄 Conversa reaberta pela equipe.',
        dataCriacao: new Date().toISOString(),
        autor: 'Sistema'
      };
      
      await updateDoc(docRef, { 
        status: 'ativa',
        dataEncerramento: null,
        respostas: [...(conversaSelecionada.respostas || []), mensagemSistema]
      });
      
      setMenuAberto(false);
      console.log('✅ Conversa reaberta com sucesso');
    } catch (error) {
      console.error('❌ Erro ao reabrir conversa:', error);
      alert('Erro ao reabrir conversa');
    }
  };

  // Formatar data/hora
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    } else {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  // Agrupar mensagens por data
  const getMensagensAgrupadas = (respostas: any[]) => {
    const grupos: { [key: string]: any[] } = {};
    
    respostas.forEach((msg: any) => {
      const data = new Date(msg.dataCriacao);
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      
      let chave: string;
      if (data.toDateString() === hoje.toDateString()) {
        chave = 'Hoje';
      } else if (data.toDateString() === ontem.toDateString()) {
        chave = 'Ontem';
      } else {
        chave = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(msg);
    });
    
    return grupos;
  };

  // Filtrar conversas
  const conversasFiltradas = conversas.filter(c => {
    const matchBusca = c.nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
      c.titulo.toLowerCase().includes(busca.toLowerCase());
    
    // Filtrar por status
    if (mostrarEncerradas) {
      return matchBusca && c.status === 'encerrada';
    } else {
      return matchBusca && c.status !== 'encerrada';
    }
  });

  // Contagem de conversas ativas e encerradas
  const conversasAtivas = conversas.filter(c => c.status !== 'encerrada').length;
  const conversasEncerradas = conversas.filter(c => c.status === 'encerrada').length;

  // Total de mensagens não lidas
  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.naoLidas, 0);

  // Não renderizar se não for admin
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9998] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700' 
            : 'bg-[#25D366] hover:bg-[#128C7E]'
        }`}
        title="Chat com Clientes"
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white" />
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </>
        )}
      </button>

      {/* Janela do Chat - Estilo WhatsApp no canto */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[380px] h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          
          {!conversaSelecionada ? (
            // Lista de Conversas
            <>
              {/* Header Lista */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">Mensagens de Clientes</h3>
                  <p className="text-xs text-green-100">
                    {conversasAtivas} ativa{conversasAtivas !== 1 ? 's' : ''} | {conversasEncerradas} encerrada{conversasEncerradas !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-y-2">
                {/* Tabs Ativas/Encerradas */}
                <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
                  <button
                    onClick={() => setMostrarEncerradas(false)}
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-colors ${
                      !mostrarEncerradas 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Ativas ({conversasAtivas})
                  </button>
                  <button
                    onClick={() => setMostrarEncerradas(true)}
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-colors ${
                      mostrarEncerradas 
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Encerradas ({conversasEncerradas})
                  </button>
                </div>

                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar conversa..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto">
                {carregando ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : conversasFiltradas.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  conversasFiltradas.map((conversa) => (
                    <div
                      key={conversa.id}
                      onClick={() => setConversaSelecionada(conversa)}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
                        conversa.naoLidas > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                      } ${conversa.status === 'encerrada' ? 'opacity-70' : ''}`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        conversa.status === 'encerrada' ? 'bg-gray-400' : 'bg-[#075E54]'
                      }`}>
                        {conversa.nomeCliente.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {conversa.nomeCliente}
                            </h4>
                            {conversa.status === 'encerrada' && (
                              <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                Encerrada
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {conversa.dataUltimaMensagem ? formatarData(conversa.dataUltimaMensagem) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {conversa.ultimaMensagem || conversa.titulo}
                          </p>
                          {conversa.naoLidas > 0 && (
                            <span className="ml-2 w-5 h-5 bg-[#25D366] rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {conversa.naoLidas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // Chat Aberto
            <>
              {/* Header do Chat */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setConversaSelecionada(null)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  conversaSelecionada.status === 'encerrada' ? 'bg-gray-400' : 'bg-white/20'
                }`}>
                  {conversaSelecionada.nomeCliente.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{conversaSelecionada.nomeCliente}</h3>
                    {conversaSelecionada.status === 'encerrada' && (
                      <span className="text-[10px] bg-red-500/30 text-red-100 px-1.5 py-0.5 rounded">
                        Encerrada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-100">{conversaSelecionada.titulo}</p>
                </div>
                
                {/* Menu de Opções */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuAberto(!menuAberto)}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  
                  {menuAberto && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {conversaSelecionada.status === 'encerrada' ? (
                        <>
                          <button
                            onClick={handleReabrirConversa}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Reabrir conversa
                          </button>
                          <button
                            onClick={() => setModalConfirmacao({ tipo: 'excluir', conversaId: conversaSelecionada.id })}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir permanente
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setModalConfirmacao({ tipo: 'limpar', conversaId: conversaSelecionada.id })}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Limpar mensagens
                          </button>
                          <button
                            onClick={() => setModalConfirmacao({ tipo: 'encerrar', conversaId: conversaSelecionada.id })}
                            className="w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Encerrar conversa
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => setModalConfirmacao({ tipo: 'excluir', conversaId: conversaSelecionada.id })}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir permanente
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mensagens */}
              <div 
                className="flex-1 overflow-y-auto p-3 space-y-2"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundColor: '#f8f9fa' }}
              >
                {conversaSelecionada.respostas.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  Object.entries(getMensagensAgrupadas(conversaSelecionada.respostas)).map(([data, msgs]) => (
                    <div key={data}>
                      {/* Separador de Data */}
                      <div className="flex items-center justify-center my-3">
                        <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                          {data}
                        </span>
                      </div>
                      
                      {/* Mensagens do dia */}
                      {msgs.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex ${msg.autor === 'Admin' ? 'justify-end' : 'justify-start'} mb-1`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                              msg.autor === 'Admin'
                                ? 'bg-[#DCF8C6] dark:bg-[#025C4C] text-gray-900 dark:text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                            }`}
                          >
                            {msg.autor === 'Cliente' && (
                              <p className="text-xs font-semibold text-[#075E54] dark:text-[#25D366] mb-0.5">
                                {conversaSelecionada.nomeCliente}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                            <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                              msg.autor === 'Admin' ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400'
                            }`}>
                              <span className="text-[10px]">
                                {new Date(msg.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.autor === 'Admin' && (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {conversaSelecionada.status === 'encerrada' ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Conversa encerrada</span>
                    <button
                      onClick={handleReabrirConversa}
                      className="text-sm text-green-600 dark:text-green-400 hover:underline ml-2"
                    >
                      Reabrir
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] border border-gray-200 dark:border-gray-600"
                      disabled={enviando}
                    />
                    <button
                      onClick={handleEnviar}
                      disabled={!novaMensagem.trim() || enviando}
                      className="w-10 h-10 bg-[#25D366] hover:bg-[#128C7E] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                      {enviando ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalConfirmacao.tipo && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                modalConfirmacao.tipo === 'excluir' 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : modalConfirmacao.tipo === 'encerrar'
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  modalConfirmacao.tipo === 'excluir' 
                    ? 'text-red-600 dark:text-red-400' 
                    : modalConfirmacao.tipo === 'encerrar'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {modalConfirmacao.tipo === 'excluir' && 'Excluir Conversa'}
                  {modalConfirmacao.tipo === 'encerrar' && 'Encerrar Conversa'}
                  {modalConfirmacao.tipo === 'limpar' && 'Limpar Mensagens'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {modalConfirmacao.tipo === 'excluir' && 'Esta ação não pode ser desfeita.'}
                  {modalConfirmacao.tipo === 'encerrar' && 'O cliente será notificado.'}
                  {modalConfirmacao.tipo === 'limpar' && 'Todas as mensagens serão removidas.'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              {modalConfirmacao.tipo === 'excluir' && 'Tem certeza que deseja excluir permanentemente esta conversa? Todo o histórico será perdido.'}
              {modalConfirmacao.tipo === 'encerrar' && 'Tem certeza que deseja encerrar esta conversa? Você poderá reabri-la depois.'}
              {modalConfirmacao.tipo === 'limpar' && 'Tem certeza que deseja limpar todas as mensagens desta conversa? O histórico será apagado.'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfirmacao({ tipo: null })}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (modalConfirmacao.tipo === 'excluir') handleExcluirConversa();
                  if (modalConfirmacao.tipo === 'encerrar') handleEncerrarConversa();
                  if (modalConfirmacao.tipo === 'limpar') handleLimparConversa();
                }}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  modalConfirmacao.tipo === 'excluir' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : modalConfirmacao.tipo === 'encerrar'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {modalConfirmacao.tipo === 'excluir' && 'Excluir'}
                {modalConfirmacao.tipo === 'encerrar' && 'Encerrar'}
                {modalConfirmacao.tipo === 'limpar' && 'Limpar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatGlobalAdmin;

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
  RefreshCw
} from 'lucide-react';
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notificarNovaMensagem } from '../services/notificacoes';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Verificar se é admin - usando useEffect para evitar problemas com hooks
  useEffect(() => {
    const verificarSeAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

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
        localStorage.getItem('userRole') === 'webmaster';
      
      // Verificar também na coleção admins do Firestore (por UID)
      if (!adminCheck && user.uid) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            adminCheck = true;
            console.log('✅ Usuário encontrado na coleção admins (UID)');
          }
        } catch (error) {
          console.log('⚠️ Erro ao verificar coleção admins:', error);
        }
      }
      
      console.log('🔐 ChatGlobalAdmin - User:', user?.email, '| isAdmin:', adminCheck);
      setIsAdmin(adminCheck);
    };

    verificarSeAdmin();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar conversas do Firestore em tempo real
  useEffect(() => {
    if (!isAdmin) return;

    console.log('🔍 Carregando conversas para o admin...');
    setCarregando(true);

    const colRef = collection(db, 'solicitacoes_clientes');

    const unsubscribe = onSnapshot(colRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const conversasData: Conversa[] = [];
      
      snapshot.forEach((snapDoc: QueryDocumentSnapshot<DocumentData>) => {
        const data = snapDoc.data();
        const respostas = data.respostas || [];
        const ultimaResposta = respostas.length > 0 ? respostas[respostas.length - 1] : null;
        const naoLidas = respostas.filter((r: any) => r.autor === 'Cliente' && !r.lidaPeloAdmin).length;
        
        conversasData.push({
          id: snapDoc.id,
          nomeCliente: data.nomeCliente || 'Cliente',
          titulo: data.titulo || data.servicoTitulo || 'Solicitação',
          ultimaMensagem: ultimaResposta?.texto?.substring(0, 50) + (ultimaResposta?.texto?.length > 50 ? '...' : ''),
          dataUltimaMensagem: ultimaResposta?.dataCriacao || data.dataSolicitacao,
          naoLidas,
          respostas,
          clienteId: data.clienteId
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
    }, (error: FirestoreError) => {
      console.error('❌ Erro ao carregar conversas:', error);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

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
  const conversasFiltradas = conversas.filter(c =>
    c.nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
    c.titulo.toLowerCase().includes(busca.toLowerCase())
  );

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
                  <p className="text-xs text-purple-100">
                    {conversas.length} conversa{conversas.length !== 1 ? 's' : ''} ativa{conversas.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Busca */}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar conversa..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      }`}
                    >
                      <div className="w-11 h-11 bg-[#075E54] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {conversa.nomeCliente.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {conversa.nomeCliente}
                          </h4>
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
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {conversaSelecionada.nomeCliente.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{conversaSelecionada.nomeCliente}</h3>
                  <p className="text-xs text-purple-100">{conversaSelecionada.titulo}</p>
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
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatGlobalAdmin;

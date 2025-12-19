import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  Users,
  Search
} from 'lucide-react';

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
}

interface ChatWhatsAppAdminProps {
  conversas: Conversa[];
  onEnviarMensagem: (conversaId: string, texto: string) => Promise<void>;
  onAtualizarConversas?: () => void;
}

const ChatWhatsAppAdmin: React.FC<ChatWhatsAppAdminProps> = ({
  conversas,
  onEnviarMensagem,
  onAtualizarConversas
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (conversaSelecionada) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [conversaSelecionada]);

  // Atualizar conversa selecionada quando conversas mudam
  useEffect(() => {
    if (conversaSelecionada) {
      const atualizada = conversas.find(c => c.id === conversaSelecionada.id);
      if (atualizada) {
        setConversaSelecionada(atualizada);
      }
    }
  }, [conversas]);

  const handleEnviar = async () => {
    if (!novaMensagem.trim() || enviando || !conversaSelecionada) return;
    
    setEnviando(true);
    try {
      await onEnviarMensagem(conversaSelecionada.id, novaMensagem.trim());
      setNovaMensagem('');
      onAtualizarConversas?.();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  const formatarHora = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) {
      return 'Hoje';
    } else if (data.toDateString() === ontem.toDateString()) {
      return 'Ontem';
    } else {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const formatarDataCurta = (dataString?: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    const hoje = new Date();
    
    if (data.toDateString() === hoje.toDateString()) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Agrupar mensagens por data
  const getMensagensAgrupadas = (respostas: any[]) => {
    const mensagens = respostas.map((resp, index) => ({
      id: `msg-${index}`,
      texto: resp.texto,
      autor: resp.autor === 'Admin' ? 'Admin' : resp.autor === 'Sistema' ? 'Sistema' : 'Cliente',
      dataCriacao: resp.dataCriacao,
      lida: true
    })) as Mensagem[];

    return mensagens.reduce((acc, msg) => {
      const data = formatarData(msg.dataCriacao);
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(msg);
      return acc;
    }, {} as Record<string, Mensagem[]>);
  };

  // Filtrar conversas pela busca
  const conversasFiltradas = conversas.filter(c => 
    c.nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
    c.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  // Total de mensagens não lidas
  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.naoLidas, 0);

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9998] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700' 
            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
        }`}
      >
        {isOpen ? (
          <ChevronDown className="w-7 h-7 text-white" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white" />
            {totalNaoLidas > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
              </span>
            )}
          </>
        )}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[400px] h-[550px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 duration-300">
          
          {!conversaSelecionada ? (
            // Lista de Conversas
            <>
              {/* Header Lista */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">Conversas com Clientes</h3>
                  <p className="text-xs text-green-100">
                    {conversas.length} conversa{conversas.length !== 1 ? 's' : ''} ativa{conversas.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
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
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto">
                {conversasFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="font-medium">Nenhuma conversa</p>
                    <p className="text-sm text-center">
                      {busca ? 'Nenhum resultado encontrado' : 'As conversas com clientes aparecerão aqui'}
                    </p>
                  </div>
                ) : (
                  conversasFiltradas.map((conversa) => (
                    <button
                      key={conversa.id}
                      onClick={() => setConversaSelecionada(conversa)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {conversa.nomeCliente.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {conversa.naoLidas > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {conversa.naoLidas}
                          </span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {conversa.nomeCliente}
                          </h4>
                          <span className="text-[10px] text-gray-500 ml-2 shrink-0">
                            {formatarDataCurta(conversa.dataUltimaMensagem)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{conversa.titulo}</p>
                        {conversa.ultimaMensagem && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {conversa.ultimaMensagem}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            // Chat Individual
            <>
              {/* Header do Chat */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setConversaSelecionada(null)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {conversaSelecionada.nomeCliente.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{conversaSelecionada.nomeCliente}</h3>
                  <p className="text-xs text-green-100 truncate">{conversaSelecionada.titulo}</p>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Área de Mensagens */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ 
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  backgroundColor: '#e5ddd5'
                }}
              >
                {conversaSelecionada.respostas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-sm">Inicie a conversa com o cliente</p>
                  </div>
                ) : (
                  Object.entries(getMensagensAgrupadas(conversaSelecionada.respostas)).map(([data, msgs]) => (
                    <div key={data}>
                      {/* Separador de Data */}
                      <div className="flex justify-center mb-3">
                        <span className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 text-xs rounded-full shadow-sm">
                          {data}
                        </span>
                      </div>
                      
                      {/* Mensagens do dia */}
                      {msgs.map((msg) => {
                        const isMinhaMsg = msg.autor === 'Admin';
                        const isSistema = msg.autor === 'Sistema';
                        
                        if (isSistema) {
                          return (
                            <div key={msg.id} className="flex justify-center mb-2">
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg">
                                {msg.texto}
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex mb-2 ${isMinhaMsg ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`relative max-w-[80%] px-3 py-2 rounded-lg shadow-sm ${
                                isMinhaMsg
                                  ? 'bg-green-100 dark:bg-green-900/50 text-gray-800 dark:text-gray-100 rounded-br-none'
                                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                              }`}
                            >
                              {!isMinhaMsg && (
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                  {conversaSelecionada.nomeCliente}
                                </p>
                              )}
                              
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                              
                              <div className={`flex items-center gap-1 mt-1 ${isMinhaMsg ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {formatarHora(msg.dataCriacao)}
                                </span>
                                {isMinhaMsg && (
                                  msg.lida 
                                    ? <CheckCheck className="w-3 h-3 text-blue-500" />
                                    : <Check className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              
                              <div
                                className={`absolute bottom-0 w-3 h-3 ${
                                  isMinhaMsg
                                    ? '-right-1 bg-green-100 dark:bg-green-900/50'
                                    : '-left-1 bg-white dark:bg-gray-700'
                                }`}
                                style={{
                                  clipPath: isMinhaMsg 
                                    ? 'polygon(0 0, 100% 100%, 0 100%)' 
                                    : 'polygon(100% 0, 100% 100%, 0 100%)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700">
                <input
                  ref={inputRef}
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma mensagem..."
                  disabled={enviando}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
                
                <button
                  onClick={handleEnviar}
                  disabled={!novaMensagem.trim() || enviando}
                  className={`p-2 rounded-full transition-all ${
                    novaMensagem.trim() && !enviando
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {enviando ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWhatsAppAdmin;

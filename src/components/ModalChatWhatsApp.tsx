import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check,
  CheckCheck,
  MessageCircle
} from 'lucide-react';

interface Mensagem {
  id: string;
  texto: string;
  autor: 'Cliente' | 'Admin' | 'Sistema';
  dataCriacao: string;
  lida?: boolean;
}

interface ModalChatWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  mensagens: Mensagem[];
  onEnviarMensagem: (texto: string) => Promise<void>;
  nomeCliente: string;
  fotoCliente?: string;
  solicitacaoTitulo?: string;
}

const ModalChatWhatsApp: React.FC<ModalChatWhatsAppProps> = ({
  isOpen,
  onClose,
  mensagens,
  onEnviarMensagem,
  nomeCliente,
  fotoCliente,
  solicitacaoTitulo
}) => {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, mensagens]);

  const handleEnviar = async () => {
    if (!novaMensagem.trim() || enviando) return;
    
    setEnviando(true);
    try {
      await onEnviarMensagem(novaMensagem.trim());
      setNovaMensagem('');
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

  // Agrupar mensagens por data
  const mensagensAgrupadas = mensagens.reduce((acc, msg) => {
    const data = formatarData(msg.dataCriacao);
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(msg);
    return acc;
  }, {} as Record<string, Mensagem[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
        
        {/* Header do Chat - Estilo WhatsApp */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 px-4 py-3 flex items-center gap-3">
          <div className="relative">
            {fotoCliente ? (
              <img 
                src={fotoCliente} 
                alt={nomeCliente}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {nomeCliente.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-green-600 bg-green-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">{nomeCliente}</h3>
            {solicitacaoTitulo && (
              <p className="text-xs text-green-100 truncate">
                {solicitacaoTitulo}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
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
          {mensagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm text-center mt-1">
                Inicie a conversa com o cliente
              </p>
            </div>
          ) : (
            Object.entries(mensagensAgrupadas).map(([data, msgs]) => (
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
                        {/* Nome do autor (se for do cliente) */}
                        {!isMinhaMsg && (
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            {nomeCliente}
                          </p>
                        )}
                        
                        {/* Texto da mensagem */}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                        
                        {/* Hora e status */}
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
                        
                        {/* Triangulo da bolha */}
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
      </div>
    </div>
  );
};

export default ModalChatWhatsApp;

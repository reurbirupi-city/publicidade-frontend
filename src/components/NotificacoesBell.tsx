import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  MessageSquare, 
  FileText, 
  Briefcase,
  DollarSign,
  Clock,
  AlertCircle,
  Plus,
  UserPlus
} from 'lucide-react';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import { Notificacao, getNotificacaoColor, formatarDataRelativa, criarNotificacao } from '../services/notificacoes';

// ============================================================================
// COMPONENTE PRINCIPAL - SINO DE NOTIFICAÇÕES
// ============================================================================

const NotificacoesBell: React.FC = () => {
  const navigate = useNavigate();
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas, loading, isAdmin } = useNotificacoes();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Função de teste para criar notificação de admin
  const criarNotificacaoTeste = async () => {
    try {
      await criarNotificacao({
        tipo: 'nova_solicitacao',
        titulo: '🧪 Teste - Nova Solicitação',
        mensagem: 'Esta é uma notificação de teste para o admin',
        destinatarioTipo: 'admin',
        destinatarioId: 'admin',
        remetenteNome: 'Sistema de Teste',
        referenciaId: 'teste-' + Date.now(),
        referenciaTipo: 'solicitacao',
        link: '/solicitacoes',
        icone: '🧪',
        prioridade: 'alta'
      });
      console.log('✅ Notificação de teste criada!');
      alert('Notificação de teste criada! Atualize a página.');
    } catch (error) {
      console.error('❌ Erro ao criar notificação de teste:', error);
      alert('Erro ao criar notificação: ' + error);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular posição do dropdown (portal + fixed evita overflow/z-index issues)
  useEffect(() => {
    if (!isOpen) {
      setDropdownPos(null);
      return;
    }

    const updatePos = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const panelWidth = 384; // w-96
      const margin = 8;
      const desiredLeft = rect.right - panelWidth;
      const left = Math.min(
        Math.max(desiredLeft, margin),
        Math.max(margin, window.innerWidth - panelWidth - margin)
      );
      const top = rect.bottom + margin;

      setDropdownPos({ top, left });
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen]);

  // Ícone baseado no tipo
  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'novo_cliente':
        return <UserPlus className="w-4 h-4" />;
      case 'nova_solicitacao':
      case 'proposta_enviada':
      case 'proposta_aceita':
        return <FileText className="w-4 h-4" />;
      case 'nova_mensagem':
        return <MessageSquare className="w-4 h-4" />;
      case 'projeto_criado':
      case 'projeto_atualizado':
      case 'aguardando_aprovacao':
      case 'projeto_aprovado':
      case 'projeto_concluido':
        return <Briefcase className="w-4 h-4" />;
      case 'contrato_disponivel':
      case 'contrato_assinado':
        return <FileText className="w-4 h-4" />;
      case 'pagamento_recebido':
        return <DollarSign className="w-4 h-4" />;
      case 'lembrete_prazo':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Handler para clicar em notificação
  const handleNotificacaoClick = async (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      await marcarLida(notificacao.id);
    }
    
    if (notificacao.link) {
      navigate(notificacao.link);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge de contagem */}
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && dropdownPos && createPortal(
        <div
          className="fixed inset-0 z-[2147483647]"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="absolute w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Notificações</h3>
              {naoLidas > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                  {naoLidas} novas
                </span>
              )}
            </div>
            
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Nenhuma notificação</p>
                <p className="text-sm">Você está em dia! 🎉</p>
                
                {/* Botão de teste - apenas para debug */}
                {isAdmin && (
                  <button
                    onClick={criarNotificacaoTeste}
                    className="mt-4 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Criar Notificação Teste
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notificacoes.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                      notificacao.lida 
                        ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                        : 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    {/* Ícone */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificacaoColor(notificacao.tipo)}`}>
                      {notificacao.icone ? (
                        <span className="text-lg">{notificacao.icone}</span>
                      ) : (
                        getIcone(notificacao.tipo)
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${
                          notificacao.lida 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notificacao.titulo}
                        </p>
                        {!notificacao.lida && (
                          <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      
                      <p className={`text-sm mt-0.5 line-clamp-2 ${
                        notificacao.lida 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {notificacao.mensagem}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatarDataRelativa(notificacao.criadaEm)}
                        </span>
                        {notificacao.remetenteNome && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {notificacao.remetenteNome}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificacoes.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Poderia navegar para página de todas as notificações
                }}
                className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificacoesBell;

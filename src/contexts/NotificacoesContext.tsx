import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  Notificacao, 
  escutarNotificacoes, 
  marcarComoLida, 
  marcarTodasComoLidas,
  DestinatarioTipo
} from '../services/notificacoes';

// ============================================================================
// TIPOS
// ============================================================================

interface NotificacoesContextData {
  notificacoes: Notificacao[];
  naoLidas: number;
  loading: boolean;
  marcarLida: (id: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
  isAdmin: boolean;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const NotificacoesContext = createContext<NotificacoesContextData>({} as NotificacoesContextData);

// ============================================================================
// PROVIDER
// ============================================================================

export const NotificacoesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Determinar se é admin (baseado no email ou role)
  // Lista de emails de admin - adicione os emails dos administradores aqui
  const emailsAdmin = [
    'admin@agencia.com',
    'admin@admin.com',
    'reurbirupi@gmail.com',
    'tributacao.irupi@gmail.com', // Email do admin
  ];
  
  const isAdmin = user?.email ? (
    emailsAdmin.some(email => user.email?.toLowerCase() === email.toLowerCase()) ||
    user.email.toLowerCase().includes('admin') ||
    localStorage.getItem('userRole') === 'admin'
  ) : false;

  // Tipo e ID do destinatário
  const destinatarioTipo: DestinatarioTipo = isAdmin ? 'admin' : 'cliente';
  const destinatarioId = isAdmin ? 'admin' : (user?.uid || '');

  // Debug: log para verificar identificação
  console.log('🔐 NotificacoesContext - User:', user?.email, '| isAdmin:', isAdmin, '| destinatarioTipo:', destinatarioTipo, '| destinatarioId:', destinatarioId);

  // Escutar notificações em tempo real
  useEffect(() => {
    if (!user) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = escutarNotificacoes(
      destinatarioTipo,
      destinatarioId,
      (novasNotificacoes) => {
        setNotificacoes(novasNotificacoes);
        setLoading(false);
        
        // Tocar som para novas notificações não lidas (opcional)
        const naoLidasAntes = notificacoes.filter(n => !n.lida).length;
        const naoLidasAgora = novasNotificacoes.filter(n => !n.lida).length;
        
        if (naoLidasAgora > naoLidasAntes && naoLidasAntes > 0) {
          // Nova notificação recebida - poderia tocar som aqui
          console.log('🔔 Nova notificação recebida!');
        }
      }
    );

    return () => unsubscribe();
  }, [user, destinatarioTipo, destinatarioId]);

  // Contar não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Marcar uma como lida
  const marcarLida = useCallback(async (id: string) => {
    await marcarComoLida(id);
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n)
    );
  }, []);

  // Marcar todas como lidas
  const marcarTodasLidas = useCallback(async () => {
    await marcarTodasComoLidas(destinatarioTipo, destinatarioId);
    setNotificacoes(prev => 
      prev.map(n => ({ ...n, lida: true, lidaEm: new Date().toISOString() }))
    );
  }, [destinatarioTipo, destinatarioId]);

  return (
    <NotificacoesContext.Provider 
      value={{ 
        notificacoes, 
        naoLidas, 
        loading, 
        marcarLida, 
        marcarTodasLidas,
        isAdmin
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useNotificacoes = () => {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  }
  return context;
};

export default NotificacoesContext;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  Notificacao, 
  escutarNotificacoes, 
  marcarComoLida, 
  marcarTodasComoLidas,
  DestinatarioTipo
} from '../services/notificacoes';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  const isDev = import.meta.env.DEV;
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWebmaster, setIsWebmaster] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  
  // Lista de emails de webmaster (super admin)
  const emailsWebmaster = [
    'admin@agencia.com',
    'admin@admin.com',
    'reurbirupi@gmail.com',
    'tributacao.irupi@gmail.com' // Webmaster principal
  ];

  // Verificar se é admin consultando a coleção admins no Firestore
  useEffect(() => {
    const verificarAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        setIsWebmaster(false);
        setAdminChecked(true);
        return;
      }

      // Verificar webmaster por email
      const isWeb = emailsWebmaster.some(email => 
        user.email?.toLowerCase() === email.toLowerCase()
      );
      setIsWebmaster(isWeb);

      if (isWeb) {
        setIsAdmin(true);
        setAdminChecked(true);
        if (isDev) console.log('✅ NotificacoesContext - Webmaster identificado:', user.email);
        return;
      }

      // Verificar se está na coleção admins do Firestore
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
          if (isDev) console.log('✅ NotificacoesContext - Admin identificado via Firestore:', user.email);
        } else {
          setIsAdmin(false);
          if (isDev) console.log('👤 NotificacoesContext - Cliente identificado:', user.email);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar admin:', error);
        setIsAdmin(false);
      }
      
      setAdminChecked(true);
    };

    verificarAdmin();
  }, [user?.uid, user?.email]);

  // Tipo e ID do destinatário (calculado após verificação de admin)
  const destinatarioTipo: DestinatarioTipo = (isWebmaster || isAdmin) ? 'admin' : 'cliente';
  const destinatarioId = isWebmaster ? 'webmaster' : (user?.uid || '');

  // Debug: log para verificar identificação
  useEffect(() => {
    if (adminChecked) {
      if (isDev) {
        console.log(
          '🔐 NotificacoesContext - User:',
          user?.email,
          '| isWebmaster:',
          isWebmaster,
          '| isAdmin:',
          isAdmin,
          '| destinatarioTipo:',
          destinatarioTipo,
          '| destinatarioId:',
          destinatarioId
        );
      }
    }
  }, [adminChecked, user?.email, isWebmaster, isAdmin, destinatarioTipo, destinatarioId]);

  // Escutar notificações em tempo real
  useEffect(() => {
    if (!user || !adminChecked) {
      setNotificacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (isDev) console.log('🔔 NotificacoesContext - Iniciando listener para:', destinatarioTipo, destinatarioId);
    
    const unsubscribe = escutarNotificacoes(
      destinatarioTipo,
      destinatarioId,
      (novasNotificacoes) => {
        setNotificacoes(novasNotificacoes);
        setLoading(false);

        // Log de debug
        if (isDev) console.log('📥 NotificacoesContext - Recebidas:', novasNotificacoes.length, 'notificações');
      }
    );

    return () => unsubscribe();
  }, [user, adminChecked, destinatarioTipo, destinatarioId]);

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
        isAdmin: isAdmin || isWebmaster  // Webmaster também é considerado admin para UI
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de usuário
export type UserType = 'admin' | 'cliente';

// Interface para cada instrução
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  page?: string; // Página específica onde mostrar (opcional)
  userType: UserType | 'both';
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';
}

// Instruções para Admin
const adminTutorials: TutorialStep[] = [
  {
    id: 'admin-welcome',
    title: '👋 Bem-vindo ao Sistema!',
    description: 'Este é seu painel de gestão completo. Aqui você pode gerenciar clientes, projetos, finanças e muito mais. Navegue pelo menu lateral para explorar todas as funcionalidades.',
    icon: '🎉',
    page: 'dashboard',
    userType: 'admin',
    color: 'yellow'
  },
  {
    id: 'admin-crm',
    title: '👥 Gestão de Clientes (CRM)',
    description: 'Cadastre e gerencie seus clientes. Você pode gerar links de convite únicos para que novos clientes se cadastrem automaticamente vinculados a você.',
    icon: '📋',
    page: 'crm',
    userType: 'admin',
    color: 'blue'
  },
  {
    id: 'admin-invite',
    title: '🔗 Links de Convite',
    description: 'Clique em "Gerar Link de Convite" para criar um código único. Compartilhe o link com seu cliente e ele será cadastrado automaticamente no sistema.',
    icon: '✉️',
    page: 'crm',
    userType: 'admin',
    color: 'pink'
  },
  {
    id: 'admin-projetos',
    title: '📁 Gerenciando Projetos',
    description: 'Crie e acompanhe projetos para seus clientes. Defina status, prazos e mantenha tudo organizado em um só lugar.',
    icon: '📊',
    page: 'projetos',
    userType: 'admin',
    color: 'green'
  },
  {
    id: 'admin-social',
    title: '📱 Social Media',
    description: 'Gerencie conteúdos para redes sociais. Crie posts, agende publicações e organize sua estratégia de conteúdo.',
    icon: '📲',
    page: 'social-media',
    userType: 'admin',
    color: 'purple'
  },
  {
    id: 'admin-agenda',
    title: '📅 Agenda de Compromissos',
    description: 'Organize seus compromissos, reuniões e prazos. Visualize tudo em um calendário intuitivo e nunca perca uma data importante.',
    icon: '🗓️',
    page: 'agenda',
    userType: 'admin',
    color: 'orange'
  },
  {
    id: 'admin-financeiro',
    title: '💰 Controle Financeiro',
    description: 'Acompanhe receitas e despesas. Tenha uma visão clara da saúde financeira do seu negócio com gráficos e relatórios.',
    icon: '📈',
    page: 'financeiro',
    userType: 'admin',
    color: 'green'
  },
  {
    id: 'admin-portfolio',
    title: '🎨 Portfólio',
    description: 'Adicione seus melhores trabalhos ao portfólio. Mostre suas criações e compartilhe com potenciais clientes.',
    icon: '🖼️',
    page: 'portfolio',
    userType: 'admin',
    color: 'pink'
  },
  {
    id: 'admin-servicos',
    title: '🛠️ Serviços',
    description: 'Cadastre os serviços que você oferece com preços e descrições. Facilite a contratação pelos seus clientes.',
    icon: '⚙️',
    page: 'servicos',
    userType: 'admin',
    color: 'blue'
  },
  {
    id: 'admin-solicitacoes',
    title: '📬 Solicitações de Clientes',
    description: 'Visualize e gerencie as solicitações enviadas pelos seus clientes. Aprove, recuse ou responda diretamente por aqui.',
    icon: '📥',
    page: 'solicitacoes',
    userType: 'admin',
    color: 'yellow'
  }
];

// Instruções para Cliente
const clienteTutorials: TutorialStep[] = [
  {
    id: 'cliente-welcome',
    title: '👋 Bem-vindo ao Portal!',
    description: 'Este é seu portal exclusivo de cliente. Aqui você pode acompanhar seus projetos, visualizar o portfólio e fazer solicitações.',
    icon: '🎉',
    page: 'portal',
    userType: 'cliente',
    color: 'yellow'
  },
  {
    id: 'cliente-projetos',
    title: '📁 Seus Projetos',
    description: 'Acompanhe o andamento dos seus projetos. Veja o status, prazos e detalhes de cada trabalho sendo desenvolvido para você.',
    icon: '📊',
    page: 'portal',
    userType: 'cliente',
    color: 'blue'
  },
  {
    id: 'cliente-solicitacoes',
    title: '📝 Fazer Solicitações',
    description: 'Precisa de algo? Use o botão "Nova Solicitação" para enviar pedidos, alterações ou dúvidas diretamente para sua equipe.',
    icon: '✍️',
    page: 'portal',
    userType: 'cliente',
    color: 'pink'
  },
  {
    id: 'cliente-portfolio',
    title: '🎨 Portfólio',
    description: 'Explore os trabalhos realizados. Inspire-se com criações anteriores e veja o padrão de qualidade que você pode esperar.',
    icon: '🖼️',
    page: 'portal',
    userType: 'cliente',
    color: 'purple'
  },
  {
    id: 'cliente-contato',
    title: '💬 Comunicação',
    description: 'Mantenha contato fácil com sua equipe. Todas as solicitações e respostas ficam registradas para seu acompanhamento.',
    icon: '📞',
    page: 'portal',
    userType: 'cliente',
    color: 'green'
  }
];

interface TutorialContextType {
  // Estado
  showTutorial: boolean;
  currentSteps: TutorialStep[];
  viewedSteps: string[];
  tutorialEnabled: boolean;
  
  // Ações
  setUserType: (type: UserType) => void;
  markStepAsViewed: (stepId: string) => void;
  resetTutorial: () => void;
  toggleTutorialEnabled: (enabled: boolean) => void;
  getStepsForPage: (page: string) => TutorialStep[];
  dismissStep: (stepId: string) => void;
  showAllTutorials: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'tutorial_preferences';

interface TutorialPreferences {
  viewedSteps: string[];
  tutorialEnabled: boolean;
  userType: UserType | null;
}

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userType, setUserTypeState] = useState<UserType | null>(null);
  const [viewedSteps, setViewedSteps] = useState<string[]>([]);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [currentSteps, setCurrentSteps] = useState<TutorialStep[]>([]);

  // Carregar preferências do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs: TutorialPreferences = JSON.parse(saved);
        setViewedSteps(prefs.viewedSteps || []);
        setTutorialEnabled(prefs.tutorialEnabled !== false);
        if (prefs.userType) {
          setUserTypeState(prefs.userType);
        }
      } catch (e) {
        console.error('Erro ao carregar preferências de tutorial:', e);
      }
    }
  }, []);

  // Salvar preferências no localStorage
  const savePreferences = (prefs: Partial<TutorialPreferences>) => {
    const current = localStorage.getItem(STORAGE_KEY);
    const existing: TutorialPreferences = current ? JSON.parse(current) : {
      viewedSteps: [],
      tutorialEnabled: true,
      userType: null
    };
    const updated = { ...existing, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Definir tipo de usuário
  const setUserType = (type: UserType) => {
    setUserTypeState(type);
    const tutorials = type === 'admin' ? adminTutorials : clienteTutorials;
    setCurrentSteps(tutorials);
    savePreferences({ userType: type });
  };

  // Marcar passo como visualizado
  const markStepAsViewed = (stepId: string) => {
    if (!viewedSteps.includes(stepId)) {
      const updated = [...viewedSteps, stepId];
      setViewedSteps(updated);
      savePreferences({ viewedSteps: updated });
    }
  };

  // Dispensar um passo (marcar como visualizado)
  const dismissStep = (stepId: string) => {
    markStepAsViewed(stepId);
  };

  // Resetar tutorial (mostrar todos novamente)
  const resetTutorial = () => {
    setViewedSteps([]);
    savePreferences({ viewedSteps: [] });
  };

  // Mostrar todos os tutoriais novamente
  const showAllTutorials = () => {
    setViewedSteps([]);
    setTutorialEnabled(true);
    savePreferences({ viewedSteps: [], tutorialEnabled: true });
  };

  // Habilitar/desabilitar tutorial
  const toggleTutorialEnabled = (enabled: boolean) => {
    setTutorialEnabled(enabled);
    savePreferences({ tutorialEnabled: enabled });
  };

  // Obter passos para uma página específica
  const getStepsForPage = (page: string): TutorialStep[] => {
    if (!tutorialEnabled || !userType) return [];
    
    const tutorials = userType === 'admin' ? adminTutorials : clienteTutorials;
    
    return tutorials.filter(step => {
      // Filtrar por página
      if (step.page && step.page !== page) return false;
      
      // Filtrar passos já visualizados
      if (viewedSteps.includes(step.id)) return false;
      
      // Filtrar por tipo de usuário
      if (step.userType !== 'both' && step.userType !== userType) return false;
      
      return true;
    });
  };

  const showTutorial = tutorialEnabled && userType !== null;

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        currentSteps,
        viewedSteps,
        tutorialEnabled,
        setUserType,
        markStepAsViewed,
        resetTutorial,
        toggleTutorialEnabled,
        getStepsForPage,
        dismissStep,
        showAllTutorials
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

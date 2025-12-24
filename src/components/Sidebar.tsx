import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  Megaphone,
  Image,
  Package,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificacoes } from '../contexts/NotificacoesContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  gradient: string;
  description: string;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { notificacoes } = useNotificacoes();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'agenda',
      label: 'Command Center',
      icon: Calendar,
      path: '/agenda',
      badge: notificacoes.filter(n => !n.lida && n.tipo === 'lembrete_prazo').length || undefined,
      gradient: 'from-orange-500 to-red-500',
      description: 'Sua central de comando'
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Users,
      path: '/crm',
      badge: notificacoes.filter(n => !n.lida && n.tipo === 'novo_cliente').length || undefined,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Gestão de clientes'
    },
    {
      id: 'projetos',
      label: 'Projetos',
      icon: Briefcase,
      path: '/projetos',
      badge: notificacoes.filter(n => !n.lida && (n.referenciaTipo === 'projeto' || n.tipo === 'projeto_criado' || n.tipo === 'projeto_atualizado')).length || undefined,
      gradient: 'from-purple-500 to-pink-500',
      description: 'Seus projetos ativos'
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      path: '/financeiro',
      badge: notificacoes.filter(n => !n.lida && n.tipo === 'pagamento_recebido').length || undefined,
      gradient: 'from-green-500 to-emerald-500',
      description: 'Controle financeiro'
    },
    {
      id: 'social-media',
      label: 'Social Media',
      icon: Megaphone,
      path: '/social-media',
      gradient: 'from-pink-500 to-rose-500',
      description: 'Gestão de redes sociais'
    },
    {
      id: 'portfolio',
      label: 'Portfólio',
      icon: Image,
      path: '/portfolio',
      gradient: 'from-amber-500 to-orange-500',
      description: 'Seus trabalhos'
    },
    {
      id: 'servicos',
      label: 'Serviços',
      icon: Package,
      path: '/servicos',
      gradient: 'from-indigo-500 to-purple-500',
      description: 'Catálogo de serviços'
    },
    {
      id: 'solicitacoes',
      label: 'Solicitações',
      icon: MessageSquare,
      path: '/solicitacoes',
      badge: notificacoes.filter(n => !n.lida && (n.referenciaTipo === 'solicitacao' || n.tipo === 'nova_solicitacao' || n.tipo === 'nova_mensagem')).length || undefined,
      gradient: 'from-teal-500 to-cyan-500',
      description: 'Solicitações de clientes'
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Fechar sidebar mobile ao mudar de rota
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Componente do item de navegação
  const NavItemComponent: React.FC<{ item: NavItem; compact?: boolean }> = ({ item, compact = false }) => {
    const isActive = location.pathname === item.path;
    const isHovered = hoveredItem === item.id;

    return (
      <button
        onClick={() => navigate(item.path)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`
          relative w-full group
          ${compact ? 'p-2 lg:p-3' : 'p-2 pr-3 lg:p-3 lg:pr-4'}
          rounded-xl transition-all duration-300 ease-out
          ${isActive 
            ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg shadow-orange-500/20' 
            : 'hover:bg-white/10 dark:hover:bg-gray-800/50'
          }
        `}
      >
        {/* Glow effect on hover */}
        {(isHovered || isActive) && (
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} opacity-20 blur-xl transition-opacity duration-300`} />
        )}

        <div className={`relative flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
          {/* Icon container with animation */}
          <div className={`
            relative flex-shrink-0
            ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}
            transition-all duration-300
            ${isHovered && !isActive ? 'scale-110' : ''}
          `}>
            <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
            
            {/* Pulse animation for active item */}
            {isActive && (
              <span className="absolute inset-0 animate-ping">
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white/50" />
              </span>
            )}
          </div>

          {/* Label only - no description */}
          {!compact && (
            <div className="flex-1 text-left overflow-hidden">
              <span className={`
                block text-sm lg:text-base font-semibold truncate
                ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}
                transition-colors duration-300
              `}>
                {item.label}
              </span>
            </div>
          )}

          {/* Badge */}
          {item.badge && item.badge > 0 && (
            <span className={`
              ${compact ? 'absolute -top-1 -right-1' : 'ml-auto'}
              min-w-[18px] h-4 px-1 
              bg-red-500 text-white text-xs font-bold 
              rounded-full flex items-center justify-center
              animate-pulse
            `}>
              {item.badge}
            </span>
          )}
        </div>

        {/* Compact mode tooltip */}
        {compact && isHovered && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded-lg shadow-xl whitespace-nowrap text-sm">
              {item.label}
            </div>
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800" />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isExpanded ? 'w-52 lg:w-64' : 'w-14 lg:w-20'}
        transition-all duration-300 ease-out
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl
        border-r border-gray-200/50 dark:border-gray-800/50
        flex flex-col
      `}>
        {/* Header */}
        <div className={`
          p-3 lg:p-6 border-b border-gray-200/50 dark:border-gray-800/50
          ${isExpanded ? '' : 'flex justify-center'}
        `}>
          {isExpanded ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-sm lg:text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Inspiração
                  </h1>
                </div>
              </div>
              {/* Botão Sair discreto */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="Sair"
              >
                <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              {/* Botão Sair compacto */}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 lg:p-4 flex flex-col justify-evenly min-h-0">
          {navItems.map((item) => (
            <NavItemComponent 
              key={item.id} 
              item={item} 
              compact={!isExpanded}
            />
          ))}
        </nav>

        {/* Footer - apenas botão recolher */}
        <div className="p-2 lg:p-4 border-t border-gray-200/50 dark:border-gray-800/50">
          {/* Toggle Expand Button (Desktop only) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              hidden lg:flex w-full p-2 lg:p-3 rounded-xl
              items-center ${isExpanded ? 'gap-3' : 'justify-center'}
              text-gray-400 dark:text-gray-500
              hover:bg-gray-100 dark:hover:bg-gray-800/50
              transition-all duration-300
            `}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-xs lg:text-sm font-medium">Recolher</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
            )}
          </button>
        </div>

        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
      </aside>

      {/* Spacer for main content */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isExpanded ? 'w-52 lg:w-64' : 'w-14 lg:w-20'}`} />
    </>
  );
};

export default Sidebar;

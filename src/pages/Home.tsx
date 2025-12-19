import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Megaphone
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 dark:from-gray-950 dark:via-gray-950 dark:to-black text-white overflow-hidden">
      {/* Background Animado */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-blue-950/20 to-pink-950/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <nav className="backdrop-blur-xl bg-gray-900/50 dark:bg-gray-950/50 border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    GESTÃO CRIATIVA
                  </h1>
                  <p className="text-xs text-purple-400/70 font-mono tracking-wider">SISTEMA INTEGRADO v2.0</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificacoesBell />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 px-6 py-3 rounded-full mb-8 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-sm font-mono text-purple-300 tracking-wider">ACESSAR O SISTEMA</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </button>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Plataforma de
              </span>
              <span className="block text-white">Gestão Completa</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 dark:text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Sistema integrado para gerenciamento de projetos, clientes, finanças e social media.
            </p>
          </div>

          {/* Info Section */}
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <div className="max-w-4xl mx-auto bg-gray-800/30 dark:bg-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Plataforma Completa de Gestão</h3>
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              
              <p className="text-gray-300 dark:text-gray-400 text-lg mb-8 text-center leading-relaxed">
                Sistema integrado com todas as ferramentas necessárias para gerenciar seu negócio criativo
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl mb-3">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Gestão Completa</h4>
                  <p className="text-sm text-gray-400 dark:text-gray-500">CRM, Projetos e Financeiro</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mb-3">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Analytics Avançado</h4>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Métricas em tempo real</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-500/10 rounded-xl mb-3">
                    <Megaphone className="w-6 h-6 text-pink-400" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">Social Media</h4>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Gestão multicanal</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 dark:border-gray-900 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-500 dark:text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>© 2024 Gestão Criativa - Sistema Integrado de Gestão</span>
                <Sparkles className="w-4 h-4" />
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Megaphone,
  Star,
  Zap,
  Crown,
  Rocket,
  Gem,
  Palette
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Background Mágico com Partículas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente Base Deslumbrante */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-blue-950/30 to-pink-950/40"></div>
        
        {/* Efeitos de Luz Dinâmicos */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Orbes Mágicos */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-conic from-purple-500/30 via-pink-500/20 to-blue-500/30 rounded-full blur-3xl animate-spin" style={{ animation: 'spin 20s linear infinite' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-gradient-radial from-blue-500/25 via-cyan-500/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-gradient-radial from-pink-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s', animationDuration: '6s' }}></div>
          
          {/* Raios de Luz */}
          <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent transform rotate-12 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/15 to-transparent transform -rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Partículas Flutuantes */}
          <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400/50 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
          <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '3s', animationDuration: '3.5s' }}></div>
        </div>

        {/* Ondas de Energia */}
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-purple-900/20 via-purple-600/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-blue-900/20 via-blue-600/10 to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <nav className="backdrop-blur-xl bg-gradient-to-r from-gray-900/60 via-purple-900/40 to-gray-900/60 border-b border-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {/* Aura Mágica */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-lg opacity-60 group-hover:opacity-80 animate-pulse transition-all duration-500"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Crown className="w-8 h-8 text-white drop-shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="group">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent hover:from-purple-200 hover:via-pink-200 hover:to-blue-200 transition-all duration-500 drop-shadow-lg">
                    GESTÃO CRIATIVA
                  </h1>
                  <div className="flex items-center gap-2">
                    <Gem className="w-3 h-3 text-purple-400 animate-pulse" />
                    <p className="text-xs text-purple-300 font-mono tracking-wider bg-purple-500/10 px-2 py-1 rounded-full backdrop-blur-sm">SISTEMA PREMIUM v3.0</p>
                    <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <NotificacoesBell />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
                </div>
                <div className="relative">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section Mágica */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className={`text-center mb-20 transition-all duration-1500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Botão de Acesso Épico */}
            <div className="relative inline-block mb-12 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur opacity-70 group-hover:opacity-100 animate-pulse transition-all duration-500"></div>
              <button
                onClick={handleLogin}
                className="relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-blue-600/90 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-full hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-2xl group"
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-white animate-pulse group-hover:animate-bounce" />
                  <span className="text-sm font-bold text-white tracking-wider">ACESSAR PLATAFORMA</span>
                  <Star className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {/* Título Espetacular */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-4 drop-shadow-2xl animate-pulse">
                Plataforma
              </span>
              <span className="block bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-500">
                EXTRAORDINÁRIA
              </span>
            </h1>
            
            {/* Subtítulo Elegante */}
            <div className="relative max-w-4xl mx-auto mb-12">
              <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed font-light">
                Sistema integrado de última geração para 
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold"> gestão criativa </span>
                e 
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-bold"> transformação digital</span>
              </p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-pulse"></div>
            </div>

            {/* Badges de Destaque */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 backdrop-blur-sm border border-purple-400/30 px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-purple-300 font-medium">IA Integrada</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm text-blue-300 font-medium">100% Seguro</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-pink-500/10 backdrop-blur-sm border border-pink-400/30 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-pink-400 animate-pulse" />
                <span className="text-sm text-pink-300 font-medium">Premium</span>
              </div>
            </div>
          </div>

          {/* Seção de Recursos Deslumbrante */}
          <div className={`transition-all duration-1500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>
            <div className="relative max-w-6xl mx-auto">
              {/* Background Mágico do Card */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-blue-600/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-gray-800/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Star className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                    Ecossistema Completo de Gestão
                  </h3>
                  <Gem className="w-8 h-8 text-cyan-400 animate-bounce" />
                </div>
                
                <p className="text-gray-200 text-xl mb-12 text-center leading-relaxed max-w-4xl mx-auto">
                  Plataforma revolucionária que combina 
                  <span className="text-purple-300 font-semibold"> inteligência artificial</span>, 
                  <span className="text-pink-300 font-semibold"> design excepcional</span> e 
                  <span className="text-blue-300 font-semibold"> funcionalidades avançadas</span>
                </p>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Card 1 - Gestão Completa */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    <div className="relative bg-gray-900/50 backdrop-blur-xl border border-purple-400/20 rounded-2xl p-6 transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-300">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:rotate-12 transition-transform">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-white mb-2 group-hover:text-purple-300 transition-colors">Gestão Inteligente</h4>
                      <p className="text-gray-400 leading-relaxed">CRM avançado, gestão de projetos e controle financeiro integrado com IA</p>
                      <div className="absolute top-2 right-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Card 2 - Analytics */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    <div className="relative bg-gray-900/50 backdrop-blur-xl border border-blue-400/20 rounded-2xl p-6 transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-300">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 group-hover:rotate-12 transition-transform">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-white mb-2 group-hover:text-blue-300 transition-colors">Analytics Premium</h4>
                      <p className="text-gray-400 leading-relaxed">Dashboards interativos e métricas avançadas em tempo real com insights preditivos</p>
                      <div className="absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Card 3 - Social Media */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-pink-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
                    <div className="relative bg-gray-900/50 backdrop-blur-xl border border-pink-400/20 rounded-2xl p-6 transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-300">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mb-4 group-hover:rotate-12 transition-transform">
                        <Palette className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-xl text-white mb-2 group-hover:text-pink-300 transition-colors">Social Media Pro</h4>
                      <p className="text-gray-400 leading-relaxed">Gestão multicanal inteligente com automação e criação de conteúdo por IA</p>
                      <div className="absolute top-2 right-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Elementos Decorativos */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-500/30 rounded-full animate-ping"></div>
                <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-blue-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Elegante */}
        <footer className="relative border-t border-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 py-12 mt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-purple-900/30 to-gray-900/50 backdrop-blur-xl"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="w-5 h-5 text-yellow-400 animate-pulse" />
                <p className="text-lg font-medium bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                  © 2024 Gestão Criativa - Plataforma Premium de Gestão Integrada
                </p>
                <Gem className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm">
                Transformando ideias em realidade através da tecnologia
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

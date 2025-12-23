import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  User,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Megaphone,
  Rocket,
  Zap,
  Globe,
  Code,
  Cpu,
  Database,
  Lock,
  ChevronDown,
  Star
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [typedText, setTypedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const phrases = [
    'Gestão Inteligente',
    'Resultados Reais',
    'Futuro Agora',
    'Sucesso Garantido'
  ];

  // Efeito de digitação
  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let charIndex = 0;
    let isDeleting = false;
    
    const typeInterval = setInterval(() => {
      if (!isDeleting) {
        setTypedText(currentPhrase.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === currentPhrase.length) {
          setTimeout(() => { isDeleting = true; }, 2000);
        }
      } else {
        setTypedText(currentPhrase.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearInterval(typeInterval);
  }, [currentPhraseIndex]);

  // Mouse tracking para efeito parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    setIsLoaded(true);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  // Partículas flutuantes
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden" ref={heroRef}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
            transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            bottom: '-10%',
            right: '-5%',
            transform: `translate(${-mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)`
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
            top: '40%',
            right: '20%',
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
          }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }} />
        </div>

        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-purple-500/30 animate-float-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}

        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.02]">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500 to-transparent h-[20px] animate-scanline"
          />
        </div>

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#030014]/80 border-b border-purple-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl animate-energy-pulse">
                    <Cpu className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      GESTÃO
                    </span>
                    <span className="text-white ml-2">CRIATIVA</span>
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-purple-400/70 font-mono tracking-widest">SYSTEM v3.0 ONLINE</p>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Recursos</a>
                <a href="#benefits" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Benefícios</a>
                <a href="#stats" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Estatísticas</a>
              </div>

              <div className="flex items-center gap-4">
                <NotificacoesBell />
                <ThemeToggle />
                <button
                  onClick={handleLogin}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
                >
                  <Lock className="w-4 h-4" />
                  <span>Acessar</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 px-6 py-3 rounded-full mb-8">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <span className="text-sm font-medium text-gray-300">Plataforma #1 em Gestão Criativa</span>
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
            </div>

            {/* Main Title */}
            <div className={`transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-6">
                <span className="block text-white mb-2">O Futuro</span>
                <span className="relative inline-block">
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-2xl opacity-50" />
                  <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                    {typedText}
                  </span>
                  <span className="inline-block w-1 h-16 sm:h-20 md:h-24 bg-purple-500 ml-2 animate-blink" />
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
                Transforme sua agência com tecnologia de ponta. 
                <span className="text-purple-400"> CRM</span>, 
                <span className="text-pink-400"> Projetos</span>, 
                <span className="text-blue-400"> Finanças</span> e 
                <span className="text-cyan-400"> Social Media</span> em uma única plataforma.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button
                onClick={handleLogin}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                <Rocket className="w-6 h-6 relative animate-bounce" />
                <span className="relative">Começar Agora</span>
                <ArrowRight className="w-6 h-6 relative group-hover:translate-x-1 transition-transform" />
              </button>

            </div>

            {/* Stats Preview */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {[
                { value: '500+', label: 'Clientes Ativos', icon: Users },
                { value: '10K+', label: 'Projetos Entregues', icon: Rocket },
                { value: '99.9%', label: 'Uptime Garantido', icon: Zap },
                { value: '24/7', label: 'Suporte Premium', icon: Shield }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
                >
                  <stat.icon className="w-8 h-8 text-purple-400 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-purple-500/50" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Recursos Poderosos
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar sua agência em um só lugar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: 'CRM Inteligente', desc: 'Gerencie clientes, propostas e contratos com facilidade', color: 'purple' },
                { icon: BarChart3, title: 'Dashboard Analytics', desc: 'Métricas e insights em tempo real do seu negócio', color: 'blue' },
                { icon: Megaphone, title: 'Social Media Hub', desc: 'Planeje e gerencie conteúdo para todas as redes', color: 'pink' },
                { icon: Database, title: 'Gestão Financeira', desc: 'Controle receitas, despesas e fluxo de caixa', color: 'green' },
                { icon: Rocket, title: 'Projetos', desc: 'Acompanhe entregas, tarefas e prazos', color: 'orange' },
                { icon: Globe, title: 'Portal do Cliente', desc: 'Experiência exclusiva para seus clientes', color: 'cyan' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                  
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-3xl opacity-20" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 md:p-16">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                  Pronto para Transformar seu Negócio?
                </h2>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                  Junte-se a centenas de agências que já revolucionaram sua gestão
                </p>
                <button
                  onClick={handleLogin}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                >
                  <Zap className="w-6 h-6 animate-pulse" />
                  <span>Acessar Plataforma</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Cpu className="w-6 h-6 text-purple-500" />
              <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                GESTÃO CRIATIVA
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 Gestão Criativa - Plataforma Integrada de Gestão de Agências
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Feito com 💜 para agências criativas
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

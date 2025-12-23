import React, { useEffect, useState } from 'react';
import { Sparkles, Star, Trophy, Rocket, PartyPopper, Gift, Crown, Zap } from 'lucide-react';

interface CelebracaoPrimeiroAcessoProps {
  nome: string;
  tipo: 'cliente' | 'admin';
  onClose: () => void;
}

const CelebracaoPrimeiroAcesso: React.FC<CelebracaoPrimeiroAcessoProps> = ({ nome, tipo, onClose }) => {
  const [stage, setStage] = useState(0);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string; size: number }>>([]);
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Gerar confetes
    const newConfetti = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      color: ['#a855f7', '#3b82f6', '#ec4899', '#fbbf24', '#22c55e', '#06b6d4'][Math.floor(Math.random() * 6)],
      size: Math.random() * 10 + 5
    }));
    setConfetti(newConfetti);

    // Gerar fogos de artifício
    const interval = setInterval(() => {
      setFireworks(prev => [
        ...prev.slice(-5),
        { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 40 + 10 }
      ]);
    }, 500);

    // Animação em estágios
    const timer1 = setTimeout(() => setStage(1), 500);
    const timer2 = setTimeout(() => setStage(2), 1500);
    const timer3 = setTimeout(() => setStage(3), 2500);
    const timer4 = setTimeout(() => setStage(4), 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const primeiroNome = nome.split(' ')[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Background escuro com blur */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      {/* Confetes caindo */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${c.x}%`,
            animationDelay: `${c.delay}s`,
            top: '-20px'
          }}
        >
          <div
            className="animate-confetti-spin"
            style={{
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        </div>
      ))}

      {/* Fogos de artifício */}
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="absolute animate-firework"
          style={{ left: `${fw.x}%`, top: `${fw.y}%` }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-firework-particle"
              style={{
                backgroundColor: ['#a855f7', '#3b82f6', '#ec4899', '#fbbf24'][i % 4],
                transform: `rotate(${i * 30}deg) translateY(-30px)`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      ))}

      {/* Partículas brilhantes flutuando */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400 opacity-60" />
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 text-center px-8 max-w-2xl">
        {/* Ícone principal com animação */}
        <div className={`transition-all duration-1000 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-3xl opacity-50 animate-pulse" />
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-slow">
              {tipo === 'admin' ? (
                <Crown className="w-16 h-16 text-white" />
              ) : (
                <Trophy className="w-16 h-16 text-white" />
              )}
            </div>
            
            {/* Estrelas orbitando */}
            <div className="absolute inset-0 animate-orbit">
              <Star className="absolute -top-4 left-1/2 w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="absolute inset-0 animate-orbit-reverse">
              <Sparkles className="absolute -bottom-4 left-1/2 w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Texto de boas-vindas */}
        <div className={`transition-all duration-1000 delay-300 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <PartyPopper className="w-8 h-8 text-pink-400 animate-wiggle" />
            <h1 className="text-5xl md:text-6xl font-black">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                BEM-VINDO!
              </span>
            </h1>
            <PartyPopper className="w-8 h-8 text-pink-400 animate-wiggle" style={{ transform: 'scaleX(-1)' }} />
          </div>
        </div>

        {/* Nome do usuário */}
        <div className={`transition-all duration-1000 delay-500 ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-3xl md:text-4xl font-bold text-white mb-6">
            {primeiroNome}! 
            <span className="ml-2">🎉</span>
          </p>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {tipo === 'admin' ? (
              <>
                Você agora faz parte da nossa <span className="text-purple-400 font-semibold">Elite de Gestores</span>!
                <br />
                Sua jornada de sucesso começa agora.
              </>
            ) : (
              <>
                É uma honra ter você conosco!
                <br />
                Preparamos uma experiência <span className="text-purple-400 font-semibold">incrível</span> para você.
              </>
            )}
          </p>

          {/* Badges/conquistas */}
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 rounded-full">
              <Gift className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Membro Fundador</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 px-4 py-2 rounded-full">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">Acesso VIP</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 px-4 py-2 rounded-full">
              <Rocket className="w-5 h-5 text-pink-400" />
              <span className="text-pink-300 font-medium">Pioneiro</span>
            </div>
          </div>
        </div>

        {/* Botão de continuar */}
        <div className={`transition-all duration-1000 delay-700 ${stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={onClose}
            className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-50 group-hover:opacity-70 transition-opacity rounded-2xl" />
            <span className="relative flex items-center gap-3">
              <Rocket className="w-6 h-6 animate-bounce" />
              <span>Começar Minha Jornada</span>
              <Sparkles className="w-6 h-6 animate-pulse" />
            </span>
          </button>
          
          <p className="text-gray-500 text-sm mt-6 animate-pulse">
            Clique para explorar todas as funcionalidades
          </p>
        </div>
      </div>

      {/* Raios de luz */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin-slow opacity-20">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
              style={{
                width: '100%',
                transform: `rotate(${i * 30}deg) translateX(-50%)`,
                transformOrigin: 'left center'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CelebracaoPrimeiroAcesso;

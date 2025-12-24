import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowLeft, 
  X, 
  KeyRound, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  Star,
  Crown,
  Zap,
  Gem,
  ArrowRight,
  Shield
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { inicializarAdmin, isWebmaster } from '../services/adminService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoaded(true);
    // Verificar se há mensagem de sucesso do registro
    const state = location.state as { message?: string };
    if (state?.message) {
      setSuccessMessage(state.message);
      // Limpar o state após exibir
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Tentando login com:', email);

    try {
      console.log('📞 Chamando signIn...');
      const userCredential = await signIn(email, password);
      console.log('✅ Login bem-sucedido! UID:', userCredential.user.uid);
      
      // Se for um webmaster, inicializar no sistema de admins
      if (isWebmaster(email)) {
        console.log('👑 Usuário é webmaster, inicializando...');
        await inicializarAdmin(userCredential.user.uid, email);
      }
      
      // Buscar role do usuário no Firestore
      console.log('📄 Buscando documento do usuário no Firestore...');
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Documento encontrado. Role:', userData.role);
        
        // Redirecionar baseado no role
        if (userData.role === 'admin') {
          console.log('➡️ Redirecionando para /agenda (Command Center)');
          navigate('/agenda');
        } else {
          console.log('➡️ Redirecionando para /client-portal');
          navigate('/client-portal');
        }
      } else {
        console.log('⚠️ Documento não encontrado. Assumindo admin.');
        navigate('/agenda');
      }
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      console.error('Código do erro:', err.code);
      console.error('Mensagem:', err.message);
      
      // Mensagens de erro mais específicas
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado. Verifique o email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta. Tente novamente.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido. Verifique o formato.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Credenciais inválidas. Verifique email e senha.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError(`Erro ao fazer login: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetMessage('Email de recuperação enviado! Verifique sua caixa de entrada e spam.');
      setResetEmail('');
    } catch (err: any) {
      console.error('❌ Erro ao enviar email de recuperação:', err);
      
      if (err.code === 'auth/user-not-found') {
        setResetError('Não existe uma conta com este email.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Email inválido. Verifique o formato.');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setResetError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email); // Preencher com o email digitado no login
    setResetMessage('');
    setResetError('');
    setShowResetModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Background Mágico Ultra Dinâmico */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente Base Espetacular */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-blue-950/40 to-pink-950/50"></div>
        
        {/* Sistema de Partículas e Luzes */}
        <div className="absolute inset-0">
          {/* Orbes Centrais Massivos */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-conic from-purple-500/40 via-pink-500/30 to-blue-500/40 rounded-full blur-3xl animate-spin" style={{ animation: 'spin 30s linear infinite' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-radial from-blue-500/35 via-cyan-500/25 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-pink-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
          
          {/* Raios de Energia Cruzados */}
          <div className="absolute top-0 left-1/3 w-2 h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent transform rotate-12 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent transform -rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-0 left-2/3 w-1 h-full bg-gradient-to-b from-transparent via-pink-400/20 to-transparent transform rotate-6 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Partículas Flutuantes Múltiplas */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-${Math.floor(Math.random() * 3) + 1} h-${Math.floor(Math.random() * 3) + 1} bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Ondas de Energia Sobrepostas */}
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-purple-900/30 via-purple-600/15 to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-900/30 via-blue-600/15 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-full h-64 bg-gradient-to-r from-pink-900/20 via-transparent to-pink-900/20"></div>
        
        {/* Efeito Aurora */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent via-blue-500/5 via-transparent to-pink-500/5 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Épico */}
        <nav className="backdrop-blur-xl bg-gradient-to-r from-gray-900/60 via-purple-900/40 to-gray-900/60 border-b border-gradient-to-r from-purple-500/40 via-pink-500/30 to-blue-500/40 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-3 text-purple-300 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 blur-lg opacity-50 group-hover:opacity-70 rounded-full transition-all duration-300"></div>
                  <ArrowLeft className="relative w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="font-semibold tracking-wide">Voltar ao Início</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur opacity-50 group-hover:opacity-70 rounded-2xl transition-all duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Crown className="w-7 h-7 text-white animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                    PORTAL PREMIUM
                  </h2>
                  <p className="text-xs text-purple-400 font-mono tracking-wider">ACESSO EXCLUSIVO</p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Login Form Container Épico */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div 
            className={`w-full max-w-lg transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}
          >
            {/* Login Card Ultra Premium */}
            <div className="relative group">
              {/* Aura Mágica Externa */}
              <div className="absolute -inset-4 bg-gradient-conic from-purple-600 via-pink-600 via-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 animate-pulse transition-all duration-500" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
              
              {/* Glow Effect Interno */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <div className="relative backdrop-blur-2xl bg-gradient-to-br from-gray-800/60 via-gray-900/50 to-gray-800/60 border border-purple-400/30 rounded-3xl p-10 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                {/* Elementos Decorativos */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                
                {/* Icon Central Majestoso */}
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-conic from-purple-500 via-pink-500 to-blue-500 blur-2xl opacity-60 animate-spin rounded-full" style={{ animation: 'spin 20s linear infinite' }}></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform duration-300">
                      <ShieldCheck className="w-10 h-10 text-white drop-shadow-lg" />
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Star className="w-3 h-3 text-yellow-400 animate-pulse" />
                        <Gem className="w-3 h-3 text-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Título Espetacular */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                    Bem-vindo de volta!
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                    <p className="text-gray-300 font-medium tracking-wide">
                      Acesse sua plataforma premium
                    </p>
                    <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                  </div>
                  <div className="w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full mx-auto animate-pulse"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Mensagem de Sucesso Estilizada */}
                  {successMessage && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur"></div>
                      <div className="relative bg-green-500/10 border border-green-400/30 text-green-300 px-6 py-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{successMessage}</div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de Erro Estilizada */}
                  {error && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl blur"></div>
                      <div className="relative bg-red-500/10 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs text-white">!</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{error}</div>
                      </div>
                    </div>
                  )}

                  {/* Campo Email Premium */}
                  <div className="group">
                    <label className="block text-sm font-bold text-purple-300 mb-3 tracking-wide">
                      <Mail className="inline w-4 h-4 mr-2" />
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                          <div className="w-px h-5 bg-gray-600 group-focus-within:bg-purple-400 transition-colors"></div>
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-600/50 focus:border-purple-400/70 rounded-xl py-4 pl-16 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300 backdrop-blur-sm font-medium tracking-wide"
                          placeholder="seu@email.com"
                          required
                          disabled={loading}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campo Senha Premium */}
                  <div className="group">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-purple-300 tracking-wide">
                        <Lock className="inline w-4 h-4 mr-2" />
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={openResetModal}
                        className="text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors relative group"
                      >
                        <span className="relative z-10">Esqueci minha senha</span>
                        <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200"></div>
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-300"></div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                          <div className="w-px h-5 bg-gray-600 group-focus-within:bg-purple-400 transition-colors"></div>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-gray-600/50 focus:border-purple-400/70 rounded-xl py-4 pl-16 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all duration-300 backdrop-blur-sm font-medium tracking-wide"
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-500/10"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Login Épico */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full group overflow-hidden"
                    >
                      {/* Aura Externa */}
                      <div className="absolute -inset-2 bg-gradient-conic from-purple-600 via-pink-600 via-blue-600 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 animate-pulse transition-all duration-500"></div>
                      
                      {/* Background Gradient */}
                      <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:from-purple-500 hover:via-pink-400 hover:to-blue-500 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform group-hover:scale-105 group-active:scale-95">
                        
                        {/* Efeito de Brilho */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        
                        {/* Conteúdo */}
                        <div className="relative flex items-center justify-center gap-3">
                          {loading ? (
                            <>
                              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="tracking-wide">PROCESSANDO...</span>
                              <Zap className="w-5 h-5 animate-pulse" />
                            </>
                          ) : (
                            <>
                              <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                              <span className="tracking-wide">ACESSAR PLATAFORMA</span>
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </div>

                        {/* Partículas */}
                        <div className="absolute top-2 right-4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                        <div className="absolute bottom-2 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                      </div>
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                  <span className="text-gray-500 text-sm">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-gray-400">
                    Não tem uma conta?{' '}
                    <button
                      onClick={() => navigate('/register')}
                      className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                    >
                      Criar conta cliente
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Sistema de Gestão Criativa © 2025
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-md animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-3xl blur-lg opacity-30"></div>
            
            <div className="relative backdrop-blur-xl bg-gray-800/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Recuperar Senha
                  </h2>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetMessage && (
                  <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">✅</div>
                    <div className="text-sm">{resetMessage}</div>
                  </div>
                )}

                {resetError && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">⚠️</div>
                    <div className="text-sm">{resetError}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 focus:border-purple-500 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      placeholder="seu@email.com"
                      required
                      disabled={resetLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enviando...
                      </>
                    ) : (
                      'Enviar Link'
                    )}
                  </button>
                </div>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Verifique também a pasta de spam se não encontrar o email.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

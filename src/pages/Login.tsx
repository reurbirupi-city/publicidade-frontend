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
  Shield,
  Rocket
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
      {/* Imagem de Fundo com Transparência */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: 'url(/imagemfundo1.png)' }}
        ></div>
      </div>
      
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

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Compacto */}
        <nav className="backdrop-blur-xl bg-gradient-to-r from-gray-900/60 via-purple-900/40 to-gray-900/60 border-b border-purple-500/20 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Voltar</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                    GESTÃO CRIATIVA
                  </h1>
                  <p className="text-[10px] text-purple-300">Sistema Premium</p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div 
            className={`w-full max-w-md transition-all duration-1500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Login Card Premium */}
            <div className="relative">
              {/* Background Mágico do Card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-blue-600/30 rounded-2xl blur-xl"></div>
              
              <div className="relative backdrop-blur-2xl bg-gray-800/40 border border-white/10 rounded-2xl p-8 shadow-2xl">
                {/* Icon e Título Premium */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-4">
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-full blur opacity-70 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent mb-2">
                    Acesso ao Sistema
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <p className="text-gray-300 text-sm">
                      Plataforma Premium de Gestão
                    </p>
                    <Gem className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Mensagens */}
                  {successMessage && (
                    <div className="bg-green-500/10 backdrop-blur-sm border border-green-400/30 text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <span className="text-green-400 text-lg">✓</span>
                      {successMessage}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <span className="text-red-400 text-lg">!</span>
                      {error}
                    </div>
                  )}

                  {/* Campo Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-600/50 focus:border-purple-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        placeholder="seu@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Campo Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">Senha</label>
                      <button
                        type="button"
                        onClick={openResetModal}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-600/50 focus:border-purple-500 rounded-lg pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Botão de Login Premium */}
                  <div className="pt-2">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-70 group-hover:opacity-100 transition-all duration-300"></div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white py-3 rounded-lg font-semibold shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Entrando na plataforma...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <LogIn className="w-5 h-5" />
                            Acessar Plataforma
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Divider Elegante */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                  <span className="text-gray-400 text-sm">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>

                {/* Register Link Premium */}
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-3">
                    Ainda não possui uma conta?
                  </p>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    Criar nova conta
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Elementos Decorativos */}
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-purple-500/30 rounded-full animate-ping"></div>
                <div className="absolute -bottom-3 -right-3 w-5 h-5 bg-blue-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                <p className="text-xs text-gray-400">
                  Acesso seguro e criptografado
                </p>
                <Shield className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Elegante */}
        <footer className="relative border-t border-gradient-to-r from-purple-500/30 via-pink-500/20 to-blue-500/30 py-6 mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 via-purple-900/30 to-gray-900/50 backdrop-blur-xl"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                <p className="text-sm font-medium bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                  © 2024 Gestão Criativa - Plataforma Premium de Gestão Integrada
                </p>
                <Gem className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-gray-400 text-xs">
                Transformando ideias em realidade através da tecnologia
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Background Mágico do Modal */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-blue-600/30 rounded-2xl blur-xl"></div>
              
              <div className="relative bg-gray-800/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Header Premium */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <KeyRound className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                        Recuperar Senha
                      </h2>
                      <p className="text-xs text-gray-400">Redefinir acesso</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                  Digite seu email cadastrado para receber as instruções de recuperação de senha.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {resetMessage && (
                    <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <span>{resetMessage}</span>
                    </div>
                  )}

                  {resetError && (
                    <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-600/50 focus:border-purple-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
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
                      className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg font-medium transition-all"
                    >
                      Cancelar
                    </button>
                    <div className="flex-1 relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition-all"></div>
                      <button
                        type="submit"
                        disabled={resetLoading || !resetEmail}
                        className="relative w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enviando...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Enviar Link
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-5 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" />
                    Verifique também sua pasta de spam
                  </p>
                </div>

                {/* Elementos Decorativos */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500/30 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

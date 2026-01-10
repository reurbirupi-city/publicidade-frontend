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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative">
      {/* Background Simplificado */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-blue-950/20 to-pink-950/30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Minimalista */}
        <nav className="backdrop-blur-sm bg-gray-900/40 border-b border-purple-500/10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-12">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-300 hidden sm:block">Sistema Premium</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Login Form Container Ultra Compacto */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div 
            className={`w-full max-w-xs transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Login Card Minimalista */}
            <div className="backdrop-blur-xl bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 shadow-xl">
                
                {/* Icon e Título Compactos */}
                <div className="text-center mb-3">
                  <div className="inline-flex w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg items-center justify-center mb-2">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-0.5">
                    Login
                  </h2>
                  <p className="text-gray-400 text-xs">
                    Acesse sua conta
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* Mensagens */}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-400/30 text-green-300 px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5">
                      <span className="text-green-400">✓</span>
                      {successMessage}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-400/30 text-red-300 px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5">
                      <span className="text-red-400">!</span>
                      {error}
                    </div>
                  )}

                  {/* Campo Email */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600/50 focus:border-purple-500 rounded pl-8 pr-2.5 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                        placeholder="seu@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Campo Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-gray-300">Senha</label>
                      <button
                        type="button"
                        onClick={openResetModal}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Esqueceu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-600/50 focus:border-purple-500 rounded pl-8 pr-8 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Botão de Login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2 rounded font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Entrando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <LogIn className="w-3.5 h-3.5" />
                        Entrar
                      </span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <span className="text-gray-500 text-xs">ou</span>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                {/* Register Link */}
                <p className="text-center text-xs text-gray-400">
                  Não tem conta?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-2.5">
              Sistema de Gestão Criativa © 2025
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Senha - Ultra Compacto */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-gray-800/90 border border-gray-700 rounded-lg p-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-bold text-white">Recuperar Senha</h2>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-400 text-xs mb-3">
              Digite seu email para receber o link de recuperação.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-2.5">
              {resetMessage && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5">
                  <span>✅</span>
                  <span>{resetMessage}</span>
                </div>
              )}

              {resetError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 focus:border-purple-500 rounded pl-8 pr-2.5 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                    placeholder="seu@email.com"
                    required
                    disabled={resetLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail}
                  className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 text-center mt-2.5">
              Verifique também sua pasta de spam.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

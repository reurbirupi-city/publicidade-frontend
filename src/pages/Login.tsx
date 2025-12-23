import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowLeft, X, KeyRound, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
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
          console.log('➡️ Redirecionando para /dashboard');
          navigate('/dashboard');
        } else {
          console.log('➡️ Redirecionando para /client-portal');
          navigate('/client-portal');
        }
      } else {
        console.log('⚠️ Documento não encontrado. Assumindo admin.');
        navigate('/dashboard');
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
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden">
      {/* Background Futurístico */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs com movimento */}
        <div className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
          }}
        />
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
            bottom: '-10%',
            right: '-5%',
            animationDelay: '1s'
          }}
        />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[80px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, transparent 70%)',
            top: '30%',
            right: '10%',
            animationDelay: '2s'
          }}
        />

        {/* Grid futurístico */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }} />
        </div>

        {/* Partículas flutuantes */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/30 animate-float-particle"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}

        {/* Linha de scan */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500 to-transparent h-[30px] animate-scanline" />
        </div>

        {/* Círculos concêntricos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] opacity-[0.02]">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <nav className="backdrop-blur-2xl bg-[#030014]/80 border-b border-purple-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-all group"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="font-medium">Voltar</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-xl opacity-50 group-hover:opacity-70 animate-pulse transition-opacity"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Gestão Criativa
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div 
            className={`w-full max-w-md transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Login Card */}
            <div className="relative group">
              {/* Glow Effect Animado */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
              
              <div className="relative backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                {/* Icon com energia */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-2xl opacity-60 animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl animate-energy-pulse">
                      <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    {/* Partículas orbitando */}
                    <div className="absolute inset-0 animate-orbit">
                      <Sparkles className="absolute -top-2 left-1/2 w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                </div>

                <h2 className="text-3xl font-black text-center mb-2">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Bem-vindo de volta!
                  </span>
                </h2>
                <p className="text-gray-400 text-center mb-8">
                  Acesse sua conta para continuar
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {successMessage && (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                      <div className="flex-shrink-0 mt-0.5">✅</div>
                      <div className="text-sm">{successMessage}</div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 backdrop-blur-sm">
                      <div className="flex-shrink-0 mt-0.5">⚠️</div>
                      <div className="text-sm">{error}</div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-700 focus:border-purple-500 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                          placeholder="seu@email.com"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={openResetModal}
                        className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-700 focus:border-purple-500 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full group mt-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Entrando...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          Entrar
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                  <span className="text-gray-500 text-sm">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>

                {/* Informação sobre registro via convite */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Para criar uma conta, solicite um link de convite ao seu administrador.
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

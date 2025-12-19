import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { inicializarAdmin, isWebmaster } from '../services/adminService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Gestão Criativa
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Bem-vindo de volta!
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Entre para acessar seu sistema de gestão
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">✅</div>
                <div className="text-sm">{successMessage}</div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">⚠️</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Criar conta cliente
              </button>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-1">
              👤 Conta de Administrador
            </p>
            <p className="text-sm text-blue-700">
              Configure o Firebase e crie seu primeiro usuário. 
              Veja o arquivo <code className="bg-blue-100 px-1 rounded">CHECKLIST.md</code> para instruções.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Sistema de Gestão Criativa © 2025
        </p>
      </div>
    </div>
  );
};

export default Login;

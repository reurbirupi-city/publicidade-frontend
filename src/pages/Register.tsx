import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Phone, Building, ArrowLeft, MapPin, Shield } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getClientes, saveClientes } from '../services/dataIntegration';
import { notificarNovoCliente } from '../services/notificacoes';
import { getAdminByCodigoConvite, Admin } from '../services/adminService';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [adminConvite, setAdminConvite] = useState<Admin | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    empresa: '',
    whatsapp: '',
    tipoPessoa: 'juridica',
    cpf: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Buscar admin pelo código de convite na URL
  useEffect(() => {
    const buscarAdminConvite = async () => {
      const ref = searchParams.get('ref');
      if (ref) {
        console.log('🔍 Código de convite encontrado na URL:', ref);
        const admin = await getAdminByCodigoConvite(ref);
        if (admin) {
          console.log('✅ Admin encontrado:', admin.nome, '-', admin.nomeAgencia);
          setAdminConvite(admin);
        } else {
          console.log('⚠️ Código de convite inválido');
        }
      }
      setLoadingAdmin(false);
    };

    buscarAdminConvite();
  }, [searchParams]);

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Validação de CPF
  const validarCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };

  // Validação de CNPJ
  const validarCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
  };

  // Validação de email
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!formData.empresa.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!validarEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    // Validação de CPF/CNPJ
    if (formData.tipoPessoa === 'juridica') {
      if (!formData.cnpj.trim()) {
        setError('CNPJ é obrigatório para pessoa jurídica');
        return;
      }
      if (!validarCNPJ(formData.cnpj)) {
        setError('CNPJ inválido');
        return;
      }
    }

    if (formData.tipoPessoa === 'fisica') {
      if (!formData.cpf.trim()) {
        setError('CPF é obrigatório para pessoa física');
        return;
      }
      if (!validarCPF(formData.cpf)) {
        setError('CPF inválido');
        return;
      }
    }

    setLoading(true);

    try {
      console.log('📝 Verificando dados...');

      // Verificar se email já existe no Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods.length > 0) {
        setError('Este email já está cadastrado');
        setLoading(false);
        return;
      }

      // Verificar duplicatas no CRM local
      const clientesExistentes = getClientes();
      
      const emailExiste = clientesExistentes.some(
        c => c.email.toLowerCase() === formData.email.toLowerCase()
      );
      if (emailExiste) {
        setError('Este email já está cadastrado no sistema');
        setLoading(false);
        return;
      }

      if (formData.tipoPessoa === 'fisica' && formData.cpf) {
        const cpfLimpo = formData.cpf.replace(/[^\d]/g, '');
        const cpfExiste = clientesExistentes.some(
          c => c.cpf === cpfLimpo
        );
        if (cpfExiste) {
          setError('Este CPF já está cadastrado');
          setLoading(false);
          return;
        }
      }

      if (formData.tipoPessoa === 'juridica' && formData.cnpj) {
        const cnpjLimpo = formData.cnpj.replace(/[^\d]/g, '');
        const cnpjExiste = clientesExistentes.some(
          c => c.cnpj === cnpjLimpo
        );
        if (cnpjExiste) {
          setError('Este CNPJ já está cadastrado');
          setLoading(false);
          return;
        }
      }
      
      console.log('📝 Criando conta de cliente...');
      
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const uid = userCredential.user.uid;
      console.log('✅ Conta criada no Firebase Auth. UID:', uid);

      // 2. Preparar dados do cliente para Firestore
      const clienteParaFirestore: any = {
        id: uid,
        nome: formData.nome,
        empresa: formData.empresa,
        email: formData.email,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp || formData.telefone,
        endereco: formData.endereco || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        status: 'prospect',
        valorTotal: 0,
        projetos: 0,
        dataContato: new Date().toISOString().split('T')[0],
        observacoes: 'Cliente cadastrado via portal (autocadastro)',
        rating: 3,
        tipoPessoa: formData.tipoPessoa,
        etapaFunil: 'prospect',
        contratoAssinado: false,
        portalAtivo: true,
        criadoEm: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      };

      // Se veio de link de convite, vincular ao admin
      if (adminConvite) {
        clienteParaFirestore.adminId = adminConvite.id;
        clienteParaFirestore.adminNome = adminConvite.nomeAgencia || adminConvite.nome;
        clienteParaFirestore.dataVinculo = new Date().toISOString();
        clienteParaFirestore.observacoes = `Cliente cadastrado via link de convite de ${adminConvite.nomeAgencia || adminConvite.nome}`;
        console.log('🔗 Cliente vinculado ao admin:', adminConvite.id, '-', adminConvite.nomeAgencia);
      }

      // Adicionar CPF ou CNPJ apenas se existir
      if (formData.tipoPessoa === 'fisica' && formData.cpf) {
        (clienteParaFirestore as any).cpf = formData.cpf.replace(/[^\d]/g, '');
      }
      if (formData.tipoPessoa === 'juridica' && formData.cnpj) {
        (clienteParaFirestore as any).cnpj = formData.cnpj.replace(/[^\d]/g, '');
      }

      console.log('📝 Salvando cliente no Firestore (coleção clientes)...', clienteParaFirestore);

      // 3. Salvar na coleção "clientes" do Firestore
      try {
        await setDoc(doc(db, 'clientes', uid), clienteParaFirestore);
        console.log('✅ Cliente salvo na coleção clientes do Firestore:', uid);
      } catch (firestoreError: any) {
        console.error('❌ ERRO ao salvar cliente no Firestore:', firestoreError);
        console.error('Código do erro:', firestoreError.code);
        console.error('Mensagem:', firestoreError.message);
        // Não interrompe o fluxo
      }

      // 4. Criar documento do usuário no Firestore (coleção users)
      const userDataFirestore: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        empresa: formData.empresa,
        role: 'client',
        clienteId: uid,
        status: 'ativo',
        dataCadastro: new Date().toISOString(),
        uid: uid
      };

      // Vincular usuário ao admin se veio de link de convite
      if (adminConvite) {
        userDataFirestore.adminId = adminConvite.id;
        userDataFirestore.adminNome = adminConvite.nomeAgencia || adminConvite.nome;
      }

      await setDoc(doc(db, 'users', uid), userDataFirestore);
      console.log('✅ Documento de usuário criado no Firestore (coleção users)');

      // 5. Criar cliente no CRM (localStorage)
      const clientes = getClientes();
      
      const novoCliente = {
        id: uid,
        nome: formData.nome,
        empresa: formData.empresa,
        email: formData.email,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp || formData.telefone,
        endereco: formData.endereco || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        status: 'prospect' as 'prospect',
        valorTotal: 0,
        projetos: 0,
        dataContato: new Date().toISOString().split('T')[0],
        observacoes: 'Cliente cadastrado via portal (autocadastro)',
        rating: 3,
        tipoPessoa: formData.tipoPessoa as 'fisica' | 'juridica',
        cpf: formData.tipoPessoa === 'fisica' ? formData.cpf.replace(/[^\d]/g, '') : undefined,
        cnpj: formData.tipoPessoa === 'juridica' ? formData.cnpj.replace(/[^\d]/g, '') : undefined,
        etapaFunil: 'prospect',
        contratoAssinado: false,
        servicosContratados: [],
        historicoInteracoes: [
          {
            id: 'i1',
            tipo: 'cadastro',
            data: new Date().toISOString().split('T')[0],
            descricao: 'Cadastro realizado via portal do cliente',
            responsavel: 'Sistema',
          }
        ],
        documentos: [],
        portalAtivo: true,
        criadoEm: new Date().toISOString(),
      } as any;

      const clientesAtualizados = [...clientes, novoCliente];
      saveClientes(clientesAtualizados);
      console.log('✅ Cliente cadastrado no localStorage (CRM local):', novoCliente.id);

      // 5.1. Notificar admin sobre novo cliente cadastrado
      try {
        await notificarNovoCliente(
          formData.nome,
          formData.empresa,
          formData.email,
          uid
        );
        console.log('🔔 Notificação enviada ao admin: novo cliente cadastrado');
      } catch (notifError) {
        console.error('⚠️ Erro ao enviar notificação (não bloqueante):', notifError);
      }

      // 6. Fazer logout após criar conta
      await auth.signOut();

      // 7. Redirecionar para login com mensagem de sucesso
      navigate('/login', { 
        state: { 
          message: '✅ Conta criada com sucesso! Você já está cadastrado no sistema. Faça login para continuar.' 
        } 
      });
    } catch (err: any) {
      console.error('❌ Erro ao criar conta:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado. Faça login ou use outro email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido. Verifique o formato.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError(`Erro ao criar conta: ${err.message}`);
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Gestão Criativa
            </h1>
          </div>

          {/* Badge de convite do admin */}
          {adminConvite && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900">Convite de</p>
                  <p className="text-lg font-bold text-purple-700">
                    {adminConvite.nomeAgencia || adminConvite.nome}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-purple-600">
                Você foi convidado(a) para se cadastrar como cliente desta agência.
              </p>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Crie sua conta
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Registre-se para acessar o portal do cliente
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">⚠️</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Nome da empresa"
                  required
                />
              </div>
            </div>

            {/* Tipo de Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pessoa *
              </label>
              <select
                name="tipoPessoa"
                value={formData.tipoPessoa}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="juridica">Pessoa Jurídica</option>
                <option value="fisica">Pessoa Física</option>
              </select>
            </div>

            {/* CPF ou CNPJ */}
            {formData.tipoPessoa === 'juridica' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ *
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            )}

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Se vazio, será usado o telefone principal</p>
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Rua, número, complemento"
                />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">UF</option>
                  {estados.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

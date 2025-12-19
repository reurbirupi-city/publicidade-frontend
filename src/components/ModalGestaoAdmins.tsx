import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  Shield,
  ShieldCheck,
  Crown,
  Mail,
  Phone,
  Building2,
  Copy,
  RefreshCw,
  Check,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  Admin,
  AdminRole,
  listarAdmins,
  escutarAdmins,
  criarAdmin,
  atualizarAdmin,
  desativarAdmin,
  reativarAdmin,
  regenerarCodigoConvite,
  getClientesDoAdmin
} from '../services/adminService';

interface ModalGestaoAdminsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalGestaoAdmins: React.FC<ModalGestaoAdminsProps> = ({ isOpen, onClose }) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Admin | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [clientesPorAdmin, setClientesPorAdmin] = useState<Record<string, number>>({});
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    nomeAgencia: '',
    role: 'admin' as AdminRole
  });
  const [showSenha, setShowSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = escutarAdmins((adminsAtualizados) => {
      setAdmins(adminsAtualizados);
      setLoading(false);
      
      // Carregar contagem de clientes por admin
      adminsAtualizados.forEach(async (admin) => {
        const clientes = await getClientesDoAdmin(admin.id);
        setClientesPorAdmin(prev => ({ ...prev, [admin.id]: clientes.length }));
      });
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      if (editando) {
        // Atualizar admin existente
        const sucesso = await atualizarAdmin(editando.id, {
          nome: formData.nome,
          telefone: formData.telefone,
          nomeAgencia: formData.nomeAgencia,
          role: formData.role
        });
        
        if (sucesso) {
          setShowForm(false);
          setEditando(null);
          resetForm();
        } else {
          setErro('Erro ao atualizar administrador.');
        }
      } else {
        // Criar novo admin
        const resultado = await criarAdmin({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          role: formData.role,
          telefone: formData.telefone,
          nomeAgencia: formData.nomeAgencia
        });

        if (resultado.success) {
          setShowForm(false);
          resetForm();
        } else {
          setErro(resultado.error || 'Erro ao criar administrador.');
        }
      }
    } catch (error) {
      setErro('Erro inesperado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      nomeAgencia: '',
      role: 'admin'
    });
    setErro('');
  };

  const handleEditar = (admin: Admin) => {
    setEditando(admin);
    setFormData({
      nome: admin.nome,
      email: admin.email,
      senha: '',
      telefone: admin.telefone || '',
      nomeAgencia: admin.nomeAgencia || '',
      role: admin.role
    });
    setShowForm(true);
  };

  const handleCopiarLink = (admin: Admin) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register?ref=${admin.codigoConvite}`;
    navigator.clipboard.writeText(link);
    setCopiado(admin.id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const handleCopiarCodigo = (admin: Admin) => {
    navigator.clipboard.writeText(admin.codigoConvite);
    setCopiado(`codigo-${admin.id}`);
    setTimeout(() => setCopiado(null), 2000);
  };

  const handleRegenerarCodigo = async (admin: Admin) => {
    const novoCodigo = await regenerarCodigoConvite(admin.id);
    if (novoCodigo) {
      // O listener vai atualizar automaticamente
    }
  };

  const handleToggleAtivo = async (admin: Admin) => {
    if (admin.ativo) {
      await desativarAdmin(admin.id);
    } else {
      await reativarAdmin(admin.id);
    }
  };

  const getRoleIcon = (role: AdminRole) => {
    switch (role) {
      case 'webmaster': return Crown;
      case 'admin': return ShieldCheck;
      case 'colaborador': return Shield;
      default: return Users;
    }
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case 'webmaster': return 'Webmaster';
      case 'admin': return 'Administrador';
      case 'colaborador': return 'Colaborador';
      default: return role;
    }
  };

  const getRoleColor = (role: AdminRole) => {
    switch (role) {
      case 'webmaster': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'admin': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'colaborador': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative z-[101]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gestão de Administradores</h2>
              <p className="text-sm text-purple-100">Gerencie a equipe que atende os clientes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {showForm ? (
            // Formulário de Novo/Editar Admin
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editando ? 'Editar Administrador' : 'Novo Administrador'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditando(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancelar
                </button>
              </div>

              {erro && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
                  {erro}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Nome do administrador"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editando}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    placeholder="email@exemplo.com"
                  />
                </div>

                {!editando && (
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={showSenha ? 'text' : 'password'}
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Agência
                  </label>
                  <input
                    type="text"
                    value={formData.nomeAgencia}
                    onChange={(e) => setFormData({ ...formData, nomeAgencia: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Nome que aparecerá para os clientes"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível de Acesso *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="colaborador">Colaborador - Acesso limitado</option>
                    <option value="admin">Administrador - Acesso completo aos seus clientes</option>
                    <option value="webmaster">Webmaster - Acesso total ao sistema</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {salvando ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editando ? 'Salvar Alterações' : 'Criar Administrador'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Lista de Admins
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Administradores Cadastrados
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {admins.length} administrador{admins.length !== 1 ? 'es' : ''} no sistema
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Novo Admin
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum administrador cadastrado ainda.</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {admins.map((admin) => {
                    const RoleIcon = getRoleIcon(admin.role);
                    return (
                      <div
                        key={admin.id}
                        className={`bg-white dark:bg-gray-800 rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg flex flex-col ${
                          admin.ativo 
                            ? 'border-gray-200 dark:border-gray-700' 
                            : 'border-red-200 dark:border-red-800 opacity-60'
                        }`}
                      >
                        {/* Header do Card */}
                        <div className={`px-4 py-3 ${getRoleColor(admin.role)}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <RoleIcon className="w-5 h-5" />
                              <span className="font-bold text-sm">{getRoleLabel(admin.role)}</span>
                            </div>
                            {!admin.ativo && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                                INATIVO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                              {admin.nome}
                            </h4>
                            {admin.nomeAgencia && admin.nomeAgencia !== admin.nome && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {admin.nomeAgencia}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4" />
                              {admin.email}
                            </p>
                            {admin.telefone && (
                              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Phone className="w-4 h-4" />
                                {admin.telefone}
                              </p>
                            )}
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              {clientesPorAdmin[admin.id] || 0} cliente(s)
                            </p>
                          </div>

                          {/* Código de Convite */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Código de Convite
                            </p>
                            
                            {admin.codigoConvite ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg font-mono text-sm text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-600 truncate">
                                    {admin.codigoConvite}
                                  </code>
                                  <button
                                    onClick={() => handleCopiarCodigo(admin)}
                                    className="p-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors flex-shrink-0"
                                    title="Copiar código"
                                  >
                                    {copiado === `codigo-${admin.id}` ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRegenerarCodigo(admin)}
                                    className="p-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors flex-shrink-0"
                                    title="Gerar novo código"
                                  >
                                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                  </button>
                                </div>
                                
                                {/* Link completo para visualização */}
                                <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Link para clientes:</p>
                                  <p className="text-xs text-purple-600 dark:text-purple-400 font-mono break-all">
                                    {window.location.origin}/register?ref={admin.codigoConvite}
                                  </p>
                                </div>
                                
                                <button
                                  onClick={() => handleCopiarLink(admin)}
                                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-green-500/25"
                                >
                                  {copiado === admin.id ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Link Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="w-4 h-4" />
                                      Copiar Link para Enviar ao Cliente
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <div className="text-center py-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  Este admin não possui código de convite
                                </p>
                                <button
                                  onClick={() => handleRegenerarCodigo(admin)}
                                  className="flex items-center justify-center gap-2 mx-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Gerar Código de Convite
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Ações */}
                          <div className="flex gap-2 pt-2 mt-auto">
                            <button
                              onClick={() => handleEditar(admin)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 py-2 px-3 rounded-lg text-sm font-semibold transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(admin)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                                admin.ativo
                                  ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400'
                                  : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                              }`}
                            >
                              {admin.ativo ? (
                                <>
                                  <UserX className="w-4 h-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4" />
                                  Reativar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalGestaoAdmins;

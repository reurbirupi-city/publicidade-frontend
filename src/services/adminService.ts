import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';

// ============================================================================
// TIPOS
// ============================================================================

export type AdminRole = 'webmaster' | 'admin' | 'colaborador';

export interface Admin {
  id: string;
  nome: string;
  email: string;
  role: AdminRole;
  ativo: boolean;
  dataCriacao: string;
  ultimoAcesso?: string;
  foto?: string;
  telefone?: string;
  // Configurações personalizadas
  nomeAgencia?: string;
  logoAgencia?: string;
  corPrimaria?: string;
  // Link único para cadastro de clientes
  codigoConvite: string;
}

export interface ClienteVinculado {
  clienteId: string;
  adminId: string;
  dataVinculo: string;
}

// ============================================================================
// EMAILS DE WEBMASTER (Super Admin)
// ============================================================================

const WEBMASTER_EMAILS = [
  'admin@agencia.com',
  'admin@admin.com',
  'reurbirupi@gmail.com',
  'tributacao.irupi@gmail.com'
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera um código de convite único para o admin
 */
export const gerarCodigoConvite = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

/**
 * Verifica se o email é de um webmaster
 */
export const isWebmaster = (email: string): boolean => {
  return WEBMASTER_EMAILS.includes(email.toLowerCase());
};

/**
 * Verifica se o usuário é admin (qualquer tipo)
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists() && adminDoc.data()?.ativo === true;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
};

/**
 * Obtém o admin pelo ID
 */
export const getAdminById = async (adminId: string): Promise<Admin | null> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', adminId));
    if (adminDoc.exists()) {
      return { id: adminDoc.id, ...adminDoc.data() } as Admin;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar admin:', error);
    return null;
  }
};

/**
 * Obtém o admin pelo email
 */
export const getAdminByEmail = async (email: string): Promise<Admin | null> => {
  try {
    const q = query(collection(db, 'admins'), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Admin;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar admin por email:', error);
    return null;
  }
};

/**
 * Obtém o admin pelo código de convite
 */
export const getAdminByCodigoConvite = async (codigo: string): Promise<Admin | null> => {
  try {
    const q = query(collection(db, 'admins'), where('codigoConvite', '==', codigo.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Admin;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar admin por código:', error);
    return null;
  }
};

// ============================================================================
// CRUD DE ADMINS
// ============================================================================

/**
 * Lista todos os admins (apenas webmaster pode ver)
 */
export const listarAdmins = async (): Promise<Admin[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
  } catch (error) {
    console.error('Erro ao listar admins:', error);
    return [];
  }
};

/**
 * Escuta mudanças nos admins em tempo real
 */
export const escutarAdmins = (callback: (admins: Admin[]) => void): (() => void) => {
  const unsubscribe = onSnapshot(collection(db, 'admins'), (snapshot) => {
    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
    callback(admins);
  });
  return unsubscribe;
};

/**
 * Cria um novo admin
 */
export const criarAdmin = async (dados: {
  nome: string;
  email: string;
  senha: string;
  role: AdminRole;
  telefone?: string;
  nomeAgencia?: string;
}): Promise<{ success: boolean; error?: string; admin?: Admin }> => {
  try {
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
    const userId = userCredential.user.uid;

    const novoAdmin: Omit<Admin, 'id'> = {
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      role: dados.role,
      ativo: true,
      dataCriacao: new Date().toISOString(),
      telefone: dados.telefone,
      nomeAgencia: dados.nomeAgencia || dados.nome,
      codigoConvite: gerarCodigoConvite()
    };

    await setDoc(doc(db, 'admins', userId), novoAdmin);

    // Também salvar na coleção users para consistência
    await setDoc(doc(db, 'users', userId), {
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      role: dados.role,
      tipo: 'admin',
      dataCriacao: new Date().toISOString()
    });

    console.log('✅ Admin criado:', userId);
    return { success: true, admin: { id: userId, ...novoAdmin } };
  } catch (error: any) {
    console.error('❌ Erro ao criar admin:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Este email já está em uso.' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    
    return { success: false, error: error.message || 'Erro ao criar administrador.' };
  }
};

/**
 * Atualiza um admin
 */
export const atualizarAdmin = async (adminId: string, dados: Partial<Admin>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'admins', adminId), dados);
    console.log('✅ Admin atualizado:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar admin:', error);
    return false;
  }
};

/**
 * Desativa um admin (não deleta)
 */
export const desativarAdmin = async (adminId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'admins', adminId), { ativo: false });
    console.log('✅ Admin desativado:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao desativar admin:', error);
    return false;
  }
};

/**
 * Reativa um admin
 */
export const reativarAdmin = async (adminId: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'admins', adminId), { ativo: true });
    console.log('✅ Admin reativado:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao reativar admin:', error);
    return false;
  }
};

/**
 * Regenera o código de convite do admin
 */
export const regenerarCodigoConvite = async (adminId: string): Promise<string | null> => {
  try {
    const novoCodigo = gerarCodigoConvite();
    await updateDoc(doc(db, 'admins', adminId), { codigoConvite: novoCodigo });
    console.log('✅ Código regenerado:', novoCodigo);
    return novoCodigo;
  } catch (error) {
    console.error('❌ Erro ao regenerar código:', error);
    return null;
  }
};

// ============================================================================
// VINCULAÇÃO CLIENTE-ADMIN
// ============================================================================

/**
 * Vincula um cliente a um admin
 */
export const vincularClienteAoAdmin = async (clienteId: string, adminId: string): Promise<boolean> => {
  try {
    // Atualizar o documento do cliente com o adminId
    await updateDoc(doc(db, 'clientes', clienteId), { 
      adminId,
      dataVinculo: new Date().toISOString()
    });

    // Também atualizar na coleção users
    await updateDoc(doc(db, 'users', clienteId), { 
      adminId 
    });

    console.log('✅ Cliente vinculado ao admin:', { clienteId, adminId });
    return true;
  } catch (error) {
    console.error('❌ Erro ao vincular cliente:', error);
    return false;
  }
};

/**
 * Obtém todos os clientes de um admin específico
 */
export const getClientesDoAdmin = async (adminId: string): Promise<any[]> => {
  try {
    const q = query(collection(db, 'clientes'), where('adminId', '==', adminId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar clientes do admin:', error);
    return [];
  }
};

/**
 * Obtém todas as solicitações de clientes de um admin
 */
export const getSolicitacoesDoAdmin = async (adminId: string): Promise<any[]> => {
  try {
    // Primeiro, pegar os IDs dos clientes do admin
    const clientes = await getClientesDoAdmin(adminId);
    const clienteIds = clientes.map(c => c.id);

    if (clienteIds.length === 0) return [];

    // Buscar solicitações desses clientes
    const q = query(
      collection(db, 'solicitacoes_clientes'),
      where('clienteId', 'in', clienteIds.slice(0, 10)) // Firestore limita a 10 items no 'in'
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar solicitações do admin:', error);
    return [];
  }
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

/**
 * Inicializa/atualiza o admin na coleção admins quando faz login
 */
export const inicializarAdmin = async (userId: string, email: string, nome?: string): Promise<Admin | null> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    
    if (adminDoc.exists()) {
      // Atualizar último acesso
      await updateDoc(doc(db, 'admins', userId), {
        ultimoAcesso: new Date().toISOString()
      });
      return { id: adminDoc.id, ...adminDoc.data() } as Admin;
    }

    // Se não existe e é webmaster, criar automaticamente
    if (isWebmaster(email)) {
      const novoAdmin: Omit<Admin, 'id'> = {
        nome: nome || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'webmaster',
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString(),
        codigoConvite: gerarCodigoConvite(),
        nomeAgencia: 'Agência Principal'
      };

      await setDoc(doc(db, 'admins', userId), novoAdmin);
      console.log('✅ Webmaster inicializado:', userId);
      return { id: userId, ...novoAdmin };
    }

    return null;
  } catch (error) {
    console.error('Erro ao inicializar admin:', error);
    return null;
  }
};

export default {
  isWebmaster,
  isAdmin,
  getAdminById,
  getAdminByEmail,
  getAdminByCodigoConvite,
  listarAdmins,
  escutarAdmins,
  criarAdmin,
  atualizarAdmin,
  desativarAdmin,
  reativarAdmin,
  regenerarCodigoConvite,
  vincularClienteAoAdmin,
  getClientesDoAdmin,
  getSolicitacoesDoAdmin,
  inicializarAdmin,
  gerarCodigoConvite
};

/**
 * CAMADA DE INTEGRAÇÃO DE DADOS
 * 
 * Gerencia a sincronização e consistência de dados entre:
 * - CRM (Clientes)
 * - Projetos
 * - Agenda (Eventos)
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, updateDoc, getDoc } from 'firebase/firestore';

// ============================================================================
// TIPOS E INTERFACES COMPARTILHADAS
// ============================================================================

// Importamos os tipos diretamente das páginas para garantir compatibilidade
// Mas aqui definimos interfaces mínimas para interoperabilidade

export interface ClienteBase {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo' | 'prospect';
  valorTotal: number;
  projetos: number;
  [key: string]: any;
}

export interface ProjetoBase {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  valorContratado: number;
  valorPago: number;
  status: string;
  [key: string]: any;
}

export interface EventoBase {
  id: string;
  titulo: string;
  data: string;
  cliente?: string;
  projeto?: string;
  projetoId?: string;
  concluido: boolean;
  [key: string]: any;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  CLIENTES: 'clientes_v1',
  PROJETOS: 'projetos_v1',
  EVENTOS: 'eventos_v1',
};

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

export const getClientes = (): ClienteBase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    console.log('🔍 getClientes - localStorage raw:', raw);
    if (raw) {
      const clientes = JSON.parse(raw);
      console.log('✅ getClientes - Parsed:', clientes.length, 'clientes');
      return clientes;
    }
  } catch (err) {
    console.error('❌ Erro ao carregar clientes:', err);
  }
  console.log('⚠️ getClientes - Retornando array vazio');
  return [];
};

export const getProjetos = (): ProjetoBase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJETOS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao carregar projetos:', err);
  }
  return [];
};

export const getEventos = (): EventoBase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTOS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao carregar eventos:', err);
  }
  return [];
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

export const saveClientes = (clientes: ClienteBase[]): void => {
  try {
    console.log('💾 saveClientes - Salvando', clientes.length, 'clientes');
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    console.log('✅ saveClientes - Salvo com sucesso');
  } catch (err) {
    console.error('❌ Erro ao salvar clientes:', err);
  }
};

export const saveProjetos = (projetos: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify(projetos));
  } catch (err) {
    console.error('Erro ao salvar projetos:', err);
  }
};

export const saveEventos = (eventos: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTOS, JSON.stringify(eventos));
  } catch (err) {
    console.error('Erro ao salvar eventos:', err);
  }
};

// ============================================================================
// FUNÇÕES DE BUSCA E RELACIONAMENTO
// ============================================================================

/**
 * Busca cliente por ID
 */
export const getClienteById = (clienteId: string): ClienteBase | null => {
  const clientes = getClientes();
  return clientes.find(c => c.id === clienteId) || null;
};

/**
 * Busca cliente por ID - versão assíncrona que também busca no Firestore
 * Primeiro tenta localStorage, depois Firestore se não encontrar
 */
export const getClienteByIdAsync = async (clienteId: string): Promise<ClienteBase | null> => {
  // Primeiro tenta no localStorage
  const clientes = getClientes();
  const clienteLocal = clientes.find(c => c.id === clienteId);
  if (clienteLocal) {
    return clienteLocal;
  }
  
  // Se não encontrou no localStorage, busca no Firestore
  try {
    const docRef = doc(db, 'clientes', clienteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || data.displayName || '',
        empresa: data.empresa || '',
        email: data.email || '',
        telefone: data.telefone || data.phone || '',
        status: data.status || 'ativo',
        valorTotal: data.valorTotal || 0,
        projetos: data.projetos || 0,
        ...data
      } as ClienteBase;
    }
  } catch (error) {
    console.error('Erro ao buscar cliente no Firestore:', error);
  }
  
  return null;
};

/**
 * Busca todos os projetos de um cliente
 */
export const getProjetosByCliente = (clienteId: string): ProjetoBase[] => {
  const projetos = getProjetos();
  return projetos.filter(p => p.clienteId === clienteId);
};

/**
 * Busca todos os eventos de um cliente
 */
export const getEventosByCliente = (clienteNome: string): EventoBase[] => {
  const eventos = getEventos();
  return eventos.filter(e => e.cliente === clienteNome);
};

/**
 * Busca todos os eventos de um projeto
 */
export const getEventosByProjeto = (projetoId: string): EventoBase[] => {
  const eventos = getEventos();
  return eventos.filter(e => e.projetoId === projetoId);
};

/**
 * Busca projeto por ID
 */
export const getProjetoById = (projetoId: string): ProjetoBase | null => {
  const projetos = getProjetos();
  return projetos.find(p => p.id === projetoId) || null;
};

// ============================================================================
// FUNÇÕES DE SINCRONIZAÇÃO E ATUALIZAÇÃO
// ============================================================================

/**
 * Atualiza o nome do cliente em todos os lugares onde ele aparece
 */
export const syncClienteNomeChange = (clienteId: string, novoNome: string, novaEmpresa: string): void => {
  console.log(`🔄 Sincronizando mudança de cliente ${clienteId}: ${novoNome} / ${novaEmpresa}`);
  
  // Atualiza projetos
  const projetos = getProjetos();
  const projetosAtualizados = projetos.map(p => 
    p.clienteId === clienteId 
      ? { ...p, clienteNome: novoNome, clienteEmpresa: novaEmpresa }
      : p
  );
  saveProjetos(projetosAtualizados);
  
  // Atualiza eventos
  const eventos = getEventos();
  const eventosAtualizados = eventos.map(e => 
    e.cliente === novoNome || getClienteById(clienteId)?.nome === e.cliente
      ? { ...e, cliente: novoNome }
      : e
  );
  saveEventos(eventosAtualizados);
  
  console.log('✅ Sincronização de cliente concluída');
};

/**
 * Atualiza o título do projeto em todos os lugares onde ele aparece
 */
export const syncProjetoTituloChange = (projetoId: string, novoTitulo: string): void => {
  console.log(`🔄 Sincronizando mudança de projeto ${projetoId}: ${novoTitulo}`);
  
  // Atualiza eventos
  const eventos = getEventos();
  const eventosAtualizados = eventos.map(e => 
    e.projetoId === projetoId 
      ? { ...e, projeto: novoTitulo }
      : e
  );
  saveEventos(eventosAtualizados);
  
  console.log('✅ Sincronização de projeto concluída');
};

/**
 * Recalcula totais do cliente (valor total e número de projetos)
 */
export const recalcularTotaisCliente = (clienteId: string): void => {
  const projetos = getProjetosByCliente(clienteId);
  const clientes = getClientes();
  
  const valorTotal = projetos.reduce((sum, p) => sum + p.valorContratado, 0);
  const numProjetos = projetos.length;
  
  const clientesAtualizados = clientes.map(c =>
    c.id === clienteId
      ? { ...c, valorTotal, projetos: numProjetos }
      : c
  );
  
  saveClientes(clientesAtualizados);
  console.log(`💰 Totais do cliente ${clienteId} recalculados: R$ ${valorTotal} / ${numProjetos} projetos`);
};

/**
 * Remove todas as referências ao cliente quando ele for deletado
 */
export const deleteClienteAndRelations = (clienteId: string): void => {
  console.log(`🗑️ Removendo cliente ${clienteId} e suas relações`);
  
  // Remove cliente
  const clientes = getClientes();
  const clientesAtualizados = clientes.filter(c => c.id !== clienteId);
  saveClientes(clientesAtualizados);
  
  // Remove projetos do cliente (ou marca como órfãos)
  const projetos = getProjetos();
  const projetosAtualizados = projetos.filter(p => p.clienteId !== clienteId);
  saveProjetos(projetosAtualizados);
  
  // Remove eventos do cliente
  const cliente = clientes.find(c => c.id === clienteId);
  if (cliente) {
    const eventos = getEventos();
    const eventosAtualizados = eventos.filter(e => e.cliente !== cliente.nome);
    saveEventos(eventosAtualizados);
  }
  
  console.log('✅ Cliente e relações removidos');
};

/**
 * Remove todas as referências ao projeto quando ele for deletado
 */
export const deleteProjetoAndRelations = (projetoId: string): void => {
  console.log(`🗑️ Removendo projeto ${projetoId} e suas relações`);
  
  const projeto = getProjetoById(projetoId);
  
  // Remove projeto
  const projetos = getProjetos();
  const projetosAtualizados = projetos.filter(p => p.id !== projetoId);
  saveProjetos(projetosAtualizados);
  
  // Remove eventos do projeto
  const eventos = getEventos();
  const eventosAtualizados = eventos.filter(e => e.projetoId !== projetoId);
  saveEventos(eventosAtualizados);
  
  // Recalcula totais do cliente
  if (projeto) {
    recalcularTotaisCliente(projeto.clienteId);
  }
  
  console.log('✅ Projeto e relações removidos');
};

// ============================================================================
// FUNÇÕES DE CRIAÇÃO COM INTEGRAÇÃO
// ============================================================================

/**
 * Cria um novo projeto e atualiza totais do cliente
 */
export const createProjetoWithSync = async (projeto: any): Promise<void> => {
  // Garantir que o projeto tenha o campo entregas inicializado
  const projetoComEntregas = {
    ...projeto,
    entregas: projeto.entregas || [],
  };
  
  const projetos = getProjetos();
  projetos.push(projetoComEntregas);
  saveProjetos(projetos);
  
  // Buscar dados adicionais do cliente para garantir que o projeto possa ser encontrado
  const cliente = getClienteById(projetoComEntregas.clienteId);
  
  // Salvar no Firestore
  try {
    const projetoParaFirestore = {
      ...projetoComEntregas,
      // Incluir email do cliente para facilitar busca no portal do cliente
      clienteEmail: cliente?.email || projetoComEntregas.clienteEmail || '',
      syncedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'projetos', projetoComEntregas.id), projetoParaFirestore);
    console.log(`✅ Projeto ${projetoComEntregas.id} salvo no Firestore`);
  } catch (error) {
    console.error('❌ Erro ao salvar projeto no Firestore:', error);
  }
  
  // Recalcula totais do cliente
  recalcularTotaisCliente(projetoComEntregas.clienteId);
  
  console.log(`✅ Projeto ${projetoComEntregas.id} criado e sincronizado`);
};

/**
 * Atualiza um projeto e sincroniza mudanças
 */
export const updateProjetoWithSync = (projetoId: string, updates: any): void => {
  const projetos = getProjetos();
  const projetoAntigo = projetos.find(p => p.id === projetoId);
  
  const projetosAtualizados = projetos.map(p =>
    p.id === projetoId ? { ...p, ...updates } : p
  );
  saveProjetos(projetosAtualizados);
  
  // Se mudou o título, sincroniza eventos
  if (updates.titulo && projetoAntigo && updates.titulo !== projetoAntigo.titulo) {
    syncProjetoTituloChange(projetoId, updates.titulo);
  }
  
  // Se mudou o cliente, recalcula totais
  if (updates.clienteId && projetoAntigo && updates.clienteId !== projetoAntigo.clienteId) {
    recalcularTotaisCliente(projetoAntigo.clienteId); // cliente antigo
    recalcularTotaisCliente(updates.clienteId); // cliente novo
  }
  
  // Se mudou o valor, recalcula totais
  if (updates.valorContratado !== undefined && projetoAntigo) {
    recalcularTotaisCliente(projetoAntigo.clienteId);
  }
  
  console.log(`✅ Projeto ${projetoId} atualizado e sincronizado`);
};

/**
 * Retorna estatísticas integradas do sistema
 */
export const getSystemStats = () => {
  const clientes = getClientes();
  const projetos = getProjetos();
  const eventos = getEventos();
  
  return {
    totalClientes: clientes.length,
    clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
    totalProjetos: projetos.length,
    projetosAtivos: projetos.filter(p => p.status === 'em_andamento').length,
    totalEventos: eventos.length,
    eventosHoje: eventos.filter(e => e.data === new Date().toISOString().split('T')[0]).length,
    valorTotalContratos: projetos.reduce((sum, p) => sum + p.valorContratado, 0),
    valorTotalPago: projetos.reduce((sum, p) => sum + p.valorPago, 0),
  };
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida se um cliente existe antes de criar projeto/evento
 */
export const validateClienteExists = (clienteId: string): boolean => {
  const cliente = getClienteById(clienteId);
  if (!cliente) {
    console.warn(`⚠️ Cliente ${clienteId} não encontrado`);
    return false;
  }
  return true;
};

/**
 * Valida se um projeto existe antes de criar evento
 */
export const validateProjetoExists = (projetoId: string): boolean => {
  const projeto = getProjetoById(projetoId);
  if (!projeto) {
    console.warn(`⚠️ Projeto ${projetoId} não encontrado`);
    return false;
  }
  return true;
};

/**
 * Lista de clientes para dropdown (id + nome formatado)
 */
export const getClientesDropdown = () => {
  const clientes = getClientes();
  console.log('📋 getClientesDropdown - Total:', clientes.length);
  const dropdown = clientes.map(c => ({
    value: c.id,
    label: `${c.nome} - ${c.empresa}`,
    cliente: c
  }));
  console.log('📋 getClientesDropdown - Dropdown:', dropdown);
  return dropdown;
};

// ============================================================================
// ATUALIZAÇÃO AUTOMÁTICA DE STATUS DO CLIENTE
// ============================================================================

/**
 * Atualiza automaticamente o status e etapa do funil do cliente
 */
export const atualizarStatusCliente = async (
  clienteId: string, 
  novoStatus: 'prospect' | 'ativo' | 'inativo',
  novaEtapaFunil?: 'prospect' | 'contato' | 'proposta' | 'negociacao' | 'contratado' | 'ativo' | 'inativo' | 'perdido'
): Promise<void> => {
  try {
    const clientes = getClientes();
    const clienteIndex = clientes.findIndex(c => c.id === clienteId);
    
    if (clienteIndex === -1) {
      console.warn(`⚠️ Cliente ${clienteId} não encontrado`);
      return;
    }

    const cliente = clientes[clienteIndex];
    const statusAnterior = cliente.status;
    const etapaAnterior = cliente.etapaFunil;

    // Atualizar status e etapa
    clientes[clienteIndex] = {
      ...cliente,
      status: novoStatus,
      etapaFunil: novaEtapaFunil || cliente.etapaFunil,
      dataMudancaEtapa: new Date().toISOString().split('T')[0],
    };

    // Salvar no localStorage
    saveClientes(clientes);
    
    // Salvar no Firestore - usar updateDoc para preservar campos como adminId
    try {
      await updateDoc(doc(db, 'clientes', clienteId), {
        status: novoStatus,
        etapaFunil: novaEtapaFunil || cliente.etapaFunil,
        dataMudancaEtapa: new Date().toISOString().split('T')[0],
        syncedAt: new Date().toISOString(),
      });
      console.log(`✅ Status do cliente ${clienteId} atualizado: ${statusAnterior} → ${novoStatus} | Etapa: ${etapaAnterior} → ${novaEtapaFunil || etapaAnterior}`);
    } catch (firestoreError) {
      console.error('❌ Erro ao atualizar status no Firestore:', firestoreError);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status do cliente:', error);
  }
};/**
 * Lista de projetos para dropdown (id + título)
 */
export const getProjetosDropdown = (clienteId?: string) => {
  let projetos = getProjetos();
  
  if (clienteId) {
    projetos = projetos.filter(p => p.clienteId === clienteId);
  }
  
  return projetos.map(p => ({
    value: p.id,
    label: `${p.id} - ${p.titulo}`,
    projeto: p
  }));
};

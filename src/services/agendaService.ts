import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TIPOS
// ============================================================================

export interface RecorrenciaEvento {
  ativa: boolean;
  tipo: 'diaria' | 'semanal' | 'mensal';
  intervalo: number;
  diasSemana?: number[];
  diaDoMes?: number;
  dataFim?: string;
  ocorrencias?: number;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: 'reuniao' | 'deadline' | 'foco' | 'ligacao' | 'outro';
  prioridade: 'alta' | 'media' | 'baixa';
  cliente?: string;
  projeto?: string;
  projetoId?: string;
  etapaProjeto?: 'briefing' | 'criacao' | 'revisao' | 'ajustes' | 'aprovacao' | 'entrega';
  local?: string;
  participantes?: string[];
  cor: string;
  concluido: boolean;
  alertaMinutos?: number;
  recorrencia?: RecorrenciaEvento;
  eventoRecorrentePaiId?: string;
  templateId?: string;
  adminId?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface EventoTemplate {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'reuniao' | 'deadline' | 'foco' | 'ligacao' | 'outro';
  duracaoMinutos: number;
  cor: string;
  checklist?: string[];
}

// ============================================================================
// CRUD DE EVENTOS
// ============================================================================

/**
 * Cria um novo evento na agenda
 */
export const criarEvento = async (
  evento: Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>, 
  adminId?: string
): Promise<Evento | null> => {
  try {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const agora = new Date().toISOString();
    
    const novoEvento: Evento = {
      ...evento,
      id,
      adminId: adminId || evento.adminId,
      criadoEm: agora,
      atualizadoEm: agora
    };
    
    console.log('📅 Salvando evento no Firestore:', { id, titulo: novoEvento.titulo, adminId: novoEvento.adminId });
    await setDoc(doc(db, 'agenda', id), novoEvento);
    console.log('✅ Evento criado com sucesso:', novoEvento.titulo);
    return novoEvento;
  } catch (error) {
    console.error('❌ Erro ao criar evento:', error);
    return null;
  }
};

/**
 * Cria múltiplos eventos (para recorrência)
 */
export const criarEventosEmLote = async (
  eventos: Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm'>[], 
  adminId?: string
): Promise<Evento[]> => {
  const eventosCriados: Evento[] = [];
  const agora = new Date().toISOString();
  
  for (const evento of eventos) {
    try {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9) + eventosCriados.length;
      const novoEvento: Evento = {
        ...evento,
        id,
        adminId: adminId || evento.adminId,
        criadoEm: agora,
        atualizadoEm: agora
      };
      
      await setDoc(doc(db, 'agenda', id), novoEvento);
      eventosCriados.push(novoEvento);
    } catch (error) {
      console.error('❌ Erro ao criar evento em lote:', error);
    }
  }
  
  console.log(`✅ ${eventosCriados.length} eventos criados em lote`);
  return eventosCriados;
};

/**
 * Atualiza um evento existente
 */
export const atualizarEvento = async (id: string, dados: Partial<Evento>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'agenda', id), {
      ...dados,
      atualizadoEm: new Date().toISOString()
    });
    console.log('✅ Evento atualizado:', id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error);
    return false;
  }
};

/**
 * Deleta um evento
 */
export const deletarEvento = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'agenda', id));
    console.log('✅ Evento deletado:', id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
    return false;
  }
};

/**
 * Deleta todos os eventos de uma recorrência
 */
export const deletarEventosRecorrencia = async (eventoRecorrentePaiId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'agenda'),
      where('eventoRecorrentePaiId', '==', eventoRecorrentePaiId)
    );
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => deleteDoc(docSnap.ref));
    await Promise.all(promises);
    
    // Deletar também o evento pai
    await deleteDoc(doc(db, 'agenda', eventoRecorrentePaiId));
    
    console.log(`✅ ${snapshot.size + 1} eventos da recorrência deletados`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar eventos da recorrência:', error);
    return false;
  }
};

/**
 * Busca todos os eventos de um admin
 */
export const buscarEventos = async (adminId?: string): Promise<Evento[]> => {
  try {
    let q;
    if (adminId) {
      q = query(
        collection(db, 'agenda'),
        where('adminId', '==', adminId),
        orderBy('data', 'asc')
      );
    } else {
      q = query(collection(db, 'agenda'), orderBy('data', 'asc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => docSnap.data() as Evento);
  } catch (error) {
    console.error('❌ Erro ao buscar eventos:', error);
    return [];
  }
};

/**
 * Busca eventos por período
 */
export const buscarEventosPorPeriodo = async (
  dataInicio: string, 
  dataFim: string, 
  adminId?: string
): Promise<Evento[]> => {
  try {
    let q;
    if (adminId) {
      q = query(
        collection(db, 'agenda'),
        where('adminId', '==', adminId),
        where('data', '>=', dataInicio),
        where('data', '<=', dataFim),
        orderBy('data', 'asc')
      );
    } else {
      q = query(
        collection(db, 'agenda'),
        where('data', '>=', dataInicio),
        where('data', '<=', dataFim),
        orderBy('data', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => docSnap.data() as Evento);
  } catch (error) {
    console.error('❌ Erro ao buscar eventos por período:', error);
    return [];
  }
};

/**
 * Escuta mudanças nos eventos em tempo real
 */
export const escutarEventos = (
  adminId: string | undefined,
  callback: (eventos: Evento[]) => void
): (() => void) => {
  let q;
  
  if (adminId) {
    q = query(
      collection(db, 'agenda'),
      where('adminId', '==', adminId)
    );
  } else {
    q = collection(db, 'agenda');
  }
  
  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const eventos: Evento[] = snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => docSnap.data() as Evento);
    // Ordenar localmente por data
    eventos.sort((a: Evento, b: Evento) => a.data.localeCompare(b.data));
    callback(eventos);
  }, (error: Error) => {
    console.error('❌ Erro ao escutar eventos:', error);
    callback([]);
  });
  
  return unsubscribe;
};

/**
 * Marca/desmarca evento como concluído
 */
export const toggleEventoConcluido = async (id: string, concluido: boolean): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'agenda', id), {
      concluido,
      atualizadoEm: new Date().toISOString()
    });
    console.log(`✅ Evento ${concluido ? 'concluído' : 'reaberto'}:`, id);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar status do evento:', error);
    return false;
  }
};

/**
 * Busca eventos do dia
 */
export const buscarEventosDoDia = async (data: string, adminId?: string): Promise<Evento[]> => {
  try {
    let q;
    if (adminId) {
      q = query(
        collection(db, 'agenda'),
        where('adminId', '==', adminId),
        where('data', '==', data)
      );
    } else {
      q = query(
        collection(db, 'agenda'),
        where('data', '==', data)
      );
    }
    
    const snapshot = await getDocs(q);
    const eventos: Evento[] = snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => docSnap.data() as Evento);
    // Ordenar por hora de início
    eventos.sort((a: Evento, b: Evento) => a.horaInicio.localeCompare(b.horaInicio));
    return eventos;
  } catch (error) {
    console.error('❌ Erro ao buscar eventos do dia:', error);
    return [];
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  criarEvento,
  criarEventosEmLote,
  atualizarEvento,
  deletarEvento,
  deletarEventosRecorrencia,
  buscarEventos,
  buscarEventosPorPeriodo,
  escutarEventos,
  toggleEventoConcluido,
  buscarEventosDoDia
};

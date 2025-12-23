import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TIPOS DE NOTIFICAÇÃO
// ============================================================================

export type TipoNotificacao = 
  | 'novo_cliente'            // Novo cliente cadastrado
  | 'nova_solicitacao'        // Cliente solicitou serviço
  | 'nova_mensagem'           // Nova mensagem recebida
  | 'proposta_enviada'        // Admin enviou proposta
  | 'proposta_aceita'         // Cliente aceitou proposta
  | 'proposta_recusada'       // Cliente recusou proposta
  | 'contrato_disponivel'     // Contrato pronto para assinar
  | 'contrato_assinado'       // Cliente assinou contrato
  | 'projeto_criado'          // Novo projeto criado
  | 'projeto_atualizado'      // Status do projeto mudou
  | 'aguardando_aprovacao'    // Projeto aguardando aprovação do cliente
  | 'projeto_aprovado'        // Cliente aprovou projeto
  | 'projeto_concluido'       // Projeto concluído
  | 'pagamento_recebido'      // Pagamento confirmado
  | 'lembrete_prazo'          // Lembrete de prazo
  | 'feedback_negativo'       // Feedback negativo do cliente (rating <= 2)
  | 'feedback_recebido'       // Feedback recebido do cliente
  | 'sistema';                // Notificação do sistema

export type DestinatarioTipo = 'admin' | 'cliente';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  destinatarioTipo: DestinatarioTipo;
  destinatarioId: string; // 'admin' para admin ou UID do cliente
  remetenteNome?: string;
  referenciaId?: string; // ID do projeto, solicitação, etc.
  referenciaTipo?: 'projeto' | 'solicitacao' | 'contrato' | 'proposta';
  lida: boolean;
  criadaEm: string;
  lidaEm?: string;
  link?: string; // Link para navegação
  icone?: string; // Emoji ou ícone
  prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente';
  // Campos para feedback negativo persistente
  persistente?: boolean; // Notificação que não some até ser resolvida
  resolvidaEm?: string;  // Data em que foi resolvida
  requerAcao?: boolean;  // Indica que requer ação do admin
}

// ============================================================================
// FUNÇÕES DE CRIAÇÃO DE NOTIFICAÇÃO
// ============================================================================

/**
 * Cria uma nova notificação no Firestore
 */
export const criarNotificacao = async (
  notificacao: Omit<Notificacao, 'id' | 'lida' | 'criadaEm'>
): Promise<string> => {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const novaNotificacao: Notificacao = {
      ...notificacao,
      id,
      lida: false,
      criadaEm: new Date().toISOString()
    };

    console.log('📤 Tentando criar notificação:', novaNotificacao);
    await setDoc(doc(db, 'notificacoes', id), novaNotificacao);
    console.log('✅ Notificação criada com sucesso:', novaNotificacao.titulo, '| ID:', id);
    return id;
  } catch (error: any) {
    console.error('❌ Erro ao criar notificação:', error);
    console.error('❌ Código do erro:', error?.code);
    console.error('❌ Mensagem:', error?.message);
    // Não propagar o erro para não quebrar o fluxo principal
    return '';
  }
};

/**
 * Marca notificação como lida
 */
export const marcarComoLida = async (notificacaoId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'notificacoes', notificacaoId), {
      lida: true,
      lidaEm: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
  }
};

/**
 * Marca todas as notificações como lidas
 */
export const marcarTodasComoLidas = async (
  destinatarioTipo: DestinatarioTipo,
  destinatarioId: string
): Promise<void> => {
  try {
    const notificacoesRef = collection(db, 'notificacoes');
    const q = query(
      notificacoesRef,
      where('destinatarioTipo', '==', destinatarioTipo),
      where('destinatarioId', '==', destinatarioId),
      where('lida', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { lida: true, lidaEm: new Date().toISOString() })
    );
    
    await Promise.all(updates);
    console.log(`✅ ${snapshot.size} notificações marcadas como lidas`);
  } catch (error) {
    console.error('❌ Erro ao marcar todas como lidas:', error);
  }
};

/**
 * Busca notificações do usuário
 */
export const buscarNotificacoes = async (
  destinatarioTipo: DestinatarioTipo,
  destinatarioId: string,
  apenasNaoLidas: boolean = false,
  limite: number = 50
): Promise<Notificacao[]> => {
  try {
    const notificacoesRef = collection(db, 'notificacoes');
    let q;
    
    if (apenasNaoLidas) {
      q = query(
        notificacoesRef,
        where('destinatarioTipo', '==', destinatarioTipo),
        where('destinatarioId', '==', destinatarioId),
        where('lida', '==', false),
        orderBy('criadaEm', 'desc'),
        limit(limite)
      );
    } else {
      q = query(
        notificacoesRef,
        where('destinatarioTipo', '==', destinatarioTipo),
        where('destinatarioId', '==', destinatarioId),
        orderBy('criadaEm', 'desc'),
        limit(limite)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notificacao);
  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error);
    return [];
  }
};

/**
 * Listener em tempo real para notificações
 * 
 * Lógica de roteamento:
 * - Webmaster (destinatarioId='webmaster'): Recebe notificações de admins e clientes sem admin
 * - Admin (destinatarioId=userId): Recebe notificações dos SEUS clientes
 * - Cliente (destinatarioId=clienteId): Recebe suas notificações específicas
 */
export const escutarNotificacoes = (
  destinatarioTipo: DestinatarioTipo,
  destinatarioId: string,
  callback: (notificacoes: Notificacao[]) => void
): (() => void) => {
  console.log('🔔 Iniciando listener de notificações para:', { destinatarioTipo, destinatarioId });
  
  const notificacoesRef = collection(db, 'notificacoes');
  
  // Agora todos os tipos usam filtro por destinatarioId específico
  // Admin usa seu userId, cliente usa seu clienteId
  let q = query(
    notificacoesRef,
    where('destinatarioTipo', '==', destinatarioTipo),
    where('destinatarioId', '==', destinatarioId),
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    console.log('📥 Snapshot recebido para', destinatarioTipo, '- docs:', snapshot.docs.length);
    
    // Mapear e ordenar no cliente
    const notificacoes = snapshot.docs.map(doc => {
      const data = doc.data() as Notificacao;
      console.log('  - Notificação:', data.titulo, '| tipo:', data.destinatarioTipo, '| destId:', data.destinatarioId);
      return data;
    });
    
    // Ordenar por data no cliente
    const notificacoesOrdenadas = notificacoes.sort((a, b) => 
      new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime()
    );
    
    console.log('📥 Total notificações:', notificacoesOrdenadas.length);
    callback(notificacoesOrdenadas);
  }, (error) => {
    console.error('❌ Erro no listener de notificações:', error);
    console.error('❌ Código:', error.code, '| Mensagem:', error.message);
    
    // Fallback: buscar sem filtro complexo
    if (error.code === 'failed-precondition') {
      console.log('⚠️ Tentando query simplificada...');
      const qSimples = query(notificacoesRef, limit(100));
      onSnapshot(qSimples, (snapshot) => {
        const todas = snapshot.docs.map(doc => doc.data() as Notificacao);
        const filtradas = todas.filter(n => {
          if (destinatarioTipo === 'admin') {
            return n.destinatarioTipo === 'admin';
          }
          return n.destinatarioTipo === 'cliente' && n.destinatarioId === destinatarioId;
        }).sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
        console.log('📥 Fallback - notificações filtradas:', filtradas.length);
        callback(filtradas);
      });
    }
  });

  return unsubscribe;
};

// ============================================================================
// FUNÇÕES HELPER PARA CRIAR NOTIFICAÇÕES ESPECÍFICAS
// ============================================================================

/**
 * Notifica webmaster sobre novo admin cadastrado
 */
export const notificarNovoAdmin = async (
  adminNome: string,
  adminEmail: string,
  adminRole: string
): Promise<void> => {
  console.log('📤 notificarNovoAdmin chamada:', { adminNome, adminEmail, adminRole });
  
  const roleLabel = adminRole === 'webmaster' ? 'Webmaster' : 'Administrador';
  
  await criarNotificacao({
    tipo: 'sistema',
    titulo: '👑 Novo Administrador Cadastrado!',
    mensagem: `${adminNome} (${adminEmail}) foi cadastrado como ${roleLabel}. O novo admin já pode acessar o sistema.`,
    destinatarioTipo: 'admin',
    destinatarioId: 'webmaster',
    remetenteNome: adminNome,
    link: '/dashboard',
    icone: '👑',
    prioridade: 'alta'
  });
};

/**
 * Notifica admin sobre novo cliente cadastrado
 * @param adminId - ID específico do admin (se cliente veio por link de convite)
 *                  Se não fornecido, notifica o webmaster (sistema)
 */
export const notificarNovoCliente = async (
  clienteNome: string,
  clienteEmpresa: string,
  clienteEmail: string,
  clienteId: string,
  adminId?: string  // ID do admin que convidou o cliente
): Promise<void> => {
  console.log('📤 notificarNovoCliente chamada:', { clienteNome, clienteEmpresa, clienteEmail, adminId });
  
  // Se tem adminId, notifica o admin específico
  // Senão, notifica o webmaster (cliente veio sem link de convite)
  const destinatario = adminId || 'webmaster';
  
  await criarNotificacao({
    tipo: 'novo_cliente',
    titulo: '👤 Novo Cliente Cadastrado!',
    mensagem: `${clienteNome} (${clienteEmpresa}) acabou de se cadastrar. Email: ${clienteEmail}. 📌 Aguarde o cliente fazer uma solicitação de serviço para iniciar o fluxo de contratação.`,
    destinatarioTipo: 'admin',
    destinatarioId: destinatario,
    remetenteNome: clienteNome,
    referenciaId: clienteId,
    referenciaTipo: 'solicitacao',
    link: '/crm',
    icone: '👤',
    prioridade: 'alta'
  });
};

/**
 * Notifica admin sobre nova solicitação de serviço
 * @param adminId - ID específico do admin (se cliente tem adminId)
 */
export const notificarNovaSolicitacao = async (
  clienteNome: string,
  servicoTitulo: string,
  solicitacaoId: string,
  adminId?: string  // ID do admin do cliente
): Promise<void> => {
  console.log('📤 notificarNovaSolicitacao chamada:', { clienteNome, servicoTitulo, solicitacaoId, adminId });
  
  // Se tem adminId, notifica o admin específico
  // Senão, notifica o webmaster
  const destinatario = adminId || 'webmaster';
  
  await criarNotificacao({
    tipo: 'nova_solicitacao',
    titulo: '📋 Nova Solicitação de Serviço!',
    mensagem: `${clienteNome} solicitou: ${servicoTitulo}. 📌 PRÓXIMOS PASSOS: 1) Acesse Solicitações 2) Envie uma Proposta 3) Aguarde o cliente aceitar 4) Envie o Contrato 5) Após assinatura, crie o Projeto.`,
    destinatarioTipo: 'admin',
    destinatarioId: destinatario,
    remetenteNome: clienteNome,
    referenciaId: solicitacaoId,
    referenciaTipo: 'solicitacao',
    link: '/solicitacoes',
    icone: '📋',
    prioridade: 'alta'
  });
};

/**
 * Notifica cliente sobre proposta enviada
 */
export const notificarPropostaEnviada = async (
  clienteId: string,
  clienteNome: string,
  valorProposta: number,
  solicitacaoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'proposta_enviada',
    titulo: '💰 Nova Proposta Disponível',
    mensagem: `Recebemos sua solicitação e enviamos uma proposta de R$ ${valorProposta.toLocaleString('pt-BR')}`,
    destinatarioTipo: 'cliente',
    destinatarioId: clienteId,
    referenciaId: solicitacaoId,
    referenciaTipo: 'proposta',
    link: '/portal',
    icone: '💰',
    prioridade: 'alta'
  });
};

/**
 * Notifica admin sobre proposta aceita
 */
export const notificarPropostaAceita = async (
  clienteNome: string,
  servicoTitulo: string,
  solicitacaoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'proposta_aceita',
    titulo: '🎉 Proposta Aceita!',
    mensagem: `${clienteNome} aceitou a proposta para: ${servicoTitulo}`,
    destinatarioTipo: 'admin',
    destinatarioId: 'admin',
    remetenteNome: clienteNome,
    referenciaId: solicitacaoId,
    referenciaTipo: 'proposta',
    link: '/solicitacoes',
    icone: '🎉',
    prioridade: 'alta'
  });
};

/**
 * Notifica cliente sobre contrato disponível
 */
export const notificarContratoDisponivel = async (
  clienteId: string,
  servicoTitulo: string,
  contratoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'contrato_disponivel',
    titulo: '📝 Contrato Pronto para Assinatura',
    mensagem: `O contrato para "${servicoTitulo}" está pronto para sua assinatura digital`,
    destinatarioTipo: 'cliente',
    destinatarioId: clienteId,
    referenciaId: contratoId,
    referenciaTipo: 'contrato',
    link: '/portal',
    icone: '📝',
    prioridade: 'alta'
  });
};

/**
 * Notifica admin sobre contrato assinado
 */
export const notificarContratoAssinado = async (
  clienteNome: string,
  servicoTitulo: string,
  contratoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'contrato_assinado',
    titulo: '✍️ Contrato Assinado!',
    mensagem: `${clienteNome} assinou o contrato para: ${servicoTitulo}`,
    destinatarioTipo: 'admin',
    destinatarioId: 'admin',
    remetenteNome: clienteNome,
    referenciaId: contratoId,
    referenciaTipo: 'contrato',
    link: '/projetos',
    icone: '✍️',
    prioridade: 'alta'
  });
};

/**
 * Notifica cliente sobre atualização de projeto
 */
export const notificarProjetoAtualizado = async (
  clienteId: string,
  projetoTitulo: string,
  novoStatus: string,
  projetoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'projeto_atualizado',
    titulo: '🔄 Projeto Atualizado',
    mensagem: `O projeto "${projetoTitulo}" foi atualizado para: ${novoStatus}`,
    destinatarioTipo: 'cliente',
    destinatarioId: clienteId,
    referenciaId: projetoId,
    referenciaTipo: 'projeto',
    link: '/portal',
    icone: '🔄',
    prioridade: 'normal'
  });
};

/**
 * Notifica cliente que projeto aguarda aprovação
 */
export const notificarAguardandoAprovacao = async (
  clienteId: string,
  projetoTitulo: string,
  descricaoFase: string,
  projetoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'aguardando_aprovacao',
    titulo: '✅ Aguardando sua Aprovação',
    mensagem: `O projeto "${projetoTitulo}" está pronto para sua aprovação. ${descricaoFase ? `Realizado: ${descricaoFase.substring(0, 100)}...` : ''}`,
    destinatarioTipo: 'cliente',
    destinatarioId: clienteId,
    referenciaId: projetoId,
    referenciaTipo: 'projeto',
    link: '/portal',
    icone: '✅',
    prioridade: 'alta'
  });
};

/**
 * Notifica admin que cliente aprovou projeto
 */
export const notificarProjetoAprovado = async (
  clienteNome: string,
  projetoTitulo: string,
  projetoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'projeto_aprovado',
    titulo: '🎉 Projeto Aprovado!',
    mensagem: `${clienteNome} aprovou o projeto: ${projetoTitulo}`,
    destinatarioTipo: 'admin',
    destinatarioId: 'admin',
    remetenteNome: clienteNome,
    referenciaId: projetoId,
    referenciaTipo: 'projeto',
    link: '/projetos',
    icone: '🎉',
    prioridade: 'alta'
  });
};

/**
 * Notifica sobre nova mensagem
 */
export const notificarNovaMensagem = async (
  destinatarioTipo: DestinatarioTipo,
  destinatarioId: string,
  remetenteNome: string,
  mensagemPreview: string,
  solicitacaoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'nova_mensagem',
    titulo: '💬 Nova Mensagem',
    mensagem: `${remetenteNome}: ${mensagemPreview.substring(0, 100)}${mensagemPreview.length > 100 ? '...' : ''}`,
    destinatarioTipo,
    destinatarioId,
    remetenteNome,
    referenciaId: solicitacaoId,
    referenciaTipo: 'solicitacao',
    link: destinatarioTipo === 'admin' ? '/solicitacoes' : '/portal',
    icone: '💬',
    prioridade: 'normal'
  });
};

/**
 * Notifica cliente sobre projeto criado
 */
export const notificarProjetoCriado = async (
  clienteId: string,
  projetoTitulo: string,
  projetoId: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'projeto_criado',
    titulo: '🚀 Novo Projeto Iniciado!',
    mensagem: `Seu projeto "${projetoTitulo}" foi criado e já está em andamento`,
    destinatarioTipo: 'cliente',
    destinatarioId: clienteId,
    referenciaId: projetoId,
    referenciaTipo: 'projeto',
    link: '/portal',
    icone: '🚀',
    prioridade: 'alta'
  });
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Retorna a cor do badge baseado no tipo de notificação
 */
export const getNotificacaoColor = (tipo: TipoNotificacao): string => {
  const colors: Record<TipoNotificacao, string> = {
    novo_cliente: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    nova_solicitacao: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    nova_mensagem: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    proposta_enviada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    proposta_aceita: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    proposta_recusada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    contrato_disponivel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    contrato_assinado: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    projeto_criado: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    projeto_atualizado: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    aguardando_aprovacao: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    projeto_aprovado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    projeto_concluido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pagamento_recebido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    lembrete_prazo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    feedback_negativo: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    feedback_recebido: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    sistema: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
  return colors[tipo] || colors.sistema;
};

/**
 * Formata data relativa (ex: "há 5 minutos")
 */
export const formatarDataRelativa = (dataString: string): string => {
  const data = new Date(dataString);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay < 7) return `há ${diffDay} dias`;
  
  return data.toLocaleDateString('pt-BR');
};

/**
 * Notifica admin sobre feedback do cliente
 * Se rating <= 2, cria notificação persistente que requer ação
 */
export const notificarFeedbackRecebido = async (
  adminId: string,
  clienteNome: string,
  projetoTitulo: string,
  projetoId: string,
  rating: number,
  comentario?: string
): Promise<void> => {
  const isNegativo = rating <= 2;
  
  await criarNotificacao({
    tipo: isNegativo ? 'feedback_negativo' : 'feedback_recebido',
    titulo: isNegativo 
      ? '⚠️ Feedback Negativo - Ação Necessária!' 
      : `⭐ Feedback Recebido: ${rating}/5`,
    mensagem: isNegativo
      ? `O cliente ${clienteNome} avaliou o projeto "${projetoTitulo}" com ${rating}/5 estrelas. ${comentario ? `Comentário: "${comentario}"` : ''} Ação necessária para resolver a insatisfação!`
      : `O cliente ${clienteNome} avaliou o projeto "${projetoTitulo}" com ${rating}/5 estrelas. ${comentario ? `Comentário: "${comentario}"` : ''}`,
    destinatarioTipo: 'admin',
    destinatarioId: adminId,
    remetenteNome: clienteNome,
    referenciaId: projetoId,
    referenciaTipo: 'projeto',
    link: '/projetos',
    icone: isNegativo ? '⚠️' : '⭐',
    prioridade: isNegativo ? 'urgente' : 'normal',
    persistente: isNegativo, // Feedback negativo é persistente
    requerAcao: isNegativo   // Requer ação do admin
  });
};

/**
 * Marca notificação persistente como resolvida (quando cliente der nova avaliação)
 */
export const resolverNotificacaoPersistente = async (
  projetoId: string
): Promise<void> => {
  try {
    // Buscar notificações persistentes não resolvidas para este projeto
    const notificacoesRef = collection(db, 'notificacoes');
    const q = query(
      notificacoesRef,
      where('referenciaId', '==', projetoId),
      where('persistente', '==', true),
      where('resolvidaEm', '==', null)
    );
    
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, 'notificacoes', docSnap.id), {
        resolvidaEm: new Date().toISOString(),
        requerAcao: false
      });
    }
    
    console.log(`✅ ${snapshot.size} notificações persistentes resolvidas para o projeto ${projetoId}`);
  } catch (error) {
    console.error('❌ Erro ao resolver notificações persistentes:', error);
  }
};

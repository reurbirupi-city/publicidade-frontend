import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  FileText,
  Image as ImageIcon,
  BarChart3,
  CheckCircle,
  Calendar,
  DollarSign,
  MessageSquare,
  Download,
  Eye,
  Clock,
  ArrowLeft,
  ExternalLink,
  X,
  Package,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  Plus,
  Star,
  Sparkles,
  Send,
  FileSignature,
  ClipboardCheck,
  LogOut
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import NotificacoesBell from '../components/NotificacoesBell';
import { TutorialOverlay, TutorialSettingsButton } from '../components/TutorialOverlay';
import ModalGerarProposta from '../components/ModalGerarProposta';
import ModalContratoAssinatura from '../components/ModalContratoAssinatura';
import ChatWhatsApp from '../components/ChatWhatsApp';
import {
  notificarNovaSolicitacao,
  notificarPropostaAceita,
  notificarContratoAssinado,
  notificarProjetoAprovado,
  notificarNovaMensagem
} from '../services/notificacoes';

const ClientPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { setUserType } = useTutorial();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [contactMessage, setContactMessage] = useState('');
  
  // Definir tipo de usuário como cliente para o tutorial
  useEffect(() => {
    setUserType('cliente');
  }, [setUserType]);
  
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showCustomServiceModal, setShowCustomServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [customServiceData, setCustomServiceData] = useState({
    titulo: '',
    descricao: '',
    prazo: '',
    orcamento: ''
  });
  
  // Estados para Propostas e Contratos
  const [showPropostaModal, setShowPropostaModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [propostaSelecionada, setPropostaSelecionada] = useState<any>(null);
  const [contratoSelecionado, setContratoSelecionado] = useState<any>(null);
  
  // Estados para Solicitações de Serviço - AGORA COMEÇA VAZIO
  const [solicitacoesServico, setSolicitacoesServico] = useState<any[]>([]);

  // Buscar dados do cliente do Firestore
  useEffect(() => {
    const fetchClientData = async () => {
      // Aguardar até que o Firebase termine de carregar a sessão
      if (authLoading) {
        console.log('⏳ Aguardando autenticação do Firebase...');
        return;
      }

      if (!user) {
        console.log('❌ Usuário não autenticado, redirecionando para login');
        navigate('/login');
        return;
      }

      try {
        console.log('📄 Buscando dados do cliente:', user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ Dados do cliente encontrados:', userData);
          setClientData({
            nome: userData.nome || user.email,
            empresa: userData.empresa || 'Não informada',
            email: userData.email || user.email,
            telefone: userData.telefone || '',
            adminId: userData.adminId || null, // Admin responsável por este cliente
            adminNome: userData.adminNome || null,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome || user.email)}&background=3B82F6&color=fff`
          });
        } else {
          console.log('⚠️ Documento do cliente não encontrado');
          setClientData({
            nome: user.email,
            empresa: 'Não informada',
            email: user.email,
            telefone: '',
            adminId: null,
            adminNome: null,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=3B82F6&color=fff`
          });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados do cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user, authLoading, navigate]);

  // Estado para catálogo de serviços dinâmico do Firebase
  const [catalogoServicos, setCatalogoServicos] = useState<any[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(true);

  // Buscar catálogo de serviços do Firebase
  useEffect(() => {
    const carregarServicos = async () => {
      setLoadingServicos(true);
      try {
        const servicosRef = collection(db, 'servicos_catalogo');
        const snapshot = await getDocs(servicosRef);
        
        if (!snapshot.empty) {
          const servicosFirebase = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                titulo: data.nome,
                categoria: getCategoriaLabel(data.categoria),
                descricao: data.descricao,
                preco: data.preco,
                prazo: data.tempo_estimado,
                icone: getCategoriaIcone(data.categoria),
                popular: data.destaque,
                recorrente: data.tempo_estimado?.toLowerCase().includes('mensal'),
                inclui: data.recursos || [],
                ativo: data.ativo
              };
            })
            .filter(s => s.ativo);
          setCatalogoServicos(servicosFirebase);
        } else {
          // Fallback para catálogo padrão se não houver serviços no Firebase
          setCatalogoServicos(catalogoServicosPadrao);
        }
      } catch (error) {
        console.error('Erro ao carregar catálogo de serviços:', error);
        setCatalogoServicos(catalogoServicosPadrao);
      }
      setLoadingServicos(false);
    };

    carregarServicos();
  }, []);

  // Mapeamento de categorias para labels
  const getCategoriaLabel = (categoria: string): string => {
    const labels: Record<string, string> = {
      'branding': 'Branding',
      'social-media': 'Social Media',
      'web': 'Web Design',
      'marketing': 'Marketing Digital',
      'design': 'Design Gráfico',
      'video': 'Audiovisual'
    };
    return labels[categoria] || categoria;
  };

  // Mapeamento de categorias para ícones
  const getCategoriaIcone = (categoria: string): string => {
    const icones: Record<string, string> = {
      'branding': '🎨',
      'social-media': '📱',
      'web': '🌐',
      'marketing': '📊',
      'design': '✨',
      'video': '🎬'
    };
    return icones[categoria] || '📦';
  };

  // Catálogo padrão como fallback
  const catalogoServicosPadrao = [
    {
      id: 1,
      titulo: 'Identidade Visual Completa',
      categoria: 'Branding',
      descricao: 'Criação de logo, manual de marca, cartão de visita e papelaria completa',
      preco: 3500,
      prazo: '15-20 dias',
      icone: '🎨',
      popular: true,
      inclui: [
        'Logo em diversos formatos',
        'Manual de identidade visual',
        'Cartão de visita',
        'Papel timbrado',
        '3 revisões incluídas'
      ]
    },
    {
      id: 2,
      titulo: 'Gestão de Redes Sociais',
      categoria: 'Social Media',
      descricao: 'Gerenciamento mensal de Instagram e Facebook com posts diários',
      preco: 1200,
      prazo: 'Mensal',
      icone: '📱',
      popular: true,
      recorrente: true,
      inclui: [
        '20 posts por mês',
        'Stories diários',
        'Relatório de métricas',
        'Atendimento inbox',
        'Planejamento de conteúdo'
      ]
    },
    {
      id: 3,
      titulo: 'Site Institucional',
      categoria: 'Web Design',
      descricao: 'Website responsivo com até 5 páginas e SEO básico',
      preco: 2800,
      prazo: '20-30 dias',
      icone: '🌐',
      inclui: [
        'Design responsivo',
        'Até 5 páginas',
        'SEO básico',
        'Formulário de contato',
        'Google Analytics'
      ]
    },
    {
      id: 4,
      titulo: 'Vídeo Institucional',
      categoria: 'Audiovisual',
      descricao: 'Produção de vídeo profissional de até 2 minutos',
      preco: 4500,
      prazo: '25-35 dias',
      icone: '🎬',
      inclui: [
        'Roteiro criativo',
        'Filmagem profissional',
        'Edição completa',
        'Trilha sonora',
        'Locução (se necessário)'
      ]
    },
    {
      id: 5,
      titulo: 'Campanha de Anúncios',
      categoria: 'Marketing Digital',
      descricao: 'Criação e gestão de campanhas no Google Ads e Meta Ads',
      preco: 1800,
      prazo: 'Mensal',
      icone: '📊',
      recorrente: true,
      inclui: [
        'Configuração de campanhas',
        'Criação de anúncios',
        'Otimização contínua',
        'Relatórios semanais',
        'Gestão de orçamento'
      ]
    },
    {
      id: 6,
      titulo: 'Design Gráfico',
      categoria: 'Design',
      descricao: 'Criação de materiais gráficos diversos (flyers, banners, etc)',
      preco: 500,
      prazo: '5-7 dias',
      icone: '✨',
      inclui: [
        'Design personalizado',
        'Até 3 peças gráficas',
        'Formatos para impressão e digital',
        '2 revisões incluídas'
      ]
    }
  ];

  // Propostas Pendentes (vinculadas às solicitações) - ESTADOS DINÂMICOS
  const [propostasPendentes, setPropostasPendentes] = useState<any[]>([]);

  const [contratosPendentes, setContratosPendentes] = useState<any[]>([]);
  
  // Estado para projetos criados após assinatura de contratos
  const [projetosDoContrato, setProjetosDoContrato] = useState<any[]>([]);
  
  // Estado para projetos criados pelo admin no CRM
  const [projetosAdmin, setProjetosAdmin] = useState<any[]>([]);
  
  // ✅ FLAG PARA CONTROLAR CARREGAMENTO DO LOCALSTORAGE
  const [localStorageLoaded, setLocalStorageLoaded] = useState(false);
  const [mensagensCliente, setMensagensCliente] = useState<Record<string, string>>({});

  // ✅ CARREGAR DADOS DO LOCALSTORAGE (Após todos os useState)
  useEffect(() => {
    if (!user?.uid) return;

    const dedupeByKey = (items: any[], keyFn: (item: any) => string) => {
      const seen = new Set<string>();
      return items.filter(item => {
        const key = keyFn(item);
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    try {
      console.log('📦 Carregando dados persistidos do localStorage para:', user.uid);
      
      const solicitacoesSalvas = localStorage.getItem(`solicitacoes_${user.uid}`);
      const propostasSalvas = localStorage.getItem(`propostas_${user.uid}`);
      const contratosSalvos = localStorage.getItem(`contratos_${user.uid}`);
      const projetosSalvos = localStorage.getItem(`projetos_${user.uid}`);

      if (solicitacoesSalvas) {
        console.log('✅ Solicitações carregadas do localStorage');
        setSolicitacoesServico(JSON.parse(solicitacoesSalvas));
      }
      if (propostasSalvas) {
        console.log('✅ Propostas carregadas do localStorage');
        const parsed = JSON.parse(propostasSalvas);
        setPropostasPendentes(dedupeByKey(parsed, (p) => p.id));
      }
      if (contratosSalvos) {
        console.log('✅ Contratos carregados do localStorage');
        const parsed = JSON.parse(contratosSalvos);
        setContratosPendentes(dedupeByKey(parsed, (c) => c.solicitacaoId || c.id));
      }
      if (projetosSalvos) {
        console.log('✅ Projetos carregados do localStorage');
        setProjetosDoContrato(JSON.parse(projetosSalvos));
      }
      
      // ✅ Marcar como carregado APÓS carregar tudo
      setLocalStorageLoaded(true);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
      setLocalStorageLoaded(true);
    }
  }, [user?.uid]);

  // ✅ SALVAR SOLICITAÇÕES QUANDO MUDAREM
  useEffect(() => {
    if (user?.uid && localStorageLoaded) {
      console.log('💾 Salvando solicitações no localStorage');
      localStorage.setItem(`solicitacoes_${user.uid}`, JSON.stringify(solicitacoesServico));
    }
  }, [solicitacoesServico, user?.uid, localStorageLoaded]);

  // ✅ SALVAR PROPOSTAS QUANDO MUDAREM
  useEffect(() => {
    if (user?.uid && localStorageLoaded) {
      console.log('💾 Salvando propostas no localStorage');
      localStorage.setItem(`propostas_${user.uid}`, JSON.stringify(propostasPendentes));
    }
  }, [propostasPendentes, user?.uid, localStorageLoaded]);

  // ✅ SALVAR CONTRATOS QUANDO MUDAREM
  useEffect(() => {
    if (user?.uid && localStorageLoaded) {
      console.log('💾 Salvando contratos no localStorage');
      localStorage.setItem(`contratos_${user.uid}`, JSON.stringify(contratosPendentes));
    }
  }, [contratosPendentes, user?.uid, localStorageLoaded]);

  // ✅ SALVAR PROJETOS QUANDO MUDAREM
  useEffect(() => {
    if (user?.uid && localStorageLoaded) {
      console.log('💾 Salvando projetos no localStorage');
      localStorage.setItem(`projetos_${user.uid}`, JSON.stringify(projetosDoContrato));
    }
  }, [projetosDoContrato, user?.uid, localStorageLoaded]);

  // ✅ CARREGAR PROJETOS DO FIRESTORE (criados pelo admin) - COM ATUALIZAÇÃO EM TEMPO REAL
  useEffect(() => {
    if (!user?.uid || !clientData) return;

    const carregarProjetosDoFirestore = async () => {
      try {
        console.log('🔍 Buscando projetos do Firestore para cliente:', user.uid, user.email);
        
        // Buscar TODOS os projetos e filtrar localmente
        // Isso permite encontrar projetos por clienteId (uid Firebase), email ou nome
        const projetosRef = collection(db, 'projetos');
        const querySnapshot = await getDocs(projetosRef);
        const todosProjetos: any[] = [];
        
        querySnapshot.forEach((doc) => {
          todosProjetos.push({ ...doc.data(), id: doc.id });
        });
        
        // Filtrar projetos que pertencem a este cliente
        // Busca por: clienteId (uid), clienteEmail, ou nome do cliente
        const clienteEmail = user.email?.toLowerCase() || '';
        const clienteNome = clientData?.nome?.toLowerCase() || '';
        const clienteEmpresa = clientData?.empresa?.toLowerCase() || '';
        
        const projetosDoCliente = todosProjetos.filter(projeto => {
          // Match por clienteId (uid do Firebase)
          if (projeto.clienteId === user.uid) return true;
          
          // Match por email do cliente (campo pode ser clienteEmail ou dentro de cliente)
          const projetoEmail = (projeto.clienteEmail || projeto.email || '').toLowerCase();
          if (projetoEmail && projetoEmail === clienteEmail) return true;
          
          // Match por nome do cliente
          const projetoClienteNome = (projeto.clienteNome || '').toLowerCase();
          if (projetoClienteNome && projetoClienteNome === clienteNome) return true;
          
          // Match por empresa
          const projetoEmpresa = (projeto.clienteEmpresa || '').toLowerCase();
          if (projetoEmpresa && projetoEmpresa === clienteEmpresa && clienteEmpresa !== 'não informada') return true;
          
          return false;
        });
        
        if (projetosDoCliente.length > 0) {
          console.log('✅ Encontrados', projetosDoCliente.length, 'projetos do Firestore');
          setProjetosAdmin(projetosDoCliente);
          
          // ✅ REMOVER PROJETOS LOCAIS que já existem no Firestore (evitar duplicação)
          // Se um projeto foi criado pelo admin no Firestore com o mesmo solicitacaoId,
          // remover o projeto local criado automaticamente na assinatura do contrato
          setProjetosDoContrato(prev => {
            const idsFirestore = projetosDoCliente.map(p => p.solicitacaoId).filter(Boolean);
            const contratoIdsFirestore = projetosDoCliente.map(p => p.contratoId).filter(Boolean);
            
            const projetosLocaisFiltrados = prev.filter(local => {
              // Manter apenas projetos locais que NÃO existem no Firestore
              const existeNoFirestore = 
                (local.solicitacaoId && idsFirestore.includes(local.solicitacaoId)) ||
                (local.contratoId && contratoIdsFirestore.includes(local.contratoId));
              
              if (existeNoFirestore) {
                console.log('🔄 Removendo projeto local duplicado:', local.id, '(já existe no Firestore)');
              }
              
              return !existeNoFirestore;
            });
            
            // Atualizar localStorage também
            if (user?.uid && projetosLocaisFiltrados.length !== prev.length) {
              localStorage.setItem(`projetos_${user.uid}`, JSON.stringify(projetosLocaisFiltrados));
              console.log('✅ localStorage atualizado - projetos duplicados removidos');
            }
            
            return projetosLocaisFiltrados;
          });
        } else {
          console.log('⚠️ Nenhum projeto encontrado no Firestore para este cliente');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar projetos do Firestore:', error);
      }
    };

    // Carregar imediatamente
    carregarProjetosDoFirestore();

    // Atualizar a cada 10 segundos para mostrar mudanças do Kanban em tempo real
    const interval = setInterval(() => {
      console.log('🔄 Atualizando projetos do Firestore...');
      carregarProjetosDoFirestore();
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.uid, user?.email, clientData?.nome, clientData?.empresa]);

  // ✅ CARREGAR PROPOSTAS E RESPOSTAS DO FIRESTORE (em tempo real com onSnapshot)
  useEffect(() => {
    if (!user?.uid || !localStorageLoaded) return;

    console.log('🔍 Iniciando listener em tempo real para cliente:', user.uid);
    
    // Usar onSnapshot para escutar mudanças em tempo real
    const q = query(
      collection(db, 'solicitacoes_clientes'),
      where('clienteId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const solicitacoesComPropostas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        console.log('📋 Solicitações atualizadas em tempo real:', solicitacoesComPropostas.length);

        // Extrair propostas das solicitações
        const propostasEncontradas: any[] = [];
        solicitacoesComPropostas.forEach(solicitacao => {
          if (solicitacao.proposta) {
            propostasEncontradas.push({
              id: solicitacao.id,
              servicoId: solicitacao.servicoId,
              titulo: solicitacao.titulo,
              status: solicitacao.status,
              valor: solicitacao.proposta.valor,
              descricao: solicitacao.proposta.descricao || solicitacao.descricao,
              prazo: solicitacao.proposta.prazo,
              validade: parseInt(solicitacao.proposta.prazo) || 30,
              dataEnvio: solicitacao.proposta.dataCriacao,
              dataCriacao: solicitacao.proposta.dataCriacao,
              respostas: solicitacao.respostas || [],
              solicitacaoDescricao: solicitacao.descricao,
              categoria: solicitacao.categoria,
              solicitacaoId: solicitacao.id
            });
          }
        });

        // Atualiza solicitações locais com respostas/status mais recentes do Firestore
        setSolicitacoesServico(solicitacoesComPropostas);

        const propostasAtivas = propostasEncontradas.filter(proposta => {
          const status = (proposta.status || '').toLowerCase();
          const contratoStatus = (proposta.contratoStatus || '').toLowerCase();
          const propostaStatus = (proposta.propostaStatus || '').toLowerCase();
          if (['contrato-pendente', 'contrato-assinado', 'concluida', 'concluída'].includes(status)) return false;
          if (['assinado', 'assinado-digitalmente'].includes(contratoStatus)) return false;
          if (propostaStatus === 'aceita') return false;
          return true;
        });

        if (propostasAtivas.length > 0) {
          console.log('✅ Propostas ativas em tempo real:', propostasAtivas.length);
          const dedupeByKey = (items: any[], keyFn: (item: any) => string) => {
            const seen = new Set<string>();
            return items.filter(item => {
              const key = keyFn(item);
              if (!key) return true;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          };
          setPropostasPendentes(dedupeByKey(propostasAtivas, (p) => p.id));
        } else {
          setPropostasPendentes([]);
        }

      } catch (error) {
        console.error('❌ Erro ao processar solicitações em tempo real:', error);
      }
    }, (error) => {
      console.error('❌ Erro no listener em tempo real:', error);
    });

    // Cleanup: remover listener quando componente desmonta
    return () => {
      console.log('🔇 Removendo listener em tempo real');
      unsubscribe();
    };
  }, [user?.uid, localStorageLoaded]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'em_andamento':
      case 'em-andamento':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pausado':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'revisao':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'aprovacao':
      case 'aguardando-aprovacao':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'concluido':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelado':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Cores de borda para cards de projetos por status
  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'planejamento':
        return 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10';
      case 'em_andamento':
      case 'em-andamento':
        return 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10';
      case 'pausado':
        return 'border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/10';
      case 'revisao':
        return 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10';
      case 'aprovacao':
      case 'aguardando-aprovacao':
        return 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10';
      case 'concluido':
        return 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10';
      case 'cancelado':
        return 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10';
      default:
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejamento':
        return '📋 Planejamento';
      case 'em_andamento':
      case 'em-andamento':
        return '🚀 Em Andamento';
      case 'pausado':
        return '⏸️ Pausado';
      case 'revisao':
        return '🔍 Em Revisão';
      case 'aprovacao':
      case 'aguardando-aprovacao':
        return '✅ Aguardando Aprovação';
      case 'concluido':
        return '🎉 Concluído';
      case 'cancelado':
        return '❌ Cancelado';
      default:
        return status;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'branding': return '🎨';
      case 'social-media': return '📱';
      case 'marketing': return '📊';
      case 'web': return '🌐';
      default: return '📁';
    }
  };

  // Calcular progresso baseado no status do projeto (sincronizado com Kanban do admin)
  const getProgressoByStatus = (projeto: any): number => {
    // Se o projeto já tem um progresso definido no Firestore, usar esse valor
    if (typeof projeto.progresso === 'number' && projeto.progresso > 0) {
      return projeto.progresso;
    }
    
    // Caso contrário, calcular baseado no status
    switch (projeto.status) {
      case 'planejamento':
        return 10;
      case 'em_andamento':
      case 'em-andamento':
        return 40;
      case 'pausado':
        return projeto.progresso || 30; // Mantém o progresso anterior
      case 'revisao':
        return 70;
      case 'aprovacao':
      case 'aguardando-aprovacao':
        return 90;
      case 'concluido':
        return 100;
      case 'cancelado':
        return 0;
      default:
        return 0;
    }
  };

  // Aprovar projeto (mover para concluído)
  const handleAprovarProjeto = async (projetoId: string) => {
    if (!confirm('Confirma a aprovação desta fase? O projeto será marcado como concluído.')) {
      return;
    }

    try {
      // Atualizar no Firestore
      await updateDoc(doc(db, 'projetos', projetoId), {
        status: 'concluido',
        atualizadoEm: new Date().toISOString(),
        aprovadoPorCliente: true,
        aprovadoEm: new Date().toISOString(),
        aprovadoPor: clientData?.nome || user?.email,
        aguardandoAprovacaoCliente: false
      });

      // Notificar admin que projeto foi aprovado pelo cliente
      const projeto = projetosAdmin.find(p => p.id === projetoId);
      await notificarProjetoAprovado(
        clientData?.nome || user?.email || 'Cliente',
        projeto?.titulo || 'Projeto',
        projetoId
      );
      console.log('🔔 Notificação enviada: projeto aprovado');

      // Atualizar estado local
      setProjetosAdmin(prev => prev.map(p => 
        p.id === projetoId 
          ? { ...p, status: 'concluido', aprovadoPorCliente: true, aprovadoEm: new Date().toISOString() }
          : p
      ));

      alert('✅ Projeto aprovado com sucesso! Obrigado pela confirmação.');
    } catch (error) {
      console.error('Erro ao aprovar projeto:', error);
      alert('Erro ao aprovar projeto. Tente novamente.');
    }
  };

  // Mensagem geral (quando não há solicitações ainda)
  const handleSendMessageGeral = async () => {
    if (!contactMessage.trim()) {
      alert('Por favor, digite uma mensagem.');
      return;
    }

    // Se já existe uma solicitação, usar o sistema de mensagens por solicitação
    if (solicitacoesServico.length > 0) {
      const primeira = solicitacoesServico[0];
      const novaResposta = {
        texto: contactMessage,
        dataCriacao: new Date().toISOString(),
        autor: 'Cliente'
      };

      try {
        const docRef = doc(db, 'solicitacoes_clientes', primeira.id);
        const respostasExistentes = primeira.respostas || [];
        await updateDoc(docRef, {
          respostas: [...respostasExistentes, novaResposta],
          ultimaResposta: new Date().toLocaleDateString('pt-BR')
        });

        setSolicitacoesServico(prev => prev.map(s => s.id === primeira.id ? { ...s, respostas: [...(s.respostas || []), novaResposta] } : s));
        setContactMessage('');
        alert('Mensagem enviada ao administrador!');
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        alert('Não foi possível enviar a mensagem.');
      }
    } else {
      // Se não há solicitações, criar uma solicitação de contato geral
      const novaSolicitacao: any = {
        id: `SOL-2024-${String(Date.now()).slice(-6)}`,
        servicoId: 'contato',
        titulo: 'Contato Geral',
        categoria: 'Contato',
        valor: 0,
        dataSolicitacao: new Date().toISOString().split('T')[0],
        status: 'nova',
        descricao: contactMessage,
        prazo: 'N/A',
        recorrente: false,
        nomeCliente: clientData?.nome || user?.email,
        emailCliente: user?.email,
        clienteId: user?.uid,
        empresaCliente: clientData?.empresa,
        respostas: [{
          texto: contactMessage,
          dataCriacao: new Date().toISOString(),
          autor: 'Cliente'
        }]
      };
      
      // Se o cliente está vinculado a um admin, adicionar à solicitação
      if (clientData?.adminId) {
        novaSolicitacao.adminId = clientData.adminId;
        novaSolicitacao.adminNome = clientData.adminNome;
      }
      
      try {
        await setDoc(doc(db, 'solicitacoes_clientes', novaSolicitacao.id), novaSolicitacao);
        setSolicitacoesServico([novaSolicitacao, ...solicitacoesServico]);
        setContactMessage('');
        alert('Mensagem enviada ao administrador!');
      } catch (error) {
        console.error('❌ Erro ao criar solicitação de contato:', error);
        alert('Não foi possível enviar a mensagem.');
      }
    }
  };

  const handleEnviarMensagemCliente = async (solicitacao: any) => {
    const texto = (mensagensCliente[solicitacao.id] || '').trim();
    if (!texto) {
      alert('Digite uma mensagem antes de enviar.');
      return;
    }

    const novaResposta = {
      texto,
      dataCriacao: new Date().toISOString(),
      autor: 'Cliente'
    };

    try {
      const docRef = doc(db, 'solicitacoes_clientes', solicitacao.id);
      const respostasExistentes = solicitacao.respostas || [];
      await updateDoc(docRef, {
        respostas: [...respostasExistentes, novaResposta],
        ultimaResposta: new Date().toLocaleDateString('pt-BR')
      });

      // Notificar admin sobre nova mensagem do cliente
      await notificarNovaMensagem(
        'admin',
        'admin',
        clientData?.nome || user?.email || 'Cliente',
        texto.substring(0, 50) + (texto.length > 50 ? '...' : ''),
        solicitacao.id
      );
      console.log('🔔 Notificação enviada: nova mensagem do cliente');

      setSolicitacoesServico(prev => prev.map(s => s.id === solicitacao.id ? { ...s, respostas: [...(s.respostas || []), novaResposta] } : s));
      setPropostasPendentes(prev => prev.map(p => p.solicitacaoId === solicitacao.id ? { ...p, respostas: [...(p.respostas || []), novaResposta] } : p));
      setMensagensCliente(prev => ({ ...prev, [solicitacao.id]: '' }));
      alert('Mensagem enviada para o administrador.');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem do cliente:', error);
      alert('Não foi possível enviar a mensagem.');
    }
  };

  // ✅ FUNÇÕES PARA O CHAT WHATSAPP
  // Obter todas as mensagens de todas as solicitações para o chat
  const obterMensagensChat = () => {
    const todasMensagens: Array<{
      id: string;
      texto: string;
      autor: 'Cliente' | 'Admin' | 'Sistema';
      dataCriacao: string;
      lida?: boolean;
    }> = [];

    solicitacoesServico.forEach(sol => {
      if (sol.respostas && Array.isArray(sol.respostas)) {
        sol.respostas.forEach((resp: any, index: number) => {
          todasMensagens.push({
            id: `${sol.id}-${index}`,
            texto: resp.texto,
            autor: resp.autor === 'Admin' ? 'Admin' : resp.autor === 'Sistema' ? 'Sistema' : 'Cliente',
            dataCriacao: resp.dataCriacao,
            lida: true
          });
        });
      }
    });

    // Ordenar por data
    todasMensagens.sort((a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime());
    return todasMensagens;
  };

  // Enviar mensagem via chat WhatsApp
  const handleEnviarMensagemChat = async (texto: string) => {
    if (!texto.trim()) return;

    const novaResposta = {
      texto,
      dataCriacao: new Date().toISOString(),
      autor: 'Cliente'
    };

    try {
      // Se já existe alguma solicitação, adicionar mensagem na primeira
      if (solicitacoesServico.length > 0) {
        const primeira = solicitacoesServico[0];
        const docRef = doc(db, 'solicitacoes_clientes', primeira.id);
        const respostasExistentes = primeira.respostas || [];
        
        await updateDoc(docRef, {
          respostas: [...respostasExistentes, novaResposta],
          ultimaResposta: new Date().toLocaleDateString('pt-BR')
        });

        // Notificar admin
        await notificarNovaMensagem(
          'admin',
          'admin',
          clientData?.nome || user?.email || 'Cliente',
          texto.substring(0, 50) + (texto.length > 50 ? '...' : ''),
          primeira.id
        );

        setSolicitacoesServico(prev => prev.map(s => 
          s.id === primeira.id 
            ? { ...s, respostas: [...(s.respostas || []), novaResposta] } 
            : s
        ));
      } else {
        // Criar nova solicitação de contato
        const novaSolicitacao: any = {
          id: `SOL-2024-${String(Date.now()).slice(-6)}`,
          servicoId: 'contato',
          titulo: 'Contato via Chat',
          categoria: 'Contato',
          valor: 0,
          dataSolicitacao: new Date().toISOString().split('T')[0],
          status: 'nova',
          descricao: texto,
          prazo: 'N/A',
          recorrente: false,
          nomeCliente: clientData?.nome || user?.email,
          emailCliente: user?.email,
          clienteId: user?.uid,
          empresaCliente: clientData?.empresa,
          respostas: [novaResposta]
        };

        // Se o cliente está vinculado a um admin, adicionar à solicitação
        if (clientData?.adminId) {
          novaSolicitacao.adminId = clientData.adminId;
          novaSolicitacao.adminNome = clientData.adminNome;
        }

        await setDoc(doc(db, 'solicitacoes_clientes', novaSolicitacao.id), novaSolicitacao);
        
        // Notificar admin
        await notificarNovaMensagem(
          'admin',
          'admin',
          clientData?.nome || user?.email || 'Cliente',
          texto.substring(0, 50) + (texto.length > 50 ? '...' : ''),
          novaSolicitacao.id
        );

        setSolicitacoesServico(prev => [novaSolicitacao, ...prev]);
      }

      console.log('✅ Mensagem enviada via chat');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via chat:', error);
      throw error;
    }
  };

  const handleRequestService = async (service: any) => {
    const timestamp = Date.now().toString().slice(-6);
    
    const novaSolicitacao: any = {
      id: `SOL-2024-${timestamp}`,
      servicoId: service.id,
      titulo: service.titulo,
      categoria: service.categoria,
      valor: service.preco,
      dataSolicitacao: new Date().toISOString().split('T')[0],
      status: 'nova',
      descricao: service.descricao,
      prazo: service.prazo,
      prazoEstimado: service.prazo,
      recorrente: service.recorrente || false,
      customizado: false,
      tipo: 'catalogo',
      nomeCliente: clientData?.nome || user?.email,
      emailCliente: user?.email,
      clienteId: user?.uid,
      empresaCliente: clientData?.empresa,
      respostas: []
    };
    
    // Se o cliente está vinculado a um admin, adicionar à solicitação
    if (clientData?.adminId) {
      novaSolicitacao.adminId = clientData.adminId;
      novaSolicitacao.adminNome = clientData.adminNome;
      console.log('🔗 Solicitação vinculada ao admin:', clientData.adminId);
    }
    
    // Salvar no localStorage
    setSolicitacoesServico([...solicitacoesServico, novaSolicitacao]);
    
    // Salvar no Firestore para o admin ver
    try {
      await setDoc(doc(db, 'solicitacoes_clientes', novaSolicitacao.id), novaSolicitacao);
      console.log('✅ Solicitação salva no Firestore:', novaSolicitacao.id);
      
      // Notificar admin sobre nova solicitação
      // Se cliente tem adminId, notifica o admin específico
      await notificarNovaSolicitacao(
        clientData?.nome || user?.email || 'Cliente',
        service.titulo,
        novaSolicitacao.id,
        clientData?.adminId  // ID do admin do cliente (se existir)
      );
      console.log('🔔 Notificação enviada para', clientData?.adminId ? `admin ${clientData.adminId}` : 'webmaster');
    } catch (error) {
      console.error('❌ Erro ao salvar solicitação no Firestore:', error);
    }
    
    console.log('Solicitação criada:', novaSolicitacao);
    
    alert(`✅ Solicitação #${novaSolicitacao.id} enviada com sucesso!\n\nServiço: ${service.titulo}\nValor: R$ ${service.preco.toLocaleString('pt-BR')}\n\n📋 Próximos passos:\n1. Nossa equipe analisará sua solicitação\n2. Você receberá uma proposta comercial detalhada\n3. Após aceitar a proposta, enviaremos o contrato\n\nVocê pode acompanhar o status na seção "Solicitações".`);
    setSelectedService(null);
    setShowServicesModal(false);
  };

  const handleRequestCustomService = async () => {
    if (!customServiceData.titulo.trim() || !customServiceData.descricao.trim()) {
      alert('Por favor, preencha pelo menos o título e a descrição do serviço.');
      return;
    }
    
    const timestamp = Date.now().toString().slice(-6);
    const valorOrcado = customServiceData.orcamento ? parseFloat(customServiceData.orcamento) : 0;
    
    const novaSolicitacao: any = {
      id: `SOL-2024-${timestamp}`,
      servicoId: 'custom',
      titulo: customServiceData.titulo,
      categoria: 'Serviço Personalizado',
      valor: valorOrcado,
      valorEstimado: valorOrcado > 0 ? valorOrcado : null,
      dataSolicitacao: new Date().toISOString().split('T')[0],
      status: 'nova',
      descricao: customServiceData.descricao,
      prazo: customServiceData.prazo || 'A definir',
      prazoEstimado: customServiceData.prazo || 'A definir conforme análise',
      recorrente: false,
      customizado: true,
      tipo: 'personalizado',
      nomeCliente: clientData?.nome || user?.email,
      emailCliente: user?.email,
      clienteId: user?.uid,
      empresaCliente: clientData?.empresa,
      respostas: []
    };
    
    // Se o cliente está vinculado a um admin, adicionar à solicitação
    if (clientData?.adminId) {
      novaSolicitacao.adminId = clientData.adminId;
      novaSolicitacao.adminNome = clientData.adminNome;
      console.log('🔗 Solicitação personalizada vinculada ao admin:', clientData.adminId);
    }
    
    // Salvar no localStorage
    setSolicitacoesServico([...solicitacoesServico, novaSolicitacao]);
    
    // Salvar no Firestore para o admin ver
    try {
      await setDoc(doc(db, 'solicitacoes_clientes', novaSolicitacao.id), novaSolicitacao);
      console.log('✅ Solicitação personalizada salva no Firestore:', novaSolicitacao.id);
      
      // Notificar admin sobre nova solicitação personalizada
      // Se cliente tem adminId, notifica o admin específico
      await notificarNovaSolicitacao(
        clientData?.nome || user?.email || 'Cliente',
        customServiceData.titulo,
        novaSolicitacao.id,
        clientData?.adminId  // ID do admin do cliente (se existir)
      );
      console.log('🔔 Notificação enviada para', clientData?.adminId ? `admin ${clientData.adminId}` : 'webmaster');
    } catch (error) {
      console.error('❌ Erro ao salvar solicitação personalizada no Firestore:', error);
    }
    
    console.log('✅ Solicitação personalizada criada:', novaSolicitacao);
    
    const valorTexto = valorOrcado > 0 
      ? `Orçamento estimado: R$ ${valorOrcado.toLocaleString('pt-BR')}`
      : 'Orçamento: A definir';
    
    alert(
      `✅ Solicitação Personalizada #${novaSolicitacao.id} enviada com sucesso!\n\n` +
      `📦 Serviço: ${customServiceData.titulo}\n` +
      `${valorTexto}\n` +
      `⏱️ Prazo: ${customServiceData.prazo || 'A definir'}\n\n` +
      `📋 Próximos passos:\n` +
      `1. Nossa equipe analisará sua solicitação em até 24 horas\n` +
      `2. Você receberá uma proposta comercial detalhada\n` +
      `3. Após aceitar a proposta, enviaremos o contrato\n` +
      `4. Assine o contrato digitalmente para iniciar\n\n` +
      `Você pode acompanhar o status na seção "Solicitações" e trocar mensagens conosco.`
    );
    
    setCustomServiceData({ titulo: '', descricao: '', prazo: '', orcamento: '' });
    setShowCustomServiceModal(false);
  };

  const handleVisualizarProposta = (proposta: any) => {
    setPropostaSelecionada(proposta);
    setShowPropostaModal(true);
  };

  const handlePropostaGerada = (documentoId: string, nomeArquivo: string) => {
    console.log('Proposta baixada:', nomeArquivo);
    setShowPropostaModal(false);
    
    // Pergunta ao cliente se aceita a proposta
    setTimeout(() => {
      const aceitar = window.confirm(
        `✅ Proposta baixada com sucesso!\n\nArquivo: ${nomeArquivo}\n\n📋 Deseja ACEITAR esta proposta?\n\nAo aceitar:\n• Um contrato será gerado automaticamente\n• Você poderá assiná-lo digitalmente\n• O projeto será iniciado após assinatura`
      );
      
      if (aceitar && propostaSelecionada) {
        handleAceitarProposta(propostaSelecionada);
      }
    }, 500);
  };
  
  // NOVO: Handler para aceitar proposta
  const handleAceitarProposta = async (proposta: any) => {
    console.log('🎉 Cliente aceitou proposta:', proposta.id);

    const statusAtual = (proposta.status || '').toLowerCase();
    if (statusAtual.includes('contrato')) {
      alert('Esta proposta já gerou um contrato. Assine o contrato listado nas pendências.');
      return;
    }

    const contratoExistente = contratosPendentes.find(
      (contrato) => contrato.solicitacaoId === proposta.solicitacaoId || contrato.propostaId === proposta.id
    );

    if (contratoExistente) {
      alert('Já existe um contrato pendente para esta proposta. Use o botão "Assinar Contrato" existente.');
      return;
    }
    
    // 1. Atualiza status da proposta localmente
    setPropostasPendentes(prev => 
      prev.map(p => 
        p.id === proposta.id 
          ? { ...p, status: 'aceita', dataAceite: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    
    // 2. Atualiza status da solicitação localmente
    setSolicitacoesServico(prev =>
      prev.map(s =>
        s.id === proposta.solicitacaoId
          ? { ...s, status: 'contrato-pendente', contratoId: `CONT-2024-${String(contratosPendentes.length + 1).padStart(3, '0')}` }
          : s
      )
    );
    
    // 3. Gera contrato automaticamente
    const novoContrato = {
      id: `CONT-2024-${String(contratosPendentes.length + 1).padStart(3, '0')}`,
      propostaId: proposta.id,
      solicitacaoId: proposta.solicitacaoId,
      titulo: proposta.titulo.replace('Proposta Comercial', 'Contrato'),
      descricao: proposta.descricao.replace('Baseado na sua solicitação', 'Conforme proposta aceita'),
      valor: proposta.valor,
      valorProposta: proposta.valor,
      valorSolicitacao: proposta.valorSolicitacao,
      servicos: proposta.servicos || [],
      dataEnvio: new Date().toISOString().split('T')[0],
      status: 'aguardando-assinatura'
    };

    setContratosPendentes(prev => {
      const jaExiste = prev.some(c => c.solicitacaoId === novoContrato.solicitacaoId || c.propostaId === novoContrato.propostaId);
      if (jaExiste) return prev;
      return [...prev, novoContrato];
    });

    // 4. Persistir no Firestore o status contrato-pendente e dados do contrato
    try {
      const docRef = doc(db, 'solicitacoes_clientes', proposta.solicitacaoId);
      await updateDoc(docRef, {
        status: 'contrato-pendente',
        propostaStatus: 'aceita',
        contratoId: novoContrato.id,
        contratoStatus: 'aguardando-assinatura',
        dataAceiteProposta: new Date().toISOString(),
        contrato: {
          id: novoContrato.id,
          valor: novoContrato.valor,
          dataEnvio: novoContrato.dataEnvio,
          status: 'aguardando-assinatura'
        }
      });
      console.log('✅ Firestore atualizado para contrato-pendente');
      
      // Notificar admin que proposta foi aceita
      await notificarPropostaAceita(
        clientData?.nome || user?.email || 'Cliente',
        proposta.titulo,
        proposta.solicitacaoId
      );
      console.log('🔔 Notificação enviada: proposta aceita');
      
      // Atualizar status do cliente para "negociacao"
      if (user?.uid) {
        const { atualizarStatusCliente } = await import('../services/dataIntegration');
        await atualizarStatusCliente(user.uid, 'prospect', 'negociacao');
        console.log('✅ Status do cliente atualizado para "negociacao"');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar Firestore para contrato-pendente:', error);
    }
    
    // 4. Remove proposta da lista de pendentes
    setTimeout(() => {
      setPropostasPendentes(prev => prev.filter(p => p.id !== proposta.id));
    }, 1000);
    
    alert(
      `🎉 Proposta ACEITA com sucesso!\n\n` +
      `✅ Status atualizado\n` +
      `📄 Contrato ${novoContrato.id} gerado\n\n` +
      `📋 Próximo passo:\n` +
      `Assine o contrato digitalmente para iniciar o projeto.\n\n` +
      `O contrato aparecerá na seção "Pendências" em instantes.`
    );
  };

  const handleVisualizarContrato = (contrato: any) => {
    setContratoSelecionado(contrato);
    setShowContratoModal(true);
  };

  const handleContratoAssinado = async (contratoId: string, assinaturaBase64: string, nomeArquivo: string, pdfBase64: string) => {
    console.log('🎉 Contrato assinado:', contratoId);
    const contrato = contratosPendentes.find(c => c.id === contratoId);
    
    if (!contrato) {
      console.error('❌ Contrato não encontrado:', contratoId);
      return;
    }
    
    console.log('📄 Contrato encontrado:', contrato);
    console.log('🔗 Solicitação vinculada:', contrato.solicitacaoId);
    
    try {
      // Salvar contrato assinado na coleção contratos_assinados
      // Usamos o pdfBase64 diretamente pois Firebase Storage requer billing
      const contratoAssinado = {
        contratoId,
        solicitacaoId: contrato.solicitacaoId,
        propostaId: contrato.propostaId,
        clienteId: user?.uid,
        clienteNome: clientData?.nome || 'Cliente',
        clienteEmpresa: clientData?.empresa || '',
        clienteEmail: clientData?.email || user?.email || '',
        titulo: contrato.titulo,
        valor: contrato.valor,
        servicos: contrato.servicos || [],
        dataAssinatura: new Date().toISOString(),
        nomeArquivo,
        pdfBase64, // Salvar o PDF como base64 diretamente no Firestore
        assinaturaBase64,
        status: 'assinado',
        adminId: clientData?.adminId || ''
      };
      
      await addDoc(collection(db, 'contratos_assinados'), contratoAssinado);
      console.log('✅ Contrato salvo na coleção contratos_assinados (com PDF base64)');

      // 1. Atualiza proposta/solicitação no Firestore para "contrato-assinado"
      const docRef = doc(db, 'solicitacoes_clientes', contrato.solicitacaoId);
      await updateDoc(docRef, {
        status: 'contrato-assinado',
        dataAssinatura: new Date().toISOString(),
        contratoArquivo: nomeArquivo,
        contratoAssinadoBase64: true // Flag indicando que o PDF está salvo como base64
      });
      console.log('✅ Status da proposta atualizado no Firestore para: contrato-assinado');

      // Atualizar status do cliente para "contratado"
      if (user?.uid) {
        const { atualizarStatusCliente } = await import('../services/dataIntegration');
        await atualizarStatusCliente(user.uid, 'ativo', 'contratado');
        console.log('✅ Status do cliente atualizado para "contratado"');
      
      // Notificar admin que contrato foi assinado
      await notificarContratoAssinado(
        clientData?.nome || user?.email || 'Cliente',
        contrato.titulo,
        contrato.solicitacaoId
      );
      console.log('🔔 Notificação enviada: contrato assinado');
      }

      // 2. Remove contrato da lista de pendentes
      setContratosPendentes(prev => {
        const novosContratos = prev.filter(c => c.id !== contratoId);
        console.log('✅ Contratos após remoção:', novosContratos.length);
        return novosContratos;
      });
      
      // 3. Remove proposta associada das pendências
      setPropostasPendentes(prev => prev.filter(p => p.id !== contrato.propostaId));
      
      // 4. Atualiza status da solicitação para 'concluida'
      setSolicitacoesServico(prev => {
        const solicitacoesAtualizadas = prev.map(s =>
          s.id === contrato.solicitacaoId
            ? { ...s, status: 'concluida', dataFinalizacao: new Date().toISOString().split('T')[0] }
            : s
        );
        console.log('🔄 Solicitações após atualização:', solicitacoesAtualizadas);
        return solicitacoesAtualizadas;
      });

      // 4b. Persistir status concluida no Firestore
      await updateDoc(docRef, {
        status: 'concluida',
        contratoStatus: 'assinado',
        dataAssinatura: new Date().toISOString(),
        dataFinalizacao: new Date().toISOString(),
        contrato: {
          id: contrato.id,
          valor: contrato.valor,
          status: 'assinado',
          dataAssinatura: new Date().toISOString()
        }
      });
      
      // 5. Fechar o modal após assinatura
      // NOTA: Projeto NÃO é criado automaticamente.
      // O admin irá criar o projeto manualmente após analisar o contrato.
      setTimeout(() => {
        setShowContratoModal(false);
        setContratoSelecionado(null);
        // Mostrar mensagem de sucesso
        alert('✅ Contrato assinado com sucesso! Em breve o administrador criará seu projeto e você poderá acompanhar o progresso.');
      }, 2000);
    } catch (error) {
      console.error('❌ Erro ao processar assinatura do contrato:', error);
      alert('Erro ao processar a assinatura. Tente novamente.');
    }
  };

  // Loading state - aguardar autenticação e dados
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Verificar se clientData existe
  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados do cliente</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portal do Cliente</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe seus projetos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowServicesModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Solicitar Serviço</span>
              </button>
              <ThemeToggle />
              <NotificacoesBell />
              <TutorialSettingsButton />
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <img 
                  src={clientData.avatar} 
                  alt={clientData.nome}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{clientData.nome}</p>
                  <p className="text-xs text-blue-100">{clientData.empresa}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Solicitações de Serviço */}
        {solicitacoesServico.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-green-600" />
              Minhas Solicitações de Serviço
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {solicitacoesServico.map((solicitacao) => {
                const proposta = propostasPendentes.find(p => p.solicitacaoId === solicitacao.id);
                const contrato = contratosPendentes.find(c => c.solicitacaoId === solicitacao.id);
                
                const getStatusInfo = (status: string) => {
                  switch (status) {
                    case 'nova':
                      return { label: 'Nova', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send };
                    case 'enviada':
                      return { label: 'Enviada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send };
                    case 'analise':
                      return { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock };
                    case 'proposta-criada':
                    case 'proposta-enviada':
                      return { label: 'Proposta Disponível', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: FileText };
                    case 'contrato-pendente':
                      return { label: 'Contrato Pendente', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: FileSignature };
                    case 'contrato-assinado':
                      return { label: 'Contrato Assinado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
                    case 'em-projeto':
                      return { label: 'Em Projeto', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Clock };
                    case 'concluida':
                      return { label: 'Concluída', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
                    default:
                      return { label: status || 'Pendente', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: AlertCircle };
                  }
                };
                
                const statusInfo = getStatusInfo(solicitacao.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div 
                    key={solicitacao.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{solicitacao.id}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-1">{solicitacao.titulo}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{solicitacao.categoria}</p>
                      </div>
                      <StatusIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Data:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(solicitacao.dataSolicitacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          R$ {solicitacao.valor.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg ${statusInfo.color} text-center text-sm font-medium mb-3`}>
                      {statusInfo.label}
                    </div>
                    
                    {/* Rastreabilidade */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Rastreamento:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Solicitação criada</span>
                        </div>
                        {proposta && (
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Proposta #{proposta.id.split('-')[2]}</span>
                          </div>
                        )}
                        {contrato && (
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Contrato #{contrato.id.split('-')[2]}</span>
                          </div>
                        )}
                        {!proposta && solicitacao.status !== 'enviada' && (
                          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>Aguardando proposta...</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Propostas e Contratos Pendentes */}
        {(propostasPendentes.length > 0 || contratosPendentes.length > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-purple-600" />
              Pendências - Ação Necessária
            </h2>
            
            {(() => {
              const propostasAtivas = propostasPendentes.filter((p) => {
                const status = (p.status || '').toLowerCase();
                const contratoStatus = (p.contratoStatus || '').toLowerCase();
                if (['contrato-assinado', 'concluida', 'concluída'].includes(status)) return false;
                if (['assinado', 'assinado-digitalmente'].includes(contratoStatus)) return false;
                return true;
              });

              const contratosAtivos = contratosPendentes.filter((c) => {
                const status = (c.status || '').toLowerCase();
                const contratoStatus = (c.contratoStatus || '').toLowerCase();
                if (['assinado', 'assinado-digitalmente', 'concluida', 'concluída'].includes(status)) return false;
                if (['assinado', 'assinado-digitalmente'].includes(contratoStatus)) return false;
                return true;
              });

              if (propostasAtivas.length === 0 && contratosAtivos.length === 0) return null;

              return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Propostas Pendentes */}
              {propostasAtivas.map((proposta) => {
                const solicitacao = solicitacoesServico.find(s => s.id === proposta.solicitacaoId);
                
                // Guard clause para dados inválidos
                if (!proposta.valor) {
                  console.warn('⚠️ Proposta sem valor:', proposta);
                  return null;
                }
                
                return (
                <div 
                  key={proposta.id}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-xl transition-all"
                >
                  {/* Badge de vínculo com solicitação */}
                  {solicitacao && (
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                        📋 Baseado em: {solicitacao.id}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{proposta.titulo}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enviada em {new Date(proposta.dataEnvio).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium">
                      Aguardando
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {proposta.descricao}
                  </p>
                  
                  {/* Comparação de valores */}
                  {proposta.valorSolicitacao && proposta.valor !== proposta.valorSolicitacao && (
                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm">
                      <p className="text-gray-700 dark:text-gray-300">
                        💡 <strong>Valor solicitado:</strong> R$ {proposta.valorSolicitacao.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        💼 <strong>Proposta completa:</strong> R$ {proposta.valor.toLocaleString('pt-BR')}
                        <span className="text-xs ml-2">(inclui serviços adicionais)</span>
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {proposta.valor.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Válida por</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {proposta.validade} dias
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVisualizarProposta(proposta)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Visualizar e Baixar Proposta
                  </button>
                </div>
                );
              })}

              {/* Contratos Pendentes */}
              {contratosAtivos.map((contrato) => {
                const proposta = propostasPendentes.find(p => p.id === contrato.propostaId);
                const solicitacao = solicitacoesServico.find(s => s.id === contrato.solicitacaoId);
                
                return (
                <div 
                  key={contrato.id}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 hover:shadow-xl transition-all"
                >
                  {/* Cadeia de rastreabilidade */}
                  {(solicitacao || proposta) && (
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      {solicitacao && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium">
                          📋 Solicitação: {solicitacao.id}
                        </span>
                      )}
                      {proposta && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-medium">
                          📄 Proposta: {proposta.id}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <FileSignature className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{contrato.titulo}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enviado em {new Date(contrato.dataEnvio).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium animate-pulse">
                      Requer Assinatura
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {contrato.descricao}
                  </p>
                  
                  {/* Rastreabilidade de valores */}
                  {(contrato.valorSolicitacao || contrato.valorProposta) && (
                    <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm space-y-1">
                      {contrato.valorSolicitacao && (
                        <p className="text-gray-700 dark:text-gray-300">
                          📋 <strong>Solicitação original:</strong> R$ {contrato.valorSolicitacao.toLocaleString('pt-BR')}
                        </p>
                      )}
                      {contrato.valorProposta && (
                        <p className="text-gray-700 dark:text-gray-300">
                          📄 <strong>Proposta aceita:</strong> R$ {contrato.valorProposta.toLocaleString('pt-BR')}
                        </p>
                      )}
                      <p className="text-gray-900 dark:text-white font-bold">
                        ✅ <strong>Valor do contrato:</strong> R$ {contrato.valor.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        R$ {contrato.valor.toLocaleString('pt-BR')}
                        {contrato.servicos && contrato.servicos[0]?.recorrente && <span className="text-sm">/mês</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Serviços</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {contrato.servicos?.length || 0}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVisualizarContrato(contrato)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileSignature className="w-5 h-5" />
                    Assinar Contrato Digitalmente
                  </button>
                </div>
                );
              })}
            </div>
              );
            })()}
          </div>
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projetos Dinâmicos Criados por Contratos */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Meus Projetos
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    🔄 Atualização automática ativa
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Projetos criados pelo admin (do Firestore) */}
                {projetosAdmin.length > 0 && projetosAdmin.map((projeto) => (
                  <div 
                    key={projeto.id}
                    className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer ${getStatusBorderColor(projeto.status)}`}
                    onClick={() => setSelectedProject(projeto)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-bold">
                        📋 Projeto Ativo
                      </span>
                      {projeto.atualizadoEm && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Atualizado: {new Date(projeto.atualizadoEm).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {projeto.titulo}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${getStatusColor(projeto.status)}`}>
                                {getStatusLabel(projeto.status)}
                              </span>
                              {projeto.prioridade && (
                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                  projeto.prioridade === 'urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  projeto.prioridade === 'alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                  projeto.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {projeto.prioridade === 'urgente' ? '🔥 Urgente' :
                                   projeto.prioridade === 'alta' ? '⚡ Alta' :
                                   projeto.prioridade === 'media' ? '📌 Média' : '📋 Baixa'}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            R$ {projeto.valorContratado?.toLocaleString('pt-BR') || '0'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{projeto.descricao}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>📅 Início: {new Date(projeto.dataInicio).toLocaleDateString('pt-BR')}</span>
                          <span>⏰ Prazo: {new Date(projeto.prazoEstimado).toLocaleDateString('pt-BR')}</span>
                          <span>📊 Progresso: {getProgressoByStatus(projeto)}%</span>
                        </div>

                        {/* Área de Aprovação - quando status é "aprovacao" */}
                        {(projeto.status === 'aprovacao' || projeto.status === 'aguardando-aprovacao') && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                                  ✅ Aguardando sua Aprovação
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                  A equipe finalizou esta etapa e aguarda sua aprovação para prosseguir.
                                </p>
                              </div>
                            </div>

                            {/* Descrição do que foi feito */}
                            {projeto.descricaoFaseAtual && (
                              <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                  📝 O que foi realizado:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {projeto.descricaoFaseAtual}
                                </p>
                                {projeto.faseAtualizadaEm && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    Atualizado em: {new Date(projeto.faseAtualizadaEm).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAprovarProjeto(projeto.id);
                              }}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Aprovar e Concluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mensagem quando não há projetos */}
                {projetosAdmin.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum projeto iniciado ainda.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Projetos aparecerão aqui após você assinar um contrato e o administrador criar seu projeto.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ver Portfólio */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Portfólio</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Veja nossos trabalhos</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/portfolio', { state: { fromClient: true } })}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                Ver Portfólio
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Projeto */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoriaIcon(selectedProject.categoria)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedProject.titulo}
                  </h2>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full mt-2 ${getStatusColor(selectedProject.status)}`}>
                    {getStatusLabel(selectedProject.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Imagem de Capa e Progresso */}
              <div className="relative rounded-xl overflow-hidden h-64">
                {selectedProject.imagemCapa ? (
                  <img 
                    src={selectedProject.imagemCapa} 
                    alt={selectedProject.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <span className="text-6xl">{getCategoriaIcon(selectedProject.categoria)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white w-full">
                    <p className="text-sm mb-1">Progresso Geral (baseado no status do projeto)</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/30 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full transition-all"
                          style={{ width: `${getProgressoByStatus(selectedProject)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">{getProgressoByStatus(selectedProject)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Data de Início</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(selectedProject.dataInicio).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-semibold">Investimento</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    R$ {(selectedProject.valorContratado || selectedProject.valor || 0).toLocaleString('pt-BR')}
                    {selectedProject.recorrente && <span className="text-sm text-gray-500"> /mês</span>}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold">Status Atual</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {getStatusLabel(selectedProject.status)}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Descrição do Projeto
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedProject.descricao}
                </p>
              </div>

              {/* Entregáveis */}
              {selectedProject.entregaveis && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Entregáveis
                  </h3>
                  <ul className="space-y-2">
                    {selectedProject.entregaveis.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Próximas Entregas */}
              {selectedProject.proximasEntregas && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Próximas Entregas
                  </h3>
                  <ul className="space-y-2">
                    {selectedProject.proximasEntregas.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pendências */}
              {selectedProject.pendencias && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Pendências
                  </h3>
                  <ul className="space-y-2">
                    {selectedProject.pendencias.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setContactMessage(`Olá! Gostaria de conversar sobre o projeto: ${selectedProject.titulo}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Falar sobre este Projeto
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Catálogo de Serviços */}
      {showServicesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de Serviços</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Escolha o serviço ideal para seu negócio</p>
                </div>
              </div>
              <button
                onClick={() => setShowServicesModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* Botão de Serviço Personalizado */}
              <div className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-lg">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Precisa de algo diferente?</h3>
                      <p className="text-purple-100">Solicite um serviço personalizado sob medida para você</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowServicesModal(false);
                      setShowCustomServiceModal(true);
                    }}
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Solicitação
                  </button>
                </div>
              </div>

              {/* Loading ou Grid de Serviços */}
              {loadingServicos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : catalogoServicos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhum serviço disponível no momento</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogoServicos.map((servico, index) => {
                  // Cores variadas para as bordas superiores
                  const borderColors = [
                    'border-t-purple-500',
                    'border-t-pink-500',
                    'border-t-blue-500',
                    'border-t-green-500',
                    'border-t-orange-500',
                    'border-t-cyan-500',
                    'border-t-red-500',
                    'border-t-indigo-500',
                    'border-t-teal-500',
                    'border-t-amber-500',
                  ];
                  const borderColor = borderColors[index % borderColors.length];
                  
                  // Cores de fundo do ícone por categoria
                  const iconBgColors: Record<string, string> = {
                    'Branding': 'bg-purple-100 dark:bg-purple-900/40',
                    'Social Media': 'bg-pink-100 dark:bg-pink-900/40',
                    'Web Design': 'bg-blue-100 dark:bg-blue-900/40',
                    'Marketing Digital': 'bg-green-100 dark:bg-green-900/40',
                    'Design Gráfico': 'bg-orange-100 dark:bg-orange-900/40',
                    'Audiovisual': 'bg-red-100 dark:bg-red-900/40',
                  };
                  const iconBg = iconBgColors[servico.categoria] || 'bg-gray-100 dark:bg-gray-800';
                  
                  return (
                  <div
                    key={servico.id}
                    className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 border-t-4 ${borderColor} rounded-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative group`}
                  >
                    {servico.popular && (
                      <div className="absolute -top-0 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-b-lg flex items-center gap-1 shadow-lg z-10">
                        <Star className="w-3 h-3" />
                        POPULAR
                      </div>
                    )}

                    <div className="p-6">
                      <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {servico.icone}
                      </div>
                    
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {servico.titulo}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full mb-3">
                          {servico.categoria}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {servico.descricao}
                        </p>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Prazo:
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{servico.prazo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Valor:
                          </span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            R$ {servico.preco.toLocaleString('pt-BR')}
                            {servico.recorrente && <span className="text-sm font-normal">/mês</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-600 p-6 pt-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Inclui:</p>
                      <ul className="space-y-1.5 mb-4">
                        {servico.inclui.slice(0, 3).map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                        {servico.inclui.length > 3 && (
                          <li className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-2">
                            + {servico.inclui.length - 3} itens adicionais
                          </li>
                        )}
                      </ul>

                      <button
                        onClick={() => setSelectedService(servico)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Solicitar Serviço
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Serviço Selecionado */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedService.icone}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedService.titulo}</h2>
                  <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full mt-1">
                    {selectedService.categoria}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sobre o Serviço</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedService.descricao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prazo de Entrega</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedService.prazo}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Investimento</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    R$ {selectedService.preco.toLocaleString('pt-BR')}
                    {selectedService.recorrente && <span className="text-sm">/mês</span>}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  O que está incluído
                </h3>
                <ul className="space-y-2">
                  {selectedService.inclui.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>📌 Próximos passos:</strong> Após confirmar a solicitação, nossa equipe entrará em contato em até 24 horas para alinhar os detalhes do projeto e iniciar o trabalho.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleRequestService(selectedService)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Confirmar Solicitação
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Serviço Personalizado */}
      {showCustomServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Solicitar Serviço Personalizado</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Descreva o que você precisa</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCustomServiceModal(false);
                  setCustomServiceData({ titulo: '', descricao: '', prazo: '', orcamento: '' });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>💡 Dica:</strong> Quanto mais detalhes você fornecer, mais precisa será nossa proposta!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customServiceData.titulo}
                  onChange={(e) => setCustomServiceData({ ...customServiceData, titulo: e.target.value })}
                  placeholder="Ex: Campanha de aniversário da empresa"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição Detalhada <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customServiceData.descricao}
                  onChange={(e) => setCustomServiceData({ ...customServiceData, descricao: e.target.value })}
                  placeholder="Descreva o que você precisa, objetivos, público-alvo, referências..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prazo Desejado (opcional)
                  </label>
                  <input
                    type="text"
                    value={customServiceData.prazo}
                    onChange={(e) => setCustomServiceData({ ...customServiceData, prazo: e.target.value })}
                    placeholder="Ex: 30 dias"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orçamento Estimado (opcional)
                  </label>
                  <input
                    type="text"
                    value={customServiceData.orcamento}
                    onChange={(e) => setCustomServiceData({ ...customServiceData, orcamento: e.target.value })}
                    placeholder="Ex: R$ 5.000"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>📧 Próximos passos:</strong> Analisaremos sua solicitação e enviaremos uma proposta personalizada em até 24 horas úteis.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleRequestCustomService}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Enviar Solicitação
                </button>
                <button
                  onClick={() => {
                    setShowCustomServiceModal(false);
                    setCustomServiceData({ titulo: '', descricao: '', prazo: '', orcamento: '' });
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Proposta */}
      {propostaSelecionada && (
        <ModalGerarProposta
          isOpen={showPropostaModal}
          onClose={() => {
            setShowPropostaModal(false);
            setPropostaSelecionada(null);
          }}
          cliente={{
            nome: clientData.nome,
            empresa: clientData.empresa,
            email: 'joao@padaria.com',
            telefone: '(11) 98765-4321',
            endereco: 'Rua das Flores, 123',
            cidade: 'São Paulo',
            estado: 'SP'
          }}
          servicos={propostaSelecionada.servicos}
          observacoes="Proposta válida conforme condições apresentadas. Valores sujeitos a alteração após período de validade."
          valorTotal={propostaSelecionada.valor}
          onPropostaGerada={handlePropostaGerada}
        />
      )}

      {/* Modal de Contrato */}
      {contratoSelecionado && (
        <ModalContratoAssinatura
          isOpen={showContratoModal}
          onClose={() => {
            setShowContratoModal(false);
            setContratoSelecionado(null);
          }}
          contratoId={contratoSelecionado.id}
          cliente={{
            nome: clientData.nome,
            empresa: clientData.empresa,
            email: 'joao@padaria.com',
            telefone: '(11) 98765-4321',
            cpf: '123.456.789-00',
            endereco: 'Rua das Flores, 123',
            cidade: 'São Paulo',
            estado: 'SP'
          }}
          servicos={contratoSelecionado.servicos || []}
          valorTotal={contratoSelecionado.valor}
          onContratoAssinado={handleContratoAssinado}
        />
      )}

      {/* Chat WhatsApp Flutuante */}
      <ChatWhatsApp
        mensagens={obterMensagensChat()}
        onEnviarMensagem={handleEnviarMensagemChat}
        nomeDestinatario="Agência de Publicidade"
        statusDestinatario="online"
        isAdmin={false}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay page="portal" />
    </div>
  );
};

export default ClientPortal;

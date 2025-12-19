/**
 * Catálogo de Serviços - Dados compartilhados
 * Este arquivo centraliza os serviços oferecidos pela agência
 */

export interface ServicoCatalogo {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  preco: number;
  prazo: string;
  recorrente: boolean;
  destaque?: boolean;
  icone?: string;
}

export const SERVICOS_CATALOGO: ServicoCatalogo[] = [
  // BRANDING
  {
    id: 'branding-completo',
    titulo: 'Identidade Visual Completa',
    categoria: 'branding',
    descricao: 'Logo profissional, manual de marca, paleta de cores, tipografia, papelaria completa e mockups',
    preco: 8000,
    prazo: '30 dias',
    recorrente: false,
    destaque: true,
    icone: '🎨'
  },
  {
    id: 'redesign-marca',
    titulo: 'Redesign de Marca',
    categoria: 'branding',
    descricao: 'Modernização e atualização da identidade visual existente mantendo reconhecimento',
    preco: 5000,
    prazo: '21 dias',
    recorrente: false,
    icone: '✨'
  },
  {
    id: 'naming-slogan',
    titulo: 'Naming e Slogan',
    categoria: 'branding',
    descricao: 'Criação estratégica de nome e slogan memorável para sua marca',
    preco: 2500,
    prazo: '15 dias',
    recorrente: false,
    icone: '💭'
  },
  {
    id: 'manual-marca',
    titulo: 'Manual de Marca',
    categoria: 'branding',
    descricao: 'Documento completo com todas as diretrizes de aplicação da marca',
    preco: 3000,
    prazo: '20 dias',
    recorrente: false,
    icone: '📖'
  },

  // SOCIAL MEDIA
  {
    id: 'gestao-redes-basico',
    titulo: 'Gestão de Redes Sociais - Básico',
    categoria: 'social-media',
    descricao: '12 posts mensais, 4 stories, planejamento e agendamento',
    preco: 1500,
    prazo: 'Mensal',
    recorrente: true,
    icone: '📱'
  },
  {
    id: 'gestao-redes-intermediario',
    titulo: 'Gestão de Redes Sociais - Intermediário',
    categoria: 'social-media',
    descricao: '20 posts mensais, 8 stories, 2 reels, interação com público',
    preco: 2500,
    prazo: 'Mensal',
    recorrente: true,
    destaque: true,
    icone: '📲'
  },
  {
    id: 'gestao-redes-premium',
    titulo: 'Gestão de Redes Sociais - Premium',
    categoria: 'social-media',
    descricao: '30 posts mensais, 12 stories, 4 reels, monitoramento 24/7, relatórios',
    preco: 3500,
    prazo: 'Mensal',
    recorrente: true,
    icone: '🌟'
  },
  {
    id: 'criacao-conteudo',
    titulo: 'Criação de Conteúdo',
    categoria: 'social-media',
    descricao: 'Produção de conteúdo original: textos, artes, copy estratégico',
    preco: 1800,
    prazo: 'Mensal',
    recorrente: true,
    icone: '✍️'
  },

  // WEB
  {
    id: 'landing-page',
    titulo: 'Landing Page Profissional',
    categoria: 'web',
    descricao: 'Página única otimizada para conversão, responsiva e com SEO',
    preco: 2500,
    prazo: '15 dias',
    recorrente: false,
    icone: '🚀'
  },
  {
    id: 'site-institucional',
    titulo: 'Site Institucional',
    categoria: 'web',
    descricao: 'Site completo com até 8 páginas, design responsivo, formulários',
    preco: 5000,
    prazo: '30 dias',
    recorrente: false,
    destaque: true,
    icone: '🌐'
  },
  {
    id: 'ecommerce',
    titulo: 'E-commerce Completo',
    categoria: 'web',
    descricao: 'Loja virtual com carrinho, pagamento, gestão de produtos e pedidos',
    preco: 12000,
    prazo: '60 dias',
    recorrente: false,
    destaque: true,
    icone: '🛒'
  },
  {
    id: 'manutencao-site',
    titulo: 'Manutenção de Site',
    categoria: 'web',
    descricao: 'Atualizações, backup, segurança, monitoramento e suporte técnico',
    preco: 800,
    prazo: 'Mensal',
    recorrente: true,
    icone: '🔧'
  },

  // MARKETING
  {
    id: 'campanha-ads',
    titulo: 'Campanha Google Ads',
    categoria: 'marketing',
    descricao: 'Criação e gestão de campanhas no Google Ads com otimização',
    preco: 2000,
    prazo: 'Mensal',
    recorrente: true,
    icone: '🎯'
  },
  {
    id: 'campanha-social-ads',
    titulo: 'Campanha Social Media Ads',
    categoria: 'marketing',
    descricao: 'Anúncios no Facebook, Instagram e LinkedIn com segmentação',
    preco: 1800,
    prazo: 'Mensal',
    recorrente: true,
    icone: '📊'
  },
  {
    id: 'email-marketing',
    titulo: 'E-mail Marketing',
    categoria: 'marketing',
    descricao: '4 campanhas mensais, design, copy, automação e relatórios',
    preco: 1200,
    prazo: 'Mensal',
    recorrente: true,
    icone: '📧'
  },
  {
    id: 'consultoria-marketing',
    titulo: 'Consultoria de Marketing',
    categoria: 'marketing',
    descricao: 'Análise estratégica, planejamento e orientação para crescimento',
    preco: 3000,
    prazo: 'Mensal',
    recorrente: true,
    icone: '💡'
  },

  // DESIGN
  {
    id: 'design-grafico',
    titulo: 'Design Gráfico sob Demanda',
    categoria: 'design',
    descricao: 'Criação de materiais gráficos diversos: flyers, banners, cartões',
    preco: 500,
    prazo: '5 dias',
    recorrente: false,
    icone: '🎨'
  },
  {
    id: 'apresentacao-corporativa',
    titulo: 'Apresentação Corporativa',
    categoria: 'design',
    descricao: 'Slide deck profissional para apresentações, com design moderno',
    preco: 1000,
    prazo: '7 dias',
    recorrente: false,
    icone: '📊'
  },
  {
    id: 'material-impresso',
    titulo: 'Material Impresso',
    categoria: 'design',
    descricao: 'Design de catálogos, folders, revistas e materiais para impressão',
    preco: 1500,
    prazo: '15 dias',
    recorrente: false,
    icone: '📄'
  },

  // VÍDEO
  {
    id: 'video-institucional',
    titulo: 'Vídeo Institucional',
    categoria: 'video',
    descricao: 'Produção completa: roteiro, filmagem, edição e trilha sonora',
    preco: 6000,
    prazo: '30 dias',
    recorrente: false,
    destaque: true,
    icone: '🎬'
  },
  {
    id: 'motion-graphics',
    titulo: 'Motion Graphics',
    categoria: 'video',
    descricao: 'Vídeos animados explicativos com design e narrativa profissional',
    preco: 4000,
    prazo: '20 dias',
    recorrente: false,
    icone: '🎞️'
  },
  {
    id: 'edicao-video',
    titulo: 'Edição de Vídeo',
    categoria: 'video',
    descricao: 'Edição profissional de vídeos com correção de cor e efeitos',
    preco: 1500,
    prazo: '10 dias',
    recorrente: false,
    icone: '✂️'
  }
];

// Função helper para obter serviços por categoria
export const getServicosByCategoria = (categoria: string): ServicoCatalogo[] => {
  return SERVICOS_CATALOGO.filter(s => s.categoria === categoria);
};

// Função helper para obter serviços em destaque
export const getServicosDestaque = (): ServicoCatalogo[] => {
  return SERVICOS_CATALOGO.filter(s => s.destaque);
};

// Função helper para buscar serviço por ID
export const getServicoById = (id: string): ServicoCatalogo | undefined => {
  return SERVICOS_CATALOGO.find(s => s.id === id);
};

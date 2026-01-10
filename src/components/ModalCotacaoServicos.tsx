import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Package, Sparkles } from 'lucide-react';

interface ServicoDisponivel {
  id: string;
  nome: string;
  categoria: 'branding' | 'social-media' | 'web' | 'marketing' | 'design' | 'video';
  descricao: string;
  valorMinimo: number;
  valorMaximo: number;
  valorSugerido: number;
  recorrente: boolean;
  unidade: string;
}

interface ModalCotacaoServicosProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNome: string;
  onGerarProposta: (servicosSelecionados: ServicoDisponivel[], observacoes: string, valorTotal: number) => void;
}

const ModalCotacaoServicos: React.FC<ModalCotacaoServicosProps> = ({
  isOpen,
  onClose,
  clienteNome,
  onGerarProposta
}) => {
  const [servicosSelecionados, setServicosSelecionados] = useState<Set<string>>(new Set());
  const [observacoes, setObservacoes] = useState('');
  const [valoresCustomizados, setValoresCustomizados] = useState<Record<string, number>>({});
  const [catalogoServicos, setCatalogoServicos] = useState<ServicoDisponivel[]>([]);

  // Catálogo de serviços padrão (fallback)
  const CATALOGO_SERVICOS: ServicoDisponivel[] = [
    // BRANDING
    {
      id: 'branding-completo',
      nome: 'Identidade Visual Completa',
      categoria: 'branding',
      descricao: 'Logo, manual de marca, papelaria, aplicações',
      valorMinimo: 2500,
      valorMaximo: 8000,
      valorSugerido: 5000,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'branding-basico',
      nome: 'Logo + Manual Básico',
      categoria: 'branding',
      descricao: 'Criação de logo e guia de aplicação',
      valorMinimo: 1500,
      valorMaximo: 3500,
      valorSugerido: 2500,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'branding-rebranding',
      nome: 'Rebranding',
      categoria: 'branding',
      descricao: 'Renovação completa de marca existente',
      valorMinimo: 4000,
      valorMaximo: 12000,
      valorSugerido: 7500,
      recorrente: false,
      unidade: 'projeto'
    },
    
    // SOCIAL MEDIA
    {
      id: 'social-gestao-completa',
      nome: 'Gestão Completa de Redes Sociais',
      categoria: 'social-media',
      descricao: 'Planejamento, posts diários, stories, reels, relatórios',
      valorMinimo: 1200,
      valorMaximo: 3500,
      valorSugerido: 2000,
      recorrente: true,
      unidade: 'mês'
    },
    {
      id: 'social-basico',
      nome: 'Gestão Básica (3x semana)',
      categoria: 'social-media',
      descricao: '12 posts/mês + stories básicos',
      valorMinimo: 800,
      valorMaximo: 1500,
      valorSugerido: 1000,
      recorrente: true,
      unidade: 'mês'
    },
    {
      id: 'social-trafego',
      nome: 'Gestão de Tráfego Pago',
      categoria: 'social-media',
      descricao: 'Campanhas Meta Ads + Google Ads',
      valorMinimo: 1000,
      valorMaximo: 3000,
      valorSugerido: 1800,
      recorrente: true,
      unidade: 'mês'
    },
    
    // WEB
    {
      id: 'web-institucional',
      nome: 'Site Institucional',
      categoria: 'web',
      descricao: 'Website responsivo com 5-8 páginas',
      valorMinimo: 3000,
      valorMaximo: 8000,
      valorSugerido: 5000,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'web-ecommerce',
      nome: 'E-commerce Completo',
      categoria: 'web',
      descricao: 'Loja virtual com integração de pagamentos',
      valorMinimo: 8000,
      valorMaximo: 25000,
      valorSugerido: 15000,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'web-landing',
      nome: 'Landing Page',
      categoria: 'web',
      descricao: 'Página única para conversão',
      valorMinimo: 1500,
      valorMaximo: 4000,
      valorSugerido: 2500,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'web-manutencao',
      nome: 'Manutenção de Website',
      categoria: 'web',
      descricao: 'Atualizações, backup, segurança',
      valorMinimo: 300,
      valorMaximo: 800,
      valorSugerido: 500,
      recorrente: true,
      unidade: 'mês'
    },
    
    // MARKETING
    {
      id: 'marketing-estrategia',
      nome: 'Planejamento Estratégico',
      categoria: 'marketing',
      descricao: 'Análise de mercado, personas, estratégias',
      valorMinimo: 2000,
      valorMaximo: 6000,
      valorSugerido: 3500,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'marketing-conteudo',
      nome: 'Marketing de Conteúdo',
      categoria: 'marketing',
      descricao: 'Blog posts, e-books, materiais ricos',
      valorMinimo: 1500,
      valorMaximo: 4000,
      valorSugerido: 2500,
      recorrente: true,
      unidade: 'mês'
    },
    {
      id: 'marketing-email',
      nome: 'Email Marketing',
      categoria: 'marketing',
      descricao: 'Campanhas de email, automação, nutrição',
      valorMinimo: 800,
      valorMaximo: 2500,
      valorSugerido: 1500,
      recorrente: true,
      unidade: 'mês'
    },
    
    // DESIGN
    {
      id: 'design-grafico',
      nome: 'Design Gráfico',
      categoria: 'design',
      descricao: 'Flyers, banners, materiais impressos',
      valorMinimo: 500,
      valorMaximo: 2000,
      valorSugerido: 1000,
      recorrente: false,
      unidade: 'peça'
    },
    {
      id: 'design-embalagem',
      nome: 'Design de Embalagem',
      categoria: 'design',
      descricao: 'Criação de embalagens e rótulos',
      valorMinimo: 1500,
      valorMaximo: 5000,
      valorSugerido: 3000,
      recorrente: false,
      unidade: 'projeto'
    },
    {
      id: 'design-apresentacao',
      nome: 'Apresentações Corporativas',
      categoria: 'design',
      descricao: 'Slides profissionais para negócios',
      valorMinimo: 600,
      valorMaximo: 2000,
      valorSugerido: 1200,
      recorrente: false,
      unidade: 'apresentação'
    },
    
    // VÍDEO
    {
      id: 'video-institucional',
      nome: 'Vídeo Institucional',
      categoria: 'video',
      descricao: 'Vídeo profissional 1-3 minutos',
      valorMinimo: 3000,
      valorMaximo: 10000,
      valorSugerido: 6000,
      recorrente: false,
      unidade: 'vídeo'
    },
    {
      id: 'video-reels',
      nome: 'Pacote Reels/TikTok',
      categoria: 'video',
      descricao: '8-12 vídeos curtos por mês',
      valorMinimo: 1200,
      valorMaximo: 3000,
      valorSugerido: 2000,
      recorrente: true,
      unidade: 'mês'
    },
    {
      id: 'video-edicao',
      nome: 'Edição de Vídeo',
      categoria: 'video',
      descricao: 'Edição profissional de material fornecido',
      valorMinimo: 500,
      valorMaximo: 2000,
      valorSugerido: 1000,
      recorrente: false,
      unidade: 'vídeo'
    }
  ];

  // Carregar serviços (padrão + customizados)
  useEffect(() => {
    const servicosCustomizados = localStorage.getItem('servicos_customizados');
    let todosServicos = [...CATALOGO_SERVICOS];
    
    if (servicosCustomizados) {
      try {
        const parsed = JSON.parse(servicosCustomizados);
        todosServicos = [...CATALOGO_SERVICOS, ...parsed];
      } catch (error) {
        console.error('Erro ao carregar serviços customizados:', error);
      }
    }
    
    setCatalogoServicos(todosServicos);
  }, [isOpen]);

  // Agrupar serviços por categoria
  const servicosPorCategoria = catalogoServicos.reduce((acc, servico) => {
    if (!acc[servico.categoria]) {
      acc[servico.categoria] = [];
    }
    acc[servico.categoria].push(servico);
    return acc;
  }, {} as Record<string, ServicoDisponivel[]>);

  const categorias = {
    'branding': { nome: 'Branding', cor: 'purple', icon: Sparkles },
    'social-media': { nome: 'Social Media', cor: 'blue', icon: Package },
    'web': { nome: 'Web', cor: 'green', icon: Package },
    'marketing': { nome: 'Marketing', cor: 'orange', icon: Package },
    'design': { nome: 'Design', cor: 'pink', icon: Package },
    'video': { nome: 'Vídeo', cor: 'red', icon: Package }
  };

  // Calcular valor total
  const calcularValorTotal = (): number => {
    let total = 0;
    servicosSelecionados.forEach(servicoId => {
      const servico = catalogoServicos.find(s => s.id === servicoId);
      if (servico) {
        const valorCustom = valoresCustomizados[servicoId];
        total += valorCustom !== undefined ? valorCustom : servico.valorSugerido;
      }
    });
    return total;
  };

  const toggleServico = (servicoId: string) => {
    const newSet = new Set(servicosSelecionados);
    if (newSet.has(servicoId)) {
      newSet.delete(servicoId);
      // Remove valor customizado se desmarcar
      const newValores = { ...valoresCustomizados };
      delete newValores[servicoId];
      setValoresCustomizados(newValores);
    } else {
      newSet.add(servicoId);
    }
    setServicosSelecionados(newSet);
  };

  const atualizarValorCustomizado = (servicoId: string, valor: number) => {
    setValoresCustomizados({
      ...valoresCustomizados,
      [servicoId]: valor
    });
  };

  const handleGerarProposta = () => {
    const servicos = Array.from(servicosSelecionados)
      .map(id => catalogoServicos.find(s => s.id === id))
      .filter(s => s !== undefined) as ServicoDisponivel[];
    
    const valorTotal = calcularValorTotal();
    onGerarProposta(servicos, observacoes, valorTotal);
  };

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setServicosSelecionados(new Set());
      setObservacoes('');
      setValoresCustomizados({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const valorTotal = calcularValorTotal();
  const servicosRecorrentes = Array.from(servicosSelecionados)
    .map(id => CATALOGO_SERVICOS.find(s => s.id === id))
    .filter(s => s && s.recorrente);
  
  const valorMensal = servicosRecorrentes.reduce((acc, s) => {
    if (s) {
      const valorCustom = valoresCustomizados[s.id];
      return acc + (valorCustom !== undefined ? valorCustom : s.valorSugerido);
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cotação de Serviços</h2>
                <p className="text-blue-100">Cliente: {clienteNome}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Resumo */}
            {servicosSelecionados.size > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Serviços selecionados</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {servicosSelecionados.size}
                    </p>
                  </div>
                  {valorMensal > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Valor recorrente/mês</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        R$ {valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Valor total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Catálogo por categoria */}
            {Object.entries(servicosPorCategoria).map(([categoria, servicos]) => {
              const catInfo = categorias[categoria as keyof typeof categorias];
              const Icon = catInfo.icon;
              
              return (
                <div key={categoria} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {catInfo.nome}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {servicos.map(servico => {
                      const selecionado = servicosSelecionados.has(servico.id);
                      const valorCustom = valoresCustomizados[servico.id];
                      const valorExibicao = valorCustom !== undefined ? valorCustom : servico.valorSugerido;
                      
                      return (
                        <div
                          key={servico.id}
                          className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                            selecionado
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => toggleServico(servico.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selecionado
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {selecionado && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {servico.nome}
                                </h4>
                                {servico.recorrente && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">
                                    Recorrente
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {servico.descricao}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Faixa: R$ {servico.valorMinimo.toLocaleString('pt-BR')} - R$ {servico.valorMaximo.toLocaleString('pt-BR')} / {servico.unidade}
                              </p>
                            </div>
                          </div>
                          
                          {selecionado && (
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Valor ({servico.unidade})
                              </label>
                              <input
                                type="number"
                                value={valorExibicao}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  atualizarValorCustomizado(servico.id, Number(e.target.value));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                min={servico.valorMinimo}
                                max={servico.valorMaximo}
                                step="100"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Observações */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Observações / Requisitos Especiais
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                placeholder="Adicione detalhes sobre prazos, requisitos específicos, preferências do cliente..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <button
                onClick={handleGerarProposta}
                disabled={servicosSelecionados.size === 0}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Gerar Proposta PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCotacaoServicos;

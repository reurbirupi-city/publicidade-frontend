import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Tag,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

type CategoriaPortfolio = 'branding' | 'web' | 'social' | 'marketing' | 'design' | 'video' | 'todos';

interface ItemPortfolio {
  id: string;
  projetoId: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaPortfolio;
  autorizadoPublicacao: boolean;
  imagemCapa: string;
  imagensGaleria: string[];
  tags: string[];
  destaque: boolean;
  dataFinalizacao: string;
  resultados?: {
    alcance?: number;
    engajamento?: number;
    conversao?: number;
    roi?: string;
  };
  testemunho?: {
    texto: string;
    autor: string;
    cargo: string;
  };
  criadoEm: string;
}

interface ModalVisualizarPortfolioProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemPortfolio;
  onEditar?: () => void;
  onDeletar?: () => void;
}

const ModalVisualizarPortfolio: React.FC<ModalVisualizarPortfolioProps> = ({
  isOpen,
  onClose,
  item,
  onEditar,
  onDeletar
}) => {
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'galeria' | 'resultados' | 'cliente'>('visao-geral');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatarNumero = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getCategoriaInfo = (categoria: CategoriaPortfolio) => {
    const infos = {
      branding: { label: 'Branding', color: 'purple', gradient: 'from-purple-500 to-pink-500' },
      web: { label: 'Web Design', color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
      social: { label: 'Social Media', color: 'pink', gradient: 'from-pink-500 to-rose-500' },
      marketing: { label: 'Marketing', color: 'green', gradient: 'from-green-500 to-emerald-500' },
      design: { label: 'Design', color: 'orange', gradient: 'from-orange-500 to-amber-500' },
      video: { label: 'Vídeo', color: 'red', gradient: 'from-red-500 to-orange-500' },
      todos: { label: 'Todos', color: 'gray', gradient: 'from-gray-500 to-slate-500' }
    };
    return infos[categoria];
  };

  const categoriaInfo = getCategoriaInfo(item.categoria);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.imagensGaleria.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + item.imagensGaleria.length) % item.imagensGaleria.length);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header com Gradiente */}
        <div className={`bg-gradient-to-r ${categoriaInfo.gradient} p-6 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{item.titulo}</h2>
                {item.destaque && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Destaque
                  </span>
                )}
              </div>
              <p className="text-white/90 text-lg">{item.clienteEmpresa}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Finalizado em {formatarData(item.dataFinalizacao)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span>{categoriaInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('visao-geral')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'visao-geral'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'galeria'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🖼️ Galeria ({item.imagensGaleria.length})
            </button>
            <button
              onClick={() => setActiveTab('resultados')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'resultados'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Resultados
            </button>
            <button
              onClick={() => setActiveTab('cliente')}
              className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'cliente'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              💬 Cliente
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: Visão Geral */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-6">
              {/* Imagem Destaque */}
              <div className="relative h-96 rounded-xl overflow-hidden group">
                <img
                  src={item.imagemCapa}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 right-4">
                    <button className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-colors">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Sobre o Projeto
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.descricao}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Informações Técnicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">Cliente</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold">{item.clienteNome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.clienteEmpresa}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">Status</span>
                  </div>
                  <p className="text-green-600 dark:text-green-400 font-bold">✅ Finalizado</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatarData(item.dataFinalizacao)}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Galeria */}
          {activeTab === 'galeria' && (
            <div className="space-y-6">
              {/* Carousel Principal */}
              <div className="relative">
                <div className="relative h-[500px] rounded-xl overflow-hidden group">
                  <img
                    src={item.imagensGaleria[currentImageIndex]}
                    alt={`${item.titulo} - Imagem ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Controles do Carousel */}
                  {item.imagensGaleria.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Indicador */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                        {currentImageIndex + 1} / {item.imagensGaleria.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {item.imagensGaleria.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 mt-4">
                    {item.imagensGaleria.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === index
                            ? 'border-purple-600 dark:border-purple-400 scale-95'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {currentImageIndex === index && (
                          <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info da Imagem */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-semibold">
                    Visualizando imagem {currentImageIndex + 1} de {item.imagensGaleria.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Resultados */}
          {activeTab === 'resultados' && (
            <div className="space-y-6">
              {item.resultados ? (
                <>
                  {/* Cards de Métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.resultados.alcance && (
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Alcance Total</p>
                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                          {formatarNumero(item.resultados.alcance)}
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">pessoas alcançadas</p>
                      </div>
                    )}

                    {item.resultados.engajamento && (
                      <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                            <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                          </div>
                          <BarChart3 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <p className="text-sm text-pink-600 dark:text-pink-400 font-semibold mb-1">Engajamento</p>
                        <p className="text-4xl font-bold text-pink-700 dark:text-pink-300">
                          {formatarNumero(item.resultados.engajamento)}
                        </p>
                        <p className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-2">interações totais</p>
                      </div>
                    )}

                    {item.resultados.conversao && (
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                          </div>
                          <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">Taxa de Conversão</p>
                        <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                          {item.resultados.conversao}%
                        </p>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">conversões realizadas</p>
                      </div>
                    )}

                    {item.resultados.roi && (
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                          <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">ROI (Retorno)</p>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-300">
                          {item.resultados.roi}
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">retorno sobre investimento</p>
                      </div>
                    )}
                  </div>

                  {/* Gráfico Visual */}
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Performance do Projeto
                    </h3>
                    <div className="space-y-3">
                      {item.resultados.alcance && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Alcance</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatarNumero(item.resultados.alcance)}</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      )}
                      {item.resultados.engajamento && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Engajamento</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatarNumero(item.resultados.engajamento)}</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: '92%' }}></div>
                          </div>
                        </div>
                      )}
                      {item.resultados.conversao && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Conversão</span>
                            <span className="font-bold text-gray-900 dark:text-white">{item.resultados.conversao}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${item.resultados.conversao}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <BarChart3 className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Resultados não disponíveis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum resultado foi registrado para este projeto
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: Cliente */}
          {activeTab === 'cliente' && (
            <div className="space-y-6">
              {/* Card do Cliente */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {item.clienteNome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.clienteNome}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{item.clienteEmpresa}</p>
                  </div>
                </div>
              </div>

              {/* Testemunho */}
              {item.testemunho ? (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Testemunho do Cliente
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed text-lg">
                        "{item.testemunho.texto}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {item.testemunho.autor.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{item.testemunho.autor}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.testemunho.cargo}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <MessageCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Nenhum testemunho disponível
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    O cliente ainda não forneceu um feedback para este projeto
                  </p>
                </div>
              )}

              {/* Avaliação Visual */}
              {item.testemunho && (
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Satisfação do Cliente
                      </h3>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-8 h-8 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">5.0</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Excelente!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onDeletar}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-semibold"
              >
                🗑️ Deletar
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-semibold"
              >
                Fechar
              </button>
              <button
                onClick={onEditar}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-semibold shadow-lg"
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVisualizarPortfolio;

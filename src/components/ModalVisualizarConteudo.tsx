import React, { useState } from 'react';
import { X, Edit2, Trash2, Instagram, Facebook, Linkedin, Twitter, Youtube, Calendar, Clock, User, Building2, FileText, Hash, Image, Video, Link as LinkIcon, MessageSquare, TrendingUp } from 'lucide-react';
import Modal from './Modal';

interface ConteudoSocial {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  projetoId?: string;
  projetoTitulo?: string;
  redeSocial: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  tipoConteudo: 'post' | 'stories' | 'reels' | 'carrossel' | 'video' | 'artigo';
  dataPublicacao: string;
  horaPublicacao?: string;
  status: 'planejado' | 'em_criacao' | 'aprovado' | 'publicado' | 'cancelado';
  copy?: string;
  hashtags?: string[];
  urlImagem?: string;
  urlVideo?: string;
  linkExterno?: string;
  observacoes?: string;
  metricas?: {
    alcance?: number;
    impressoes?: number;
    engajamento?: number;
    cliques?: number;
    comentarios?: number;
    compartilhamentos?: number;
    salvos?: number;
  };
  criadoEm: string;
  atualizadoEm: string;
}

interface ModalVisualizarConteudoProps {
  isOpen: boolean;
  onClose: () => void;
  conteudo: ConteudoSocial | null;
  onEdit: (conteudo: ConteudoSocial) => void;
  onDelete: (conteudo: ConteudoSocial) => void;
}

const ModalVisualizarConteudo: React.FC<ModalVisualizarConteudoProps> = ({
  isOpen,
  onClose,
  conteudo,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'detalhes' | 'copy' | 'midia' | 'metricas'>('detalhes');

  if (!conteudo) return null;

  const getRedeIcon = (rede: string) => {
    const icons = {
      instagram: <Instagram className="w-5 h-5" />,
      facebook: <Facebook className="w-5 h-5" />,
      linkedin: <Linkedin className="w-5 h-5" />,
      twitter: <Twitter className="w-5 h-5" />,
      youtube: <Youtube className="w-5 h-5" />,
      tiktok: <MessageSquare className="w-5 h-5" />,
    };
    return icons[rede as keyof typeof icons] || <MessageSquare className="w-5 h-5" />;
  };

  const getRedeColor = (rede: string) => {
    const colors = {
      instagram: 'from-pink-600 to-purple-600',
      facebook: 'from-blue-600 to-blue-500',
      linkedin: 'from-blue-700 to-blue-600',
      twitter: 'from-sky-500 to-blue-500',
      youtube: 'from-red-600 to-red-500',
      tiktok: 'from-gray-800 to-gray-700',
    };
    return colors[rede as keyof typeof colors] || 'from-gray-600 to-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planejado: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      em_criacao: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      aprovado: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      publicado: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      cancelado: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status as keyof typeof colors] || colors.planejado;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planejado: 'Planejado',
      em_criacao: 'Em Criação',
      aprovado: 'Aprovado',
      publicado: 'Publicado',
      cancelado: 'Cancelado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      post: 'Post',
      stories: 'Stories',
      reels: 'Reels',
      carrossel: 'Carrossel',
      video: 'Vídeo',
      artigo: 'Artigo',
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'copy', label: 'Copy & Hashtags' },
    { id: 'midia', label: 'Mídia' },
    { id: 'metricas', label: 'Métricas' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* Header com Título e Badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${getRedeColor(conteudo.redeSocial)} text-white`}>
                {getRedeIcon(conteudo.redeSocial)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {conteudo.titulo}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {conteudo.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(conteudo.status)}`}>
                {getStatusLabel(conteudo.status)}
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                {getTipoLabel(conteudo.tipoConteudo)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(conteudo)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              onClick={() => onDelete(conteudo)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-pink-600 dark:border-purple-500 text-pink-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'detalhes' && (
            <div className="space-y-4">
              {/* Descrição */}
              {conteudo.descricao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {conteudo.descricao}
                  </p>
                </div>
              )}

              {/* Cliente e Projeto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Cliente</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {conteudo.clienteNome}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {conteudo.clienteEmpresa}
                  </p>
                </div>

                {conteudo.projetoTitulo && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Projeto</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {conteudo.projetoTitulo}
                    </p>
                  </div>
                )}
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Data de Publicação</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(conteudo.dataPublicacao)}
                  </p>
                </div>

                {conteudo.horaPublicacao && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Horário</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {conteudo.horaPublicacao}
                    </p>
                  </div>
                )}
              </div>

              {/* Observações */}
              {conteudo.observacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {conteudo.observacoes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Criado em:</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(conteudo.criadoEm)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Atualizado em:</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDateTime(conteudo.atualizadoEm)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'copy' && (
            <div className="space-y-4">
              {/* Copy/Legenda */}
              {conteudo.copy ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Copy/Legenda
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {conteudo.copy}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {conteudo.copy.length} caracteres
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma copy cadastrada
                </p>
              )}

              {/* Hashtags */}
              {conteudo.hashtags && conteudo.hashtags.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Hashtags ({conteudo.hashtags.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {conteudo.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 dark:bg-purple-900 text-pink-700 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma hashtag cadastrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'midia' && (
            <div className="space-y-4">
              {/* URL da Imagem */}
              {conteudo.urlImagem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Imagem
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <a
                      href={conteudo.urlImagem}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {conteudo.urlImagem}
                    </a>
                  </div>
                </div>
              )}

              {/* URL do Vídeo */}
              {conteudo.urlVideo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Vídeo
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <a
                      href={conteudo.urlVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {conteudo.urlVideo}
                    </a>
                  </div>
                </div>
              )}

              {/* Link Externo */}
              {conteudo.linkExterno && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Link Externo
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <a
                      href={conteudo.linkExterno}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {conteudo.linkExterno}
                    </a>
                  </div>
                </div>
              )}

              {!conteudo.urlImagem && !conteudo.urlVideo && !conteudo.linkExterno && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mídia cadastrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metricas' && (
            <div className="space-y-4">
              {conteudo.metricas ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {conteudo.metricas.alcance !== undefined && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Alcance</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {conteudo.metricas.alcance.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.impressoes !== undefined && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
                      <span className="text-sm text-purple-600 dark:text-purple-300">Impressões</span>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {conteudo.metricas.impressoes.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.engajamento !== undefined && (
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900 dark:to-pink-800 p-4 rounded-lg">
                      <span className="text-sm text-pink-600 dark:text-pink-300">Engajamento</span>
                      <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                        {conteudo.metricas.engajamento.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.cliques !== undefined && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                      <span className="text-sm text-green-600 dark:text-green-300">Cliques</span>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {conteudo.metricas.cliques.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.comentarios !== undefined && (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-4 rounded-lg">
                      <span className="text-sm text-yellow-600 dark:text-yellow-300">Comentários</span>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {conteudo.metricas.comentarios.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.compartilhamentos !== undefined && (
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 p-4 rounded-lg">
                      <span className="text-sm text-indigo-600 dark:text-indigo-300">Compartilhamentos</span>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                        {conteudo.metricas.compartilhamentos.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {conteudo.metricas.salvos !== undefined && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
                      <span className="text-sm text-orange-600 dark:text-orange-300">Salvos</span>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {conteudo.metricas.salvos.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma métrica registrada</p>
                  <p className="text-sm mt-1">As métricas serão exibidas após a publicação do conteúdo</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 inline mr-2" />
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalVisualizarConteudo;

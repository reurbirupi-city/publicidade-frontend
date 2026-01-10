import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Modal from './Modal';
import { ClienteSelector, ProjetoSelector } from './DataSelectors';
import { getClienteById, getProjetoById } from '../services/dataIntegration';

type RedeSocial = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
type StatusConteudo = 'planejado' | 'em_criacao' | 'aprovado' | 'publicado' | 'cancelado';
type TipoConteudo = 'post' | 'stories' | 'reels' | 'carrossel' | 'video' | 'artigo';

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
  criadoEm: string;
  atualizadoEm: string;
}

interface ModalEditarConteudoProps {
  isOpen: boolean;
  onClose: () => void;
  conteudo: ConteudoSocial | null;
  onSuccess: (conteudoAtualizado: ConteudoSocial) => void;
}

const ModalEditarConteudo: React.FC<ModalEditarConteudoProps> = ({
  isOpen,
  onClose,
  conteudo,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    projetoId: '',
    redeSocial: 'instagram' as RedeSocial,
    tipoConteudo: 'post' as TipoConteudo,
    dataPublicacao: '',
    horaPublicacao: '',
    status: 'planejado' as StatusConteudo,
    copy: '',
    hashtags: '',
    urlImagem: '',
    urlVideo: '',
    linkExterno: '',
    observacoes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteAlterado, setClienteAlterado] = useState(false);

  useEffect(() => {
    if (conteudo && isOpen) {
      setFormData({
        titulo: conteudo.titulo,
        descricao: conteudo.descricao || '',
        clienteId: conteudo.clienteId,
        projetoId: conteudo.projetoId || '',
        redeSocial: conteudo.redeSocial as RedeSocial,
        tipoConteudo: conteudo.tipoConteudo as TipoConteudo,
        dataPublicacao: conteudo.dataPublicacao,
        horaPublicacao: conteudo.horaPublicacao || '',
        status: conteudo.status as StatusConteudo,
        copy: conteudo.copy || '',
        hashtags: conteudo.hashtags ? conteudo.hashtags.join(', ') : '',
        urlImagem: conteudo.urlImagem || '',
        urlVideo: conteudo.urlVideo || '',
        linkExterno: conteudo.linkExterno || '',
        observacoes: conteudo.observacoes || '',
      });
      setClienteAlterado(false);
    }
  }, [conteudo, isOpen]);

  const redesSociais = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  const tiposConteudo = [
    { value: 'post', label: 'Post' },
    { value: 'stories', label: 'Stories' },
    { value: 'reels', label: 'Reels' },
    { value: 'carrossel', label: 'Carrossel' },
    { value: 'video', label: 'Vídeo' },
    { value: 'artigo', label: 'Artigo' },
  ];

  const statusOptions = [
    { value: 'planejado', label: 'Planejado' },
    { value: 'em_criacao', label: 'Em Criação' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'publicado', label: 'Publicado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  const handleClienteChange = (clienteId: string) => {
    if (conteudo && clienteId !== conteudo.clienteId) {
      setClienteAlterado(true);
    }
    
    setFormData(prev => ({
      ...prev,
      clienteId,
      projetoId: '', // Reseta projeto ao mudar cliente
    }));
    
    if (errors.clienteId) {
      setErrors(prev => ({ ...prev, clienteId: '' }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    if (!formData.clienteId) {
      newErrors.clienteId = 'Selecione um cliente';
    }
    if (!formData.dataPublicacao) {
      newErrors.dataPublicacao = 'Data de publicação é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conteudo) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const cliente = getClienteById(formData.clienteId);
      if (!cliente) {
        setErrors({ clienteId: 'Cliente não encontrado' });
        setIsSubmitting(false);
        return;
      }

      // Buscar título do projeto se houver
      let projetoTitulo: string | undefined = undefined;
      if (formData.projetoId) {
        const projeto = getProjetoById(formData.projetoId);
        if (projeto) {
          projetoTitulo = projeto.titulo;
        }
      }

      const conteudoAtualizado: ConteudoSocial = {
        ...conteudo,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        clienteId: formData.clienteId,
        clienteNome: cliente.nome,
        clienteEmpresa: cliente.empresa,
        projetoId: formData.projetoId || undefined,
        projetoTitulo: projetoTitulo,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
        dataPublicacao: formData.dataPublicacao,
        horaPublicacao: formData.horaPublicacao || undefined,
        status: formData.status,
        copy: formData.copy || undefined,
        hashtags: formData.hashtags
          ? formData.hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean)
          : undefined,
        urlImagem: formData.urlImagem || undefined,
        urlVideo: formData.urlVideo || undefined,
        linkExterno: formData.linkExterno || undefined,
        observacoes: formData.observacoes || undefined,
        atualizadoEm: new Date().toISOString(),
      };

      console.log('✅ Conteúdo atualizado:', conteudoAtualizado);
      onSuccess(conteudoAtualizado);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      alert('Erro ao atualizar conteúdo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!conteudo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${conteudo.titulo}`} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de cliente alterado */}
        {clienteAlterado && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Atenção:</strong> Você alterou o cliente. O projeto vinculado será removido.
            </p>
          </div>
        )}

        {/* Cliente */}
        <div>
          <ClienteSelector
            value={formData.clienteId}
            onChange={handleClienteChange}
            required
          />
          {errors.clienteId && (
            <p className="text-sm text-red-500 mt-1">{errors.clienteId}</p>
          )}
        </div>

        {/* Projeto (Opcional) */}
        {formData.clienteId && (
          <div>
            <ProjetoSelector
              value={formData.projetoId}
              onChange={(projetoId) => setFormData(prev => ({ ...prev, projetoId }))}
              clienteId={formData.clienteId}
              label="Projeto (Opcional)"
              required={false}
            />
          </div>
        )}

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título do Conteúdo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
          />
          {errors.titulo && (
            <p className="text-sm text-red-500 mt-1">{errors.titulo}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Grid 3 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rede Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rede Social <span className="text-red-500">*</span>
            </label>
            <select
              name="redeSocial"
              value={formData.redeSocial}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            >
              {redesSociais.map(rede => (
                <option key={rede.value} value={rede.value}>{rede.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Conteúdo <span className="text-red-500">*</span>
            </label>
            <select
              name="tipoConteudo"
              value={formData.tipoConteudo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            >
              {tiposConteudo.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid 2 colunas - Data e Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Publicação <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dataPublicacao"
              value={formData.dataPublicacao}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hora de Publicação
            </label>
            <input
              type="time"
              name="horaPublicacao"
              value={formData.horaPublicacao}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Copy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Copy/Legenda
          </label>
          <textarea
            name="copy"
            value={formData.copy}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.copy.length} caracteres
          </p>
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hashtags
          </label>
          <input
            type="text"
            name="hashtags"
            value={formData.hashtags}
            onChange={handleChange}
            placeholder="marketing, digital, branding (separadas por vírgula)"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
          />
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL da Imagem
            </label>
            <input
              type="url"
              name="urlImagem"
              value={formData.urlImagem}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL do Vídeo
            </label>
            <input
              type="url"
              name="urlVideo"
              value={formData.urlVideo}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link Externo
            </label>
            <input
              type="url"
              name="linkExterno"
              value={formData.linkExterno}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 inline mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>⏳ Salvando...</>
            ) : (
              <>
                <Save className="w-5 h-5 inline mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalEditarConteudo;

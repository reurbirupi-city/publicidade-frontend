import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import Modal from './Modal';
import { ClienteSelector, ProjetoSelector } from './DataSelectors';
import { getClienteById } from '../services/dataIntegration';

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

interface ModalCriarConteudoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conteudo: ConteudoSocial) => void;
}

const ModalCriarConteudo: React.FC<ModalCriarConteudoProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    projetoId: '',
    redeSocial: 'instagram' as const,
    tipoConteudo: 'post' as const,
    dataPublicacao: new Date().toISOString().split('T')[0],
    horaPublicacao: '10:00',
    copy: '',
    hashtags: '',
    urlImagem: '',
    urlVideo: '',
    linkExterno: '',
    observacoes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleClienteChange = (clienteId: string) => {
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
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cliente = getClienteById(formData.clienteId);
      if (!cliente) {
        setErrors({ clienteId: 'Cliente não encontrado' });
        setIsSubmitting(false);
        return;
      }

      const hoje = new Date();
      const conteudoId = `SM-${Date.now()}`;

      const novoConteudo: ConteudoSocial = {
        id: conteudoId,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        clienteId: formData.clienteId,
        clienteNome: cliente.nome,
        clienteEmpresa: cliente.empresa,
        projetoId: formData.projetoId || undefined,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
        dataPublicacao: formData.dataPublicacao,
        horaPublicacao: formData.horaPublicacao || undefined,
        status: 'planejado',
        copy: formData.copy || undefined,
        hashtags: formData.hashtags
          ? formData.hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean)
          : undefined,
        urlImagem: formData.urlImagem || undefined,
        urlVideo: formData.urlVideo || undefined,
        linkExterno: formData.linkExterno || undefined,
        observacoes: formData.observacoes || undefined,
        criadoEm: hoje.toISOString(),
        atualizadoEm: hoje.toISOString(),
      };

      console.log('✅ Conteúdo criado:', novoConteudo);
      onSuccess(novoConteudo);
      onClose();
      
      // Reseta formulário
      setFormData({
        titulo: '',
        descricao: '',
        clienteId: '',
        projetoId: '',
        redeSocial: 'instagram',
        tipoConteudo: 'post',
        dataPublicacao: new Date().toISOString().split('T')[0],
        horaPublicacao: '10:00',
        copy: '',
        hashtags: '',
        urlImagem: '',
        urlVideo: '',
        linkExterno: '',
        observacoes: '',
      });
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      alert('Erro ao criar conteúdo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Conteúdo Social Media" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Ex: Lançamento de Produto"
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
            placeholder="Descreva o conteúdo e objetivo..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Grid 2 colunas - Data e Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data de Publicação */}
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
            {errors.dataPublicacao && (
              <p className="text-sm text-red-500 mt-1">{errors.dataPublicacao}</p>
            )}
          </div>

          {/* Hora de Publicação */}
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
            placeholder="Escreva o texto que acompanhará o post..."
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separe as hashtags com vírgula (não precisa usar #)
          </p>
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
            placeholder="Notas internas, instruções, etc..."
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
              <>⏳ Criando...</>
            ) : (
              <>
                <Save className="w-5 h-5 inline mr-2" />
                Criar Conteúdo
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCriarConteudo;

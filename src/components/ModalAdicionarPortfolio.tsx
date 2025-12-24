import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Tag,
  Calendar,
  Building,
  User,
  FileText,
  Sparkles,
  Loader
} from 'lucide-react';
import { uploadImage, uploadMultipleImages } from '../services/imageUpload';

// ============================================================================
// INTERFACES
// ============================================================================

type CategoriaPortfolio = 'branding' | 'web' | 'social' | 'marketing' | 'design' | 'video';

interface NovoItemPortfolio {
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
  alcance?: string;
  engajamento?: string;
  conversao?: string;
  roi?: string;
  testemunhoTexto?: string;
  testemunhoAutor?: string;
  testemunhoCargo?: string;
}

interface ModalAdicionarPortfolioProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (item: NovoItemPortfolio) => void;
}

const ModalAdicionarPortfolio: React.FC<ModalAdicionarPortfolioProps> = ({
  isOpen,
  onClose,
  onSalvar
}) => {
  const [formData, setFormData] = useState<NovoItemPortfolio>({
    clienteNome: '',
    clienteEmpresa: '',
    titulo: '',
    descricao: '',
    categoria: 'web',
    autorizadoPublicacao: true,
    imagemCapa: '',
    imagensGaleria: [],
    tags: [],
    destaque: false,
    dataFinalizacao: new Date().toISOString().split('T')[0],
    alcance: '',
    engajamento: '',
    conversao: '',
    roi: '',
    testemunhoTexto: '',
    testemunhoAutor: '',
    testemunhoCargo: ''
  });

  const [novaTag, setNovaTag] = useState('');
  const [novaImagemUrl, setNovaImagemUrl] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  
  const inputCapaRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================

  const validarFormulario = (): boolean => {
    const novosErros: string[] = [];

    if (!formData.titulo.trim()) novosErros.push('Título é obrigatório');
    if (!formData.descricao.trim()) novosErros.push('Descrição é obrigatória');
    if (!formData.clienteNome.trim()) novosErros.push('Nome do cliente é obrigatório');
    if (!formData.clienteEmpresa.trim()) novosErros.push('Empresa do cliente é obrigatória');
    if (!formData.imagemCapa.trim()) novosErros.push('Imagem de capa é obrigatória');
    if (formData.imagensGaleria.length === 0) novosErros.push('Adicione ao menos 1 imagem na galeria');
    if (formData.tags.length === 0) novosErros.push('Adicione ao menos 1 tag');

    setErros(novosErros);
    return novosErros.length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    console.log('🎯 Validando formulário...');
    
    if (validarFormulario()) {
      console.log('✅ Formulário válido, salvando...');
      
      try {
        await onSalvar(formData);
        console.log('✅ Portfólio salvo com sucesso');
        
        // Limpar formulário após sucesso
        setFormData({
          clienteNome: '',
          clienteEmpresa: '',
          titulo: '',
          descricao: '',
          categoria: 'web',
          autorizadoPublicacao: true,
          imagemCapa: '',
          imagensGaleria: [],
          tags: [],
          destaque: false,
          dataFinalizacao: new Date().toISOString().split('T')[0],
          alcance: '',
          engajamento: '',
          conversao: '',
          roi: '',
          testemunhoTexto: '',
          testemunhoAutor: '',
          testemunhoCargo: ''
        });
        setErros([]);
        onClose();
      } catch (error) {
        console.error('❌ Erro ao salvar portfólio:', error);
        setErros(['Erro ao salvar portfólio. Tente novamente.']);
      }
    } else {
      console.log('❌ Formulário inválido:', erros);
    }
  };

  const handleAdicionarTag = () => {
    if (novaTag.trim() && !formData.tags.includes(novaTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, novaTag.trim()]
      });
      setNovaTag('');
    }
  };

  const handleRemoverTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleAdicionarImagem = () => {
    if (novaImagemUrl.trim() && !formData.imagensGaleria.includes(novaImagemUrl.trim())) {
      setFormData({
        ...formData,
        imagensGaleria: [...formData.imagensGaleria, novaImagemUrl.trim()]
      });
      setNovaImagemUrl('');
    }
  };

  const handleRemoverImagem = (url: string) => {
    setFormData({
      ...formData,
      imagensGaleria: formData.imagensGaleria.filter(img => img !== url)
    });
  };

  // Upload de imagem de capa
  const handleUploadCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máx 32MB para ImgBB)
    if (file.size > 32 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 32MB.');
      return;
    }

    setUploadingCapa(true);
    try {
      const downloadUrl = await uploadImage(file);
      setFormData({ ...formData, imagemCapa: downloadUrl });
      console.log('✅ Imagem de capa enviada:', downloadUrl);
    } catch (error: any) {
      console.error('❌ Erro ao enviar imagem de capa:', error);
      alert(`Erro ao enviar imagem: ${error?.message || 'Tente novamente'}`);
    } finally {
      setUploadingCapa(false);
      if (inputCapaRef.current) inputCapaRef.current.value = '';
    }
  };

  // Upload de imagens da galeria
  const handleUploadGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGaleria(true);

    try {
      const novasUrls = await uploadMultipleImages(files);
      
      if (novasUrls.length > 0) {
        setFormData({
          ...formData,
          imagensGaleria: [...formData.imagensGaleria, ...novasUrls]
        });
        console.log(`✅ ${novasUrls.length} imagens enviadas`);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar imagens da galeria:', error);
      alert('Erro ao enviar algumas imagens. Tente novamente.');
    } finally {
      setUploadingGaleria(false);
      if (inputGaleriaRef.current) inputGaleriaRef.current.value = '';
    }
  };

  const getCategoriaInfo = (categoria: CategoriaPortfolio) => {
    const infos = {
      branding: { label: 'Branding', color: 'purple' },
      web: { label: 'Web Design', color: 'blue' },
      social: { label: 'Social Media', color: 'pink' },
      marketing: { label: 'Marketing', color: 'green' },
      design: { label: 'Design', color: 'orange' },
      video: { label: 'Vídeo', color: 'red' }
    };
    return infos[categoria];
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus className="w-7 h-7" />
                Adicionar ao Portfolio
              </h2>
              <p className="text-white/90 mt-1">Cadastre um novo projeto para o showcase</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Erros de Validação */}
        {erros.length > 0 && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  Corrija os seguintes erros:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {erros.map((erro, index) => (
                    <li key={index} className="text-sm text-red-700 dark:text-red-300">
                      {erro}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do Formulário */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.clienteNome}
                    onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.clienteEmpresa}
                    onChange={(e) => setFormData({ ...formData, clienteEmpresa: e.target.value })}
                    placeholder="Ex: Tech Innovations"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Informações do Projeto */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Projeto
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Campanha Digital Q1 - Tech Innovations"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o projeto, objetivos, estratégias utilizadas..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaPortfolio })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="branding">🎨 Branding</option>
                      <option value="web">💻 Web Design</option>
                      <option value="social">📱 Social Media</option>
                      <option value="marketing">📊 Marketing</option>
                      <option value="design">✨ Design</option>
                      <option value="video">🎬 Vídeo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Data de Finalização *
                    </label>
                    <input
                      type="date"
                      value={formData.dataFinalizacao}
                      onChange={(e) => setFormData({ ...formData, dataFinalizacao: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autorizadoPublicacao}
                      onChange={(e) => setFormData({ ...formData, autorizadoPublicacao: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Autorizado para Publicação
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.destaque}
                      onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Marcar como Destaque
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Imagens */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Imagens
              </h3>

              {/* Imagem de Capa */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Imagem de Capa * (clique para fazer upload)
                </label>
                
                <input
                  ref={inputCapaRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCapa}
                  className="hidden"
                />
                
                {formData.imagemCapa ? (
                  <div className="relative h-48 rounded-xl overflow-hidden group border-2 border-purple-500">
                    <img 
                      src={formData.imagemCapa} 
                      alt="Preview capa" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => inputCapaRef.current?.click()}
                        disabled={uploadingCapa}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Trocar
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, imagemCapa: '' })}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => inputCapaRef.current?.click()}
                    disabled={uploadingCapa}
                    className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                  >
                    {uploadingCapa ? (
                      <>
                        <Loader className="w-10 h-10 text-purple-600 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Enviando imagem...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Clique para enviar a imagem de capa
                        </span>
                        <span className="text-xs text-gray-500">PNG, JPG, WEBP (máx. 5MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Galeria */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Galeria de Imagens * (mínimo 1 - pode selecionar várias)
                </label>
                
                <input
                  ref={inputGaleriaRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadGaleria}
                  className="hidden"
                />
                
                <button
                  onClick={() => inputGaleriaRef.current?.click()}
                  disabled={uploadingGaleria}
                  className="w-full mb-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer"
                >
                  {uploadingGaleria ? (
                    <>
                      <Loader className="w-5 h-5 text-purple-600 animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enviando imagens...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-600">
                        Adicionar imagens à galeria
                      </span>
                    </>
                  )}
                </button>

                {formData.imagensGaleria.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {formData.imagensGaleria.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Galeria ${index + 1}`} 
                          className="w-full h-28 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700" 
                        />
                        <button
                          onClick={() => handleRemoverImagem(url)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.imagensGaleria.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma imagem adicionada à galeria ainda
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Tags
              </h3>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdicionarTag()}
                  placeholder="Digite uma tag e pressione Enter"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                />
                <button
                  onClick={handleAdicionarTag}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoverTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Resultados (Opcional) */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Resultados (Opcional)
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Alcance
                  </label>
                  <input
                    type="text"
                    value={formData.alcance}
                    onChange={(e) => setFormData({ ...formData, alcance: e.target.value })}
                    placeholder="250000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Engajamento
                  </label>
                  <input
                    type="text"
                    value={formData.engajamento}
                    onChange={(e) => setFormData({ ...formData, engajamento: e.target.value })}
                    placeholder="15000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Conversão (%)
                  </label>
                  <input
                    type="text"
                    value={formData.conversao}
                    onChange={(e) => setFormData({ ...formData, conversao: e.target.value })}
                    placeholder="8.5"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    ROI
                  </label>
                  <input
                    type="text"
                    value={formData.roi}
                    onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                    placeholder="450%"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Testemunho (Opcional) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                💬 Testemunho do Cliente (Opcional)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <textarea
                    value={formData.testemunhoTexto}
                    onChange={(e) => setFormData({ ...formData, testemunhoTexto: e.target.value })}
                    placeholder="Digite o feedback do cliente sobre o projeto..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                {formData.testemunhoTexto && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.testemunhoAutor}
                      onChange={(e) => setFormData({ ...formData, testemunhoAutor: e.target.value })}
                      placeholder="Nome do autor"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={formData.testemunhoCargo}
                      onChange={(e) => setFormData({ ...formData, testemunhoCargo: e.target.value })}
                      placeholder="Cargo"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              * Campos obrigatórios
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-semibold shadow-lg"
              >
                ✨ Adicionar ao Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAdicionarPortfolio;

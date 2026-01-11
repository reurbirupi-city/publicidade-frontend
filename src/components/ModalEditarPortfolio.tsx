import React, { useState, useEffect, useRef } from 'react';
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
  Edit,
  Loader
} from 'lucide-react';
import { uploadImage, uploadMultipleImages } from '../services/imageUpload';
import WizardStepper from './WizardStepper';

// ============================================================================
// INTERFACES
// ============================================================================

type CategoriaPortfolio = 'branding' | 'web' | 'social' | 'marketing' | 'design' | 'video';

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
  alcance?: string;
  engajamento?: string;
  conversao?: string;
  roi?: string;
  testemunhoTexto?: string;
  testemunhoAutor?: string;
  testemunhoCargo?: string;
  testemunhoAvatar?: string;
  testemunhoRating?: number;
  criadoEm: string;
}

interface ModalEditarPortfolioProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (item: ItemPortfolio) => void;
  item: ItemPortfolio | null;
}

const ModalEditarPortfolio: React.FC<ModalEditarPortfolioProps> = ({
  isOpen,
  onClose,
  onSalvar,
  item
}) => {
  const steps = ['Cliente & Projeto', 'Imagens', 'Tags & Resultados'];
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState<ItemPortfolio | null>(null);
  const [novaTag, setNovaTag] = useState('');
  const [novaImagemUrl, setNovaImagemUrl] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  
  const inputCapaRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadingCapa || uploadingGaleria;

  // Inicializa o formulário quando o item mudar
  useEffect(() => {
    if (item) {
      setStep(0);
      setFormData({ ...item });
      setErros([]);
    }
  }, [item]);

  if (!isOpen || !formData) return null;

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================

  const getErrosPorPasso = () => {
    const erros0: string[] = [];
    const erros1: string[] = [];
    const erros2: string[] = [];

    if (!formData.clienteNome.trim()) erros0.push('Nome do cliente é obrigatório');
    if (!formData.clienteEmpresa.trim()) erros0.push('Empresa do cliente é obrigatória');
    if (!formData.titulo.trim()) erros0.push('Título é obrigatório');
    if (!formData.descricao.trim()) erros0.push('Descrição é obrigatória');
    if (!formData.dataFinalizacao) erros0.push('Data de finalização é obrigatória');

    if (!formData.imagemCapa.trim()) erros1.push('Imagem de capa é obrigatória');
    if (formData.imagensGaleria.length === 0) erros1.push('Adicione ao menos 1 imagem na galeria');

    if (formData.tags.length === 0) erros2.push('Adicione ao menos 1 tag');

    const all = [...erros0, ...erros1, ...erros2];
    return { all, byStep: [erros0, erros1, erros2] };
  };

  const validarPasso = (currentStep: number) => {
    const { all, byStep } = getErrosPorPasso();
    if (byStep[currentStep]?.length) {
      setErros(all);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (isUploading) return;
    if (validarPasso(step)) setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = () => {
    const { all, byStep } = getErrosPorPasso();
    setErros(all);

    if (all.length > 0) {
      const firstInvalid = byStep.findIndex(s => s.length > 0);
      setStep(firstInvalid >= 0 ? firstInvalid : 0);
      return;
    }

    onSalvar(formData);
    onClose();
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
    if (!file || !formData) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingCapa(true);
    try {
      const downloadUrl = await uploadImage(file);
      setFormData({ ...formData, imagemCapa: downloadUrl });
      console.log('✅ Imagem de capa enviada:', downloadUrl);
    } catch (error) {
      console.error('❌ Erro ao enviar imagem de capa:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingCapa(false);
      if (inputCapaRef.current) inputCapaRef.current.value = '';
    }
  };

  // Upload de imagens da galeria
  const handleUploadGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !formData) return;

    setUploadingGaleria(true);

    try {
      // Filtrar arquivos válidos
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        // Criar FileList simulado
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        
        const novasUrls = await uploadMultipleImages(dataTransfer.files);
        setFormData({
          ...formData,
          imagensGaleria: [...formData.imagensGaleria, ...novasUrls]
        });
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit className="w-7 h-7" />
                Editar Item do Portfolio
              </h2>
              <p className="text-white/90 mt-1">Atualize as informações do projeto</p>
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

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <WizardStepper steps={steps} step={step} className="mb-6" />

          <div className="space-y-6">
            {step === 0 && (
              <>
                {/* SEÇÃO 1: INFORMAÇÕES DO CLIENTE */}
                <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.clienteNome}
                    onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.clienteEmpresa}
                    onChange={(e) => setFormData({ ...formData, clienteEmpresa: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: Silva & Associados"
                  />
                </div>
              </div>
            </div>

                {/* SEÇÃO 2: INFORMAÇÕES DO PROJETO */}
                <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Projeto
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: Identidade Visual Completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição do Projeto *
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                    placeholder="Descreva o projeto, objetivos e resultados alcançados..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaPortfolio })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="branding">Branding</option>
                      <option value="web">Web Design</option>
                      <option value="social">Social Media</option>
                      <option value="marketing">Marketing</option>
                      <option value="design">Design</option>
                      <option value="video">Vídeo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data de Finalização *
                    </label>
                    <input
                      type="date"
                      value={formData.dataFinalizacao}
                      onChange={(e) => setFormData({ ...formData, dataFinalizacao: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autorizadoPublicacao}
                      onChange={(e) => setFormData({ ...formData, autorizadoPublicacao: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Cliente autorizou publicação
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.destaque}
                      onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                      className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Projeto em destaque
                    </span>
                  </label>
                </div>
              </div>
            </div>

              </>
            )}

            {step === 1 && (
              <>

            {/* SEÇÃO 3: IMAGENS */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Imagens
              </h3>

              {/* Imagem de Capa */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <div className="relative h-48 rounded-xl overflow-hidden group border-2 border-blue-500">
                    <img 
                      src={formData.imagemCapa} 
                      alt="Preview capa" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => inputCapaRef.current?.click()}
                        disabled={uploadingCapa}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
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
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        Capa
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => inputCapaRef.current?.click()}
                    disabled={uploadingCapa}
                    className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                  >
                    {uploadingCapa ? (
                      <>
                        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
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

              {/* Galeria de Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full mb-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                >
                  {uploadingGaleria ? (
                    <>
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enviando imagens...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-600">
                        Adicionar imagens à galeria
                      </span>
                    </>
                  )}
                </button>

                {/* Grid de Imagens */}
                {formData.imagensGaleria.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {formData.imagensGaleria.map((url, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                        <img
                          src={url}
                          alt={`Galeria ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={() => handleRemoverImagem(url)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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

              </>
            )}

            {step === 2 && (
              <>

            {/* SEÇÃO 4: TAGS */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags *
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdicionarTag()}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Ex: Logo, Identidade, Brand (Enter para adicionar)"
                />
                <button
                  onClick={handleAdicionarTag}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoverTag(tag)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* SEÇÃO 5: RESULTADOS (Opcional) */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Resultados (Opcional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alcance
                  </label>
                  <input
                    type="text"
                    value={formData.alcance || ''}
                    onChange={(e) => setFormData({ ...formData, alcance: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: 50.000 pessoas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Engajamento
                  </label>
                  <input
                    type="text"
                    value={formData.engajamento || ''}
                    onChange={(e) => setFormData({ ...formData, engajamento: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: 5.2%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conversão
                  </label>
                  <input
                    type="text"
                    value={formData.conversao || ''}
                    onChange={(e) => setFormData({ ...formData, conversao: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: 3.8%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ROI
                  </label>
                  <input
                    type="text"
                    value={formData.roi || ''}
                    onChange={(e) => setFormData({ ...formData, roi: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Ex: 320%"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 6: TESTEMUNHO (Opcional) */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Testemunho do Cliente (Opcional)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Testemunho
                  </label>
                  <textarea
                    value={formData.testemunhoTexto || ''}
                    onChange={(e) => setFormData({ ...formData, testemunhoTexto: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                    placeholder="Depoimento do cliente sobre o projeto..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Autor
                    </label>
                    <input
                      type="text"
                      value={formData.testemunhoAutor || ''}
                      onChange={(e) => setFormData({ ...formData, testemunhoAutor: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.testemunhoCargo || ''}
                      onChange={(e) => setFormData({ ...formData, testemunhoCargo: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Ex: CEO"
                    />
                  </div>
                </div>
              </div>
            </div>

              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">* Campos obrigatórios</p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>

              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Voltar
                </button>
              )}

              {step < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={isUploading}
                  className={`px-6 py-2 rounded-lg text-white font-semibold transition-all shadow-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  Próximo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Salvar Alterações
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarPortfolio;

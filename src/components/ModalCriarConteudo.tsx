import React, { useEffect, useState, useRef } from 'react';
import { Save, Sparkles, X } from 'lucide-react';
import Modal from './Modal';
import WizardStepper from './WizardStepper';
import { ClienteSelector, ProjetoSelector } from './DataSelectors';
import { getClienteById, getProjetoById } from '../services/dataIntegration';
import api from '../services/api';

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
  const steps = ['Contexto', 'Brief & Agenda', 'Copy & Mídia'];
  const [step, setStep] = useState(0);
  const allowSubmitRef = useRef(false);

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
  const [iaInstrucoes, setIaInstrucoes] = useState('');
  const [isGerandoDescricaoIA, setIsGerandoDescricaoIA] = useState(false);
  const [isAjustandoDescricaoIA, setIsAjustandoDescricaoIA] = useState(false);
  const [iaInstrucoesCopy, setIaInstrucoesCopy] = useState('');
  const [isGerandoCopyIA, setIsGerandoCopyIA] = useState(false);
  const [isAjustandoCopyIA, setIsAjustandoCopyIA] = useState(false);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Monitorar mudanças no step
  useEffect(() => {
    console.log('📍 Step mudou para:', step);
    allowSubmitRef.current = false; // Sempre bloqueia submit quando step muda
  }, [step]);

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

  const getValidationErrors = (): Record<string, string> => {
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

    return newErrors;
  };

  const validate = (): boolean => {
    const newErrors = getValidationErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.clienteId) newErrors.clienteId = 'Selecione um cliente';
      if (!formData.titulo.trim()) newErrors.titulo = 'Título é obrigatório';
    }

    if (currentStep === 1) {
      if (!formData.dataPublicacao) newErrors.dataPublicacao = 'Data de publicação é obrigatória';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 SUBMIT CHAMADO - Step atual:', step, '| allowSubmit:', allowSubmitRef.current);

    // Só permite submit no último step E se allowSubmitRef for true
    if (step < steps.length - 1) {
      console.log('⚠️ Submit bloqueado - ainda não está no último step. Use o botão "Próximo".');
      return;
    }

    if (!allowSubmitRef.current) {
      console.log('⚠️ Submit bloqueado por allowSubmitRef - use o botão "Criar Conteúdo"');
      return;
    }

    const newErrors = getValidationErrors();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.titulo || newErrors.clienteId) setStep(0);
      else setStep(1);
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

      // Buscar título do projeto se houver
      let projetoTitulo: string | undefined = undefined;
      if (formData.projetoId) {
        const projeto = getProjetoById(formData.projetoId);
        if (projeto) {
          projetoTitulo = projeto.titulo;
        }
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
        projetoTitulo: projetoTitulo,
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

  const handleGerarDescricaoIA = async () => {
    if (isSubmitting || isGerandoDescricaoIA || isAjustandoDescricaoIA) return;

    const assunto = formData.titulo.trim();
    if (!assunto) {
      setErrors(prev => ({ ...prev, titulo: 'Informe o título para gerar a descrição com IA' }));
      return;
    }

    try {
      setIsGerandoDescricaoIA(true);

      const cliente = formData.clienteId ? getClienteById(formData.clienteId) : null;
      const response = await api.post('/ia/social-media/descricao/gerar', {
        titulo: assunto,
        clienteNome: cliente?.nome,
        clienteEmpresa: cliente?.empresa,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
      });

      const descricaoGerada = response?.data?.descricao;
      if (typeof descricaoGerada === 'string' && descricaoGerada.trim()) {
        setFormData(prev => ({ ...prev, descricao: descricaoGerada.trim() }));
      } else {
        alert('A IA não retornou uma descrição válida. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerar descrição com IA:', error);
      alert('Erro ao gerar descrição com IA. Tente novamente.');
    } finally {
      setIsGerandoDescricaoIA(false);
    }
  };

  const handleAjustarDescricaoIA = async () => {
    if (isSubmitting || isGerandoDescricaoIA || isAjustandoDescricaoIA) return;

    const texto = formData.descricao.trim();
    if (!texto) {
      alert('Escreva uma descrição antes de ajustar com IA.');
      return;
    }

    try {
      setIsAjustandoDescricaoIA(true);

      const response = await api.post('/ia/social-media/descricao/ajustar', {
        descricao: texto,
        instrucoes: iaInstrucoes.trim() || undefined,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
      });

      const descricaoAjustada = response?.data?.descricao;
      if (typeof descricaoAjustada === 'string' && descricaoAjustada.trim()) {
        setFormData(prev => ({ ...prev, descricao: descricaoAjustada.trim() }));
      } else {
        alert('A IA não retornou uma descrição válida. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao ajustar descrição com IA:', error);
      alert('Erro ao ajustar descrição com IA. Tente novamente.');
    } finally {
      setIsAjustandoDescricaoIA(false);
    }
  };

  const handleGerarCopyIA = async () => {
    if (isSubmitting || isGerandoCopyIA || isAjustandoCopyIA) return;

    const assunto = formData.titulo.trim();
    const brief = formData.descricao.trim();
    if (!assunto && !brief) {
      alert('Informe um título ou uma descrição para gerar a copy com IA.');
      return;
    }

    try {
      setIsGerandoCopyIA(true);

      const cliente = formData.clienteId ? getClienteById(formData.clienteId) : null;
      const response = await api.post('/ia/social-media/copy/gerar', {
        titulo: assunto || undefined,
        descricao: brief || undefined,
        clienteNome: cliente?.nome,
        clienteEmpresa: cliente?.empresa,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
      });

      const copyGerada = response?.data?.copy;
      if (typeof copyGerada === 'string' && copyGerada.trim()) {
        setFormData(prev => ({ ...prev, copy: copyGerada.trim() }));
      } else {
        alert('A IA não retornou uma copy válida. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerar copy com IA:', error);
      alert('Erro ao gerar copy com IA. Tente novamente.');
    } finally {
      setIsGerandoCopyIA(false);
    }
  };

  const handleAjustarCopyIA = async () => {
    if (isSubmitting || isGerandoCopyIA || isAjustandoCopyIA) return;

    const texto = (formData.copy || '').trim();
    if (!texto) {
      alert('Escreva uma copy antes de ajustar com IA.');
      return;
    }

    try {
      setIsAjustandoCopyIA(true);

      const response = await api.post('/ia/social-media/copy/ajustar', {
        copy: texto,
        instrucoes: iaInstrucoesCopy.trim() || undefined,
        redeSocial: formData.redeSocial,
        tipoConteudo: formData.tipoConteudo,
      });

      const copyAjustada = response?.data?.copy;
      if (typeof copyAjustada === 'string' && copyAjustada.trim()) {
        setFormData(prev => ({ ...prev, copy: copyAjustada.trim() }));
      } else {
        alert('A IA não retornou uma copy válida. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao ajustar copy com IA:', error);
      alert('Erro ao ajustar copy com IA. Tente novamente.');
    } finally {
      setIsAjustandoCopyIA(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Novo Conteúdo Social Media — ${steps[step]} (${step + 1}/${steps.length})`}
      size="lg"
    >
      <form 
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            console.log('⚠️ Enter detectado no form - Step atual:', step);
            if (step < steps.length - 1) {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Bloqueando Enter e chamando handleNext');
              handleNext();
            }
          }
        }}
        className="space-y-5"
      >
        <WizardStepper steps={steps} step={step} className="-mt-1" />

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <ClienteSelector value={formData.clienteId} onChange={handleClienteChange} required />
              {errors.clienteId && <p className="text-sm text-red-500 mt-1">{errors.clienteId}</p>}
            </div>

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
              {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option key={rede.value} value={rede.value}>
                      {rede.label}
                    </option>
                  ))}
                </select>
              </div>

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
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleGerarDescricaoIA}
                  disabled={isSubmitting || isGerandoDescricaoIA || isAjustandoDescricaoIA}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50"
                  title="Gerar descrição/brief com IA"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGerandoDescricaoIA ? 'Gerando…' : 'Gerar com IA'}
                </button>
                <button
                  type="button"
                  onClick={handleAjustarDescricaoIA}
                  disabled={isSubmitting || isGerandoDescricaoIA || isAjustandoDescricaoIA}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="Corrigir e ajustar o texto com IA"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAjustandoDescricaoIA ? 'Ajustando…' : 'Ajustar com IA'}
                </button>
              </div>
              <input
                type="text"
                value={iaInstrucoes}
                onChange={(e) => setIaInstrucoes(e.target.value)}
                placeholder="Instruções para IA (opcional). Ex: mais direto, tom informal, incluir CTA"
                className="w-full mb-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              />
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva o conteúdo e objetivo..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
              />
            </div>

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
                {errors.dataPublicacao && <p className="text-sm text-red-500 mt-1">{errors.dataPublicacao}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora de Publicação</label>
                <input
                  type="time"
                  name="horaPublicacao"
                  value={formData.horaPublicacao}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Copy/Legenda</label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleGerarCopyIA}
                  disabled={isSubmitting || isGerandoCopyIA || isAjustandoCopyIA}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 disabled:opacity-50"
                  title="Gerar copy/legenda com IA"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGerandoCopyIA ? 'Gerando…' : 'Gerar com IA'}
                </button>
                <button
                  type="button"
                  onClick={handleAjustarCopyIA}
                  disabled={isSubmitting || isGerandoCopyIA || isAjustandoCopyIA}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="Corrigir e ajustar a copy com IA"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAjustandoCopyIA ? 'Ajustando…' : 'Ajustar com IA'}
                </button>
              </div>
              <input
                type="text"
                value={iaInstrucoesCopy}
                onChange={(e) => setIaInstrucoesCopy(e.target.value)}
                placeholder="Instruções para IA (opcional). Ex: mais curto, mais engraçado, incluir hashtags"
                className="w-full mb-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              />
              <textarea
                name="copy"
                value={formData.copy}
                onChange={handleChange}
                rows={4}
                placeholder="Escreva o texto que acompanhará o post..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.copy.length} caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hashtags</label>
              <input
                type="text"
                name="hashtags"
                value={formData.hashtags}
                onChange={handleChange}
                placeholder="marketing, digital, branding (separadas por vírgula)"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separe as hashtags com vírgula (não precisa usar #)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL da Imagem</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL do Vídeo</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link Externo</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={2}
                placeholder="Notas internas, instruções, etc..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500 outline-none text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 inline mr-2" />
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                onClick={() => {
                  console.log('🖱️ Botão "Criar Conteúdo" clicado - habilitando submit');
                  allowSubmitRef.current = true;
                }}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCriarConteudo;

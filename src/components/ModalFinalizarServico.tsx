import React, { useState } from 'react';
import { X, Upload, CheckCircle, Image, FileText, Award, MessageSquare } from 'lucide-react';

interface ServicoContratado {
  id: string;
  nome: string;
  categoria: 'branding' | 'social-media' | 'web' | 'marketing' | 'design' | 'video';
  valor: number;
  recorrente: boolean;
  dataContratacao: string;
  status: 'ativo' | 'pausado' | 'concluido';
}

interface EntregavelServico {
  titulo: string;
  descricao: string;
  imagemCapa: string;
  imagensGaleria: string[];
  arquivosEntregues: string[];
  linkProjeto?: string;
  tags: string[];
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
  autorizadoPublicacao: boolean;
}

interface ModalFinalizarServicoProps {
  isOpen: boolean;
  onClose: () => void;
  servico: ServicoContratado;
  cliente: {
    id: string;
    nome: string;
    empresa: string;
  };
  onFinalizar: (servicoId: string, entregavel: EntregavelServico) => void;
}

const ModalFinalizarServico: React.FC<ModalFinalizarServicoProps> = ({
  isOpen,
  onClose,
  servico,
  cliente,
  onFinalizar
}) => {
  const [formData, setFormData] = useState<EntregavelServico>({
    titulo: `${servico.nome} - ${cliente.empresa}`,
    descricao: '',
    imagemCapa: '',
    imagensGaleria: [],
    arquivosEntregues: [],
    linkProjeto: '',
    tags: [],
    resultados: {
      alcance: 0,
      engajamento: 0,
      conversao: 0,
      roi: ''
    },
    testemunho: {
      texto: '',
      autor: '',
      cargo: ''
    },
    autorizadoPublicacao: false
  });

  const [novaTag, setNovaTag] = useState('');
  const [step, setStep] = useState<'info' | 'resultados' | 'testemunho' | 'publicacao'>('info');

  const handleAddTag = () => {
    if (novaTag.trim() && !formData.tags.includes(novaTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, novaTag.trim()]
      });
      setNovaTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleAddImagem = () => {
    const url = prompt('URL da imagem:');
    if (url) {
      setFormData({
        ...formData,
        imagensGaleria: [...formData.imagensGaleria, url]
      });
    }
  };

  const handleAddArquivo = () => {
    const nome = prompt('Nome do arquivo entregue:');
    if (nome) {
      setFormData({
        ...formData,
        arquivosEntregues: [...formData.arquivosEntregues, nome]
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.titulo.trim() || !formData.descricao.trim()) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    onFinalizar(servico.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-7 h-7" />
              Finalizar Serviço
            </h2>
            <p className="text-green-100 mt-1">
              {servico.nome} • {cliente.empresa}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Steps */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex gap-2">
            {[
              { id: 'info', label: 'Informações' },
              { id: 'resultados', label: 'Resultados' },
              { id: 'testemunho', label: 'Testemunho' },
              { id: 'publicacao', label: 'Publicação' }
            ].map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id as any)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  step === s.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {idx + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Informações */}
          {step === 'info' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Trabalho *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  placeholder="Ex: Identidade Visual Completa para Silva & Associados"
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
                  placeholder="Descreva o projeto, desafios, soluções implementadas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem de Capa (URL)
                </label>
                <input
                  type="url"
                  value={formData.imagemCapa}
                  onChange={(e) => setFormData({ ...formData, imagemCapa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
                {formData.imagemCapa && (
                  <img
                    src={formData.imagemCapa}
                    alt="Preview"
                    className="mt-3 w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Galeria de Imagens
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.imagensGaleria.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Imagem ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          imagensGaleria: formData.imagensGaleria.filter((_, i) => i !== idx)
                        })}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddImagem}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Adicionar Imagem
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link do Projeto (opcional)
                </label>
                <input
                  type="url"
                  value={formData.linkProjeto}
                  onChange={(e) => setFormData({ ...formData, linkProjeto: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivos Entregues
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.arquivosEntregues.map((arquivo, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      <FileText className="w-3 h-3" />
                      {arquivo}
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          arquivosEntregues: formData.arquivosEntregues.filter((_, i) => i !== idx)
                        })}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddArquivo}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar Arquivo
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Digite uma tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Resultados */}
          {step === 'resultados' && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Resultados e Métricas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adicione métricas e resultados alcançados (opcional, mas recomendado para portfolio)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alcance
                  </label>
                  <input
                    type="number"
                    value={formData.resultados?.alcance || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      resultados: { ...formData.resultados, alcance: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ex: 50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Engajamento (%)
                  </label>
                  <input
                    type="number"
                    value={formData.resultados?.engajamento || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      resultados: { ...formData.resultados, engajamento: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ex: 8.5"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conversão (%)
                  </label>
                  <input
                    type="number"
                    value={formData.resultados?.conversao || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      resultados: { ...formData.resultados, conversao: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ex: 12.3"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ROI
                  </label>
                  <input
                    type="text"
                    value={formData.resultados?.roi || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      resultados: { ...formData.resultados, roi: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ex: +250%"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Testemunho */}
          {step === 'testemunho' && (
            <>
              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Testemunho do Cliente
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adicione um depoimento do cliente sobre o trabalho realizado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Depoimento
                </label>
                <textarea
                  value={formData.testemunho?.texto || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    testemunho: { ...formData.testemunho!, texto: e.target.value }
                  })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
                  placeholder="O trabalho superou nossas expectativas..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={formData.testemunho?.autor || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      testemunho: { ...formData.testemunho!, autor: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.testemunho?.cargo || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      testemunho: { ...formData.testemunho!, cargo: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                    placeholder="Ex: CEO, Diretora de Marketing..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 4: Publicação */}
          {step === 'publicacao' && (
            <>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Autorização de Publicação
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirme se o cliente autorizou a publicação deste trabalho no portfólio público
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.autorizadoPublicacao}
                  onChange={(e) => setFormData({ ...formData, autorizadoPublicacao: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-0.5"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Cliente autorizou a publicação
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Este trabalho poderá ser exibido no portfólio público e utilizado em materiais de divulgação
                  </p>
                </div>
              </label>

              {!formData.autorizadoPublicacao && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ℹ️ Se não autorizado, o trabalho será registrado internamente mas não aparecerá no portfólio público
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
          >
            Cancelar
          </button>
          {step !== 'publicacao' ? (
            <button
              onClick={() => {
                const steps = ['info', 'resultados', 'testemunho', 'publicacao'];
                const currentIndex = steps.indexOf(step);
                setStep(steps[currentIndex + 1] as any);
              }}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar e Adicionar ao Portfólio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalFinalizarServico;

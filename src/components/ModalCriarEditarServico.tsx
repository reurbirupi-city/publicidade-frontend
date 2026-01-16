import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Star, Clock, DollarSign } from 'lucide-react';

interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco?: number;
  valorBase?: number;
  tempo_estimado?: string;
  prazoBaseDias?: number;
  destaque?: boolean;
  ativo?: boolean;
  recursos?: string[];
  padrao?: boolean;
  customizado?: boolean;
}

interface Categoria {
  id: string;
  nome: string;
}

interface ModalCriarEditarServicoProps {
  servico: Servico | null;
  categorias: Categoria[];
  onSave: (servico: Partial<Servico>) => void;
  onClose: () => void;
}

const ModalCriarEditarServico: React.FC<ModalCriarEditarServicoProps> = ({
  servico,
  categorias,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: 'design',
    preco: 0,
    tempo_estimado: '',
    destaque: false,
    ativo: true,
    recursos: ['']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao,
        categoria: servico.categoria,
        preco: servico.preco || servico.valorBase || 0,
        tempo_estimado: servico.tempo_estimado || (servico.prazoBaseDias ? `${servico.prazoBaseDias} dias` : ''),
        destaque: servico.destaque || false,
        ativo: servico.ativo !== false,
        recursos: (servico.recursos && servico.recursos.length > 0) ? servico.recursos : ['']
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        categoria: 'design',
        preco: 0,
        tempo_estimado: '',
        destaque: false,
        ativo: true,
        recursos: ['']
      });
    }
    setErrors({});
  }, [servico]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (formData.preco <= 0) {
      newErrors.preco = 'Preço deve ser maior que zero';
    }

    if (!formData.tempo_estimado.trim()) {
      newErrors.tempo_estimado = 'Tempo estimado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const recursos = formData.recursos.filter(r => r.trim() !== '');
      onSave({
        ...formData,
        recursos
      });
    }
  };

  const addRecurso = () => {
    setFormData({
      ...formData,
      recursos: [...formData.recursos, '']
    });
  };

  const removeRecurso = (index: number) => {
    const newRecursos = formData.recursos.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      recursos: newRecursos.length > 0 ? newRecursos : ['']
    });
  };

  const updateRecurso = (index: number, value: string) => {
    const newRecursos = [...formData.recursos];
    newRecursos[index] = value;
    setFormData({
      ...formData,
      recursos: newRecursos
    });
  };

  const isEditing = !!servico;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <p className="text-purple-100 mt-1">
              {isEditing ? 'Atualize as informações do serviço' : 'Adicione um novo serviço ao catálogo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Serviço *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                errors.nome ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white`}
              placeholder="Ex: Criação de Logo Profissional"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.nome}
              </p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria *
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                errors.descricao ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white resize-none`}
              placeholder="Descreva o serviço e o que está incluído..."
            />
            {errors.descricao && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.descricao}
              </p>
            )}
          </div>

          {/* Preço e Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Preço (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                    errors.preco ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.preco && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.preco}
                </p>
              )}
            </div>

            {/* Tempo Estimado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Tempo Estimado *
              </label>
              <input
                type="text"
                value={formData.tempo_estimado}
                onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                  errors.tempo_estimado ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                } rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white`}
                placeholder="Ex: 7-10 dias, Mensal"
              />
              {errors.tempo_estimado && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.tempo_estimado}
                </p>
              )}
            </div>
          </div>

          {/* Recursos/Itens Inclusos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recursos Inclusos
            </label>
            <div className="space-y-2">
              {formData.recursos.map((recurso, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={recurso}
                    onChange={(e) => updateRecurso(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    placeholder="Ex: 3 propostas iniciais"
                  />
                  <button
                    type="button"
                    onClick={() => removeRecurso(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRecurso}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar recurso
              </button>
            </div>
          </div>

          {/* Opções */}
          <div className="flex flex-wrap gap-6">
            {/* Destaque */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.destaque}
                onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Star className="w-4 h-4 text-yellow-500" />
                Serviço em destaque
              </span>
            </label>

            {/* Ativo */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Serviço ativo
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isEditing ? 'Salvar Alterações' : 'Criar Serviço'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCriarEditarServico;

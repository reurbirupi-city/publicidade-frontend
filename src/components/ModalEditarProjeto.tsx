import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Modal from './Modal';
import { ClienteSelector } from './DataSelectors';
import { getClienteById, updateProjetoWithSync } from '../services/dataIntegration';

interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  clienteEmpresa: string;
  servicosContratados: string[];
  valorContratado: number;
  valorPago: number;
  status: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  etapaAtual: string;
  progresso: number;
  dataInicio: string;
  prazoEstimado: string;
  limiteRevisoes: number;
  horasEstimadas: number;
  horasTrabalhadas?: number;
  tags: string[];
  categoria: string;
  [key: string]: any;
}

interface ModalEditarProjetoProps {
  isOpen: boolean;
  onClose: () => void;
  projeto: Projeto | null;
  onSuccess: (projeto: Projeto) => void;
}

const ModalEditarProjeto: React.FC<ModalEditarProjetoProps> = ({
  isOpen,
  onClose,
  projeto,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    servicosContratados: '',
    valorContratado: '',
    valorPago: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    dataInicio: '',
    prazoEstimado: '',
    limiteRevisoes: '3',
    horasEstimadas: '',
    horasTrabalhadas: '',
    tags: '',
    categoria: 'Marketing Digital',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categorias = [
    'Marketing Digital',
    'Design Gráfico',
    'Desenvolvimento Web',
    'Social Media',
    'Branding',
    'Fotografia',
    'Vídeo',
    'Consultoria',
    'Outro',
  ];

  // Carrega dados do projeto quando o modal abre
  useEffect(() => {
    if (projeto && isOpen) {
      setFormData({
        titulo: projeto.titulo,
        descricao: projeto.descricao || '',
        clienteId: projeto.clienteId,
        servicosContratados: projeto.servicosContratados.join(', '),
        valorContratado: projeto.valorContratado.toString(),
        valorPago: projeto.valorPago.toString(),
        prioridade: projeto.prioridade,
        dataInicio: projeto.dataInicio,
        prazoEstimado: projeto.prazoEstimado,
        limiteRevisoes: projeto.limiteRevisoes.toString(),
        horasEstimadas: projeto.horasEstimadas.toString(),
        horasTrabalhadas: (projeto.horasTrabalhadas || 0).toString(),
        tags: projeto.tags.join(', '),
        categoria: projeto.categoria,
      });
    }
  }, [projeto, isOpen]);

  const handleClienteChange = (clienteId: string) => {
    setFormData(prev => ({
      ...prev,
      clienteId,
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
    if (!formData.valorContratado || parseFloat(formData.valorContratado) <= 0) {
      newErrors.valorContratado = 'Valor contratado deve ser maior que zero';
    }
    if (!formData.prazoEstimado) {
      newErrors.prazoEstimado = 'Prazo estimado é obrigatório';
    }
    if (!formData.horasEstimadas || parseFloat(formData.horasEstimadas) <= 0) {
      newErrors.horasEstimadas = 'Horas estimadas devem ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projeto || !validate()) {
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
      const clienteAlterado = projeto.clienteId !== formData.clienteId;

      const updates = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        clienteId: formData.clienteId,
        clienteNome: cliente.nome,
        clienteEmpresa: cliente.empresa,
        servicosContratados: formData.servicosContratados
          ? formData.servicosContratados.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        valorContratado: parseFloat(formData.valorContratado),
        valorPago: parseFloat(formData.valorPago),
        prioridade: formData.prioridade,
        dataInicio: formData.dataInicio,
        prazoEstimado: formData.prazoEstimado,
        diasRestantes: Math.ceil(
          (new Date(formData.prazoEstimado).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        ),
        limiteRevisoes: parseInt(formData.limiteRevisoes),
        horasEstimadas: parseFloat(formData.horasEstimadas),
        horasTrabalhadas: parseFloat(formData.horasTrabalhadas) || 0,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        categoria: formData.categoria,
        atualizadoEm: hoje.toISOString(),
      };

      // Salva com sincronização automática
      updateProjetoWithSync(projeto.id, updates);
      
      const projetoAtualizado = { ...projeto, ...updates };
      
      console.log('✅ Projeto atualizado:', projetoAtualizado);
      
      if (clienteAlterado) {
        console.log('⚠️ Cliente alterado - totais recalculados automaticamente');
      }
      
      onSuccess(projetoAtualizado);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Erro ao atualizar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!projeto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Projeto: ${projeto.id}`} size="xl">
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
          {formData.clienteId !== projeto.clienteId && (
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Alterar o cliente recalculará os totais de ambos os clientes
            </p>
          )}
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título do Projeto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            placeholder="Ex: Campanha Digital Q1 2026"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
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
            placeholder="Descreva o escopo e objetivos do projeto..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridade
            </label>
            <select
              name="prioridade"
              value={formData.prioridade}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        {/* Grid 3 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor Contratado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor Contratado <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="valorContratado"
              value={formData.valorContratado}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
            {errors.valorContratado && (
              <p className="text-sm text-red-500 mt-1">{errors.valorContratado}</p>
            )}
          </div>

          {/* Valor Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor Pago
            </label>
            <input
              type="number"
              name="valorPago"
              value={formData.valorPago}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Horas Estimadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horas Estimadas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="horasEstimadas"
              value={formData.horasEstimadas}
              onChange={handleChange}
              required
              min="1"
              step="0.5"
              placeholder="40"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
            {errors.horasEstimadas && (
              <p className="text-sm text-red-500 mt-1">{errors.horasEstimadas}</p>
            )}
          </div>
        </div>

        {/* Horas Trabalhadas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Horas Trabalhadas
          </label>
          <input
            type="number"
            name="horasTrabalhadas"
            value={formData.horasTrabalhadas}
            onChange={handleChange}
            min="0"
            step="0.5"
            placeholder="0"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.horasTrabalhadas && formData.horasEstimadas ? (
              <>
                {((parseFloat(formData.horasTrabalhadas) / parseFloat(formData.horasEstimadas)) * 100).toFixed(1)}% das horas estimadas
              </>
            ) : (
              'Registre as horas trabalhadas no projeto'
            )}
          </p>
        </div>

        {/* Grid 2 colunas - Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Início
            </label>
            <input
              type="date"
              name="dataInicio"
              value={formData.dataInicio}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Prazo Estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prazo Estimado <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="prazoEstimado"
              value={formData.prazoEstimado}
              onChange={handleChange}
              required
              min={formData.dataInicio}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
            {errors.prazoEstimado && (
              <p className="text-sm text-red-500 mt-1">{errors.prazoEstimado}</p>
            )}
          </div>
        </div>

        {/* Serviços Contratados */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Serviços Contratados
          </label>
          <input
            type="text"
            name="servicosContratados"
            value={formData.servicosContratados}
            onChange={handleChange}
            placeholder="Design, Desenvolvimento, Social Media (separados por vírgula)"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separe múltiplos serviços com vírgula
          </p>
        </div>

        {/* Grid 2 colunas - Extras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="urgente, estratégico (separados por vírgula)"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Limite de Revisões */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Limite de Revisões
            </label>
            <input
              type="number"
              name="limiteRevisoes"
              value={formData.limiteRevisoes}
              onChange={handleChange}
              min="0"
              max="10"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Info do projeto */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Status atual:</strong> {projeto.status} | <strong>Progresso:</strong> {projeto.progresso}%
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            💡 O status e progresso são atualizados automaticamente no Kanban
          </p>
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
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ModalEditarProjeto;

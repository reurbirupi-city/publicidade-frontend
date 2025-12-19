import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import Modal from './Modal';
import { ClienteSelector } from './DataSelectors';
import { getClienteById, createProjetoWithSync, atualizarStatusCliente } from '../services/dataIntegration';

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
  status: 'planejamento' | 'em_andamento' | 'pausado' | 'revisao' | 'aprovacao' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  etapaAtual: 'briefing' | 'criacao' | 'revisao' | 'ajustes' | 'aprovacao' | 'entrega';
  progresso: number;
  dataInicio: string;
  prazoEstimado: string;
  limiteRevisoes: number;
  horasEstimadas: number;
  tags: string[];
  categoria: string;
  [key: string]: any;
}

interface ModalCriarProjetoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projeto: Projeto) => void;
}

const ModalCriarProjeto: React.FC<ModalCriarProjetoProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    servicosContratados: '',
    valorContratado: '',
    valorPago: '0',
    prioridade: 'media' as const,
    dataInicio: new Date().toISOString().split('T')[0],
    prazoEstimado: '',
    limiteRevisoes: '3',
    horasEstimadas: '',
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

  const handleClienteChange = (clienteId: string) => {
    const cliente = getClienteById(clienteId);
    
    if (cliente) {
      console.log('📋 Pré-carregando dados do cliente:', cliente);
      
      // Buscar projetos existentes para verificar nome único
      const projetosExistentes = JSON.parse(localStorage.getItem('projetos_v1') || '[]');
      const projetosDoCliente = projetosExistentes.filter((p: any) => p.clienteId === clienteId);
      
      // Gerar nome único do projeto
      let nomeProjeto = `Projeto ${cliente.empresa}`;
      if (projetosDoCliente.length > 0) {
        nomeProjeto = `Projeto ${cliente.empresa} #${projetosDoCliente.length + 1}`;
      }
      
      // Pré-carregar serviços contratados
      const servicosContratados = cliente.servicosContratados 
        ? cliente.servicosContratados.map((s: any) => s.nome).join(', ')
        : '';
      
      // Calcular valor total dos serviços
      const valorContratado = cliente.servicosContratados
        ? cliente.servicosContratados.reduce((total: number, s: any) => total + (s.valor || 0), 0)
        : cliente.valorTotal || 0;

      // Gerar descrição automática
      const descricaoPadrao = `Projeto para ${cliente.empresa}${servicosContratados ? ` - Serviços: ${servicosContratados}` : ''}`;

      // Calcular prazo padrão (30 dias a partir de hoje)
      const prazoDefault = new Date();
      prazoDefault.setDate(prazoDefault.getDate() + 30);
      const prazoEstimado = prazoDefault.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        clienteId,
        titulo: nomeProjeto,
        descricao: descricaoPadrao,
        servicosContratados,
        valorContratado: valorContratado > 0 ? valorContratado.toString() : prev.valorContratado,
        prazoEstimado: prev.prazoEstimado || prazoEstimado,
        horasEstimadas: prev.horasEstimadas || '40', // Padrão: 40 horas
      }));
      
      console.log('✅ Dados pré-carregados:', {
        titulo: nomeProjeto,
        descricao: descricaoPadrao,
        servicosContratados,
        valorContratado,
        prazoEstimado,
        totalProjetosCliente: projetosDoCliente.length
      });
      
      // Notificar usuário
      if (valorContratado > 0) {
        console.log(`💰 Valor total dos serviços do cliente: R$ ${valorContratado.toLocaleString('pt-BR')}`);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        clienteId,
      }));
    }
    
    // Limpa erro de cliente se existir
    if (errors.clienteId) {
      setErrors(prev => ({ ...prev, clienteId: '' }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpa erro do campo alterado
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

      // Gera ID único para o projeto
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const projetos = JSON.parse(localStorage.getItem('projetos_v1') || '[]');
      const projetosDoAno = projetos.filter((p: any) => p.id.startsWith(`PROJ-${ano}`));
      const numero = String(projetosDoAno.length + 1).padStart(3, '0');
      const projetoId = `PROJ-${ano}-${numero}`;

      const novoProjeto: Projeto = {
        id: projetoId,
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
        status: 'planejamento',
        prioridade: formData.prioridade,
        etapaAtual: 'briefing',
        progresso: 10,
        dataInicio: formData.dataInicio,
        prazoEstimado: formData.prazoEstimado,
        diasRestantes: Math.ceil(
          (new Date(formData.prazoEstimado).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        ),
        revisoes: [],
        limiteRevisoes: parseInt(formData.limiteRevisoes),
        revisoesUsadas: 0,
        responsavel: 'Usuário Atual', // TODO: pegar do contexto de autenticação
        equipe: [],
        arquivos: [],
        comentariosInternos: [],
        comentariosCliente: [],
        aprovacoes: [],
        horasEstimadas: parseFloat(formData.horasEstimadas),
        horasTrabalhadas: 0,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        categoria: formData.categoria,
        criadoEm: hoje.toISOString(),
        atualizadoEm: hoje.toISOString(),
      };

      // Salva com sincronização automática
      await createProjetoWithSync(novoProjeto);
      
      // Atualizar status do cliente para "ativo"
      await atualizarStatusCliente(formData.clienteId, 'ativo', 'ativo');
      console.log('✅ Status do cliente atualizado para "ativo"');
      
      console.log('✅ Projeto criado:', novoProjeto);
      onSuccess(novoProjeto);
      onClose();
      
      // Reseta formulário
      setFormData({
        titulo: '',
        descricao: '',
        clienteId: '',
        servicosContratados: '',
        valorContratado: '',
        valorPago: '0',
        prioridade: 'media',
        dataInicio: new Date().toISOString().split('T')[0],
        prazoEstimado: '',
        limiteRevisoes: '3',
        horasEstimadas: '',
        tags: '',
        categoria: 'Marketing Digital',
      });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Projeto" size="xl">
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
          {formData.clienteId && formData.valorContratado && parseFloat(formData.valorContratado) > 0 && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span>✅</span>
                <span>Dados do cliente carregados automaticamente!</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                💰 Valor dos serviços contratados: R$ {parseFloat(formData.valorContratado).toLocaleString('pt-BR')}
              </p>
            </div>
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
          {formData.clienteId && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Nome gerado automaticamente. Você pode alterá-lo se desejar.
            </p>
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
            className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>⏳ Criando...</>
            ) : (
              <>
                <Save className="w-5 h-5 inline mr-2" />
                Criar Projeto
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCriarProjeto;

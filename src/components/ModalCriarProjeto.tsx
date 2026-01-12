import React, { useEffect, useState, useRef } from 'react';
import { Save, Sparkles, X } from 'lucide-react';
import Modal from './Modal';
import WizardStepper from './WizardStepper';
import { ClienteSelector } from './DataSelectors';
import { getClienteById, createProjetoWithSync, atualizarStatusCliente } from '../services/dataIntegration';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import api from '../services/api';

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
  const steps = ['Básico', 'Financeiro & Prazo', 'Descrição'];
  const [step, setStep] = useState(0);
  const allowSubmitRef = useRef(false);
  const { user } = useAuth();

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
  const [isGerandoDescricaoIA, setIsGerandoDescricaoIA] = useState(false);
  const [isAjustandoDescricaoIA, setIsAjustandoDescricaoIA] = useState(false);
  const [instrucoesDescricaoIA, setInstrucoesDescricaoIA] = useState('');

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Monitorar mudanças no step
  useEffect(() => {
    console.log('📍 Step mudou para:', step);
    allowSubmitRef.current = false; // Sempre bloqueia submit quando step muda
  }, [step]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && step < steps.length - 1) {
      e.preventDefault();
      console.log('⚠️ Enter pressionado - disparando handleNext ao invés de submit');
      handleNext();
    }
  };

  const handleGerarDescricaoIA = async () => {
    if (!formData.titulo.trim()) {
      alert('Preencha o título do projeto antes de gerar a descrição com IA.');
      return;
    }

    setIsGerandoDescricaoIA(true);
    try {
      const cliente = formData.clienteId ? getClienteById(formData.clienteId) : null;

      const response = await api.post('/ia/projetos/descricao/gerar', {
        titulo: formData.titulo,
        clienteNome: cliente?.nome,
        clienteEmpresa: cliente?.empresa,
        categoria: formData.categoria,
        servicosContratados: formData.servicosContratados,
        prazoEstimado: formData.prazoEstimado,
        instrucoes: instrucoesDescricaoIA || undefined,
      });

      const descricao = response.data?.descricao;
      if (descricao) {
        setFormData(prev => ({ ...prev, descricao }));
      }
    } catch (error: any) {
      console.error('Erro ao gerar descrição do projeto com IA:', error);
      alert(error?.response?.data?.error || 'Erro ao gerar descrição com IA.');
    } finally {
      setIsGerandoDescricaoIA(false);
    }
  };

  const handleAjustarDescricaoIA = async () => {
    if (!formData.descricao.trim()) {
      alert('Escreva uma descrição antes de ajustar com IA.');
      return;
    }

    setIsAjustandoDescricaoIA(true);
    try {
      const cliente = formData.clienteId ? getClienteById(formData.clienteId) : null;

      const response = await api.post('/ia/projetos/descricao/ajustar', {
        titulo: formData.titulo,
        clienteEmpresa: cliente?.empresa,
        categoria: formData.categoria,
        descricao: formData.descricao,
        instrucoes: instrucoesDescricaoIA || undefined,
      });

      const descricao = response.data?.descricao;
      if (descricao) {
        setFormData(prev => ({ ...prev, descricao }));
      }
    } catch (error: any) {
      console.error('Erro ao ajustar descrição do projeto com IA:', error);
      alert(error?.response?.data?.error || 'Erro ao ajustar descrição com IA.');
    } finally {
      setIsAjustandoDescricaoIA(false);
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
    if (!formData.valorContratado || parseFloat(formData.valorContratado) <= 0) {
      newErrors.valorContratado = 'Valor contratado deve ser maior que zero';
    }
    if (!formData.prazoEstimado) {
      newErrors.prazoEstimado = 'Prazo estimado é obrigatório';
    }
    if (!formData.horasEstimadas || parseFloat(formData.horasEstimadas) <= 0) {
      newErrors.horasEstimadas = 'Horas estimadas devem ser maior que zero';
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
      if (!formData.valorContratado || parseFloat(formData.valorContratado) <= 0) {
        newErrors.valorContratado = 'Valor contratado deve ser maior que zero';
      }
      if (!formData.prazoEstimado) newErrors.prazoEstimado = 'Prazo estimado é obrigatório';
      if (!formData.horasEstimadas || parseFloat(formData.horasEstimadas) <= 0) {
        newErrors.horasEstimadas = 'Horas estimadas devem ser maior que zero';
      }
    }

    // Step 2 (Descrição) é opcional, sempre válido
    if (currentStep === 2) {
      return true;
    }

    console.log('🔍 Validando step', currentStep, '- Erros encontrados:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    console.log('🔄 Tentando avançar do step', step, 'para', step + 1);
    console.log('📋 FormData atual:', formData);
    
    if (validateStep(step)) {
      console.log('✅ Validação passou! Avançando...');
      const nextStep = Math.min(step + 1, steps.length - 1);
      setStep(nextStep);
      
      if (nextStep === 2) {
        console.log('🎯 STEP 2 (DESCRIÇÃO COM IA) AGORA VISÍVEL - Não clique em "Criar Projeto" ainda se quiser usar IA!');
      }
    } else {
      console.log('❌ Validação falhou:', errors);
      // Scroll para o topo para mostrar erros
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 SUBMIT CHAMADO - Step atual:', step, '| allowSubmit:', allowSubmitRef.current);
    console.trace('🔍 Stack trace do submit:');

    // Só permite submit no último step E se allowSubmitRef for true
    if (step < steps.length - 1) {
      console.log('⚠️ Submit bloqueado - ainda não está no último step. Use o botão "Próximo".');
      return;
    }

    if (!allowSubmitRef.current) {
      console.log('⚠️ Submit bloqueado por allowSubmitRef - use o botão "Criar Projeto"');
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
      
      // Se há valor pago, criar transação financeira automaticamente
      if (parseFloat(formData.valorPago) > 0) {
        try {
          const transacao = {
            tipo: 'receita',
            descricao: `Pagamento do projeto: ${formData.titulo.trim()}`,
            valor: parseFloat(formData.valorPago),
            categoria: 'projeto',
            status: 'pago',
            dataVencimento: formData.dataInicio || hoje.toISOString().split('T')[0],
            dataPagamento: formData.dataInicio || hoje.toISOString().split('T')[0],
            formaPagamento: 'transferencia',
            clienteId: formData.clienteId,
            clienteNome: cliente.nome,
            projetoId: projetoId,
            projetoTitulo: formData.titulo.trim(),
            recorrente: false,
            observacoes: `Pagamento registrado automaticamente na criação do projeto`,
            adminId: user?.uid,
            criadoEm: hoje.toISOString(),
            atualizadoEm: hoje.toISOString()
          };
          
          await addDoc(collection(db, 'transacoes'), transacao);
          console.log('💰 Transação financeira criada automaticamente: R$', parseFloat(formData.valorPago));
        } catch (error) {
          console.error('⚠️ Erro ao criar transação automática:', error);
          // Não bloqueia a criação do projeto se falhar
        }
      }
      
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Criar Novo Projeto — ${steps[step]} (${step + 1}/${steps.length})`}
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
            // Se step === último, deixa o comportamento padrão (submit)
          }
        }}
        className="space-y-5"
      >
        <WizardStepper steps={steps} step={step} className="-mt-1" />

        {step === 0 && (
          <div className="space-y-5">
            {/* Cliente */}
            <div>
              <ClienteSelector value={formData.clienteId} onChange={handleClienteChange} required />
              {errors.clienteId && <p className="text-sm text-red-500 mt-1">{errors.clienteId}</p>}
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
                onKeyDown={handleKeyDown}
                required
                placeholder="Ex: Campanha Digital Q1 2026"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
              />
              {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo}</p>}
              {formData.clienteId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Nome gerado automaticamente. Você pode alterá-lo se desejar.
                </p>
              )}
            </div>

            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

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
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            {/* Valores e horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Contratado <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valorContratado"
                  value={formData.valorContratado}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
                />
                {errors.valorContratado && <p className="text-sm text-red-500 mt-1">{errors.valorContratado}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Pago
                </label>
                <input
                  type="number"
                  name="valorPago"
                  value={formData.valorPago}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horas Estimadas <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="horasEstimadas"
                  value={formData.horasEstimadas}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  required
                  min="1"
                  step="0.5"
                  placeholder="40"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
                />
                {errors.horasEstimadas && <p className="text-sm text-red-500 mt-1">{errors.horasEstimadas}</p>}
              </div>

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
                {errors.prazoEstimado && <p className="text-sm text-red-500 mt-1">{errors.prazoEstimado}</p>}
              </div>
            </div>

            {/* Data de início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Serviços */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Serviços Contratados
              </label>
              <input
                type="text"
                name="servicosContratados"
                value={formData.servicosContratados}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Design, Desenvolvimento, Social Media (separados por vírgula)"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separe múltiplos serviços com vírgula</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Descrição + IA */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGerarDescricaoIA}
                    disabled={isGerandoDescricaoIA || isSubmitting}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-xs font-semibold"
                    title="Gerar descrição com IA"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGerandoDescricaoIA ? 'Gerando…' : 'Gerar com IA'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAjustarDescricaoIA}
                    disabled={isAjustandoDescricaoIA || isSubmitting}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 disabled:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200"
                    title="Ajustar descrição com IA"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isAjustandoDescricaoIA ? 'Ajustando…' : 'Ajustar com IA'}
                  </button>
                </div>
              </div>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva o escopo e objetivos do projeto..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white resize-none"
              />
              <input
                type="text"
                value={instrucoesDescricaoIA}
                onChange={(e) => setInstrucoesDescricaoIA(e.target.value)}
                placeholder="Instruções para IA (opcional). Ex: tom profissional, foco em entregáveis..."
                className="mt-2 w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="urgente, estratégico (separados por vírgula)"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limite de Revisões</label>
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

            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Resumo</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Título:</span> {formData.titulo || '—'}</p>
                <p><span className="font-medium">Categoria:</span> {formData.categoria}</p>
                <p><span className="font-medium">Valor:</span> {formData.valorContratado ? `R$ ${parseFloat(formData.valorContratado).toLocaleString('pt-BR')}` : '—'}</p>
                <p><span className="font-medium">Prazo:</span> {formData.prazoEstimado || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
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
                className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                onClick={() => {
                  console.log('🖱️ Botão "Criar Projeto" clicado - habilitando submit');
                  allowSubmitRef.current = true;
                }}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCriarProjeto;

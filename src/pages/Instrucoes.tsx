import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Sparkles,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Megaphone,
  Image,
  MessageSquare,
  FileText,
  Send,
  Link2,
  Shield,
  ChevronDown,
  ChevronUp,
  Home,
  Settings,
  Bell,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  UserPlus,
  Crown,
  Package,
  Download
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-700 pt-4">
          {children}
        </div>
      )}
    </div>
  );
};

const StepItem: React.FC<{ number: number; title: string; description: string }> = ({ number, title, description }) => (
  <div className="flex gap-4 mb-4">
    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
      {number}
    </div>
    <div>
      <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
      <span className="text-lg">💡</span>
      <span>{children}</span>
    </p>
  </div>
);

const Instrucoes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Como Usar o Sistema
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Intro */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Sistema de Gestão! 🚀</h2>
          <p className="text-purple-100">
            Este guia irá ajudá-lo a aproveitar todos os recursos do sistema. 
            Clique em cada seção para expandir e ver as instruções detalhadas.
          </p>
        </div>

        {/* Fluxo de Trabalho Completo */}
        <Section title="🔄 Fluxo de Trabalho: Da Solicitação à Entrega" icon={<Users className="w-5 h-5" />} defaultOpen>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veja o passo a passo completo desde quando o cliente solicita um serviço até a entrega final.
          </p>
          
          {/* Diagrama Visual do Fluxo */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-center">📊 Visão Geral do Fluxo de Trabalho</h4>
            
            <div className="flex flex-col items-center gap-2">
              {/* Linha 1 */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 w-full">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <Send className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">1. Solicita</p>
                  <p className="text-xs text-blue-200">Cliente</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <Eye className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">2. Analisa</p>
                  <p className="text-xs text-purple-200">Admin</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <FileText className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">3. Proposta</p>
                  <p className="text-xs text-amber-200">Admin</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">4. Aprova</p>
                  <p className="text-xs text-green-200">Cliente</p>
                </div>
              </div>
              
              {/* Linha 2 */}
              <div className="text-gray-400 text-xl">↓</div>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 w-full">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <Briefcase className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">5. Projeto</p>
                  <p className="text-xs text-pink-200">Admin cria</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <Package className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">6. Executa</p>
                  <p className="text-xs text-indigo-200">Admin</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <Image className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">7. Entrega</p>
                  <p className="text-xs text-teal-200">Admin</p>
                </div>
                <div className="text-gray-400 text-xl hidden md:block">→</div>
                <div className="text-gray-400 text-xl md:hidden">↓</div>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 text-white text-center min-w-[120px]">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                  <p className="font-bold text-sm">8. Finaliza</p>
                  <p className="text-xs text-emerald-200">Cliente aprova</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção do Cliente */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white">O que o CLIENTE faz:</h4>
            </div>
            
            <div className="space-y-4">
              {/* Passo 1 Cliente */}
              <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Acessa o Portal do Cliente</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Faz login com email e senha cadastrados.
                  </p>
                </div>
              </div>
              
              {/* Passo 2 Cliente */}
              <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Solicita um novo serviço</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Clica em <strong>"Solicitar Serviço"</strong>, escolhe o tipo de serviço desejado e descreve o que precisa.
                  </p>
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exemplo de solicitação:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"Preciso de um logo para minha nova loja de roupas femininas, com cores rosa e dourado..."</p>
                  </div>
                </div>
              </div>
              
              {/* Passo 3 Cliente */}
              <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Aguarda a proposta</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    O admin analisa a solicitação e envia uma proposta com valores e prazos.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Bell className="w-4 h-4" />
                    <span>Recebe notificação quando a proposta estiver pronta</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 4 Cliente */}
              <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Aprova a proposta e assina contrato</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Revisa os valores, aceita a proposta e assina o contrato digitalmente.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Projeto inicia automaticamente!</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 5 Cliente */}
              <div className="flex gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border-l-4 border-cyan-500">
                <div className="flex-shrink-0 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Acompanha o projeto</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Visualiza o andamento do projeto, etapas concluídas e próximos passos.
                  </p>
                </div>
              </div>
              
              {/* Passo 6 Cliente */}
              <div className="flex gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border-l-4 border-teal-500">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">6</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Recebe as entregas</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Visualiza e baixa os arquivos entregues pelo admin.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
                    <Download className="w-4 h-4" />
                    <span>Pode baixar imagens, PDFs, vídeos, etc.</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 7 Cliente */}
              <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-l-4 border-emerald-500">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">7</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Aprova ou solicita ajustes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Se estiver tudo certo, aprova a entrega. Se precisar de alterações, envia feedback.
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span><strong>Aprovar:</strong> Finaliza o projeto</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <MessageSquare className="w-4 h-4" />
                      <span><strong>Feedback:</strong> Solicita alterações</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção do Admin */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white">O que o ADMIN faz:</h4>
            </div>
            
            <div className="space-y-4">
              {/* Passo 1 Admin */}
              <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Recebe notificação de nova solicitação</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    O sininho 🔔 mostra que há uma nova solicitação de cliente.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <Bell className="w-4 h-4" />
                    <span>Acesse o módulo <strong>"Solicitações"</strong> no Dashboard</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 2 Admin */}
              <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Analisa a solicitação</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Leia o que o cliente precisa, tire dúvidas pelo chat se necessário.
                  </p>
                </div>
              </div>
              
              {/* Passo 3 Admin */}
              <div className="flex gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-l-4 border-amber-500">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Cria e envia uma proposta</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Clique em <strong>"Gerar Proposta"</strong> na solicitação. Defina:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4 list-disc">
                    <li>Serviços incluídos</li>
                    <li>Valor total</li>
                    <li>Forma de pagamento (à vista ou parcelado)</li>
                    <li>Prazo de entrega</li>
                  </ul>
                </div>
              </div>
              
              {/* Passo 4 Admin */}
              <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Cliente aprova → Contrato é assinado</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quando o cliente aceitar, você recebe notificação. O contrato é gerado automaticamente.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Parcelas são criadas no Financeiro!</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 5 Admin */}
              <div className="flex gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-l-4 border-pink-500">
                <div className="flex-shrink-0 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">5</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Cria o projeto</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Acesse <strong>"Projetos"</strong> e crie um novo projeto vinculado ao cliente.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4 list-disc">
                    <li>Defina as etapas (Briefing, Criação, Revisão, etc.)</li>
                    <li>Estabeleça prazos para cada etapa</li>
                    <li>O cliente poderá acompanhar o progresso</li>
                  </ul>
                </div>
              </div>
              
              {/* Passo 6 Admin */}
              <div className="flex gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-l-4 border-indigo-500">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">6</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Executa o trabalho</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Trabalhe no projeto e vá atualizando as etapas conforme avança.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-4 h-4" />
                    <span>Use a Agenda para organizar seus prazos</span>
                  </div>
                </div>
              </div>
              
              {/* Passo 7 Admin */}
              <div className="flex gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border-l-4 border-teal-500">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">7</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Faz as entregas</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    No projeto, acesse a aba <strong>"Entregas"</strong> e faça upload dos arquivos.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-4 list-disc">
                    <li>Adicione título e descrição para cada entrega</li>
                    <li>O cliente será notificado</li>
                    <li>Ele poderá baixar e visualizar os arquivos</li>
                  </ul>
                </div>
              </div>
              
              {/* Passo 8 Admin */}
              <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-l-4 border-emerald-500">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">8</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Recebe feedback e finaliza</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    O cliente pode aprovar ou pedir ajustes. Quando aprovado:
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Projeto marcado como <strong>Concluído</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                      <span>Acompanhe os pagamentos no <strong>Financeiro</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Visual */}
          <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">✨ Módulos Utilizados no Fluxo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Send className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Solicitações</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Briefcase className="w-6 h-6 mx-auto mb-1 text-pink-500" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Projetos</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-500" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Financeiro</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <MessageSquare className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Chat</p>
              </div>
            </div>
          </div>

          <Tip>
            Use o Chat a qualquer momento para tirar dúvidas com o cliente ou vice-versa!
          </Tip>
        </Section>

        {/* Para Administradores */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-amber-500" />
            Para Administradores
          </h2>
        </div>

        <Section title="Dashboard - Visão Geral" icon={<Home className="w-5 h-5" />} defaultOpen>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            O Dashboard é sua central de comando. Aqui você vê um resumo completo do seu negócio.
          </p>
          
          <StepItem 
            number={1} 
            title="Faça login com suas credenciais" 
            description="Use seu email e senha para acessar o painel administrativo."
          />
          <StepItem 
            number={2} 
            title="Visualize as estatísticas" 
            description="Veja clientes, projetos ativos, faturamento e compromissos do dia."
          />
          <StepItem 
            number={3} 
            title="Acesse os módulos pelo menu" 
            description="Use os cards coloridos para navegar entre CRM, Projetos, Agenda, etc."
          />
          
          <Tip>Use o ícone de engrenagem (⚙️) no canto superior direito para acessar configurações e copiar seu link de convite para clientes.</Tip>
        </Section>

        <Section title="CRM - Gestão de Clientes" icon={<Users className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gerencie todos os seus clientes, desde prospects até clientes ativos.
          </p>
          
          <StepItem 
            number={1} 
            title="Cadastre novos clientes" 
            description="Clique no botão '+' para adicionar manualmente ou envie o link de convite."
          />
          <StepItem 
            number={2} 
            title="Organize por etapa do funil" 
            description="Arraste clientes entre as etapas: Prospect, Qualificado, Proposta, Negociação, Fechado."
          />
          <StepItem 
            number={3} 
            title="Visualize detalhes do cliente" 
            description="Clique em um cliente para ver histórico, documentos e serviços contratados."
          />
          <StepItem 
            number={4} 
            title="Vincule serviços ao cliente" 
            description="No perfil do cliente, adicione os serviços que ele contratou."
          />
          
          <Tip>Clientes cadastrados via link de convite ficam automaticamente vinculados a você!</Tip>
        </Section>

        <Section title="Projetos - Gestão de Trabalhos" icon={<Briefcase className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Crie e gerencie projetos para seus clientes com entregas e timeline.
          </p>
          
          <StepItem 
            number={1} 
            title="Crie um novo projeto" 
            description="Clique em 'Novo Projeto' e vincule a um cliente existente."
          />
          <StepItem 
            number={2} 
            title="Defina as etapas do projeto" 
            description="Configure briefing, criação, revisão, aprovação e finalização."
          />
          <StepItem 
            number={3} 
            title="Adicione entregas" 
            description="Faça upload de arquivos para o cliente baixar ou visualizar."
          />
          <StepItem 
            number={4} 
            title="Acompanhe o progresso" 
            description="Visualize o andamento na timeline e mova entre etapas."
          />
          
          <Tip>O cliente pode ver o projeto e deixar feedbacks através do Portal do Cliente!</Tip>
        </Section>

        <Section title="Agenda - Compromissos" icon={<Calendar className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gerencie reuniões, prazos e compromissos com visual de calendário.
          </p>
          
          <StepItem 
            number={1} 
            title="Visualize por mês, semana ou dia" 
            description="Alterne entre as visualizações usando os botões no topo."
          />
          <StepItem 
            number={2} 
            title="Crie eventos rapidamente" 
            description="Clique no '+' ou use templates pré-definidos (Reunião, Prazo, Evento)."
          />
          <StepItem 
            number={3} 
            title="Configure alertas" 
            description="Defina lembretes para não perder compromissos importantes."
          />
          <StepItem 
            number={4} 
            title="Arraste para reagendar" 
            description="Mova eventos entre datas arrastando-os no calendário."
          />
        </Section>

        <Section title="Financeiro - Controle de Pagamentos" icon={<DollarSign className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gerencie contratos, parcelas e acompanhe o fluxo financeiro.
          </p>
          
          <StepItem 
            number={1} 
            title="Crie contratos vinculados a clientes" 
            description="Defina valor total, número de parcelas e vencimentos."
          />
          <StepItem 
            number={2} 
            title="Acompanhe parcelas" 
            description="Veja parcelas pendentes, pagas e em atraso."
          />
          <StepItem 
            number={3} 
            title="Registre pagamentos" 
            description="Marque parcelas como pagas quando receber."
          />
          <StepItem 
            number={4} 
            title="Visualize relatórios" 
            description="Veja faturamento por período e previsões."
          />
        </Section>

        <Section title="Social Media - Gestão de Redes" icon={<Megaphone className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Planeje e organize posts para as redes sociais dos seus clientes.
          </p>
          
          <StepItem 
            number={1} 
            title="Selecione o cliente" 
            description="Escolha para qual cliente você está criando conteúdo."
          />
          <StepItem 
            number={2} 
            title="Crie posts" 
            description="Defina texto, imagem e plataforma (Instagram, Facebook, etc.)."
          />
          <StepItem 
            number={3} 
            title="Agende publicações" 
            description="Defina data e hora para cada post."
          />
          <StepItem 
            number={4} 
            title="Visualize no calendário" 
            description="Veja todos os posts programados em formato de calendário."
          />
        </Section>

        <Section title="Portfólio - Seus Trabalhos" icon={<Image className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Exiba seus melhores trabalhos e compartilhe com potenciais clientes.
          </p>
          
          <StepItem 
            number={1} 
            title="Adicione projetos ao portfólio" 
            description="Faça upload de imagens e descrições dos seus trabalhos."
          />
          <StepItem 
            number={2} 
            title="Organize por categorias" 
            description="Agrupe trabalhos por tipo (Branding, Web, Social Media, etc.)."
          />
          <StepItem 
            number={3} 
            title="Compartilhe o link público" 
            description="Envie o link do portfólio para potenciais clientes."
          />
        </Section>

        <Section title="Chat com Clientes" icon={<MessageSquare className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comunique-se diretamente com seus clientes pelo chat integrado.
          </p>
          
          <StepItem 
            number={1} 
            title="Acesse o chat pelo ícone flutuante" 
            description="O balão de chat aparece no canto inferior direito em todas as páginas."
          />
          <StepItem 
            number={2} 
            title="Veja conversas ativas" 
            description="Clique no balão para ver todas as conversas com seus clientes."
          />
          <StepItem 
            number={3} 
            title="Responda em tempo real" 
            description="O indicador mostra quando o cliente está digitando."
          />
          <StepItem 
            number={4} 
            title="Gerencie conversas" 
            description="Use as opções para limpar, encerrar ou excluir conversas."
          />
          
          <Tip>Você só vê conversas de clientes vinculados a você!</Tip>
        </Section>

        <Section title="Link de Convite para Clientes" icon={<Link2 className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Convide clientes para se cadastrarem no sistema de forma segura.
          </p>
          
          <StepItem 
            number={1} 
            title="Acesse as configurações (⚙️)" 
            description="No Dashboard, clique no ícone de engrenagem."
          />
          <StepItem 
            number={2} 
            title="Copie o link de convite" 
            description="Clique em 'Copiar Link de Cadastro' para copiar o link."
          />
          <StepItem 
            number={3} 
            title="Envie ao cliente" 
            description="Compartilhe o link por WhatsApp, email ou mensagem."
          />
          <StepItem 
            number={4} 
            title="Cliente se cadastra" 
            description="Ao usar o link, o cliente fica automaticamente vinculado a você."
          />
          
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
              <span className="text-lg">🔒</span>
              <span><strong>Segurança:</strong> Cada link é de uso único! Após um cadastro, o código é regenerado automaticamente para evitar usos não autorizados.</span>
            </p>
          </div>
        </Section>

        {/* Para Clientes */}
        <div className="mt-8 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <UserPlus className="w-6 h-6 text-green-500" />
            Para Clientes
          </h2>
        </div>

        <Section title="Portal do Cliente" icon={<Package className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Como cliente, você tem acesso a um portal exclusivo para acompanhar seus projetos.
          </p>
          
          <StepItem 
            number={1} 
            title="Cadastre-se pelo link de convite" 
            description="Use o link enviado pelo seu prestador de serviços."
          />
          <StepItem 
            number={2} 
            title="Faça login no portal" 
            description="Acesse com seu email e senha cadastrados."
          />
          <StepItem 
            number={3} 
            title="Veja seus projetos" 
            description="Acompanhe o andamento, etapas e prazos."
          />
          <StepItem 
            number={4} 
            title="Baixe entregas" 
            description="Acesse arquivos disponibilizados para você."
          />
          <StepItem 
            number={5} 
            title="Envie feedbacks" 
            description="Deixe comentários e aprove ou solicite alterações."
          />
        </Section>

        <Section title="Solicitações de Serviço" icon={<Send className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Solicite novos serviços diretamente pelo portal.
          </p>
          
          <StepItem 
            number={1} 
            title="Acesse 'Nova Solicitação'" 
            description="No portal, clique no botão para criar uma nova solicitação."
          />
          <StepItem 
            number={2} 
            title="Descreva o que você precisa" 
            description="Preencha os detalhes do serviço desejado."
          />
          <StepItem 
            number={3} 
            title="Aguarde a proposta" 
            description="O administrador irá analisar e enviar uma proposta."
          />
          <StepItem 
            number={4} 
            title="Aprove ou negocie" 
            description="Aceite a proposta ou solicite ajustes."
          />
        </Section>

        <Section title="Chat com o Administrador" icon={<MessageSquare className="w-5 h-5" />}>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tire dúvidas e comunique-se diretamente com seu prestador de serviços.
          </p>
          
          <StepItem 
            number={1} 
            title="Clique no balão de chat" 
            description="O ícone verde de chat aparece no canto inferior direito."
          />
          <StepItem 
            number={2} 
            title="Digite sua mensagem" 
            description="Escreva sua dúvida ou comentário."
          />
          <StepItem 
            number={3} 
            title="Aguarde a resposta" 
            description="O indicador mostra quando o admin está digitando."
          />
          
          <Tip>Você receberá notificações de novas mensagens!</Tip>
        </Section>

        {/* FAQ */}
        <div className="mt-8 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Search className="w-6 h-6 text-blue-500" />
            Perguntas Frequentes
          </h2>
        </div>

        <Section title="Perguntas Frequentes (FAQ)" icon={<Search className="w-5 h-5" />}>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Como recuperar minha senha?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Na tela de login, clique em "Esqueceu a senha?" e siga as instruções enviadas por email.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Meu cliente não consegue se cadastrar
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifique se você está enviando o link correto. Lembre-se que cada link é de uso único - após um cadastro, você precisa copiar o novo link gerado.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Não estou vendo as conversas no chat
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O chat só mostra conversas de clientes vinculados a você. Verifique se o cliente foi cadastrado através do seu link de convite.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Como alterar o tema (claro/escuro)?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique no ícone de sol/lua no canto superior direito de qualquer página para alternar entre os temas.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Posso usar o sistema no celular?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sim! O sistema é responsivo e funciona em dispositivos móveis. Acesse pelo navegador do seu celular.
              </p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>Dúvidas? Entre em contato com o suporte.</p>
          <p className="mt-2">© 2025 - Sistema de Gestão</p>
        </div>
      </main>
    </div>
  );
};

export default Instrucoes;

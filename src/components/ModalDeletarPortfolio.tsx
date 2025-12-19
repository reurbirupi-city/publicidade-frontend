import React from 'react';
import {
  X,
  AlertTriangle,
  Trash2,
  Info
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ItemPortfolio {
  id: string;
  projetoId: string;
  titulo: string;
  clienteNome: string;
  clienteEmpresa: string;
  categoria: string;
}

interface ModalDeletarPortfolioProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  item: ItemPortfolio | null;
}

const ModalDeletarPortfolio: React.FC<ModalDeletarPortfolioProps> = ({
  isOpen,
  onClose,
  onConfirmar,
  item
}) => {
  if (!isOpen || !item) return null;

  const handleConfirmar = () => {
    onConfirmar();
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
                <p className="text-white/90 text-sm mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Aviso Principal */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">
                  Atenção! Exclusão Permanente
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Você está prestes a excluir permanentemente este item do portfolio. 
                  Todos os dados serão perdidos e não poderão ser recuperados.
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Item */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Item a ser excluído:
            </h3>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{item.id}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Título:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">{item.titulo}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Cliente:</span>
                <span className="text-sm text-gray-900 dark:text-white text-right">{item.clienteNome}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Empresa:</span>
                <span className="text-sm text-gray-900 dark:text-white text-right">{item.clienteEmpresa}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Categoria:</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize text-right">{item.categoria}</span>
              </div>
            </div>
          </div>

          {/* Lista de Consequências */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              O que será perdido:
            </h3>
            <ul className="space-y-1.5 text-sm text-yellow-700 dark:text-yellow-300">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Todas as informações do projeto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Imagem de capa e galeria de imagens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Tags e categorização</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Métricas e resultados (alcance, engajamento, ROI)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Testemunho do cliente</span>
              </li>
            </ul>
          </div>

          {/* Confirmação Final */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              Tem certeza que deseja <span className="font-bold text-red-600 dark:text-red-400">excluir permanentemente</span> este item?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-semibold"
            >
              <Trash2 className="w-5 h-5" />
              Excluir Permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDeletarPortfolio;

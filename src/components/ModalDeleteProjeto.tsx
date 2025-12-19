import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import { deleteProjetoAndRelations, getEventosByProjeto } from '../services/dataIntegration';

interface Projeto {
  id: string;
  titulo: string;
  clienteNome: string;
  clienteEmpresa: string;
  valorContratado: number;
  [key: string]: any;
}

interface ModalDeleteProjetoProps {
  isOpen: boolean;
  onClose: () => void;
  projeto: Projeto | null;
  onSuccess: () => void;
}

const ModalDeleteProjeto: React.FC<ModalDeleteProjetoProps> = ({
  isOpen,
  onClose,
  projeto,
  onSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!projeto) return null;

  const eventos = getEventosByProjeto(projeto.id);
  const hasRelations = eventos.length > 0;

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'excluir') {
      return;
    }

    setIsDeleting(true);

    try {
      // Deleta projeto e todas as relações
      deleteProjetoAndRelations(projeto.id);
      
      console.log('✅ Projeto excluído:', projeto.id);
      console.log(`📊 ${eventos.length} evento(s) desvinculado(s)`);
      console.log('💰 Totais do cliente recalculados automaticamente');
      
      onSuccess();
      onClose();
      
      // Reset
      setConfirmText('');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isConfirmValid = confirmText.toLowerCase() === 'excluir';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Projeto" size="md">
      <div className="space-y-6">
        {/* Alerta de perigo */}
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
              Atenção: Esta ação não pode ser desfeita!
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              Todos os dados do projeto serão permanentemente removidos.
            </p>
          </div>
        </div>

        {/* Informações do projeto */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Projeto</p>
            <p className="font-semibold text-gray-900 dark:text-white">{projeto.titulo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{projeto.id}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cliente</p>
            <p className="font-semibold text-gray-900 dark:text-white">{projeto.clienteNome}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{projeto.clienteEmpresa}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor Contratado</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projeto.valorContratado)}</p>
          </div>
        </div>

        {/* Avisos sobre relações */}
        {hasRelations && (
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
              Impactos da exclusão:
            </h4>
            <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-400">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-500 mt-0.5">•</span>
                <span><strong>{eventos.length}</strong> evento(s) na agenda serão desvinculados deste projeto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-500 mt-0.5">•</span>
                <span>Os totais do cliente <strong>{projeto.clienteNome}</strong> serão recalculados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-500 mt-0.5">•</span>
                <span>Arquivos e comentários associados serão perdidos</span>
              </li>
            </ul>
          </div>
        )}

        {/* Campo de confirmação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Digite <span className="font-bold text-red-600 dark:text-red-400">EXCLUIR</span> para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
            disabled={isDeleting}
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500 dark:focus:border-red-500 outline-none text-gray-900 dark:text-white disabled:opacity-50"
            autoFocus
          />
          {confirmText && !isConfirmValid && (
            <p className="text-sm text-red-500 mt-1">
              Digite "EXCLUIR" exatamente como mostrado acima
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 inline mr-2" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isDeleting ? (
              <>⏳ Excluindo...</>
            ) : (
              <>
                <Trash2 className="w-5 h-5 inline mr-2" />
                Excluir Projeto
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDeleteProjeto;

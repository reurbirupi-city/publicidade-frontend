import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

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

interface ModalDeletarConteudoProps {
  isOpen: boolean;
  onClose: () => void;
  conteudo: ConteudoSocial | null;
  onConfirm: (conteudoId: string) => void;
}

const ModalDeletarConteudo: React.FC<ModalDeletarConteudoProps> = ({
  isOpen,
  onClose,
  conteudo,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!conteudo) return null;

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') {
      alert('Por favor, digite "EXCLUIR" para confirmar.');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('🗑️ Deletando conteúdo:', conteudo.id);
      onConfirm(conteudo.id);
      onClose();
      setConfirmText('');
    } catch (error) {
      console.error('Erro ao deletar conteúdo:', error);
      alert('Erro ao deletar conteúdo. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planejado: 'Planejado',
      em_criacao: 'Em Criação',
      aprovado: 'Aprovado',
      publicado: 'Publicado',
      cancelado: 'Cancelado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getRedeLabel = (rede: string) => {
    const labels = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      twitter: 'Twitter',
      youtube: 'YouTube',
      tiktok: 'TikTok',
    };
    return labels[rede as keyof typeof labels] || rede;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Conteúdo" size="md">
      <div className="space-y-6">
        {/* Alerta de perigo */}
        <div className="bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-700 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                ⚠️ Atenção: Esta ação não pode ser desfeita!
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Você está prestes a excluir permanentemente este conteúdo do calendário editorial.
              </p>
            </div>
          </div>
        </div>

        {/* Informações do conteúdo */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Conteúdo:</span>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {conteudo.titulo}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ID: {conteudo.id}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Cliente:</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {conteudo.clienteNome}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Empresa:</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {conteudo.clienteEmpresa}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Rede Social:</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {getRedeLabel(conteudo.redeSocial)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {getStatusLabel(conteudo.status)}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Data de Publicação:</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatDate(conteudo.dataPublicacao)}
              {conteudo.horaPublicacao && ` às ${conteudo.horaPublicacao}`}
            </p>
          </div>

          {conteudo.projetoTitulo && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Projeto Vinculado:</span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {conteudo.projetoTitulo}
              </p>
            </div>
          )}
        </div>

        {/* O que será removido */}
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            O que será removido:
          </h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
            <li>Todas as informações do conteúdo (título, descrição, copy, etc)</li>
            <li>Hashtags e links associados</li>
            <li>Data e horário de publicação planejado</li>
            <li>Observações e notas internas</li>
          </ul>
        </div>

        {/* Confirmação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Digite <span className="font-bold text-red-600 dark:text-red-400">EXCLUIR</span> para confirmar:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Digite EXCLUIR"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white"
            autoFocus
          />
          {confirmText && confirmText !== 'EXCLUIR' && (
            <p className="text-sm text-red-500 mt-1">
              Você digitou "{confirmText}". Por favor, digite exatamente "EXCLUIR".
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
            disabled={confirmText !== 'EXCLUIR' || isDeleting}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>⏳ Excluindo...</>
            ) : (
              <>
                <Trash2 className="w-5 h-5 inline mr-2" />
                Excluir Permanentemente
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalDeletarConteudo;

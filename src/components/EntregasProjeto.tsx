import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Trash2, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Loader2,
  File,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { storage, db } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// INTERFACES
// ============================================================================

export interface EntregaArquivo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  storagePath: string;
  uploadPor: string;
  uploadPorNome: string;
  uploadEm: string;
  versao: number;
  status: 'pendente' | 'aprovado' | 'revisao' | 'rejeitado';
  feedbacks: Feedback[];
}

export interface Feedback {
  id: string;
  autorId: string;
  autorNome: string;
  autorTipo: 'admin' | 'cliente';
  texto: string;
  dataHora: string;
  tipo: 'comentario' | 'aprovacao' | 'revisao' | 'rejeicao';
}

interface EntregasProjetoProps {
  projetoId: string;
  clienteId: string;
  clienteNome: string;
  isAdmin: boolean;
  onEntregaAtualizada?: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const EntregasProjeto: React.FC<EntregasProjetoProps> = ({
  projetoId,
  clienteId,
  clienteNome,
  isAdmin,
  onEntregaAtualizada
}) => {
  const { user } = useAuth();
  const [entregas, setEntregas] = useState<EntregaArquivo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaArquivo | null>(null);
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar entregas do Firestore em tempo real
  useEffect(() => {
    if (!projetoId) return;

    const docRef = doc(db, 'projetos', projetoId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEntregas(data.entregas || []);
      }
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar entregas:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projetoId]);

  // Função para fazer upload de arquivo
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `projetos/${projetoId}/entregas/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload com progresso
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Erro no upload:', error);
          alert('Erro ao fazer upload do arquivo');
          setUploading(false);
        },
        async () => {
          // Upload completo
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Calcular próxima versão
          const versaoAtual = entregas.length > 0 
            ? Math.max(...entregas.map(e => e.versao)) + 1 
            : 1;

          const novaEntrega: EntregaArquivo = {
            id: `entrega_${timestamp}`,
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            url: downloadURL,
            storagePath,
            uploadPor: user.uid,
            uploadPorNome: user.displayName || user.email || 'Admin',
            uploadEm: new Date().toISOString(),
            versao: versaoAtual,
            status: 'pendente',
            feedbacks: []
          };

          // Salvar no Firestore
          const projetoRef = doc(db, 'projetos', projetoId);
          await updateDoc(projetoRef, {
            entregas: arrayUnion(novaEntrega),
            atualizadoEm: new Date().toISOString()
          });

          // Atualizar no localStorage também
          const projetos = JSON.parse(localStorage.getItem('projetos_v1') || '[]');
          const projetoIndex = projetos.findIndex((p: any) => p.id === projetoId);
          if (projetoIndex !== -1) {
            if (!projetos[projetoIndex].entregas) {
              projetos[projetoIndex].entregas = [];
            }
            projetos[projetoIndex].entregas.push(novaEntrega);
            localStorage.setItem('projetos_v1', JSON.stringify(projetos));
          }

          setUploading(false);
          setUploadProgress(0);
          onEntregaAtualizada?.();
          
          console.log('✅ Entrega enviada:', novaEntrega.nome);
        }
      );
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      setUploading(false);
    }
  };

  // Função para adicionar feedback
  const handleAddFeedback = async (entregaId: string, tipo: 'comentario' | 'aprovacao' | 'revisao' | 'rejeicao') => {
    if (!user || (!feedbackTexto.trim() && tipo === 'comentario')) return;

    const novoFeedback: Feedback = {
      id: `feedback_${Date.now()}`,
      autorId: user.uid,
      autorNome: user.displayName || user.email || (isAdmin ? 'Admin' : clienteNome),
      autorTipo: isAdmin ? 'admin' : 'cliente',
      texto: feedbackTexto.trim() || getTextoAutomatico(tipo),
      dataHora: new Date().toISOString(),
      tipo
    };

    // Atualizar status baseado no tipo de feedback
    let novoStatus = selectedEntrega?.status || 'pendente';
    if (tipo === 'aprovacao') novoStatus = 'aprovado';
    else if (tipo === 'revisao') novoStatus = 'revisao';
    else if (tipo === 'rejeicao') novoStatus = 'rejeitado';

    try {
      const projetoRef = doc(db, 'projetos', projetoId);
      const projetoSnap = await getDoc(projetoRef);
      
      if (projetoSnap.exists()) {
        const data = projetoSnap.data();
        const entregasAtualizadas = (data.entregas || []).map((e: EntregaArquivo) => {
          if (e.id === entregaId) {
            return {
              ...e,
              status: novoStatus,
              feedbacks: [...(e.feedbacks || []), novoFeedback]
            };
          }
          return e;
        });

        await updateDoc(projetoRef, {
          entregas: entregasAtualizadas,
          atualizadoEm: new Date().toISOString()
        });

        // Atualizar estado local
        setEntregas(entregasAtualizadas);
        if (selectedEntrega?.id === entregaId) {
          setSelectedEntrega({
            ...selectedEntrega,
            status: novoStatus,
            feedbacks: [...(selectedEntrega.feedbacks || []), novoFeedback]
          });
        }

        setFeedbackTexto('');
        onEntregaAtualizada?.();
        console.log(`✅ Feedback adicionado: ${tipo}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar feedback:', error);
      alert('Erro ao adicionar feedback');
    }
  };

  const getTextoAutomatico = (tipo: string) => {
    switch (tipo) {
      case 'aprovacao': return '✅ Trabalho aprovado!';
      case 'revisao': return '🔄 Solicitada revisão';
      case 'rejeicao': return '❌ Trabalho rejeitado';
      default: return '';
    }
  };

  // Função para deletar entrega (apenas admin)
  const handleDeleteEntrega = async (entrega: EntregaArquivo) => {
    if (!confirm('Tem certeza que deseja excluir esta entrega?')) return;

    try {
      // Deletar do Storage
      const storageRef = ref(storage, entrega.storagePath);
      await deleteObject(storageRef);

      // Remover do Firestore
      const projetoRef = doc(db, 'projetos', projetoId);
      await updateDoc(projetoRef, {
        entregas: arrayRemove(entrega)
      });

      setSelectedEntrega(null);
      onEntregaAtualizada?.();
      console.log('🗑️ Entrega excluída:', entrega.nome);
    } catch (error) {
      console.error('Erro ao excluir entrega:', error);
      alert('Erro ao excluir entrega');
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ícone do tipo de arquivo
  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (tipo.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (tipo.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  // Cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'revisao': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejeitado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'revisao': return 'Em Revisão';
      case 'rejeitado': return 'Rejeitado';
      default: return 'Aguardando Feedback';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Upload (apenas admin) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-500" />
            Enviar Entrega
          </h3>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploading 
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' 
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'
            }`}
          >
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
                <p className="text-gray-600 dark:text-gray-400">Enviando arquivo...</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{Math.round(uploadProgress)}%</p>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                  accept="image/*,video/*,.pdf,.psd,.ai,.eps,.doc,.docx,.xls,.xlsx,.zip,.rar"
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Selecionar Arquivo
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Suporta: Imagens, Vídeos, PDFs, PSD, AI, Documentos, ZIP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lista de Entregas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Entregas ({entregas.length})
          </h3>
        </div>

        {entregas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma entrega enviada ainda</p>
            {isAdmin && <p className="text-sm mt-1">Use o formulário acima para enviar arquivos</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {entregas.map((entrega) => (
              <div 
                key={entrega.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  selectedEntrega?.id === entrega.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                }`}
                onClick={() => setSelectedEntrega(entrega)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {getFileIcon(entrega.tipo)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entrega.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        v{entrega.versao} • {formatFileSize(entrega.tamanho)} • {new Date(entrega.uploadEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entrega.status)}`}>
                      {getStatusLabel(entrega.status)}
                    </span>
                    {entrega.feedbacks.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        {entrega.feedbacks.length}
                      </span>
                    )}
                    <a 
                      href={entrega.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
                      title="Visualizar/Baixar"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Entrega */}
      {selectedEntrega && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  {getFileIcon(selectedEntrega.tipo)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedEntrega.nome}
                  </h3>
                  <p className="text-xs text-gray-500">
                    v{selectedEntrega.versao} • Enviado por {selectedEntrega.uploadPorNome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntrega(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              {selectedEntrega.tipo.startsWith('image/') ? (
                <img 
                  src={selectedEntrega.url} 
                  alt={selectedEntrega.nome}
                  className="max-h-64 mx-auto rounded-lg shadow-lg"
                />
              ) : selectedEntrega.tipo.startsWith('video/') ? (
                <video 
                  src={selectedEntrega.url}
                  controls
                  className="max-h-64 mx-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center py-8">
                  <File className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                  <a 
                    href={selectedEntrega.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline"
                  >
                    Abrir/Baixar arquivo
                  </a>
                </div>
              )}
            </div>

            {/* Status e Ações */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(selectedEntrega.status)}`}>
                  {getStatusLabel(selectedEntrega.status)}
                </span>
                
                {/* Botões de ação do cliente */}
                {!isAdmin && selectedEntrega.status === 'pendente' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddFeedback(selectedEntrega.id, 'aprovacao')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleAddFeedback(selectedEntrega.id, 'revisao')}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Solicitar Revisão
                    </button>
                  </div>
                )}

                {/* Botão de deletar para admin */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteEntrega(selectedEntrega)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
              </div>
            </div>

            {/* Feedbacks */}
            <div className="p-4 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedbacks ({selectedEntrega.feedbacks.length})
              </h4>
              
              {selectedEntrega.feedbacks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum feedback ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedEntrega.feedbacks.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className={`p-3 rounded-lg ${
                        feedback.autorTipo === 'admin' 
                          ? 'bg-orange-50 dark:bg-orange-900/20 ml-4' 
                          : 'bg-blue-50 dark:bg-blue-900/20 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {feedback.autorNome}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.dataHora).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {feedback.texto}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input de Feedback */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackTexto}
                  onChange={(e) => setFeedbackTexto(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeedback(selectedEntrega.id, 'comentario')}
                />
                <button
                  onClick={() => handleAddFeedback(selectedEntrega.id, 'comentario')}
                  disabled={!feedbackTexto.trim()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntregasProjeto;

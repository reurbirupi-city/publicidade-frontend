import React, { useState, useEffect } from 'react';
import { getClientesDropdown, getProjetosDropdown } from '../services/dataIntegration';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { isWebmaster, getAdminByEmail } from '../services/adminService';

interface ClienteOption {
  value: string;
  label: string;
  cliente?: any;
}

interface ClienteSelectorProps {
  value: string;
  onChange: (clienteId: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const ClienteSelector: React.FC<ClienteSelectorProps> = ({
  value,
  onChange,
  label = 'Cliente',
  required = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar clientes do Firestore filtrados pelo admin
  useEffect(() => {
    const carregarClientes = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let clientesData: ClienteOption[] = [];

        // Verificar se é webmaster (vê todos) ou admin comum (vê só seus clientes)
        const isWebmasterUser = isWebmaster(user.email);

        if (isWebmasterUser) {
          // Webmaster vê todos os clientes
          const snapshot = await getDocs(collection(db, 'clientes'));
          clientesData = snapshot.docs.map(doc => ({
            value: doc.id,
            label: `${doc.data().nome} - ${doc.data().empresa || 'Sem empresa'}`,
            cliente: { id: doc.id, ...doc.data() }
          }));
          console.log('👑 Webmaster: carregando todos os clientes:', clientesData.length);
        } else {
          // Admin comum: buscar apenas seus clientes vinculados
          const admin = await getAdminByEmail(user.email);
          
          if (admin) {
            const q = query(
              collection(db, 'clientes'),
              where('adminId', '==', admin.id)
            );
            const snapshot = await getDocs(q);
            clientesData = snapshot.docs.map(doc => ({
              value: doc.id,
              label: `${doc.data().nome} - ${doc.data().empresa || 'Sem empresa'}`,
              cliente: { id: doc.id, ...doc.data() }
            }));
            console.log(`📋 Admin ${admin.nome}: carregando ${clientesData.length} clientes vinculados`);
          } else {
            console.log('⚠️ Admin não encontrado no sistema');
          }
        }

        // Também carregar do localStorage (clientes legados)
        const clientesLocalStorage = getClientesDropdown();
        
        // Mesclar evitando duplicatas (priorizar Firestore)
        const idsFirestore = new Set(clientesData.map(c => c.value));
        const clientesLocal = clientesLocalStorage.filter(c => !idsFirestore.has(c.value));
        
        const todosClientes = [...clientesData, ...clientesLocal];
        
        // Ordenar por nome
        todosClientes.sort((a, b) => a.label.localeCompare(b.label));
        
        setClientes(todosClientes);
        console.log('🔍 ClienteSelector - Total combinado:', todosClientes.length);
      } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        // Fallback para localStorage em caso de erro
        setClientes(getClientesDropdown());
      } finally {
        setLoading(false);
      }
    };

    carregarClientes();
  }, [user]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={loading}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white disabled:opacity-50"
      >
        <option value="">{loading ? 'Carregando...' : 'Selecione um cliente...'}</option>
        {clientes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!loading && clientes.length === 0 && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
          ⚠️ Nenhum cliente vinculado. Envie um link de convite para cadastrar clientes.
        </p>
      )}
    </div>
  );
};

interface ProjetoSelectorProps {
  value: string;
  onChange: (projetoId: string) => void;
  clienteId?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export const ProjetoSelector: React.FC<ProjetoSelectorProps> = ({
  value,
  onChange,
  clienteId,
  label = 'Projeto',
  required = false,
  className = ''
}) => {
  const projetos = getProjetosDropdown(clienteId);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={!!(clienteId && projetos.length === 0)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Selecione um projeto...</option>
        {projetos.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {clienteId && projetos.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ⚠️ Este cliente não possui projetos cadastrados.
        </p>
      )}
      {!clienteId && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          💡 Selecione um cliente primeiro para filtrar projetos.
        </p>
      )}
    </div>
  );
};

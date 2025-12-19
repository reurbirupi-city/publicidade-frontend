import React from 'react';
import { getClientesDropdown, getProjetosDropdown } from '../services/dataIntegration';

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
  const clientes = getClientesDropdown();
  
  // Debug: log para verificar clientes
  React.useEffect(() => {
    console.log('🔍 ClienteSelector - Total de clientes:', clientes.length);
    console.log('📋 Clientes disponíveis:', clientes);
  }, [clientes]);

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
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 outline-none text-gray-900 dark:text-white"
      >
        <option value="">Selecione um cliente...</option>
        {clientes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {clientes.length === 0 && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
          ⚠️ Nenhum cliente cadastrado. Cadastre clientes no módulo CRM primeiro.
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

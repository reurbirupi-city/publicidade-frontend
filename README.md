# Frontend - Sistema de Gestão Criativa

## 📱 Páginas Implementadas

### 🏠 Home (`/`)
**Página inicial pública (Landing Page)**

Recursos:
- ✅ Hero section com call-to-action
- ✅ Grid de módulos do sistema
- ✅ Seção de benefícios
- ✅ Steps de como começar
- ✅ Footer com informações
- ✅ Navegação para login

**Objetivo**: Apresentar o sistema para novos usuários e direcionar para o login.

---

### 🔐 Login (`/login`)
**Página de autenticação**

Recursos:
- ✅ Formulário de login com email e senha
- ✅ Validação de campos
- ✅ Feedback de erros
- ✅ Loading state durante autenticação
- ✅ Integração com Firebase Auth
- ✅ Botão para voltar à home
- ✅ Design moderno e responsivo

**Objetivo**: Autenticar usuários no sistema.

---

### 📊 Dashboard (`/dashboard`)
**Painel principal do sistema (Rota protegida)**

Recursos:
- ✅ Estatísticas resumidas (faturamento, projetos, prazos)
- ✅ Cards de módulos principais:
  - CRM - Clientes
  - Projetos
  - Financeiro
  - Agenda
  - Social Media
  - Portfólio
- ✅ Mensagem de boas-vindas
- ✅ Dicas rápidas para começar
- ✅ Botão de logout
- ✅ Informações do usuário logado

**Objetivo**: Hub central para acesso a todos os módulos do sistema.

---

## 🎨 Componentes

### Autenticação
- `AuthContext` - Context API para gerenciar estado de autenticação
- `PrivateRoute` - HOC para proteger rotas privadas

### Hooks
- `useAuth` - Hook para acessar contexto de autenticação

---

## 🚀 Tecnologias

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Firebase SDK** - Autenticação e banco de dados
- **Vite** - Build tool

---

## 🎯 Próximas Páginas/Módulos

### Em Desenvolvimento
- [ ] CRM - Lista de clientes
- [ ] CRM - Formulário de cliente
- [ ] Projetos - Lista de projetos
- [ ] Projetos - Formulário de projeto
- [ ] Financeiro - Dashboard financeiro
- [ ] Agenda - Calendário
- [ ] Social Media - Calendário editorial
- [ ] Portfólio - Galeria de projetos

### Melhorias Futuras
- [ ] Notificações em tempo real
- [ ] Dark mode
- [ ] Perfil do usuário
- [ ] Configurações
- [ ] Relatórios e gráficos
- [ ] Exportação de dados
- [ ] Filtros e busca avançada

---

## 📁 Estrutura de Pastas

```
frontend/src/
├── components/         # Componentes reutilizáveis
├── contexts/          # Context API (Auth, etc)
│   └── AuthContext.tsx
├── hooks/             # Custom hooks
├── pages/             # Páginas principais
│   ├── Home.tsx       # Landing page
│   ├── Login.tsx      # Autenticação
│   └── Dashboard.tsx  # Painel principal
├── services/          # Serviços (API, Firebase)
│   ├── api.ts         # Axios instance
│   └── firebase.ts    # Firebase config
├── types/             # TypeScript types
├── utils/             # Utilitários
├── index.css          # Estilos globais
└── main.tsx           # Entrada principal
```

---

## 🔄 Fluxo de Navegação

```
/ (Home)
  ↓
/login (Login)
  ↓
/dashboard (Dashboard - Protegida)
  ↓
/[modulo] (Módulos - Protegidas)
```

---

## 🎨 Design System

### Cores Principais
- **Primary**: Blue (Azul) - `primary-500`, `primary-600`, etc.
- **Secondary**: Purple (Roxo)
- **Success**: Green (Verde)
- **Warning**: Orange (Laranja)
- **Danger**: Red (Vermelho)

### Componentes Padrão
- **Botões**: `.btn-primary`, `.btn-secondary`
- **Inputs**: `.input-field`
- **Cards**: `.card`

### Ícones
Usando **Lucide React** para ícones consistentes e modernos.

---

## 🔐 Autenticação

### Firebase Authentication
O sistema usa Firebase para autenticação de usuários.

**Fluxo**:
1. Usuário acessa `/login`
2. Insere email e senha
3. Firebase valida credenciais
4. Token JWT é armazenado
5. Usuário é redirecionado para `/dashboard`

**Proteção de Rotas**:
- Rotas públicas: `/`, `/login`
- Rotas protegidas: `/dashboard` e todos os módulos

---

## 📝 Como Adicionar Nova Página

1. Crie o arquivo em `src/pages/`:
```typescript
// src/pages/NovaPagina.tsx
import React from 'react';

const NovaPagina: React.FC = () => {
  return (
    <div>
      <h1>Nova Página</h1>
    </div>
  );
};

export default NovaPagina;
```

2. Adicione a rota em `src/main.tsx`:
```typescript
<Route path="/nova-pagina" element={<NovaPagina />} />
```

3. Se for rota protegida, use `PrivateRoute`:
```typescript
<Route
  path="/nova-pagina"
  element={
    <PrivateRoute>
      <NovaPagina />
    </PrivateRoute>
  }
/>
```

---

## 🐛 Debug

### Verificar Autenticação
```typescript
// No console do navegador
localStorage.getItem('firebase:authUser')
```

### Verificar Rotas
Todas as rotas estão definidas em `src/main.tsx`.

### Erros Comuns
- **Firebase not configured**: Configure `.env` com credenciais
- **Route not found**: Verifique se a rota está definida em `main.tsx`
- **Auth error**: Verifique se o usuário existe no Firebase Authentication

---

## ✅ Status Atual

- ✅ Estrutura base configurada
- ✅ Autenticação funcionando
- ✅ Navegação entre páginas
- ✅ Design system implementado
- ✅ Páginas principais criadas (Home, Login, Dashboard)
- ⏳ Módulos em desenvolvimento

---

**Pronto para desenvolvimento dos módulos! 🚀**

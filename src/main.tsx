import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import { TutorialProvider } from './contexts/TutorialContext';
import ChatGlobalAdmin from './components/ChatGlobalAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';

// Build: v2.0.2 - Proteção de rotas + Cache-bust 2026-01-15
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Agenda from './pages/Agenda';
import Projetos from './pages/Projetos';
import SocialMedia from './pages/SocialMedia';
import Financeiro from './pages/Financeiro';
import Portfolio from './pages/Portfolio';
import Servicos from './pages/Servicos';
import ClientPortal from './pages/ClientPortal';
import Solicitacoes from './pages/Solicitacoes';
import './index.css';

// Componente principal
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificacoesProvider>
          <TutorialProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
              <Route path="/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
              <Route path="/social-media" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
              <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
              <Route path="/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
            </Routes>
            {/* Chat Global - Aparece em todas as páginas para admins */}
            <ChatGlobalAdmin />
          </BrowserRouter>
          </TutorialProvider>
        </NotificacoesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

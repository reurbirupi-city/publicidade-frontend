import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import { TutorialProvider } from './contexts/TutorialContext';
import ChatGlobalAdmin from './components/ChatGlobalAdmin';
import Home from './pages/Home';
import Login from './pages/Login';

// Build: v2.0.1 - Cache-bust 2026-01-15
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/social-media" element={<SocialMedia />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portal" element={<ClientPortal />} />
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
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

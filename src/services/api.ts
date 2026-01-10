import axios from 'axios';
import { auth } from './firebase';

const fallbackBaseURL = import.meta.env.PROD
  ? 'https://publicidade-backend.vercel.app/api'
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackBaseURL,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.error('Sessão expirada. Faça login novamente.');
    }
    return Promise.reject(error);
  }
);

export default api;

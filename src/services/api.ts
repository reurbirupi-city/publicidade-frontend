import axios from 'axios';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';

const fallbackBaseURL = import.meta.env.PROD
  ? 'https://publicidade-backend.vercel.app/api'
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackBaseURL,
});

const waitForAuthUser = async (timeoutMs: number = 1200): Promise<User | null> => {
  if (auth.currentUser) return auth.currentUser;

  return await new Promise<User | null>((resolve) => {
    let unsubscribe = () => {};
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
};

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(async (config) => {
  const user = await waitForAuthUser();
  if (user) {
    const url = (config.url || '').toString();
    const isIARequest = url.includes('/ia/');
    const token = await user.getIdToken(isIARequest);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const originalRequest = error.config;

      // Tenta 1 retry com token atualizado (evita falso 401 por token antigo)
      if (originalRequest && !originalRequest.__isRetry) {
        originalRequest.__isRetry = true;
        const user = await waitForAuthUser();
        if (user) {
          try {
            const token = await user.getIdToken(true);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api.request(originalRequest);
          } catch {
            // cai no erro padrão abaixo
          }
        }
      }

      console.error('Sessão expirada. Faça login novamente.');
    }

    return Promise.reject(error);
  }
);

export default api;

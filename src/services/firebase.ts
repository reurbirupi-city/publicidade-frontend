import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQmrD3-ZnwrOHecDxi4q8DljA9bbkq1hE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "inspiracao-e5a54.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "inspiracao-e5a54",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "inspiracao-e5a54.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "392020602156",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:392020602156:web:9669411d3dffed72225089",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VG9E54NZ6W"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Inicializar Analytics (apenas no browser)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

console.log('✅ Firebase inicializado com sucesso!');
console.log('📦 Projeto:', firebaseConfig.projectId);

export { auth, db, storage, analytics };
export default app;

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQmrD3-ZnwrOHecDxi4q8DljA9bbkq1hE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "publicidade-35746.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "publicidade-35746",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "publicidade-35746.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "392020602156",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:392020602156:web:9669411d3dffed72225089",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VG9E54NZ6W"
};

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const auth = getAuth(app);
const db = getFirestore(app);

// Evita logs verbosos do Firestore no console (principalmente em produção)
const firestoreLogLevel = (import.meta.env.VITE_FIRESTORE_LOG_LEVEL || (import.meta.env.PROD ? 'error' : 'warn')) as
  | 'debug'
  | 'error'
  | 'silent'
  | 'warn';
setLogLevel(firestoreLogLevel);

const storage = getStorage(app);

// Inicializar Analytics (apenas no browser)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

if (import.meta.env.DEV) {
  console.log('✅ Firebase inicializado com sucesso!');
  console.log('📦 Projeto:', firebaseConfig.projectId);
  console.log('🧾 Firestore log level:', firestoreLogLevel);
}

export { auth, db, storage, analytics };
export default app;

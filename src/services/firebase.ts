import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCQmrD3-ZnwrOHecDxi4q8DljA9bbkq1hE",
  authDomain: "inspiracao-e5a54.firebaseapp.com",
  projectId: "inspiracao-e5a54",
  storageBucket: "inspiracao-e5a54.firebasestorage.app",
  messagingSenderId: "392020602156",
  appId: "1:392020602156:web:9669411d3dffed72225089",
  measurementId: "G-VG9E54NZ6W"
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

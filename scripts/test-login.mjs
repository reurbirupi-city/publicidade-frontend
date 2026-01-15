import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

const decodeJwtPayload = (jwt) => {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCQmrD3-ZnwrOHecDxi4q8DljA9bbkq1hE',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'inspiracao-e5a54.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'inspiracao-e5a54',
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'inspiracao-e5a54.firebasestorage.app',
  messagingSenderId:
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '392020602156',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:392020602156:web:9669411d3dffed72225089',
};

const email = (process.env.TEST_EMAIL || process.env.LOGIN_EMAIL || '').trim();
const password = (process.env.TEST_PASSWORD || process.env.LOGIN_PASSWORD || '').trim();

if (!email || !password) {
  console.error('❌ Defina TEST_EMAIL e TEST_PASSWORD para executar o teste de login.');
  console.error('   Exemplo (PowerShell):');
  console.error("     $env:TEST_EMAIL='seu@email.com'; $env:TEST_PASSWORD='sua_senha'; node scripts/test-login.mjs");
  process.exit(2);
}

const run = async () => {
  console.log('🔧 Firebase config (projectId):', firebaseConfig.projectId);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('🔐 Fazendo login...');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log('✅ Login ok. UID:', uid);

  const token = await cred.user.getIdToken(true);
  const payload = decodeJwtPayload(token);
  console.log('🪪 Token aud:', payload?.aud || '(não detectado)');

  if (payload?.aud && payload.aud !== firebaseConfig.projectId) {
    console.error('❌ Token aud != projectId. Isso indica projeto divergente no frontend.');
    console.error('   aud:', payload.aud);
    console.error('   projectId:', firebaseConfig.projectId);
    process.exit(3);
  }

  const tryGet = async (label, fn) => {
    try {
      const res = await fn();
      console.log(`✅ ${label}: OK`);
      return res;
    } catch (e) {
      console.error(`❌ ${label}:`, e?.code || e?.message || e);
      throw e;
    }
  };

  await tryGet('Firestore read users/{uid}', async () => {
    const snap = await getDoc(doc(db, 'users', uid));
    return { exists: snap.exists(), data: snap.data() };
  });

  await tryGet('Firestore read admins/{uid}', async () => {
    const snap = await getDoc(doc(db, 'admins', uid));
    return { exists: snap.exists(), data: snap.data() };
  });

  await tryGet('Firestore query notificacoes (destinatario)', async () => {
    // tenta ambos (admin uid e canal webmaster)
    const ref = collection(db, 'notificacoes');

    const q1 = query(ref, where('destinatarioTipo', '==', 'admin'), where('destinatarioId', '==', uid), limit(5));
    const s1 = await getDocs(q1);

    const q2 = query(ref, where('destinatarioTipo', '==', 'admin'), where('destinatarioId', '==', 'webmaster'), limit(5));
    const s2 = await getDocs(q2);

    return { uidCount: s1.size, webmasterCount: s2.size };
  });

  await tryGet('Firestore list solicitacoes_clientes (limit 5)', async () => {
    const ref = collection(db, 'solicitacoes_clientes');
    const q = query(ref, limit(5));
    const snap = await getDocs(q);
    return { size: snap.size };
  });

  console.log('🎉 Teste completo: login + leituras Firestore passaram.');
};

run().catch((e) => {
  console.error('💥 Falhou:', e?.code || e?.message || e);
  process.exit(1);
});

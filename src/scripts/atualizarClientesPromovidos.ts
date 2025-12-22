import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCsvNjDRGTS8l_-mMupjoME7e8mtSswCcE',
  authDomain: 'publicidade-7ab56.firebaseapp.com',
  projectId: 'publicidade-7ab56'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function atualizarClientes() {
  const emails = ['bonjourmariajose@gmail.com', 'kadionisio21@gmail.com'];
  
  console.log('Buscando usuarios para atualizar...');
  
  for (const email of emails) {
    console.log(`\nProcessando: ${email}`);
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`  ❌ Usuario nao encontrado: ${email}`);
      continue;
    }
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log(`  Encontrado: ${email} - UID: ${docSnap.id} - Role atual: ${data.role}`);
      
      await updateDoc(doc(db, 'users', docSnap.id), { role: 'admin' });
      console.log(`  ✅ Atualizado para role: admin`);
    }
  }
  
  console.log('\n🎉 Concluido!');
  process.exit(0);
}

atualizarClientes().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});

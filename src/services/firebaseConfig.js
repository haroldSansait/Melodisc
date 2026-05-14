import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyADJK9DBF7VY6VPQQeEgPFPFzPnku098aY',
  authDomain: 'melodisc-57fd2.firebaseapp.com',
  projectId: 'melodisc-57fd2',
  storageBucket: 'melodisc-57fd2.firebasestorage.app',
  messagingSenderId: '889352597122',
  appId: '1:889352597122:web:98f61ba9041412e56d8e9b',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };

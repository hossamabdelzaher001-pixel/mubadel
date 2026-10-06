import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaHLUq2DZzc2euPGSIyiuzB2CmhZz9WdE",
  authDomain: "lkkkk-19b6a.firebaseapp.com",
  projectId: "lkkkk-19b6a",
  storageBucket: "lkkkk-19b6a.firebasestorage.app",
  messagingSenderId: "217514766331",
  appId: "1:217514766331:web:baa9fc4c708d4718ee655e",
  measurementId: "G-8MQHQ3Z80P"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;

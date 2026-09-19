import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDnb5AWd8Lyi1KFq5xQhow4ELwdGd1dTw4",
  authDomain: "ai-prompt-library-1bfcd.firebaseapp.com",
  projectId: "ai-prompt-library-1bfcd",
  storageBucket: "ai-prompt-library-1bfcd.firebasestorage.app",
  messagingSenderId: "27070268198",
  appId: "1:27070268198:web:0e5e70205df744a137f7e7"
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;

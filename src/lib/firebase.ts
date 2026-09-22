import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence 
} from 'firebase/auth';
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

// Explicitly ensure browser persistence is active so user stays logged in across refreshes / navigation
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set browserLocalPersistence, trying browserSessionPersistence:', err);
  setPersistence(auth, browserSessionPersistence).catch(console.warn);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const db = getFirestore(app);
export default app;

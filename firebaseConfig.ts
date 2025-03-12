import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// For debugging purposes - remove in production
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key') {
  console.error('Firebase API key is missing or invalid. Check your environment variables.');
  // Fallback to hardcoded config for development if needed
  if (process.env.NODE_ENV === 'development') {
    firebaseConfig.apiKey = 'AIzaSyC1GQX1T24QT5lOT-H3lhWOqN_nEyVNc-w';
    firebaseConfig.authDomain = 'brix-bb1f3.firebaseapp.com';
    firebaseConfig.projectId = 'brix-bb1f3';
    firebaseConfig.storageBucket = 'brix-bb1f3.firebasestorage.app';
    firebaseConfig.messagingSenderId = '1076726929135';
    firebaseConfig.appId = '1:1076726929135:web:4a17dd641c650946fead1a';
  }
}

// Initialize Firebase - check if app already exists first
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
